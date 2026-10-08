import json
from pathlib import Path
from typing import List, Dict, Any, Optional

GENE_CATALOG_FILE = Path(__file__).parent.parent.parent / "data" / "breakpoints" / "amr_gene_catalog.json"

class GenomicAMRAnalyzer:
    """
    Ingests bacterial genomic information (FASTA sequences, gene lists, AMRFinder/CARD-style tables)
    and identifies known resistance-associated genes/mutations.
    Maintains clear scientific separation between genotypic markers and phenotypic expression.
    """
    def __init__(self, catalog_path: Optional[Path] = None):
        self.catalog_path = catalog_path or GENE_CATALOG_FILE
        self.catalog = []
        self._load()

    def _load(self):
        if self.catalog_path.exists():
            with open(self.catalog_path, "r", encoding="utf-8") as f:
                self.catalog = json.load(f)
        else:
            self.catalog = []

    def analyze(self, organism: str, input_type: str, content: str) -> Dict[str, Any]:
        """
        Analyzes FASTA headers/sequences, gene identifiers, or AMRFinder-style lines.
        """
        detected_features = []
        implicated_classes = set()
        matched_genes = set()

        content_clean = content.lower()

        # Iterate through catalog entries
        for entry in self.catalog:
            gene = entry["gene_symbol"].lower()
            # Check for direct match or variants (e.g. blaCTX-M, CTX-M-15, gyrA)
            simple_gene = gene.split("_")[0]
            
            matched = False
            if gene in content_clean:
                matched = True
            elif simple_gene in content_clean and len(simple_gene) >= 4:
                # E.g. blaNDM or blaKPC
                matched = True

            if matched and entry["gene_symbol"] not in matched_genes:
                matched_genes.add(entry["gene_symbol"])
                detected_features.append({
                    "gene_or_mutation": entry["gene_symbol"],
                    "family": entry["gene_family"],
                    "mechanism": entry["resistance_mechanism"],
                    "drug_class": entry["drug_class"],
                    "associated_antibiotics": entry["associated_antibiotics"],
                    "evidence_level": entry["evidence_level"],
                    "phenotypic_caution": "Genotypic marker detected. Presence indicates genetic resistance mechanism, but phenotypic susceptibility must be verified with AST due to variable expression and membrane permeability factors."
                })
                implicated_classes.add(entry["drug_class"])

        num_found = len(detected_features)
        summary = (
            f"Identified {num_found} resistance-associated genotypic feature(s) for {organism}. "
            f"Implicated drug classes: {', '.join(implicated_classes) if implicated_classes else 'None detected'}."
        ) if num_found > 0 else (
            f"No recognized high-confidence AMR resistance genes or canonical mutations found in provided input for {organism}."
        )

        return {
            "organism": organism,
            "detected_features": detected_features,
            "implicated_classes": sorted(list(implicated_classes)),
            "summary_text": summary,
            "phenotypic_vs_genotypic_note": (
                "IMPORTANT SCIENTIFIC DISTINCTION: Genomic analysis reveals genotypic resistance potential. "
                "The presence of a resistance gene does not strictly guarantee high-level clinical phenotypic resistance, "
                "nor does its absence ensure phenotypic susceptibility (due to potential novel or uncatalogued mechanisms)."
            )
        }

genomic_analyzer = GenomicAMRAnalyzer()
