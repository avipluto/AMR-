import os
import json
import base64
from io import BytesIO
from pathlib import Path
from datetime import datetime
from typing import Dict, Any, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

REPORTS_DIR = Path(__file__).resolve().parent.parent.parent / "data" / "reports"
REPORTS_DIR.mkdir(parents=True, exist_ok=True)
REPORTS_META_FILE = REPORTS_DIR / "reports_meta.json"

class ScientificPDFGenerator:
    """
    Authoritative scientific PDF report generator for AMR Sentinel.
    Generates printer-friendly, clean publication-quality white medical laboratory reports.
    Never relies on screenshots.
    """
    def __init__(self, output_dir: Path = REPORTS_DIR):
        self.output_dir = output_dir
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self._ensure_meta()

    def _ensure_meta(self):
        if not REPORTS_META_FILE.exists():
            with open(REPORTS_META_FILE, "w", encoding="utf-8") as f:
                json.dump([], f)

    def _save_meta(self, meta: Dict[str, Any]):
        data = []
        if REPORTS_META_FILE.exists():
            with open(REPORTS_META_FILE, "r", encoding="utf-8") as f:
                try:
                    data = json.load(f)
                except Exception:
                    data = []
        data.insert(0, meta)
        with open(REPORTS_META_FILE, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)

    def list_reports(self, user_id: Optional[str] = None):
        if not REPORTS_META_FILE.exists():
            return []
        with open(REPORTS_META_FILE, "r", encoding="utf-8") as f:
            try:
                data = json.load(f)
                if user_id:
                    return [r for r in data if r.get("user_id") == user_id or r.get("user_id") == "guest"]
                return data
            except Exception:
                return []

    def get_report_meta(self, report_id: str) -> Optional[Dict[str, Any]]:
        for r in self.list_reports():
            if r["report_id"] == report_id:
                return r
        return None

    def generate_ast_report(
        self,
        report_id: str,
        analysis_data: Dict[str, Any],
        user: Optional[Dict[str, Any]] = None,
        isolate_id: Optional[str] = None
    ) -> Path:
        filename = f"AMR_Report_{report_id}.pdf"
        filepath = self.output_dir / filename

        doc = SimpleDocTemplate(
            str(filepath),
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        # Custom styles
        header_title = ParagraphStyle(
            'HeaderTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=18,
            leading=22,
            textColor=colors.HexColor('#0f172a')
        )
        sub_title = ParagraphStyle(
            'SubTitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=12,
            textColor=colors.HexColor('#475569')
        )
        section_h = ParagraphStyle(
            'SectionH',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=16,
            textColor=colors.HexColor('#0f766e'),
            spaceBefore=12,
            spaceAfter=6
        )
        body = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9,
            leading=13,
            textColor=colors.HexColor('#1e293b')
        )
        disclaimer_p = ParagraphStyle(
            'Disclaimer',
            parent=styles['Normal'],
            fontName='Helvetica-Oblique',
            fontSize=7.5,
            leading=10,
            textColor=colors.HexColor('#64748b')
        )

        elements = []

        # Header Banner
        header_table_data = [
            [
                Paragraph("<b>AMR SENTINEL</b><br/><font size=8 color='#0f766e'>Antimicrobial Resistance Intelligence Platform</font>", header_title),
                Paragraph(f"<b>REPORT ID:</b> {report_id}<br/><b>DATE:</b> {datetime.utcnow().strftime('%d %b %Y %H:%M UTC')}<br/><b>STATUS:</b> Research Authorized", sub_title)
            ]
        ]
        ht = Table(header_table_data, colWidths=[3.8 * inch, 3.4 * inch])
        ht.setStyle(TableStyle([
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4)
        ]))
        elements.append(ht)
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0f766e'), spaceBefore=4, spaceAfter=10))

        # Sample & Patient/Cohort Metadata
        organism = analysis_data.get("summary", {}).get("organism", "Escherichia coli")
        iso_id = isolate_id or f"ISO-{datetime.utcnow().strftime('%Y%m')}-{report_id[-4:]}"
        user_name = user.get("full_name", "Academic Microbiology Investigator") if user else "Senior Researcher"
        institution = user.get("institution", "Biotechnology Laboratory") if user else "AMR Surveillance Center"

        meta_data = [
            [Paragraph("<b>Pathogen Species:</b>", body), Paragraph(f"<i>{organism}</i>", body), Paragraph("<b>Investigator:</b>", body), Paragraph(user_name, body)],
            [Paragraph("<b>Isolate Identifier:</b>", body), Paragraph(iso_id, body), Paragraph("<b>Institution:</b>", body), Paragraph(institution, body)],
            [Paragraph("<b>Test Modality:</b>", body), Paragraph("Kirby-Bauer Agar Disk Diffusion", body), Paragraph("<b>Reference Standard:</b>", body), Paragraph("CLSI M100-ED33:2023", body)],
            [Paragraph("<b>Calibration:</b>", body), Paragraph(f"{analysis_data.get('calibration_method', 'known_disk_6mm')} ({analysis_data.get('pixels_per_mm', 'N/A')} px/mm)", body), Paragraph("<b>Analysis Engine:</b>", body), Paragraph("CV Zone Radial Profiler v1.0", body)]
        ]
        meta_table = Table(meta_data, colWidths=[1.6 * inch, 2.0 * inch, 1.4 * inch, 2.2 * inch])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f8fafc')),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e2e8f0')),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
        ]))
        elements.append(meta_table)
        elements.append(Spacer(1, 12))

        # Executive Summary Box
        disks = analysis_data.get("disks", [])
        total_tested = len(disks)
        r_count = sum(1 for d in disks if d.get("interpretation", {}).get("classification") == "R")
        s_count = sum(1 for d in disks if d.get("interpretation", {}).get("classification") == "S")
        i_count = sum(1 for d in disks if d.get("interpretation", {}).get("classification") == "I")

        elements.append(Paragraph("EXECUTIVE PHENOTYPIC SUMMARY", section_h))
        summary_data = [
            [
                Paragraph(f"<b>Tested Antibiotics:</b> {total_tested}", body),
                Paragraph(f"<b>Resistant (R):</b> <font color='#b91c1c'><b>{r_count}</b></font>", body),
                Paragraph(f"<b>Intermediate (I):</b> <font color='#b45309'><b>{i_count}</b></font>", body),
                Paragraph(f"<b>Susceptible (S):</b> <font color='#15803d'><b>{s_count}</b></font>", body)
            ]
        ]
        sum_table = Table(summary_data, colWidths=[1.8 * inch, 1.8 * inch, 1.8 * inch, 1.8 * inch])
        sum_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f1f5f9')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#cbd5e1')),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER')
        ]))
        elements.append(sum_table)
        elements.append(Spacer(1, 12))

        # Antibiotic Breakdown Table
        elements.append(Paragraph("QUANTITATIVE ZONE MEASUREMENTS & BREAKPOINT INTERPRETATION", section_h))
        table_rows = [
            [
                Paragraph("<b>Antibiotic</b>", body),
                Paragraph("<b>Code</b>", body),
                Paragraph("<b>Disk (mm)</b>", body),
                Paragraph("<b>Zone (mm)</b>", body),
                Paragraph("<b>Result</b>", body),
                Paragraph("<b>CLSI Standard Breakpoint</b>", body)
            ]
        ]

        for d in disks:
            interp = d.get("interpretation") or {}
            c = interp.get("classification", "N/A")
            color_hex = "#b91c1c" if c == "R" else ("#15803d" if c == "S" else "#b45309")
            bp = interp.get("breakpoints") or {}
            bp_str = f"S: {bp.get('susceptible', 'N/A')} | R: {bp.get('resistant', 'N/A')}" if bp else "Interpretation unavailable"

            table_rows.append([
                Paragraph(f"<b>{d.get('antibiotic_name', 'Unknown')}</b>", body),
                Paragraph(d.get("antibiotic_code", ""), body),
                Paragraph(str(d.get("disk_diameter_mm") or "6.0"), body),
                Paragraph(f"<b>{d.get('zone_diameter_mm', 'N/A')} mm</b>", body),
                Paragraph(f"<font color='{color_hex}'><b>{c}</b></font>", body),
                Paragraph(bp_str, body)
            ])

        ab_table = Table(table_rows, colWidths=[1.8 * inch, 0.7 * inch, 0.9 * inch, 1.0 * inch, 0.9 * inch, 1.9 * inch])
        ab_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0f766e')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cbd5e1')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
            ('PADDING', (0, 0), (-1, -1), 5),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE')
        ]))
        elements.append(ab_table)
        elements.append(Spacer(1, 14))

        # Annotated Image (if base64 data available)
        b64_img = analysis_data.get("annotated_image_base64")
        if b64_img and "," in b64_img:
            try:
                img_data = base64.b64decode(b64_img.split(",")[1])
                img_buf = BytesIO(img_data)
                img_flowable = RLImage(img_buf, width=2.8 * inch, height=2.8 * inch)
                
                img_section = [
                    Paragraph("PLATE VISION DETECTION & HALO SEGMENTATION", section_h),
                    img_flowable,
                    Paragraph("<i>Visual annotation displaying detected petri rim, segmented paper disks, and radial halo measurements.</i>", disclaimer_p)
                ]
                elements.append(KeepTogether(img_section))
                elements.append(Spacer(1, 10))
            except Exception:
                pass

        # Methodological Limitations & Safety Disclaimer
        elements.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor('#cbd5e1'), spaceBefore=8, spaceAfter=8))
        elements.append(Paragraph("<b>METHODOLOGICAL LIMITATIONS & SURVEILLANCE BOUNDARIES:</b>", body))
        limitations_text = (
            "• This phenotypic assessment relies on automated Kirby-Bauer disk diffusion zone segmentation.<br/>"
            "• Zone measurements are converted using standard 6.0 mm disk physical calibration. Micro-colonies or fuzzy margin zones should be verified manually.<br/>"
            "• Phenotypic observations do not predict the future evolutionary trajectory of this specific isolate."
        )
        elements.append(Paragraph(limitations_text, body))
        elements.append(Spacer(1, 8))

        disclaimer_text = (
            "<b>LEGAL & SCIENTIFIC DISCLAIMER:</b> AMR Sentinel is an academic research and educational prototype. "
            "It is not cleared or approved by any medical regulatory agency for clinical diagnostic use, antimicrobial prescription selection, "
            "or direct patient therapeutic decisions. All outputs must be reviewed and confirmed by qualified clinical microbiology personnel."
        )
        elements.append(Paragraph(disclaimer_text, disclaimer_p))

        doc.build(elements)

        # Record metadata
        meta = {
            "report_id": report_id,
            "filename": filename,
            "report_type": "AST Plate Phenotypic Report",
            "organism": organism,
            "isolate_id": iso_id,
            "user_id": user.get("sub", "guest") if user else "guest",
            "user_name": user_name,
            "created_at": datetime.utcnow().isoformat(),
            "antibiotics_tested": total_tested,
            "resistant_count": r_count,
            "susceptible_count": s_count
        }
        self._save_meta(meta)
        return filepath

pdf_generator = ScientificPDFGenerator()
