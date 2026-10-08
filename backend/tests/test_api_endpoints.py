import pytest
from fastapi.testclient import TestClient
import numpy as np
import cv2
from pathlib import Path
from backend.app.main import app
from backend.app.ml.model_service import model_service
from backend.app.surveillance.engine import SurveillanceEngine

client = TestClient(app)

# 1. Health Endpoint
def test_health():
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

# 2. AMR Prediction Endpoint
def test_amr_predict_valid():
    payload = {
        "organism": "Escherichia coli",
        "antibiotic": "Ciprofloxacin",
        "zone_diameter_mm": 14.0,
        "disk_diameter_mm": 6.0
    }
    res = client.post("/api/amr/predict", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["organism"] == "Escherichia coli"
    assert data["predicted_class"] in ["S", "I", "R"]
    assert "rule_based_interpretation" in data

def test_amr_predict_invalid_blank_organism():
    payload = {
        "organism": "   ",
        "antibiotic": "Ciprofloxacin"
    }
    res = client.post("/api/amr/predict", json=payload)
    assert res.status_code == 400

def test_amr_predict_missing_model_artifact(monkeypatch):
    # Temporarily simulate unconfigured model
    monkeypatch.setattr(model_service, "is_loaded", False)
    monkeypatch.setattr(model_service, "load_artifacts", lambda: False)
    
    payload = {
        "organism": "Escherichia coli",
        "antibiotic": "Ciprofloxacin",
        "zone_diameter_mm": 14.0
    }
    res = client.post("/api/amr/predict", json=payload)
    assert res.status_code == 503
    assert "not trained/configured" in res.json()["detail"]

# 3. AST Image Analysis Endpoints
def test_ast_analyze_valid():
    img = np.full((200, 200, 3), 70, dtype=np.uint8)
    cv2.circle(img, (100, 100), 80, (40, 40, 40), -1)
    cv2.circle(img, (100, 100), 12, (240, 240, 240), -1)
    _, buf = cv2.imencode(".png", img)

    files = {"file": ("plate.png", buf.tobytes(), "image/png")}
    data = {"organism": "Escherichia coli"}
    res = client.post("/api/ast/analyze", files=files, data=data)
    assert res.status_code == 200
    res_data = res.json()
    assert res_data["plate_detected"] is True
    assert len(res_data["disks"]) >= 1

def test_ast_analyze_empty_file():
    files = {"file": ("empty.png", b"", "image/png")}
    res = client.post("/api/ast/analyze", files=files)
    assert res.status_code == 400

def test_ast_calibrate_valid():
    res = client.post("/api/ast/calibrate?known_disk_diameter_mm=6.0&measured_disk_diameter_px=30.0")
    assert res.status_code == 200
    assert res.json()["pixels_per_mm"] == 5.0

def test_ast_calibrate_invalid_zero():
    res = client.post("/api/ast/calibrate?known_disk_diameter_mm=0&measured_disk_diameter_px=30.0")
    assert res.status_code == 400

# 4. Genomic Analysis Endpoint
def test_genomics_analyze_valid():
    payload = {
        "organism": "Escherichia coli",
        "input_type": "gene_list",
        "content": "blaCTX-M-15\ngyrA_S83L"
    }
    res = client.post("/api/genomics/analyze", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert len(data["detected_features"]) >= 2

def test_genomics_analyze_empty_content():
    payload = {
        "organism": "Escherichia coli",
        "input_type": "gene_list",
        "content": "   "
    }
    res = client.post("/api/genomics/analyze", json=payload)
    assert res.status_code == 400

# 5. Surveillance Endpoints
def test_surveillance_trends():
    res = client.get("/api/surveillance/trends?organism=Escherichia%20coli&antibiotic=Ciprofloxacin")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_surveillance_heatmap():
    res = client.get("/api/surveillance/heatmap")
    assert res.status_code == 200
    data = res.json()
    assert "organisms" in data
    assert "matrix" in data

def test_surveillance_emerging():
    res = client.get("/api/surveillance/emerging")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_surveillance_empty_dataset():
    empty_engine = SurveillanceEngine(data_path=Path("nonexistent.csv"))
    overview = empty_engine.get_overview_metrics()
    assert overview["status"] == "no_data"
    assert overview["total_observations"] == 0

# 6. Isolates Database Endpoints
def test_isolates_get_list():
    res = client.get("/api/isolates?limit=10")
    assert res.status_code == 200
    assert isinstance(res.json(), list)

def test_isolate_not_found():
    res = client.get("/api/isolates/UNKNOWN-99999")
    assert res.status_code == 404
    assert "not found" in res.json()["detail"].lower()

# 7. Model Performance
def test_model_performance():
    res = client.get("/api/model/performance")
    assert res.status_code == 200
    data = res.json()
    assert "Random Forest" in data or "Logistic Regression" in data
