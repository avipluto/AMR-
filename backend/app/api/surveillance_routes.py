from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional, List, Dict, Any
from backend.app.surveillance.engine import surveillance_engine
from backend.app.ml.model_service import model_service
import logging

logger = logging.getLogger("amr_sentinel.surveillance_routes")

router = APIRouter(tags=["AMR Surveillance & Isolates"])

@router.get("/surveillance/overview")
def get_surveillance_overview():
    return surveillance_engine.get_overview_metrics()

@router.get("/surveillance/trends")
def get_trends(
    organism: Optional[str] = Query("All"),
    antibiotic: Optional[str] = Query("All"),
    location: Optional[str] = Query("All")
):
    return surveillance_engine.get_trends_timeline(organism, antibiotic, location)

@router.get("/surveillance/heatmap")
def get_heatmap(location: Optional[str] = Query("All")):
    return surveillance_engine.get_heatmap_matrix(location)

@router.get("/surveillance/emerging")
def get_emerging_trends(min_sample_size: int = Query(25)):
    return surveillance_engine.detect_emerging_trends(min_sample_size)

# Direct /api/isolates and /api/surveillance/isolates support
@router.get("/isolates")
@router.get("/surveillance/isolates")
def get_isolates(limit: int = Query(100), organism: Optional[str] = Query("All")):
    return surveillance_engine.get_isolates_table(limit, organism)

@router.get("/isolates/{isolate_id}")
@router.get("/surveillance/isolates/{isolate_id}")
def get_isolate_by_id(isolate_id: str):
    isolates = surveillance_engine.get_isolates_table(limit=10000)
    for iso in isolates:
        if str(iso.get("isolate_id", "")).lower() == isolate_id.lower():
            return iso
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Isolate '{isolate_id}' was not found in the surveillance database."
    )

# Direct /api/model/performance and /api/surveillance/model/performance support
@router.get("/model/performance")
@router.get("/surveillance/model/performance")
def get_model_performance():
    if not model_service.is_loaded:
        if not model_service.load_artifacts():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Model performance metrics unavailable: AMR models have not been trained or configured."
            )
    return model_service.metrics_report
