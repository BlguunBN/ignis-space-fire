"""
NASA Scientific PDF Ingestion Utility for IGNIS.
Uses pdfplumber to extract tables, conditions, and findings from NASA technical reports and papers.

Usage:
    python scripts/extract_pdf.py <path_to_nasa_pdf> [--output output_dir]
"""

import sys
import json
import re
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("pdfplumber is required. Run: pip install pdfplumber")
    sys.exit(1)

def extract_pdf_data(pdf_path: Path):
    print(f"Extracting NASA publication: {pdf_path.name}")
    if not pdf_path.exists():
        print(f"File not found: {pdf_path}")
        return None

    full_text = []
    all_tables = []

    with pdfplumber.open(pdf_path) as pdf:
        num_pages = len(pdf.pages)
        print(f"Total Pages: {num_pages}")

        for i, page in enumerate(pdf.pages):
            page_text = page.extract_text() or ""
            full_text.append(page_text)

            # Extract any tables on the page
            tables = page.extract_tables()
            if tables:
                for t in tables:
                    # Clean table data
                    cleaned_table = [
                        [cell.strip().replace("\n", " ") if cell else "" for cell in row]
                        for row in t if any(row)
                    ]
                    if len(cleaned_table) > 1:
                        all_tables.append({
                            "page": i + 1,
                            "table": cleaned_table
                        })

    combined_text = "\n".join(full_text)

    # Heuristic keyword detection for microgravity parameters
    o2_matches = re.findall(r"(\d{1,2}(?:\.\d+)?)\s*%\s*(?:O2|oxygen)", combined_text, re.IGNORECASE)
    pressure_matches = re.findall(r"(\d{2,3}(?:\.\d+)?)\s*(?:kPa|psia|torr)", combined_text, re.IGNORECASE)
    flow_matches = re.findall(r"(\d{1,2}(?:\.\d+)?)\s*(?:cm/s|mm/s|m/s)", combined_text, re.IGNORECASE)

    extracted_summary = {
        "source_file": pdf_path.name,
        "total_pages": num_pages,
        "tables_found": len(all_tables),
        "detected_parameters": {
            "possible_oxygen_percentages": list(set(o2_matches))[:5],
            "possible_pressures": list(set(pressure_matches))[:5],
            "possible_flow_velocities": list(set(flow_matches))[:5],
        },
        "sample_tables": all_tables[:3],
        "template_candidate_record": {
            "id": f"nasa-{pdf_path.stem.lower()[:15]}",
            "programme": "Saffire / BASS / SoFIE (Update)",
            "investigation": pdf_path.stem.replace("-", " ").title(),
            "source_type": "NTRS",
            "psi_id": None,
            "doi": None,
            "gravity": "microgravity",
            "platform": "ISS / Cygnus",
            "material": "Specify Material (e.g. PMMA, SIBAL)",
            "material_class": "solid_polymer / solid_fabric",
            "oxygen_pct": float(o2_matches[0]) if o2_matches else 21.0,
            "pressure_kpa": float(pressure_matches[0]) if pressure_matches else 101.3,
            "airflow_cm_s": float(flow_matches[0]) if flow_matches else 10.0,
            "measurements": ["flame_spread", "temperature"],
            "finding": "Enter verified finding extracted from PDF abstract/conclusion",
            "fire_safety_relevance": "Enter spacecraft fire safety significance",
            "limitations": [
                "Microgravity flight data; do not extrapolate to Lunar or Martian partial gravity.",
            ],
            "source_url": "https://ntrs.nasa.gov/",
            "quality": "primary_nasa",
            "verified_by": "Extracted via pdfplumber"
        }
    }

    out_file = pdf_path.parent / f"{pdf_path.stem}_extracted.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(extracted_summary, f, indent=2)

    print(f"[SUCCESS] Extracted {len(all_tables)} tables and parameter hints.")
    print(f"Generated candidate record in: {out_file}")
    return extracted_summary

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/extract_pdf.py <path_to_pdf>")
        sys.exit(1)

    p = Path(sys.argv[1])
    extract_pdf_data(p)
