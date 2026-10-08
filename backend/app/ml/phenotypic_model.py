import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score, f1_score, balanced_accuracy_score, confusion_matrix
)
from sklearn.preprocessing import OneHotEncoder
import xgboost as xgb
import pickle
import logging

from backend.app.ml.model_service import model_service, MODEL_PATH

logger = logging.getLogger("amr_sentinel.phenotypic_model")

class PhenotypicAMRModelSuite:
    """
    ML Pipeline for predicting S/I/R resistance phenotypes.
    Features:
      - Organism (Categorical)
      - Antibiotic (Categorical)
      - Zone diameter mm (Continuous)
      - Disk diameter mm (Continuous)
      - Normalized zone ratio
      - MIC (Continuous)
      - Presence of key genomic resistance markers (Binary flags)
    
    Trained on TEMPORAL train/test splits (<= 2023 Train, >= 2024 Test) to prevent data leakage.
    Evaluated with Balanced Accuracy, Macro-F1, Sensitivity, Specificity, Confusion Matrix.
    """

    def __init__(self):
        self.classes_ = ["I", "R", "S"]

    @property
    def models(self):
        return model_service.models

    @property
    def encoder(self):
        return model_service.encoder

    @property
    def metrics_report(self):
        return model_service.metrics_report

    def prepare_features(self, df: pd.DataFrame, fit_encoder: bool = False) -> Tuple[np.ndarray, np.ndarray]:
        # Feature engineering matching training specification exactly
        df = df.copy()
        df["disk_diameter_mm"] = df.get("disk_diameter_mm", 6.0)
        df["normalized_zone"] = df["zone_diameter_mm"] / df["disk_diameter_mm"]
        df["mic_clean"] = df["mic"].fillna(df["mic"].median() if not df["mic"].isna().all() else 2.0)
        df["zone_clean"] = df["zone_diameter_mm"].fillna(df["zone_diameter_mm"].median() if not df["zone_diameter_mm"].isna().all() else 18.0)

        # Canonical genomic marker flags
        key_markers = ["gyrA_S83L", "blaCTX-M-15", "blaKPC-2", "mecA", "aac(6')-Ib-cr"]
        for marker in key_markers:
            df[f"marker_{marker}"] = df["genomic_features"].fillna("").apply(lambda s: 1 if marker in str(s) else 0)

        cat_cols = ["organism", "antibiotic"]
        if fit_encoder:
            enc = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
            cat_encoded = enc.fit_transform(df[cat_cols])
            model_service.encoder = enc
        else:
            model_service.ensure_ready()
            cat_encoded = model_service.encoder.transform(df[cat_cols])

        num_cols = ["zone_clean", "disk_diameter_mm", "normalized_zone", "mic_clean"] + [f"marker_{m}" for m in key_markers]
        num_features = df[num_cols].values

        X = np.hstack([cat_encoded, num_features])
        y = df["susceptibility"].values if "susceptibility" in df.columns else np.array([])
        return X, y

    def train_and_evaluate(self, data_path: Path) -> Dict[str, Any]:
        if not data_path.exists():
            raise FileNotFoundError(f"Training dataset not found at {data_path}")

        df = pd.read_csv(data_path)
        required_cols = ["year", "organism", "antibiotic", "zone_diameter_mm", "susceptibility"]
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            raise ValueError(f"Dataset missing required columns: {', '.join(missing_cols)}")

        # Temporal Split: <= 2023 Train, >= 2024 Test
        train_df = df[df["year"] <= 2023]
        test_df = df[df["year"] >= 2024]

        if len(train_df) == 0 or len(test_df) == 0:
            raise ValueError("Insufficient temporal split data: both train (<=2023) and test (>=2024) sets must be non-empty.")

        X_train, y_train = self.prepare_features(train_df, fit_encoder=True)
        X_test, y_test = self.prepare_features(test_df, fit_encoder=False)

        trained_models = {}

        # 1. Logistic Regression
        lr = LogisticRegression(max_iter=1000, class_weight="balanced")
        lr.fit(X_train, y_train)
        trained_models["Logistic Regression"] = lr

        # 2. Random Forest
        rf = RandomForestClassifier(n_estimators=100, class_weight="balanced", random_state=42)
        rf.fit(X_train, y_train)
        trained_models["Random Forest"] = rf

        # 3. XGBoost
        label_to_int = {c: i for i, c in enumerate(self.classes_)}
        int_to_label = {i: c for i, c in enumerate(self.classes_)}
        y_train_int = np.array([label_to_int[l] for l in y_train])

        xgb_model = xgb.XGBClassifier(n_estimators=100, random_state=42, eval_metric="mlogloss")
        xgb_model.fit(X_train, y_train_int)
        trained_models["XGBoost"] = (xgb_model, int_to_label)

        metrics = {}
        for name in ["Logistic Regression", "Random Forest", "XGBoost"]:
            if name == "XGBoost":
                m, mapper = trained_models[name]
                preds_int = m.predict(X_test)
                preds = np.array([mapper[p] for p in preds_int])
            else:
                m = trained_models[name]
                preds = m.predict(X_test)

            acc = accuracy_score(y_test, preds)
            bal_acc = balanced_accuracy_score(y_test, preds)
            macro_f1 = f1_score(y_test, preds, average="macro", zero_division=0)
            
            is_r_true = (y_test == "R")
            is_r_pred = (preds == "R")
            tp = np.sum(is_r_true & is_r_pred)
            fn = np.sum(is_r_true & ~is_r_pred)
            tn = np.sum(~is_r_true & ~is_r_pred)
            fp = np.sum(~is_r_true & is_r_pred)

            sens_r = float(tp / (tp + fn)) if (tp + fn) > 0 else 0.0
            spec_r = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
            cm = confusion_matrix(y_test, preds, labels=self.classes_).tolist()

            metrics[name] = {
                "accuracy": round(float(acc), 4),
                "balanced_accuracy": round(float(bal_acc), 4),
                "macro_f1": round(float(macro_f1), 4),
                "sensitivity_resistant": round(sens_r, 4),
                "specificity_resistant": round(spec_r, 4),
                "confusion_matrix": cm,
                "classes": self.classes_,
                "train_samples": len(train_df),
                "test_samples": len(test_df),
                "split_type": "Temporal (Train <= 2023, Test >= 2024)"
            }

        # Persist atomic artifacts
        MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
        with open(MODEL_PATH, "wb") as f:
            pickle.dump({
                "models": trained_models,
                "encoder": model_service.encoder,
                "classes_": self.classes_,
                "metrics_report": metrics
            }, f)

        # Reload into active service
        model_service.load_artifacts()
        logger.info("Successfully trained and saved model suite to %s", MODEL_PATH)
        return metrics

    def predict(self, organism: str, antibiotic: str, zone_diameter_mm: float, disk_diameter_mm: float = 6.0,
                mic: Optional[float] = None, genomic_features: Optional[list] = None, model_name: str = "Random Forest") -> Dict[str, Any]:
        """Runs single isolate inference with explainability."""
        model_service.ensure_ready()

        df_single = pd.DataFrame([{
            "organism": organism,
            "antibiotic": antibiotic,
            "zone_diameter_mm": zone_diameter_mm,
            "disk_diameter_mm": disk_diameter_mm,
            "mic": mic if mic is not None else np.nan,
            "genomic_features": ";".join(genomic_features or [])
        }])

        X, _ = self.prepare_features(df_single, fit_encoder=False)

        models = model_service.models
        if model_name not in models:
            model_name = "Random Forest"

        if model_name == "XGBoost":
            m, mapper = models[model_name]
            pred_int = m.predict(X)[0]
            pred_class = mapper[pred_int]
            probs = m.predict_proba(X)[0]
            prob_dict = {mapper[i]: round(float(p), 4) for i, p in enumerate(probs)}
        else:
            m = models[model_name]
            pred_class = m.predict(X)[0]
            probs = m.predict_proba(X)[0]
            prob_dict = {cls: round(float(p), 4) for cls, p in zip(m.classes_, probs)}

        evidence = [
            f"Bacterial species: {organism}",
            f"Antibiotic tested: {antibiotic}",
            f"Measured zone diameter: {zone_diameter_mm:.1f} mm (Disk: {disk_diameter_mm:.1f} mm)",
        ]
        if mic is not None:
            evidence.append(f"Broth Microdilution MIC: {mic} ug/mL")
        if genomic_features:
            evidence.append(f"Genomic resistance markers observed: {', '.join(genomic_features)}")
        else:
            evidence.append("No specific genomic resistance markers detected.")

        confidence = prob_dict.get(pred_class, 0.85)

        return {
            "organism": organism,
            "antibiotic": antibiotic,
            "predicted_class": pred_class,
            "confidence": confidence,
            "probabilities": prob_dict,
            "model_used": model_name,
            "evidence": evidence,
            "disclaimer": "AMR Sentinel is an AI research prototype. Model predictions are for academic surveillance study and not validated for clinical diagnosis or prescription."
        }

phenotypic_model_suite = PhenotypicAMRModelSuite()
