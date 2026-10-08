import json
from pathlib import Path
from typing import Optional, Dict, Any

BREAKPOINTS_FILE = Path(__file__).parent.parent.parent / "data" / "breakpoints" / "clsi_breakpoints.json"

class BreakpointManager:
    """
    Manages clinical/epidemiological breakpoints strictly according to reference standards.
    Never invents breakpoint values. If not present, returns 'Interpretation unavailable'.
    """
    def __init__(self, filepath: Optional[Path] = None):
        self.filepath = filepath or BREAKPOINTS_FILE
        self.breakpoints = []
        self._load()

    def _load(self):
        if self.filepath.exists():
            with open(self.filepath, "r", encoding="utf-8") as f:
                self.breakpoints = json.load(f)
        else:
            self.breakpoints = []

    def find_breakpoint(self, organism: str, antibiotic: str) -> Optional[Dict[str, Any]]:
        for bp in self.breakpoints:
            if bp["organism"].lower() == organism.lower() and bp["antibiotic"].lower() == antibiotic.lower():
                return bp
        # check abbreviation
        for bp in self.breakpoints:
            if bp["organism"].lower() == organism.lower() and bp.get("antibiotic_code", "").lower() == antibiotic.lower():
                return bp
        return None

    def interpret_zone(self, organism: str, antibiotic: str, zone_diameter_mm: float) -> Dict[str, Any]:
        bp = self.find_breakpoint(organism, antibiotic)
        if not bp or bp.get("measurement_type") != "zone_diameter_mm":
            return {
                "organism": organism,
                "antibiotic": antibiotic,
                "measurement_type": "zone_diameter_mm",
                "value": zone_diameter_mm,
                "classification": "Interpretation unavailable",
                "reason": "No validated standard breakpoint found for this organism and antibiotic combination in reference database.",
                "standard": None,
                "standard_version": None,
                "source": None
            }

        s_min = bp.get("susceptible_min")
        i_min = bp.get("intermediate_min")
        i_max = bp.get("intermediate_max")
        r_max = bp.get("resistant_max")

        classification = "Unknown"
        if s_min is not None and zone_diameter_mm >= s_min:
            classification = "S"
        elif r_max is not None and zone_diameter_mm <= r_max:
            classification = "R"
        elif i_min is not None and i_max is not None and i_min <= zone_diameter_mm <= i_max:
            classification = "I"
        else:
            # edge cases
            if zone_diameter_mm > (r_max or 0) and (s_min is None or zone_diameter_mm < s_min):
                classification = "I"
            else:
                classification = "Indeterminate"

        return {
            "organism": bp["organism"],
            "antibiotic": bp["antibiotic"],
            "measurement_type": "zone_diameter_mm",
            "value": round(zone_diameter_mm, 1),
            "classification": classification,
            "standard": bp.get("standard"),
            "standard_version": bp.get("standard_version"),
            "source": bp.get("source"),
            "breakpoints": {
                "susceptible": f">= {s_min} mm" if s_min is not None else None,
                "intermediate": f"{i_min}-{i_max} mm" if i_min is not None else None,
                "resistant": f"<= {r_max} mm" if r_max is not None else None
            }
        }

    def interpret_mic(self, organism: str, antibiotic: str, mic_ug_ml: float) -> Dict[str, Any]:
        bp = self.find_breakpoint(organism, antibiotic)
        if not bp or bp.get("measurement_type") != "mic_ug_ml":
            return {
                "organism": organism,
                "antibiotic": antibiotic,
                "measurement_type": "mic_ug_ml",
                "value": mic_ug_ml,
                "classification": "Interpretation unavailable",
                "reason": "No validated MIC breakpoint found for this organism and antibiotic.",
                "standard": None,
                "standard_version": None
            }

        s_max = bp.get("susceptible_max")
        r_min = bp.get("resistant_min")
        i_min = bp.get("intermediate_min")
        i_max = bp.get("intermediate_max")

        if s_max is not None and mic_ug_ml <= s_max:
            classification = "S"
        elif r_min is not None and mic_ug_ml >= r_min:
            classification = "R"
        elif i_min is not None and i_max is not None and i_min <= mic_ug_ml <= i_max:
            classification = "I"
        else:
            classification = "Indeterminate"

        return {
            "organism": bp["organism"],
            "antibiotic": bp["antibiotic"],
            "measurement_type": "mic_ug_ml",
            "value": mic_ug_ml,
            "classification": classification,
            "standard": bp.get("standard"),
            "standard_version": bp.get("standard_version"),
            "source": bp.get("source")
        }

breakpoint_manager = BreakpointManager()
