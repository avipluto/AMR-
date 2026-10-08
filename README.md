# AMR Sentinel: AI-Powered Antimicrobial Resistance Surveillance & Prediction Platform

> **SAFETY & SCIENTIFIC DISCLAIMER:**  
> AMR Sentinel is an academic research and educational prototype. It is **not** validated for clinical diagnosis, patient antibiotic selection, treatment recommendations, or medical decision-making. Predictions and surveillance signals require validation by qualified clinical microbiology professionals and laboratory testing standards.

---

## 1. Overview & Research Objective

**AMR Sentinel** addresses the core research question:  
> *"Can machine learning combine phenotypic, visual, genomic, and historical data to detect antimicrobial resistance and identify emerging resistance patterns earlier and more efficiently?"*

Rather than claiming definitive future evolution for an individual bacterium, AMR Sentinel identifies **population-level emerging resistance patterns** across bacterial species, antibiotics, geographic locations, and time strata.

---

## 2. Platform Architecture

```text
                    AMR SENTINEL
                         │
        ┌────────────────┼────────────────┐
        │                │                │
        ▼                ▼                ▼
    AST IMAGE         GENOMICS       HISTORICAL DATA
        │                │                │
        └────────────────┼────────────────┘
                         ▼
                   AI ANALYSIS
                         │
            ┌────────────┴────────────┐
            ▼                         ▼
       CURRENT AMR              AMR SURVEILLANCE
       DETECTION                      │
                                      ▼
                              EMERGING PATTERNS
                                      │
                                      ▼
                              RESEARCH INSIGHTS
```

### Main Modules:
1. **Module A — AST Image Analysis (`backend/app/cv/`)**:
   - Automated Kirby-Bauer petri dish detection, antibiotic paper disk detection, radial zone-of-inhibition segmentation, and millimeter calibration based on standard 6.0 mm disk size.
   - Breakpoint interpretation mapped strictly against **CLSI M100 Performance Standards** (Never invents values).
2. **Module B — Machine Learning AMR Susceptibility (`backend/app/ml/`)**:
   - Logistic Regression, Random Forest, and XGBoost classifiers.
   - Temporal train/test split (<= 2023 Train, >= 2024 Test) avoiding future data leakage.
   - Evaluated on **Macro-F1, Balanced Accuracy, Sensitivity, Specificity, and Confusion Matrix**.
3. **Module C — Genomic AMR Analysis (`backend/app/genomics/`)**:
   - Ingestion of FASTA sequences, gene lists, and AMRFinderPlus/CARD outputs.
   - Detects canonical beta-lactamases (`blaKPC-2`, `blaNDM-1`, `blaCTX-M-15`), QRDR target alterations (`gyrA_S83L`, `parC_S80I`), and efflux pumps (`tet(A)`).
   - Enforces scientific distinction: *Genotypic marker presence ≠ Definite phenotypic clinical resistance*.
4. **Module D — AMR Surveillance & Trend Detection (`backend/app/surveillance/`)**:
   - Multidrug resistance (MDR) rate tracking (isolates resistant to >= 3 classes).
   - Statistical change-point detection & Research AMR Trend Score (0–100) with configurable minimum sample size safeguards (e.g. n >= 25).
5. **Module E — Research Dashboard (`frontend/src/`)**:
   - React + TypeScript + Tailwind CSS + Recharts interactive dashboard.
   - Antibiogram Heatmap, Longitudinal Trend Explorer, and Isolates Dossier.
6. **Module F — Multimodal Deep Network (`backend/app/ml/multimodal_model.py`)**:
   - PyTorch multimodal fusion architecture supporting partial/missing modalities.

---

## 3. Getting Started

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Local Development

#### 1. Backend Setup:
```bash
# Navigate to project root
pip install -r backend/requirements.txt

# Start FastAPI server
uvicorn backend.app.main:app --reload --port 8000
```
Backend API interactive documentation will be available at `http://127.0.0.1:8000/docs`.

#### 2. Frontend Setup:
```bash
cd frontend
npm install
npm run dev
```
Dashboard available at `http://localhost:3000`.

---

## 4. Running Tests & Verifications

```bash
# Run pytest verification suite
python -m pytest backend/tests/test_core.py -v
```

---

## 5. Docker Deployment

```bash
docker-compose up --build
```
- Frontend UI: `http://localhost:3000`
- Backend API: `http://localhost:8000`
