"""
Validation script for NASA Microgravity Combustion Evidence Corpus.
Ensures every indexed record adheres strictly to scientific provenance standards.
"""

import json
import sys
from pathlib import Path

REQUIRED_FIELDS = [
    "id",
    "programme",
    "investigation",
    "source_type",
    "gravity",
    "platform",
    "material",
    "oxygen_pct",
    "airflow_cm_s",
    "measurements",
    "finding",
    "fire_safety_relevance",
    "limitations",
    "source_url",
    "quality"
]

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
            elif rec[field] is None and field not in ["pressure_kpa", "psi_id"]:
                print(f"  [WARN] Record '{rec_id}' has None for non-optional field: '{field}'")

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
