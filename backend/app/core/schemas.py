from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class BreakpointInfo(BaseModel):
    organism: str
    antibiotic: str
    measurement_type: str
    value: float
    classification: str
    standard: Optional[str] = None
    standard_version: Optional[str] = None
    source: Optional[str] = None
    breakpoints: Optional[Dict[str, Optional[str]]] = None
    reason: Optional[str] = None

class DiskDetection(BaseModel):
    disk_id: int
    antibiotic_code: Optional[str] = "Unknown"
    antibiotic_name: Optional[str] = "Unknown"
    confidence: float
    x: int
    y: int
    width: int
    height: int
    disk_diameter_px: float
    disk_diameter_mm: Optional[float] = None
    zone_diameter_px: float
    zone_diameter_mm: Optional[float] = None
    interpretation: Optional[BreakpointInfo] = None

class PlateAnalysisResult(BaseModel):
    image_width: int
    image_height: int
    plate_detected: bool
    plate_bbox: Optional[List[int]] = None # [x, y, w, h]
    calibration_method: str # "known_disk_6mm", "user_scale", "uncalibrated"
    pixels_per_mm: Optional[float] = None
    calibration_warning: Optional[str] = None
    disks: List[DiskDetection] = []
    annotated_image_base64: Optional[str] = None
    summary: Dict[str, Any] = {}

class AMRDirectPredictionRequest(BaseModel):
    organism: str
    antibiotic: str
    zone_diameter_mm: Optional[float] = None
    disk_diameter_mm: Optional[float] = 6.0
    mic: Optional[float] = None
    genomic_features: Optional[List[str]] = []
    location: Optional[str] = None

class AMRDirectPredictionResponse(BaseModel):
    organism: str
    antibiotic: str
    predicted_class: str # S, I, R
    confidence: float
    probabilities: Dict[str, float]
    model_used: str
    evidence: List[str]
    rule_based_interpretation: Optional[Dict[str, Any]] = None
    disclaimer: str

class GenomicAnalysisRequest(BaseModel):
    organism: str
    input_type: str # "fasta", "gene_list", "amrfinder_table"
    content: str # Raw fasta string or JSON list or tabular text

class GenomicFeatureHit(BaseModel):
    gene_or_mutation: str
    family: str
    mechanism: str
    drug_class: str
    associated_antibiotics: List[str]
    evidence_level: str
    phenotypic_caution: str = "Genotypic presence does not guarantee phenotypic expression; confirm with AST."

class GenomicAnalysisResponse(BaseModel):
    organism: str
    detected_features: List[GenomicFeatureHit]
    implicated_classes: List[str]
    summary_text: str
    phenotypic_vs_genotypic_note: str

class SurveillanceRecord(BaseModel):
    isolate_id: str
    organism: str
    collection_date: str # YYYY-MM-DD
    location: str
    antibiotic: str
    zone_diameter_mm: Optional[float] = None
    mic: Optional[float] = None
    susceptibility: str # S, I, R
    genomic_features: Optional[List[str]] = []
    source_dataset: str
