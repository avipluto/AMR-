# AMR Sentinel Dataset Provenance & Metadata

This document catalogs the datasets, reference standards, and benchmark cohorts utilized within the AMR Sentinel research platform in compliance with strict epidemiological data standards.

---

## 1. Reference Breakpoint Standards

- **Standard**: CLSI (Clinical and Laboratory Standards Institute)
- **Document**: M100 Performance Standards for Antimicrobial Susceptibility Testing, 33rd Edition (2023)
- **Measurement Standards**:
  - Kirby-Bauer Agar Disk Diffusion (zone diameter in mm)
  - Broth Microdilution Minimal Inhibitory Concentration (MIC in µg/mL)
- **File**: `backend/data/breakpoints/clsi_breakpoints.json`
- **Rule**: No breakpoint values are invented. If a validated standard combination is unavailable, the system strictly outputs `"Interpretation unavailable"`.

---

## 2. AMR Gene and Mutation Catalog

- **Curated Sources**: NCBI AMRFinderPlus, Comprehensive Antibiotic Resistance Database (CARD), ResFinder
- **Scope**:
  - Beta-lactamase genes (blaTEM-1, blaCTX-M-15, blaKPC-2, blaNDM-1)
  - Fluoroquinolone Target Alterations (gyrA S83L, parC S80I)
  - Aminoglycoside-modifying enzymes (aac(6')-Ib-cr)
  - Efflux pumps (tet(A))
  - Target alteration markers (mecA, vanA)
- **File**: `backend/data/breakpoints/amr_gene_catalog.json`
- **Scientific Caveat**: Genotypic presence denotes resistance mechanisms; phenotypic expression requires AST confirmation.

---

## 3. Longitudinal Surveillance Benchmark Cohort

- **Dataset Name**: AMR-Sentinel Longitudinal Surveillance Cohort
- **File**: `backend/data/raw/surveillance_isolates.csv`
- **Sample Volume**: 8,752 AST observations across 3,500 unique isolates (Years: 2021–2025)
- **Organisms**:
  - *Escherichia coli* (40%)
  - *Klebsiella pneumoniae* (28%)
  - *Staphylococcus aureus* (22%)
  - *Pseudomonas aeruginosa* (10%)
- **Antibiotics Profiled**:
  - Ciprofloxacin, Gentamicin, Ampicillin, Tetracycline, Ceftriaxone, Meropenem, Oxacillin, Vancomycin
- **Fields**:
  - `isolate_id`, `organism`, `collection_date`, `year`, `month`, `location`, `antibiotic`, `zone_diameter_mm`, `mic`, `susceptibility` (S/I/R), `genomic_features`, `source_dataset`
- **Purpose**: Research benchmarking of trend analysis, change-point detection, multidrug resistance patterns, and temporal train/test ML evaluation.
