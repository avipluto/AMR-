from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from typing import Optional, List
import json
from backend.app.cv.pipeline import ast_processor
from backend.app.core.schemas import PlateAnalysisResult
import logging

logger = logging.getLogger("amr_sentinel.ast_routes")

router = APIRouter(prefix="/ast", tags=["AST Image Analysis"])

@router.post("/analyze", response_model=PlateAnalysisResult)
async def analyze_ast_plate(
    file: UploadFile = File(...),
    organism: str = Form("Escherichia coli"),
    antibiotics: Optional[str] = Form(None), # Comma separated list of codes or JSON array
    calibration_px_per_mm: Optional[float] = Form(None)
):
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Valid image file must be uploaded."
        )

    try:
        contents = await file.read()
        if not contents or len(contents) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Uploaded file is empty."
            )

        disk_labels = None
        if antibiotics:
            try:
                disk_labels = json.loads(antibiotics)
            except Exception:
                disk_labels = [s.strip() for s in antibiotics.split(",") if s.strip()]

        result = ast_processor.process_image(
            image_bytes=contents,
            organism=organism.strip() if organism else "Escherichia coli",
            disk_labels=disk_labels,
            user_calibration_px_per_mm=calibration_px_per_mm
        )
        return result
    except HTTPException:
        raise
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))
    except Exception as e:
        logger.exception("Image processing failed: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image processing failed: {str(e)}"
        )

@router.post("/calibrate")
async def calibrate_scale(
    known_disk_diameter_mm: float = 6.0,
    measured_disk_diameter_px: float = 30.0
):
    if known_disk_diameter_mm <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Known disk diameter in mm must be strictly greater than 0."
        )
    if measured_disk_diameter_px <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Measured pixel distance must be strictly greater than 0."
        )
    
    px_per_mm = measured_disk_diameter_px / known_disk_diameter_mm
    return {
        "status": "Calibration computed successfully",
        "known_disk_diameter_mm": known_disk_diameter_mm,
        "measured_disk_diameter_px": measured_disk_diameter_px,
        "pixels_per_mm": round(px_per_mm, 4),
        "calibration_note": "Apply this scale factor to subsequent zone-of-inhibition pixel measurements."
    }
