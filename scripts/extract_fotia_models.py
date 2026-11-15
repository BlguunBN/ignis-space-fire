"""One-shot trainer: runs Fotia's own model pipeline and dumps portable JSON.

Outputs (to src/data/fotia-models.json):
  - rate model (ridge on standardized features, FLEX-1 + MSL-1)
  - extinction model (logistic regression, balanced, FLEX-1)
  - extinction-diameter model (ridge)
  - tested ranges per fuel (burn ranges and extinction ranges)
  - proximity reference points (scaled test points + typical/largest gap)
  - fuel physics constants for the Spalding transfer number
"""
import json
import sys
from pathlib import Path

ROOT = Path(r"X:\Development\Projects\fotia-ref2")
sys.path.insert(0, str(ROOT))

import numpy as np  # noqa: E402
import pandas as pd  # noqa: E402

from flame.dashboard.predict import build  # noqa: E402
from flame.dashboard.registry import MODULES  # noqa: E402
from flame.models.droplet_burn import rate_frame  # noqa: E402
from flame.models.hybrid import FUEL_KEYS, MMHG_PER_ATM, NUMERIC, Physics  # hybrid imports numpy/pandas above

OUT = Path(r"X:\Development\Projects\Nasa2\src\data\fotia-models.json")


def dump_linear_model(pipe, columns):
    """Ridge/Logistic pipeline: StandardScaler + linear model -> plain weights."""
    scaler, model = pipe
    coef = model.coef_
    intercept = float(np.ravel(model.intercept_)[0])
    return {
        "columns": list(columns),
        "mean": scaler.mean_.tolist(),
        "scale": scaler.scale_.tolist(),
        "coef": np.ravel(coef).tolist(),
        "intercept": intercept,
    }


def main():
    bundle = build(MODULES["suppression"])

    payload = {}

    # --- extinction (logistic, balanced) ---
    payload["extinction"] = dump_linear_model(bundle.model, bundle.columns)

    # --- extinction diameter (ridge) ---
    payload["diameter"] = dump_linear_model(bundle.regressor, bundle.regressor_columns)
    payload["diameter_error"] = bundle.regressor_error

    # --- burning rate K (ridge, FLEX + MSL-1) ---
    payload["rate"] = dump_linear_model(bundle.rate_model, bundle.rate_columns)
    payload["rate_error"] = bundle.rate_error

    # --- tested ranges per fuel (burn + extinction) ---
    engine_frame = bundle.frame.assign(pressure_atm=bundle.frame["pressure_mmhg"] / MMHG_PER_ATM)
    ext_ranges = {}
    for fuel, block in engine_frame.groupby("fuel"):
        ext_ranges[fuel] = {
            name: [float(block[name].min()), float(block[name].max())]
            for name in NUMERIC
        }
    rate = rate_frame().assign(pressure_atm=rate_frame()["pressure_mmhg"] / MMHG_PER_ATM)
    burn_ranges = {}
    for fuel, block in rate.groupby("fuel"):
        burn_ranges[fuel] = {
            name: [lo, hi]
            for name, (lo, hi) in (
                (name, (float(block[name].min()), float(block[name].max())))
                for name in NUMERIC
            )
        }
    payload["ranges"] = {"burn": burn_ranges, "extinction": ext_ranges}

    # --- proximity reference: scaled points + gap statistics ---
    index = bundle.index
    payload["proximity"] = {
        "numeric_features": index.numeric_features,
        "categorical_features": index.categorical_features,
        "mean": index.scaler.mean_.tolist(),
        "scale": index.scaler.scale_.tolist(),
        "points": index.points.tolist(),
        "ranges": {k: list(v) for k, v in index.ranges.items()},
        "typical_distance": index.typical_distance,
        "largest_internal_gap": index.largest_internal_gap,
        "fuels": bundle.frame["fuel"].tolist(),
        "verdicts": {"inside": "Measured here", "extrapolation": "Between tests", "outside": "Never tested"},
    }

    # --- fuel physics for the Spalding transfer number ---
    physics = Physics()
    fuel_phys = {}
    for display, key in FUEL_KEYS.items():
        fuel_phys[display] = {
            "heating_value_kj_g": physics.heating_value(key),
            "stoich_ratio": physics.stoichiometric_ratio(key),
            "latent_kj_g": float(
                physics.fuels.loc[key, "enthalpie_vaporisation"]
                / physics.fuels.loc[key, "masse_molaire"]
            ),
            "density": float(physics.fuels.loc[key, "masse_volumique_liquide"]),
        }
    payload["physics"] = {
        "fuels": fuel_phys,
        "molar_mass": physics.molar_mass,
    }

    OUT.write_text(json.dumps(payload, indent=1))
    print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
    print("extinction columns:", payload["extinction"]["columns"])
    print("rate columns:", payload["rate"]["columns"])
    print("burn ranges:", json.dumps(burn_ranges, default=str)[:400])


if __name__ == "__main__":
    main()
