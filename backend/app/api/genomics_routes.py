from fastapi import APIRouter, HTTPException, status
from backend.app.core.schemas import GenomicAnalysisRequest, GenomicAnalysisResponse
from backend.app.genomics.analyzer import genomic_analyzer
import logging

logger = logging.getLogger("amr_sentinel.genomics_routes")

router = APIRouter(prefix="/genomics", tags=["Genomic AMR Analysis"])

@router.post("/analyze", response_model=GenomicAnalysisResponse)
def analyze_genomics(req: GenomicAnalysisRequest):
    if not req.organism or not req.organism.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bacterial organism must be specified."
        )
    if not req.content or not req.content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Genomic sequence or marker content cannot be empty."
        )

    try:
        res = genomic_analyzer.analyze(
            organism=req.organism.strip(),
            input_type=req.input_type.strip(),
            content=req.content.strip()
        )
        return res
    except Exception as e:
        logger.exception("Genomic analysis error: %s", str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Genomic analysis error: {str(e)}"
        )
