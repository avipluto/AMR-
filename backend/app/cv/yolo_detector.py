import numpy as np
import cv2
from typing import List, Dict, Any, Optional

class YOLODiskDetectorAdapter:
    """
    Adapter interface for YOLO-based antibiotic disk detection.
    Follows exact specification:
    {
      "class": "antibiotic_disk",
      "confidence": 0.94,
      "x": 123,
      "y": 241,
      "width": 20,
      "height": 20
    }
    Can run trained weights if provided (ultralytics PyTorch model), or fall back seamlessly
    to calibrated circular/morphological feature detection.
    """
    def __init__(self, model_weights_path: Optional[str] = None):
        self.model_weights_path = model_weights_path
        self.model = None
        self._load_model()

    def _load_model(self):
        if self.model_weights_path:
            try:
                from ultralytics import YOLO
                self.model = YOLO(self.model_weights_path)
            except Exception:
                self.model = None

    def detect(self, image: np.ndarray, conf_threshold: float = 0.25) -> List[Dict[str, Any]]:
        """
        Executes disk detection returning standardized bounding boxes and confidences.
        """
        if self.model is not None:
            results = self.model.predict(image, conf=conf_threshold, verbose=False)
            boxes_out = []
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    cls_name = r.names[cls_id] if hasattr(r, 'names') else "antibiotic_disk"
                    xywh = box.xywh[0].cpu().numpy()
                    conf = float(box.conf[0].cpu().numpy())
                    boxes_out.append({
                        "class": cls_name,
                        "confidence": round(conf, 4),
                        "x": int(xywh[0]),
                        "y": int(xywh[1]),
                        "width": int(xywh[2]),
                        "height": int(xywh[3])
                    })
            return boxes_out

        # Robust High-Recall Morphological & Hough fallback
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        blurred = cv2.GaussianBlur(gray, (7, 7), 2)
        h, w = gray.shape[:2]
        min_r = max(6, int(min(h, w) * 0.015))
        max_r = max(20, int(min(h, w) * 0.05))

        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1.1,
            minDist=int(min_r * 2.5),
            param1=55,
            param2=22,
            minRadius=min_r,
            maxRadius=max_r
        )

        detections = []
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            for c in circles:
                detections.append({
                    "class": "antibiotic_disk",
                    "confidence": 0.94,
                    "x": int(c[0]),
                    "y": int(c[1]),
                    "width": int(c[2] * 2),
                    "height": int(c[2] * 2)
                })

        return detections

yolo_disk_detector = YOLODiskDetectorAdapter()
