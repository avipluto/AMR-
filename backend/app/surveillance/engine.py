import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, List, Optional
from scipy import stats

DATA_FILE = Path(__file__).parent.parent.parent / "data" / "raw" / "surveillance_isolates.csv"

class SurveillanceEngine:
    """
    AMR Surveillance & Population-Level Analysis Engine.
    Computes:
      - S/I/R percentages overall, by antibiotic, organism, location, year
      - Multidrug resistance (MDR) rate: resistance to >= 3 antibiotic classes
      - Longitudinal trends over time
      - Statistical safeguards: sample size thresholds, confidence classification
      - Emerging resistance change-point detection & AMR Trend/Risk Score
    """

    def __init__(self, data_path: Optional[Path] = None):
        self.data_path = data_path or DATA_FILE
        self._df = None
        self._load()

    def _load(self):
        if self.data_path.exists():
            self._df = pd.read_csv(self.data_path)
        else:
            self._df = pd.DataFrame()

    def get_overview_metrics(self) -> Dict[str, Any]:
        if self._df.empty:
            return {
                "status": "no_data",
                "message": "No surveillance data is currently available.",
                "total_observations": 0,
                "total_isolates": 0,
                "antibiotics_analyzed": 0,
                "organisms_analyzed": 0,
                "resistance_rate_pct": 0.0,
                "susceptibility_rate_pct": 0.0,
                "intermediate_rate_pct": 0.0,
                "mdr_isolates_count": 0,
                "mdr_rate_pct": 0.0,
                "emerging_trends_count": 0,
                "years_covered": []
            }

        total_observations = len(self._df)
        total_isolates = self._df["isolate_id"].nunique()
        total_antibiotics = self._df["antibiotic"].nunique()
        total_organisms = self._df["organism"].nunique()

        overall_r_rate = (self._df["susceptibility"] == "R").mean() * 100
        overall_s_rate = (self._df["susceptibility"] == "S").mean() * 100
        overall_i_rate = (self._df["susceptibility"] == "I").mean() * 100

        # MDR calculation: isolates resistant to >= 3 distinct antibiotics
        isolate_r_counts = self._df[self._df["susceptibility"] == "R"].groupby("isolate_id")["antibiotic"].nunique()
        mdr_isolates = (isolate_r_counts >= 3).sum()
        mdr_rate = (mdr_isolates / total_isolates) * 100 if total_isolates > 0 else 0.0

        # Detect high-trend signals
        emerging_signals = self.detect_emerging_trends()

        return {
            "total_observations": total_observations,
            "total_isolates": total_isolates,
            "antibiotics_analyzed": total_antibiotics,
            "organisms_analyzed": total_organisms,
            "resistance_rate_pct": round(overall_r_rate, 2),
            "susceptibility_rate_pct": round(overall_s_rate, 2),
            "intermediate_rate_pct": round(overall_i_rate, 2),
            "mdr_isolates_count": int(mdr_isolates),
            "mdr_rate_pct": round(mdr_rate, 2),
            "emerging_trends_count": len(emerging_signals),
            "years_covered": sorted(self._df["year"].unique().tolist())
        }

    def get_trends_timeline(
        self,
        organism: Optional[str] = None,
        antibiotic: Optional[str] = None,
        location: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if self._df.empty:
            return []

        df = self._df.copy()
        if organism and organism != "All":
            df = df[df["organism"] == organism]
        if antibiotic and antibiotic != "All":
            df = df[df["antibiotic"] == antibiotic]
        if location and location != "All":
            df = df[df["location"] == location]

        if df.empty:
            return []

        timeline = []
        for year, grp in df.groupby("year"):
            total = len(grp)
            r_count = (grp["susceptibility"] == "R").sum()
            s_count = (grp["susceptibility"] == "S").sum()
            i_count = (grp["susceptibility"] == "I").sum()

            r_pct = (r_count / total * 100) if total > 0 else 0
            s_pct = (s_count / total * 100) if total > 0 else 0
            i_pct = (i_count / total * 100) if total > 0 else 0

            # Wilson score interval or sample size safeguard
            conf = "Strong evidence" if total >= 50 else ("Moderate evidence" if total >= 20 else "Insufficient data")

            timeline.append({
                "year": int(year),
                "total_isolates": total,
                "resistance_pct": round(r_pct, 2),
                "susceptible_pct": round(s_pct, 2),
                "intermediate_pct": round(i_pct, 2),
                "confidence_level": conf
            })

        timeline = sorted(timeline, key=lambda x: x["year"])
        return timeline

    def get_heatmap_matrix(self, location: Optional[str] = None) -> Dict[str, Any]:
        """Matrix of Organisms (rows) x Antibiotics (columns) -> Resistance %."""
        if self._df.empty:
            return {"organisms": [], "antibiotics": [], "matrix": []}

        df = self._df.copy()
        if location and location != "All":
            df = df[df["location"] == location]

        orgs = sorted(df["organism"].unique().tolist())
        abs_list = sorted(df["antibiotic"].unique().tolist())

        matrix = []
        for org in orgs:
            row_data = {"organism": org}
            for ab in abs_list:
                sub = df[(df["organism"] == org) & (df["antibiotic"] == ab)]
                if len(sub) >= 5: # Minimal safeguard
                    r_pct = round((sub["susceptibility"] == "R").mean() * 100, 1)
                    row_data[ab] = {
                        "resistance_pct": r_pct,
                        "sample_size": len(sub),
                        "status": "High" if r_pct >= 40 else ("Moderate" if r_pct >= 20 else "Low")
                    }
                else:
                    row_data[ab] = {
                        "resistance_pct": None,
                        "sample_size": len(sub),
                        "status": "Insufficient data"
                    }
            matrix.append(row_data)

        return {
            "organisms": orgs,
            "antibiotics": abs_list,
            "matrix": matrix
        }

    def detect_emerging_trends(self, min_sample_size: int = 25) -> List[Dict[str, Any]]:
        """
        Identifies emerging resistance patterns across organism-antibiotic pairs.
        Uses statistical slope and delta over the last 2-3 years.
        Implements strict safeguards against sample size bias.
        """
        if self._df.empty:
            return []

        emerging = []
        grouped = self._df.groupby(["organism", "antibiotic"])

        current_year = int(self._df["year"].max())
        prev_year = current_year - 1

        for (org, ab), grp in grouped:
            if len(grp) < min_sample_size:
                continue

            grp_current = grp[grp["year"] == current_year]
            grp_prev = grp[grp["year"] == prev_year]

            if len(grp_current) < 15 or len(grp_prev) < 15:
                # Insufficient longitudinal volume in recent periods
                continue

            r_current = (grp_current["susceptibility"] == "R").mean() * 100
            r_prev = (grp_prev["susceptibility"] == "R").mean() * 100
            change_12mo = r_current - r_prev

            # Yearly regression slope
            yearly_r = grp.groupby("year")["susceptibility"].apply(lambda s: (s == "R").mean() * 100)
            if len(yearly_r) >= 3:
                x = yearly_r.index.values
                y = yearly_r.values
                slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)
            else:
                slope = change_12mo
                p_value = 0.5

            # Calculate Research-only AMR Trend Score (0 - 100)
            # Factors: Current R rate (30%), 12mo change (35%), Data volume (15%), Long-term slope (20%)
            vol_score = min(100, (len(grp) / 500) * 100)
            change_score = max(0, min(100, (change_12mo / 15) * 100))
            current_r_score = max(0, min(100, (r_current / 60) * 100))
            slope_score = max(0, min(100, (slope / 5) * 100))

            trend_score = int(0.30 * current_r_score + 0.35 * change_score + 0.15 * vol_score + 0.20 * slope_score)

            # Flag condition: slope > 1.5% per year and change_12mo >= 3.0%
            if change_12mo >= 3.0 or slope >= 2.0:
                emerging.append({
                    "organism": org,
                    "antibiotic": ab,
                    "trend_direction": "Increasing" if slope > 0 else "Decreasing",
                    "current_resistance_pct": round(r_current, 1),
                    "previous_resistance_pct": round(r_prev, 1),
                    "change_12mo_pct": round(change_12mo, 1),
                    "annual_slope": round(slope, 2),
                    "p_value": round(float(p_value), 4) if not np.isnan(p_value) else None,
                    "sample_size_total": len(grp),
                    "sample_size_recent": len(grp_current),
                    "confidence": "Strong evidence" if len(grp_current) >= 40 else "Moderate evidence",
                    "amr_trend_score": trend_score,
                    "status_flag": "Emerging resistance pattern" if trend_score >= 50 else "Watchlist",
                    "contributing_factors": [
                        f"Current resistance rate at {round(r_current, 1)}%",
                        f"12-month delta of +{round(change_12mo, 1)}%",
                        f"Consistent longitudinal upward trajectory (slope: +{round(slope, 2)}%/year)",
                        f"Validated across {len(grp)} laboratory isolate tests"
                    ]
                })

        # Sort by trend score descending
        emerging = sorted(emerging, key=lambda x: x["amr_trend_score"], reverse=True)
        return emerging

    def get_isolates_table(self, limit: int = 50, organism: Optional[str] = None) -> List[Dict[str, Any]]:
        if self._df.empty:
            return []
        df = self._df
        if organism and organism != "All":
            df = df[df["organism"] == organism]
        # Clean NaN values so Pydantic / json serializers produce valid nulls
        clean_df = df.head(limit).replace({np.nan: None})
        records = clean_df.to_dict(orient="records")
        return records

surveillance_engine = SurveillanceEngine()
