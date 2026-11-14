"""
Validation script for NASA Microgravity Combustion Evidence Corpus.
Checks candidate records mechanically; it does not verify scientific claims.
"""

import json
import math
import sys
from pathlib import Path

REQUIRED_FIELDS = [
    "id",
    "programme",
    "investigation",
    "record_type",
    "verification_status",
    "source_type",
    "gravity",
    "platform",
    "material",
    "material_class",
    "measurements",
    "finding",
    "fire_safety_relevance",
    "limitations",
    "source_url",
    "quality"
]

VALID_RECORD_TYPES = {"experiment_run", "investigation_summary", "paper_finding"}
VALID_VERIFICATION_STATUSES = {"verified", "needs_review", "unsupported"}

def validate_dataset(filepath: Path) -> bool:
    print(f"Validating NASA evidence dataset: {filepath}")
    if not filepath.exists():
        print(f"ERROR: Dataset not found at {filepath}")
        return False

    with open(filepath, "r", encoding="utf-8") as f:
        try:
            records = json.load(f)
        except json.JSONDecodeError as e:
            print(f"ERROR: Invalid JSON in {filepath}: {e}")
            return False

    if not isinstance(records, list):
        print(f"ERROR: Expected list of records, got {type(records)}")
        return False

    print(f"Loaded {len(records)} experimental records.")
    all_valid = True
    ids_seen = set()

    for idx, rec in enumerate(records):
        rec_id = rec.get("id", f"index_{idx}")
        if rec_id in ids_seen:
            print(f"  [FAIL] Duplicate ID detected: '{rec_id}'")
            all_valid = False
        ids_seen.add(rec_id)

        # Check required fields
        for field in REQUIRED_FIELDS:
            if field not in rec:
                print(f"  [FAIL] Record '{rec_id}' missing required field: '{field}'")
                all_valid = False

        # Validate record_type and verification_status
        rec_type = rec.get("record_type")
        if rec_type not in VALID_RECORD_TYPES:
            print(f"  [FAIL] Record '{rec_id}' invalid record_type: '{rec_type}'")
            all_valid = False

        status = rec.get("verification_status")
        if status not in VALID_VERIFICATION_STATUSES:
            print(f"  [FAIL] Record '{rec_id}' invalid verification_status: '{status}'")
            all_valid = False

        # If verified, require source_locator
        if status == "verified" and not rec.get("source_locator"):
            print(f"  [FAIL] Record '{rec_id}' is marked 'verified' but lacks 'source_locator'")
            all_valid = False

        # Range checks for physical values (if reported)
        o2 = rec.get("oxygen_pct")
        if o2 is not None:
            if isinstance(o2, bool) or not isinstance(o2, (int, float)) or not math.isfinite(o2) or not (0.0 <= o2 <= 100.0):
                print(f"  [FAIL] Record '{rec_id}' oxygen_pct outside plausible bounds: {o2}")
                all_valid = False

        flow = rec.get("airflow_cm_s")
        if flow is not None:
            if isinstance(flow, bool) or not isinstance(flow, (int, float)) or not math.isfinite(flow) or flow < 0:
                print(f"  [FAIL] Record '{rec_id}' airflow_cm_s cannot be negative: {flow}")
                all_valid = False

        pressure = rec.get("pressure_kpa")
        if pressure is not None and (isinstance(pressure, bool) or not isinstance(pressure, (int, float)) or not math.isfinite(pressure) or pressure <= 0):
            print(f"  [FAIL] Record '{rec_id}' pressure_kpa must be positive")
            all_valid = False

        # Validate scientific integrity rules
        if rec.get("gravity") != "microgravity":
            print(f"  [NOTE] Record '{rec_id}' specifies gravity={rec.get('gravity')}")

        if not rec.get("source_url") or not str(rec.get("source_url")).startswith("http"):
            print(f"  [FAIL] Record '{rec_id}' has invalid source_url: '{rec.get('source_url')}'")
            all_valid = False

        if not rec.get("limitations") or len(rec.get("limitations")) == 0:
            print(f"  [FAIL] Record '{rec_id}' has no scientific limitations stated!")
            all_valid = False

    if all_valid:
        print(f"[SUCCESS] All {len(records)} evidence records passed validation!")
    else:
        print("[FAILURE] Some records failed validation standards.")

    return all_valid

if __name__ == "__main__":
    base_dir = Path(__file__).resolve().parent.parent
    data_file = base_dir / "data" / "experiments.json"
    ok = validate_dataset(data_file)
    sys.exit(0 if ok else 1)
