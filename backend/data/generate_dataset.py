import random
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "data"
RAW_FILE = DATA_DIR / "raw" / "surveillance_isolates.csv"

ORGANISMS = [
    "Escherichia coli",
    "Klebsiella pneumoniae",
    "Staphylococcus aureus",
    "Pseudomonas aeruginosa"
]

ANTIBIOTICS = {
    "Escherichia coli": ["Ciprofloxacin", "Gentamicin", "Ampicillin", "Tetracycline", "Ceftriaxone"],
    "Klebsiella pneumoniae": ["Ciprofloxacin", "Gentamicin", "Ampicillin", "Meropenem", "Ceftriaxone"],
    "Staphylococcus aureus": ["Ciprofloxacin", "Gentamicin", "Oxacillin", "Vancomycin", "Tetracycline"],
    "Pseudomonas aeruginosa": ["Ciprofloxacin", "Gentamicin", "Meropenem", "Ceftriaxone"]
}

LOCATIONS = ["North Region (Hospital A)", "South District (General)", "East Metro Clinic", "West Medical Center"]

def generate_realistic_surveillance_cohort(n_isolates=3500, seed=42):
    random.seed(seed)
    np.random.seed(seed)

    start_date = datetime(2021, 1, 1)
    end_date = datetime(2025, 12, 31)
    total_days = (end_date - start_date).days

    records = []

    for i in range(1, n_isolates + 1):
        isolate_id = f"ISO-202{random.randint(1,5)}-{i:05d}"
        days_offset = random.randint(0, total_days)
        col_date = start_date + timedelta(days=days_offset)
        year = col_date.year
        
        organism = random.choices(ORGANISMS, weights=[0.40, 0.28, 0.22, 0.10])[0]
        location = random.choice(LOCATIONS)
        
        # Test a panel of 2-3 antibiotics per isolate
        available_abs = ANTIBIOTICS[organism]
        chosen_abs = random.sample(available_abs, k=min(len(available_abs), random.randint(2, 3)))
        
        for ab in chosen_abs:
            # Baseline resistance with authentic historical trend shift
            base_r_rate = 0.18
            if organism == "Escherichia coli" and ab == "Ciprofloxacin":
                # Simulated realistic emergent trend: 18% in 2021 -> ~34% in 2025
                base_r_rate = 0.16 + (year - 2021) * 0.045
            elif organism == "Klebsiella pneumoniae" and ab == "Meropenem":
                # Carbapenem resistance emergence in East Metro Clinic
                base_r_rate = 0.06 + (year - 2021) * 0.038 if "East" in location else 0.08
            elif organism == "Staphylococcus aureus" and ab == "Oxacillin":
                # MRSA plateauing at ~26%
                base_r_rate = 0.24 + (year - 2021) * 0.005
            elif ab == "Ampicillin":
                base_r_rate = 0.58 # High baseline resistance for ampicillin
            elif ab == "Vancomycin":
                base_r_rate = 0.01 # Very low VRSA

            # S / I / R assignment
            is_r = np.random.rand() < base_r_rate
            is_i = False if is_r else (np.random.rand() < 0.08)
            susceptibility = "R" if is_r else ("I" if is_i else "S")

            # Synthetic zone diameter consistent with phenotype
            if susceptibility == "R":
                zone = round(np.random.uniform(6.0, 15.0), 1)
                mic = round(np.random.uniform(16.0, 64.0), 1)
            elif susceptibility == "I":
                zone = round(np.random.uniform(16.0, 21.0), 1)
                mic = round(np.random.uniform(4.0, 8.0), 1)
            else:
                zone = round(np.random.uniform(22.0, 32.0), 1)
                mic = round(np.random.uniform(0.1, 2.0), 2)

            # Genomic markers if resistant
            genomic_features = []
            if susceptibility == "R":
                if ab in ["Ciprofloxacin"] and np.random.rand() < 0.85:
                    genomic_features.append("gyrA_S83L")
                if ab in ["Ampicillin", "Ceftriaxone"] and np.random.rand() < 0.75:
                    genomic_features.append("blaCTX-M-15")
                if ab in ["Meropenem"] and np.random.rand() < 0.80:
                    genomic_features.append("blaKPC-2")
                if ab in ["Oxacillin"] and np.random.rand() < 0.90:
                    genomic_features.append("mecA")
                if ab in ["Gentamicin"] and np.random.rand() < 0.70:
                    genomic_features.append("aac(6')-Ib-cr")

            records.append({
                "isolate_id": isolate_id,
                "organism": organism,
                "collection_date": col_date.strftime("%Y-%m-%d"),
                "year": year,
                "month": col_date.strftime("%Y-%m"),
                "location": location,
                "antibiotic": ab,
                "zone_diameter_mm": zone,
                "mic": mic,
                "susceptibility": susceptibility,
                "genomic_features": ";".join(genomic_features),
                "source_dataset": "AMR-Sentinel Benchmark Cohort (Simulated Longitudinal)"
            })

    df = pd.DataFrame(records)
    RAW_FILE.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(RAW_FILE, index=False)
    print(f"Generated {len(df)} AST observations across {n_isolates} isolates at {RAW_FILE}")
    return df

if __name__ == "__main__":
    generate_realistic_surveillance_cohort()
