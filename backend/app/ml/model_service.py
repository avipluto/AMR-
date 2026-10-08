import os
import pickle
import logging
from pathlib import Path
from typing import Dict, Any, Optional

logger = logging.getLogger("amr_sentinel.model_service")

# Default model directory resolution
DEFAULT_MODEL_DIR = Path(__file__).resolve().parent.parent.parent / "models"
MODEL_PATH = Path(os.getenv("AMR_MODEL_PATH", DEFAULT_MODEL_DIR / "amr_suite.pkl"))

class AMRModelService:
    """
    Centralized model loading and management service for AMR Sentinel.
    Enforces atomic artifact verification: models, preprocessors (encoders/scalers),
    class lists, and metrics must all exist together.
    """
    def __init__(self, artifact_path: Optional[Path] = None):
        self.artifact_path = artifact_path or MODEL_PATH
        self.models = {}
        self.encoder = None
        self.classes_ = []
        self.metrics_report = {}
        self.is_loaded = False
        self.load_error = None
        
        # Attempt immediate load
        self.load_artifacts()

    def load_artifacts(self) -> bool:
        """Loads and verifies all required ML components together."""
        if not self.artifact_path.exists():
            self.load_error = (
                f"AMR prediction model artifact not found at {self.artifact_path}. "
                "Please train or configure the model before using this endpoint."
            )
            logger.warning(self.load_error)
            self.is_loaded = False
            return False

        try:
            with open(self.artifact_path, "rb") as f:
                data = pickle.load(f)

            models = data.get("models")
            encoder = data.get("encoder")
            classes_ = data.get("classes_")
            metrics_report = data.get("metrics_report", {})

            # Strict validation: no None components allowed
            missing = []
            if not models:
                missing.append("models")
            if encoder is None:
                missing.append("encoder/preprocessor")
            if not classes_:
                missing.append("classes")

            if missing:
                self.load_error = f"Incomplete model artifact at {self.artifact_path}. Missing: {', '.join(missing)}."
                logger.error(self.load_error)
                self.is_loaded = False
                return False

            self.models = models
            self.encoder = encoder
            self.classes_ = classes_
            self.metrics_report = metrics_report
            self.is_loaded = True
            self.load_error = None
            logger.info(f"Successfully loaded AMR models and preprocessor from {self.artifact_path}")
            return True

        except Exception as e:
            self.load_error = f"Failed to load AMR model artifacts from {self.artifact_path}: {str(e)}"
            logger.error(self.load_error)
            self.is_loaded = False
            return False

    def ensure_ready(self):
        """Raises RuntimeError if models/transformers are unavailable."""
        if not self.is_loaded or self.encoder is None:
            # Re-try loading in case file was recently created
            if not self.load_artifacts():
                raise RuntimeError(self.load_error or "AMR prediction model is not trained/configured.")

model_service = AMRModelService()
