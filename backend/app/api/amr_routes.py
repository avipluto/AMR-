from fastapi import APIRouter, HTTPException, status
from backend.app.core.schemas import AMRDirectPredictionRequest, AMRDirectPredictionResponse
from backend.app.ml.phenotypic_model import phenotypic_model_suite
from backend.app.ml.model_service import model_service
from backend.app.core.breakpoints import breakpoint_manager
import logging

logger = logging.getLogger("amr_sentinel.amr_routes")

router = APIRouter(prefix="/amr", tags=["AMR Prediction"])

@router.post("/predict", response_model=AMRDirectPredictionResponse)
def predict_susceptibility(req: AMRDirectPredictionRequest):
    # Check if model service is ready; if not, return 503 Service Unavailable
    if not model_service.is_loaded:
        # Try loading once
        if not model_service.load_artifacts():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AMR prediction model is not trained/configured. Please train or configure the model before using this endpoint."
            )

    # Input validation
    if not req.organism or not req.organism.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bacterial organism must be specified."
        )
    if not req.antibiotic or not req.antibiotic.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Antibiotic name must be specified."
        )

    try:
        zone = req.zone_diameter_mm if req.zone_diameter_mm is not None else 18.0
        
        # ML model prediction
        pred = phenotypic_model_suite.predict(
            organism=req.organism.strip(),
            antibiotic=req.antibiotic.strip(),
            zone_diameter_mm=zone,
            disk_diameter_mm=req.disk_diameter_mm or 6.0,
            mic=req.mic,
            genomic_features=req.genomic_features
        )

        # Reference standard rule-based interpretation
        rule_interp = breakpoint_manager.interpret_zone(req.organism.strip(), req.antibiotic.strip(), zone)
        pred["rule_based_interpretation"] = rule_interp
        return pred

    except RuntimeError as re:
        logger.error("Runtime error during inference: %s", str(re))
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail=str(re))
    except Exception as e:
        logger.exception("Unexpected error during AMR prediction: %s", str(e))
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"AMR prediction failed: {str(e)}")
