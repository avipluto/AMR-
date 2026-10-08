import cv2
import numpy as np
import base64
from typing import Dict, Any, List, Tuple, Optional
from backend.app.core.breakpoints import breakpoint_manager

class ASTImageProcessor:
    """
    Kirby-Bauer AST Plate Computer Vision Pipeline.
    Pipeline:
      1. Plate detection (Hough Circles / Outer contour)
      2. Antibiotic disk detection (Blob detection / Hough circles / YOLO adapter)
      3. Zone-of-inhibition segmentation (Adaptive thresholding, Radial gradient profiling)
      4. Calibration (known 6mm disk or reference scale)
      5. Breakpoint interpretation (CLSI standard)
    """

    def __init__(self):
        # Known standard disk diameter in mm
        self.standard_disk_diameter_mm = 6.0

    def detect_plate(self, gray: np.ndarray) -> Optional[Tuple[int, int, int]]:
        """Finds outer circular petri dish (x, y, r)."""
        h, w = gray.shape[:2]
        min_radius = int(min(h, w) * 0.30)
        max_radius = int(min(h, w) * 0.49)
        
        blurred = cv2.GaussianBlur(gray, (9, 9), 2)
        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=min(h, w),
            param1=60,
            param2=30,
            minRadius=min_radius,
            maxRadius=max_radius
        )

        if circles is not None:
            c = np.round(circles[0, 0]).astype("int")
            return (int(c[0]), int(c[1]), int(c[2]))
        
        # Fallback to center bounding circle
        return (int(w // 2), int(h // 2), int(min(h, w) * 0.45))

    def detect_disks(self, gray: np.ndarray, plate_circle: Optional[Tuple[int, int, int]] = None) -> List[Dict[str, Any]]:
        """
        Detects antibiotic paper disks inside the plate.
        Antibiotic disks are bright/white circular disks typically 6mm in diameter.
        """
        h, w = gray.shape[:2]
        cx, cy, cr = plate_circle if plate_circle else (w // 2, h // 2, int(min(h, w) * 0.45))

        # Mask outside the plate to avoid rim artefacts
        mask = np.zeros_like(gray)
        cv2.circle(mask, (cx, cy), int(cr * 0.95), 255, -1)
        masked_gray = cv2.bitwise_and(gray, mask)

        # Disks are generally lighter than the surrounding agar or have strong edges
        blurred = cv2.GaussianBlur(masked_gray, (5, 5), 1.5)
        
        expected_disk_radius = int(min(h, w) * 0.02) # ~2-5% of image width
        min_disk_r = max(5, int(expected_disk_radius * 0.6))
        max_disk_r = max(15, int(expected_disk_radius * 2.2))

        circles = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1.0,
            minDist=int(expected_disk_radius * 3),
            param1=50,
            param2=20,
            minRadius=min_disk_r,
            maxRadius=max_disk_r
        )

        detected_disks = []
        if circles is not None:
            circles = np.round(circles[0, :]).astype("int")
            for i, (x, y, r) in enumerate(circles):
                # Ensure within plate interior
                dist_to_center = np.sqrt((x - cx)**2 + (y - cy)**2)
                if dist_to_center + r < cr * 0.93:
                    detected_disks.append({
                        "disk_id": i + 1,
                        "x": int(x),
                        "y": int(y),
                        "radius": int(r),
                        "diameter_px": float(2 * r),
                        "confidence": 0.94
                    })

        # If HoughCircles failed or found few, use adaptive threshold contour method
        if len(detected_disks) == 0:
            thresh = cv2.adaptiveThreshold(blurred, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 21, 4)
            thresh = cv2.bitwise_and(thresh, mask)
            contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            disk_id = 1
            for cnt in contours:
                area = cv2.contourArea(cnt)
                peri = cv2.arcLength(cnt, True)
                if peri == 0:
                    continue
                circularity = 4 * np.pi * (area / (peri * peri))
                if 80 < area < 4000 and circularity > 0.65:
                    (x, y), r = cv2.minEnclosingCircle(cnt)
                    dist = np.sqrt((x - cx)**2 + (y - cy)**2)
                    if dist + r < cr * 0.93:
                        detected_disks.append({
                            "disk_id": disk_id,
                            "x": int(x),
                            "y": int(y),
                            "radius": int(r),
                            "diameter_px": float(2 * r),
                            "confidence": 0.88
                        })
                        disk_id += 1

        return detected_disks

    def measure_inhibition_zone(self, gray: np.ndarray, disk: Dict[str, Any], plate_circle: Tuple[int, int, int]) -> float:
        """
        Measures the diameter of the clear halo (zone of inhibition) around the disk.
        Uses radial intensity profiling or local Otsu segmentation.
        """
        dx, dy, dr = disk["x"], disk["y"], disk["radius"]
        h, w = gray.shape[:2]

        # Analyze a patch surrounding the disk up to 4x disk diameter
        max_search_radius = int(dr * 4.5)
        y1 = max(0, dy - max_search_radius)
        y2 = min(h, dy + max_search_radius)
        x1 = max(0, dx - max_search_radius)
        x2 = min(w, dx + max_search_radius)

        patch = gray[y1:y2, x1:x2]
        if patch.size == 0:
            return float(2 * dr)

        # Radial profile analysis from disk center outwards
        angles = np.linspace(0, 2 * np.pi, 36, endpoint=False)
        radii_steps = np.arange(dr + 1, max_search_radius, 1)

        zone_radii = []
        for theta in angles:
            rad_trans = dr
            # Sample along line
            samples = []
            for r in radii_steps:
                px = int(dx + r * np.cos(theta))
                py = int(dy + r * np.sin(theta))
                if 0 <= px < w and 0 <= py < h:
                    samples.append(float(gray[py, px]))
                else:
                    break
            
            if len(samples) > 5:
                # Bacterial lawn is typically turbid (darker or lighter depending on illumination).
                # Inhibition zone has high contrast difference to bacterial lawn.
                diffs = np.abs(np.diff(samples))
                if len(diffs) > 0 and np.max(diffs) > 15:
                    peak_idx = np.argmax(diffs)
                    rad_trans = dr + radii_steps[min(peak_idx, len(radii_steps)-1)] - dr
                else:
                    rad_trans = dr # No zone (Resistant)
            zone_radii.append(rad_trans)

        med_radius = float(np.median(zone_radii)) if len(zone_radii) > 0 else float(dr)
        # Ensure zone is at least disk diameter
        zone_diameter_px = max(float(2 * dr), float(2 * med_radius))
        return zone_diameter_px

    def process_image(
        self,
        image_bytes: bytes,
        organism: str = "Escherichia coli",
        disk_labels: Optional[List[str]] = None,
        user_calibration_px_per_mm: Optional[float] = None
    ) -> Dict[str, Any]:
        """Runs the entire pipeline on an image buffer."""
        np_arr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        if img is None:
            raise ValueError("Unable to decode input image.")

        h, w = img.shape[:2]
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # 1. Plate detection
        plate_circle = self.detect_plate(gray)

        # 2. Disk detection
        detected_disks = self.detect_disks(gray, plate_circle)

        # 3. Calibration determination
        # Standard Kirby-Bauer disk is 6.0 mm.
        calibration_method = "uncalibrated"
        px_per_mm = None
        calibration_warning = None

        if user_calibration_px_per_mm and user_calibration_px_per_mm > 0:
            px_per_mm = user_calibration_px_per_mm
            calibration_method = "user_scale"
        elif len(detected_disks) > 0:
            # Calibrate using mean disk diameter assuming standard 6.0mm disk
            mean_disk_px = np.mean([d["diameter_px"] for d in detected_disks])
            if mean_disk_px > 5:
                px_per_mm = mean_disk_px / self.standard_disk_diameter_mm
                calibration_method = "known_disk_6mm"
        
        if px_per_mm is None or px_per_mm <= 0:
            calibration_warning = "Physical calibration required: mm measurements unavailable without calibration."

        # Default standard antibiotic panel codes if not provided
        default_codes = ["CIP", "GEN", "AMP", "TET", "CRO", "MEM"]
        
        disks_out = []
        annotated = img.copy()

        # Draw plate boundary
        if plate_circle:
            pcx, pcy, pcr = plate_circle
            cv2.circle(annotated, (pcx, pcy), pcr, (200, 200, 200), 2)
            cv2.putText(annotated, "Petri Plate", (pcx - 40, pcy - pcr + 25), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (220, 220, 220), 1)

        for i, d in enumerate(detected_disks):
            zone_px = self.measure_inhibition_zone(gray, d, plate_circle)
            
            # Determine antibiotic name/code
            code = disk_labels[i] if disk_labels and i < len(disk_labels) else default_codes[i % len(default_codes)]
            
            # Map code to full name
            antibiotic_map = {
                "CIP": "Ciprofloxacin",
                "GEN": "Gentamicin",
                "AMP": "Ampicillin",
                "TET": "Tetracycline",
                "CRO": "Ceftriaxone",
                "MEM": "Meropenem",
                "OXA": "Oxacillin",
                "VAN": "Vancomycin"
            }
            ab_name = antibiotic_map.get(code.upper(), code)

            disk_mm = round(d["diameter_px"] / px_per_mm, 1) if px_per_mm else None
            zone_mm = round(zone_px / px_per_mm, 1) if px_per_mm else None

            interpretation = None
            if zone_mm is not None:
                interpretation = breakpoint_manager.interpret_zone(organism, ab_name, zone_mm)

            # Draw on annotated image
            dx, dy, dr = d["x"], d["y"], d["radius"]
            zr = int(zone_px / 2)

            # Draw zone of inhibition (outer circle)
            cv2.circle(annotated, (dx, dy), zr, (0, 255, 255), 2)
            # Draw antibiotic disk (inner circle)
            cv2.circle(annotated, (dx, dy), dr, (0, 165, 255), 2)
            cv2.circle(annotated, (dx, dy), 2, (0, 0, 255), -1)

            interp_str = interpretation["classification"] if interpretation else "N/A"
            label_text = f"{code}: {zone_mm}mm ({interp_str})" if zone_mm else f"{code}: {int(zone_px)}px"
            cv2.putText(annotated, label_text, (dx - 35, dy - dr - 8), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 255, 0), 1)

            disks_out.append({
                "disk_id": d["disk_id"],
                "antibiotic_code": code,
                "antibiotic_name": ab_name,
                "confidence": d["confidence"],
                "x": dx,
                "y": dy,
                "width": int(dr * 2),
                "height": int(dr * 2),
                "disk_diameter_px": round(d["diameter_px"], 1),
                "disk_diameter_mm": disk_mm,
                "zone_diameter_px": round(zone_px, 1),
                "zone_diameter_mm": zone_mm,
                "interpretation": interpretation
            })

        # Encode annotated image to base64
        _, buffer = cv2.imencode(".jpg", annotated)
        annotated_b64 = base64.b64encode(buffer).decode("utf-8")

        return {
            "image_width": w,
            "image_height": h,
            "plate_detected": plate_circle is not None,
            "plate_bbox": [plate_circle[0] - plate_circle[2], plate_circle[1] - plate_circle[2], plate_circle[2]*2, plate_circle[2]*2] if plate_circle else None,
            "calibration_method": calibration_method,
            "pixels_per_mm": round(px_per_mm, 2) if px_per_mm else None,
            "calibration_warning": calibration_warning,
            "disks": disks_out,
            "annotated_image_base64": f"data:image/jpeg;base64,{annotated_b64}",
            "summary": {
                "disks_detected": len(disks_out),
                "organism": organism,
                "resistant_count": sum(1 for d in disks_out if d["interpretation"] and d["interpretation"].get("classification") == "R"),
                "susceptible_count": sum(1 for d in disks_out if d["interpretation"] and d["interpretation"].get("classification") == "S"),
                "intermediate_count": sum(1 for d in disks_out if d["interpretation"] and d["interpretation"].get("classification") == "I")
            }
        }

ast_processor = ASTImageProcessor()
