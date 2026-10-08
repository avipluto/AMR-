from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Dict, Any, Optional, List
import uuid
from backend.app.core.pdf_generator import pdf_generator, REPORTS_DIR
from backend.app.api.auth_routes import get_current_user

router = APIRouter(prefix="/reports", tags=["Scientific Reports"])

class GenerateASTReportRequest(BaseModel):
    analysis_data: Dict[str, Any]
    isolate_id: Optional[str] = None

@router.get("")
@router.get("/")
def list_reports(current_user: Optional[Dict[str, Any]] = Depends(get_current_user)):
    user_id = current_user.get("sub") if current_user else None
    return pdf_generator.list_reports(user_id=user_id)

@router.post("/generate/ast")
def generate_ast_report(
    req: GenerateASTReportRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user)
):
    if not req.analysis_data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Analysis payload required.")

    report_id = f"REP-{uuid.uuid4().hex[:8].upper()}"
    try:
        filepath = pdf_generator.generate_ast_report(
            report_id=report_id,
            analysis_data=req.analysis_data,
            user=current_user,
            isolate_id=req.isolate_id
        )
        meta = pdf_generator.get_report_meta(report_id)
        return {
            "status": "success",
            "report_id": report_id,
            "filename": filepath.name,
            "download_url": f"/api/reports/{report_id}/download",
            "metadata": meta
        }
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"PDF Generation failed: {str(e)}")

@router.get("/{report_id}")
def get_report_details(report_id: str):
    meta = pdf_generator.get_report_meta(report_id)
    if not meta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report {report_id} not found.")
    return meta

@router.get("/{report_id}/download")
def download_report(report_id: str):
    meta = pdf_generator.get_report_meta(report_id)
    if not meta:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Report {report_id} not found.")

    filepath = REPORTS_DIR / meta["filename"]
    if not filepath.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Report PDF file missing from disk.")

    return FileResponse(
        path=str(filepath),
        filename=meta["filename"],
        media_type="application/pdf"
    )
