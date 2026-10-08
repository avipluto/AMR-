import pytest
import numpy as np
import cv2
import json
from pathlib import Path
from backend.app.core.breakpoints import breakpoint_manager
from backend.app.genomics.analyzer import genomic_analyzer
from backend.app.surveillance.engine import surveillance_engine
from backend.app.cv.pipeline import ast_processor

def test_clsi_breakpoints():
    # E. coli Ciprofloxacin S >= 26, R <= 21
    s_interp = breakpoint_manager.interpret_zone("Escherichia coli", "Ciprofloxacin", 28.0)
    assert s_interp["classification"] == "S"

    r_interp = breakpoint_manager.interpret_zone("Escherichia coli", "Ciprofloxacin", 12.0)
    assert r_interp["classification"] == "R"

    i_interp = breakpoint_manager.interpret_zone("Escherichia coli", "Ciprofloxacin", 23.0)
    assert i_interp["classification"] == "I"

    # Non-existent breakpoint should return 'Interpretation unavailable'
    unavail = breakpoint_manager.interpret_zone("Unknown Bacterium", "RareDrug", 15.0)
    assert unavail["classification"] == "Interpretation unavailable"

def test_genomics_analyzer():
    res = genomic_analyzer.analyze(
        organism="Escherichia coli",
        input_type="gene_list",
        content="Isolate contains blaCTX-M-15 and gyrA_S83L chromosomal mutation."
    )
    assert len(res["detected_features"]) >= 2
    genes = [f["gene_or_mutation"] for f in res["detected_features"]]
    assert "blaCTX-M-15" in genes
    assert "gyrA_S83L" in genes
    assert "Cephalosporins, Monobactams" in res["implicated_classes"]
    assert "Fluoroquinolones" in res["implicated_classes"]

def test_surveillance_engine():
    overview = surveillance_engine.get_overview_metrics()
    assert overview["total_observations"] > 0
    assert overview["total_isolates"] > 0
    assert overview["resistance_rate_pct"] > 0
    assert overview["mdr_rate_pct"] > 0

    emerging = surveillance_engine.detect_emerging_trends()
    assert isinstance(emerging, list)

    timeline = surveillance_engine.get_trends_timeline(organism="Escherichia coli", antibiotic="Ciprofloxacin")
    assert len(timeline) > 0
    assert "confidence_level" in timeline[0]

def test_ast_cv_synthetic_plate():
    # Generate a synthetic plate image with 2 disks
    img = np.full((400, 400, 3), 70, dtype=np.uint8) # Dark agar
    cv2.circle(img, (200, 200), 180, (50, 50, 50), -1) # Plate area

    # Disk 1: Resistant (small zone = disk size)
    cv2.circle(img, (140, 200), 12, (240, 240, 240), -1) # disk

    # Disk 2: Susceptible (large inhibition halo)
    cv2.circle(img, (260, 200), 35, (40, 40, 40), -1) # zone halo
    cv2.circle(img, (260, 200), 12, (240, 240, 240), -1) # disk

    _, buf = cv2.imencode(".png", img)
    result = ast_processor.process_image(
        image_bytes=buf.tobytes(),
        organism="Escherichia coli",
        disk_labels=["CIP", "GEN"]
    )
    assert result["plate_detected"] is True
    assert len(result["disks"]) >= 1
