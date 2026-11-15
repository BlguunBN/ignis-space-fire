/**
 * Droplet combustion engine — TypeScript port of Fotia's hybrid engine
 * (https://github.com/AnteurAbderraouf/Fotia, MIT-licensed).
 *
 * Fotia trains classical models on real NASA PSI data (204 FLEX-1 ISS droplet
 * burns + 32 MSL-1 Spacelab heptane droplets) and answers four questions:
 *   does the flame go out, how fast does it burn, how long does it last,
 *   and how much should you trust the answer.
 *
 * The learned coefficients live in src/data/fotia-models.json, produced by
 * scripts/extract_fotia_models.py running Fotia's own pipeline. This module
 * implements the same inference math:
 *
 *   inside the tested range   learned models answer directly
 *   outside                   K = learned-at-edge x ln(1+B) physics ratio
 *                             (Spalding quasi-steady theory); extinction is
 *                             NEVER extrapolated — the edge value is shown,
 *                             named as such
 *   confidence                distance to the nearest real NASA test, judged
 *                             against the dataset's own nearest-neighbour
 *                             gap distribution
 *
 * Known limits surfaced to the user (from Fotia's own validation):
 *   - Spalding theory under-predicts the oxygen effect by ~20-25% beyond tests
 *   - n-decane has no NASA droplet test; it is computed from heptane (surrogate)
 *   - every test behind these numbers ran in microgravity
 */
import modelData from "../data/fotia-models.json";

export interface DropletSetting {
  /** Fuel display name: "Methanol" | "Heptane" | "n-decane". */
  fuel: string;
  /** Ambient pressure in atm. */
  pressure_atm: number;
  /** Oxygen mole fraction, 0..1. */
  o2_frac: number;
  /** Added CO2 mole fraction. */
  co2_frac: number;
  /** Added helium mole fraction. */
  he_frac: number;
  /** Initial droplet diameter, mm. */
  d0_mm: number;
  /** Gravity in g (0 for microgravity). */
  gravity_g: number;
}

export interface LinearModel {
  columns: string[];
  mean: number[];
  scale: number[];
  coef: number[];
  intercept: number;
}

export interface Prediction {
  /** d²-law burning-rate constant, mm²/s. */
  k_mm2_s: number;
  /** "learned" | "physics" | "surrogate". */
  k_basis: string;
  /** Probability of extinction, or null when not modelled (n-decane). */
  extinction_probability: number | null;
  /** "learned" | "edge" | "none". */
  extinction_basis: string;
  /** Predicted extinction diameter, mm, or null. */
  dext_mm: number | null;
  /** Whether the flame extinguishes (p >= 0.5), or null when not modelled. */
  extinguishes: boolean | null;
  /** Burn duration from the d² law, s. */
  duration_s: number;
  /** "inside" | "extrapolation" | "outside". */
  verdict: string;
  /** Human-readable honesty notes. */
  notes: string[];
  /** Axes outside the tested burn range: name -> [lo, hi, value]. */
  extrapolated: Record<string, [number, number, number]>;
  /** Tested burn ranges for the queried fuel. */
  ranges: Record<string, [number, number]>;
}

interface EngineData {
  extinction: LinearModel;
  diameter: LinearModel;
  rate: LinearModel;
  diameter_error: number;
  rate_error: number;
  ranges: {
    burn: Record<string, Record<string, [number, number]>>;
    extinction: Record<string, Record<string, [number, number]>>;
  };
  proximity: {
    numeric_features: string[];
    mean: number[];
    scale: number[];
    points: number[][];
    ranges: Record<string, [number, number]>;
    typical_distance: number;
    largest_internal_gap: number;
    fuels: string[];
    verdicts: Record<string, string>;
  };
  physics: {
    fuels: Record<
      string,
      {
        heating_value_kj_g: number;
        stoich_ratio: number;
        latent_kj_g: number;
        density: number;
      }
    >;
    molar_mass: Record<string, number>;
  };
}

const DATA = modelData as unknown as EngineData;

const MMHG_PER_ATM = 760.0;
const MICROGRAVITY_BELOW = 0.01;

/** Display fuel -> property-table key. */
const FUEL_KEYS: Record<string, string> = {
  Methanol: "methanol",
  Heptane: "n-heptane",
  "n-decane": "n-decane",
};

/** Fuel without tests -> learned fuel used as its anchor. */
const SURROGATE: Record<string, string> = { "n-decane": "Heptane" };

const NUMERIC = ["pressure_atm", "o2_frac", "co2_frac", "he_frac", "d0_mm"];

// ---------------------------------------------------------------------------
// Linear model inference (standardize -> linear)
// ---------------------------------------------------------------------------

function applyLinear(model: LinearModel, features: Record<string, number>): number {
  let acc = model.intercept;
  for (let i = 0; i < model.columns.length; i++) {
    const col = model.columns[i];
    // The one-hot dummy (fuel_Methanol) is always present in the feature row —
    // 0 for heptane — and must still be standardized like any training column.
    const v = features[col] ?? 0;
    acc += ((v - model.mean[i]) / model.scale[i]) * model.coef[i];
  }
  return acc;
}

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

// ---------------------------------------------------------------------------
// Spalding quasi-steady droplet theory (ratios only — transport constants cancel)
// ---------------------------------------------------------------------------

function oxygenMassFraction(o2: number, co2: number, he: number): number {
  const m = DATA.physics.molar_mass;
  const n2 = Math.max(1.0 - o2 - co2 - he, 0.0);
  const total = o2 * m.o2 + n2 * m.n2 + co2 * m.co2 + he * m.he;
  return (o2 * m.o2) / total;
}

function transferNumber(fuel: string, o2: number, co2: number, he: number): number {
  const p = DATA.physics.fuels[fuel];
  const y = oxygenMassFraction(o2, co2, he);
  return (y * p.heating_value_kj_g) / (p.stoich_ratio * p.latent_kj_g);
}

function physicsFactor(fuel: string, o2: number, co2: number, he: number): number {
  const b = transferNumber(fuel, o2, co2, he);
  return Math.log1p(b) / DATA.physics.fuels[fuel].density;
}

// ---------------------------------------------------------------------------
// Tested ranges
// ---------------------------------------------------------------------------

export function testedRange(fuel: string, axis: string): [number, number] | null {
  const modelFuel = SURROGATE[fuel] ?? fuel;
  const box = DATA.ranges.burn[modelFuel];
  return box?.[axis] ?? null;
}

export function testedRangeExtinction(fuel: string, axis: string): [number, number] | null {
  const box = DATA.ranges.extinction[fuel];
  return box?.[axis] ?? null;
}

// ---------------------------------------------------------------------------
// Proximity badge — distance to the nearest real NASA test
// ---------------------------------------------------------------------------

export interface ProximityAssessment {
  verdict: string;
  label: string;
  distance: number;
  typicalDistance: number;
  explanation: string;
}

export function assessProximity(setting: DropletSetting): ProximityAssessment {
  const prox = DATA.proximity;
  const query: Record<string, number> = {
    pressure_mmhg: setting.pressure_atm * MMHG_PER_ATM,
    o2_frac: setting.o2_frac,
    co2_frac: setting.co2_frac,
    he_frac: setting.he_frac,
    d0_mm: setting.d0_mm,
  };

  const outOfRange = prox.numeric_features.filter((name) => {
    const [lo, hi] = prox.ranges[name] ?? [-Infinity, Infinity];
    return !(lo <= query[name] && query[name] <= hi);
  });

  const scaled = prox.numeric_features.map(
    (name, i) => (query[name] - prox.mean[i]) / prox.scale[i]
  );

  // Categorical fuel filter: a test on another fuel is not a neighbour.
  const eligible = prox.fuels.map((f) => f === setting.fuel);
  if (!eligible.some(Boolean)) {
    for (let i = 0; i < eligible.length; i++) eligible[i] = true;
  }

  let nearestSq = Infinity;
  for (let i = 0; i < prox.points.length; i++) {
    if (!eligible[i]) continue;
    const p = prox.points[i];
    let d2 = 0;
    for (let j = 0; j < p.length; j++) {
      const diff = p[j] - scaled[j];
      d2 += diff * diff;
    }
    if (d2 < nearestSq) nearestSq = d2;
  }
  const nearest = Math.sqrt(nearestSq);

  let verdict: string;
  if (outOfRange.length > 0 || nearest > prox.largest_internal_gap) {
    verdict = "outside";
  } else if (nearest <= prox.typical_distance) {
    verdict = "inside";
  } else {
    verdict = "extrapolation";
  }

  const explanation =
    outOfRange.length > 0
      ? `No NASA test ever went to these values of ${outOfRange.join(", ")}. The prediction is pure extrapolation.`
      : verdict === "inside"
        ? "Real NASA tests sit as close to this condition as the tests typically sit to one another."
        : verdict === "extrapolation"
          ? `This condition falls in a gap in the test matrix: the nearest run is ${(nearest / prox.typical_distance).toFixed(1)}x further away than usual.`
          : "No campaign ever went here. The prediction rests entirely on the shape of the model, not on any observation.";

  return {
    verdict,
    label: prox.verdicts[verdict],
    distance: nearest,
    typicalDistance: prox.typical_distance,
    explanation,
  };
}

// ---------------------------------------------------------------------------
// The engine
// ---------------------------------------------------------------------------

function featuresFor(fuel: string, v: Record<string, number>): Record<string, number> {
  return {
    pressure_mmhg: v.pressure_atm * MMHG_PER_ATM,
    o2_frac: v.o2_frac,
    co2_frac: v.co2_frac,
    he_frac: v.he_frac,
    d0_mm: v.d0_mm,
    // One-hot: the training columns carry only fuel_Methanol (heptane is the
    // reference class). An absent key means the dummy is 0.
    ...(fuel === "Methanol" ? { fuel_Methanol: 1 } : {}),
  };
}

export function predict(setting: DropletSetting): Prediction {
  const fuel = setting.fuel;
  const modelFuel = SURROGATE[fuel] ?? fuel;
  const ranges = DATA.ranges.burn[modelFuel];
  const values: Record<string, number> = {
    pressure_atm: setting.pressure_atm,
    o2_frac: setting.o2_frac,
    co2_frac: setting.co2_frac,
    he_frac: setting.he_frac,
    d0_mm: setting.d0_mm,
  };

  const beyond = (box: Record<string, [number, number]>) => {
    const out: Record<string, [number, number, number]> = {};
    for (const name of NUMERIC) {
      const [lo, hi] = box[name];
      if (!(lo - 1e-9 <= values[name] && values[name] <= hi + 1e-9)) {
        out[name] = [lo, hi, values[name]];
      }
    }
    return out;
  };

  const extrapolated = beyond(ranges);
  const anchor: Record<string, number> = {};
  for (const name of NUMERIC) {
    const [lo, hi] = ranges[name];
    anchor[name] = Math.min(Math.max(values[name], lo), hi);
  }

  const extBox = DATA.ranges.extinction[fuel] ?? ranges;
  const extBeyond = beyond(extBox);
  const extAnchor: Record<string, number> = {};
  for (const name of NUMERIC) {
    const [lo, hi] = extBox[name];
    extAnchor[name] = Math.min(Math.max(values[name], lo), hi);
  }

  const notes: string[] = [];

  // --- K: learned at the edge of the tested range, then physics ratio ---
  const kAnchor = Math.max(applyLinear(DATA.rate, featuresFor(modelFuel, anchor)), 1e-3);
  const physicsRatio =
    physicsFactor(fuel, values.o2_frac, values.co2_frac, values.he_frac) /
    physicsFactor(modelFuel, anchor.o2_frac, anchor.co2_frac, anchor.he_frac);
  const k = Math.max(kAnchor * physicsRatio, 1e-3);

  let kBasis: string;
  if (fuel in SURROGATE) {
    kBasis = "surrogate";
    notes.push(
      `No NASA test burned ${fuel} in this dataset. Its burning rate is computed from ${SURROGATE[fuel].toLowerCase()} with combustion theory; between fuels that theory was off by up to a factor of 2 on our own data.`
    );
  } else if (Object.keys(extrapolated).length > 0) {
    kBasis = "physics";
  } else {
    kBasis = "learned";
  }

  if ("o2_frac" in extrapolated && values.o2_frac > ranges.o2_frac[1]) {
    notes.push(
      "Above the oxygen ever tested, the burning rate comes from combustion theory. On the tested range that theory under-predicts the effect of oxygen by about 20-25%, so the real rate is probably higher."
    );
  }
  if ("pressure_atm" in extrapolated) {
    notes.push(
      "Pressure is outside the tests. Theory gives no first-order pressure effect on the burning rate, so it is held at the nearest tested pressure."
    );
  }
  if ("co2_frac" in extrapolated || "he_frac" in extrapolated) {
    notes.push(
      "Diluent beyond the tests: only its effect on the oxygen mass fraction is accounted for, not its heat transport."
    );
  }
  if ("d0_mm" in extrapolated) {
    notes.push(
      "Droplet size outside the tests: the burning rate and extinction are taken at the nearest tested size."
    );
  }

  // --- extinction: learned in-domain, never extrapolated ---
  let p: number | null = null;
  let extinctionBasis = "none";
  let dext: number | null = null;
  if (fuel in SURROGATE) {
    notes.push(`Whether a ${fuel} flame goes out is not modelled: no test.`);
  } else {
    const point = Object.keys(extBeyond).length === 0 ? values : extAnchor;
    const feats = featuresFor(fuel, point);
    p = sigmoid(applyLinear(DATA.extinction, feats));
    dext = applyLinear(DATA.diameter, feats);
    extinctionBasis = Object.keys(extBeyond).length === 0 ? "learned" : "edge";
    if (Object.keys(extBeyond).length > 0 && Object.keys(extrapolated).length === 0) {
      notes.push(
        "NASA burned droplets at this setting and measured how fast they burn, but no test here records whether the flame went out. The chance of extinction is the value at the edge of the tests that do."
      );
    } else if (Object.keys(extBeyond).length > 0) {
      notes.push(
        "The chance of extinction shown is the value at the edge of the tests, not a prediction at this condition."
      );
    }
  }

  const extinguishes = p === null ? null : p >= 0.5;
  let final = extinguishes && dext !== null ? dext : 0.0;
  final = Math.min(Math.max(final, 0.0), values.d0_mm);
  const duration = burnDuration(values.d0_mm, final, k);

  // --- badge ---
  if (setting.gravity_g >= MICROGRAVITY_BELOW) {
    extrapolated["gravity_g"] = [0.0, 0.0, setting.gravity_g];
    notes.push(
      "Every test behind these numbers ran in microgravity. With gravity, buoyancy reshapes the flame; the numbers do not include it, and the flame shape drawn is illustrative."
    );
  }
  let verdict: string;
  if (Object.keys(extrapolated).length > 0 || fuel in SURROGATE) {
    verdict = "outside";
  } else if (Object.keys(extBeyond).length > 0) {
    verdict = "extrapolation";
  } else {
    verdict = assessProximity(setting).verdict;
  }

  return {
    k_mm2_s: k,
    k_basis: kBasis,
    extinction_probability: p,
    extinction_basis: extinctionBasis,
    dext_mm: dext,
    extinguishes,
    duration_s: duration,
    verdict,
    notes,
    extrapolated,
    ranges,
  };
}

/** d² law: t = (d0² - dfinal²) / K. */
export function burnDuration(initialMm: number, finalMm: number, rateMm2S: number): number {
  if (rateMm2S <= 0) return 0;
  return Math.max((initialMm * initialMm - finalMm * finalMm) / rateMm2S, 0);
}

/** d²-law trajectory: d(t) = sqrt(d0² - K·t). */
export function trajectory(
  initialMm: number,
  finalMm: number,
  rateMm2S: number,
  steps = 120
): { time_s: number; diameter_mm: number }[] {
  const duration = burnDuration(initialMm, finalMm, rateMm2S);
  const out: { time_s: number; diameter_mm: number }[] = [];
  for (let i = 0; i < steps; i++) {
    const t = (duration * i) / Math.max(steps - 1, 1);
    const squared = Math.max(initialMm * initialMm - rateMm2S * t, finalMm * finalMm);
    out.push({ time_s: t, diameter_mm: Math.sqrt(squared) });
  }
  return out;
}
