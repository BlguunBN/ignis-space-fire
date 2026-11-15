import test from "node:test";
import assert from "node:assert/strict";
import {
  DropletSetting,
  assessProximity,
  burnDuration,
  predict,
  testedRange,
  trajectory,
} from "../src/lib/droplet-engine";

const base: DropletSetting = {
  fuel: "Methanol",
  pressure_atm: 1.0,
  o2_frac: 0.21,
  co2_frac: 0.0,
  he_frac: 0.0,
  d0_mm: 2.5,
  gravity_g: 0.0,
};

// Reference values printed by Fotia's own engine
// (python flame/models/hybrid.py, run against the same extracted models).
const REF = {
  iss_methanol: { k: 0.532, p: 0.49, t: 11.7 },
  iss_heptane: { k: 0.561, p: 0.17, t: 11.1 },
  iss_ndecane: { k: 0.557, t: 11.2 },
  apollo_flight_heptane: { k: 1.084, p: 0.01, t: 5.8 },
  apollo_pad_methanol: { k: 1.165, p: 0.04, t: 5.4 },
  mars_heptane: { k: 0.758, p: 0.01, t: 8.2 },
};

function approx(actual: number, expected: number, tol: number, what: string) {
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `${what}: got ${actual}, expected ${expected} +/- ${tol}`
  );
}

test("ISS methanol matches Fotia's reference engine", () => {
  const r = predict(base);
  approx(r.k_mm2_s, REF.iss_methanol.k, 0.01, "K");
  approx(r.extinction_probability!, REF.iss_methanol.p, 0.02, "P(ext)");
  approx(r.duration_s, REF.iss_methanol.t, 0.3, "duration");
  assert.equal(r.k_basis, "learned");
  assert.equal(r.verdict, "inside");
});

test("ISS heptane matches Fotia's reference engine", () => {
  const r = predict({ ...base, fuel: "Heptane" });
  approx(r.k_mm2_s, REF.iss_heptane.k, 0.01, "K");
  approx(r.extinction_probability!, REF.iss_heptane.p, 0.02, "P(ext)");
  approx(r.duration_s, REF.iss_heptane.t, 0.3, "duration");
  assert.equal(r.k_basis, "learned");
});

test("n-decane uses the heptane surrogate and refuses extinction", () => {
  const r = predict({ ...base, fuel: "n-decane" });
  approx(r.k_mm2_s, REF.iss_ndecane.k, 0.01, "K");
  assert.equal(r.extinction_probability, null);
  assert.equal(r.k_basis, "surrogate");
  assert.equal(r.verdict, "outside");
  assert.ok(r.notes.some((n) => n.includes("No NASA test burned n-decane")));
});

test("Apollo flight heptane extrapolates K with physics and holds extinction at the edge", () => {
  const r = predict({
    ...base,
    fuel: "Heptane",
    pressure_atm: 0.34,
    o2_frac: 1.0,
  });
  approx(r.k_mm2_s, REF.apollo_flight_heptane.k, 0.02, "K");
  approx(r.extinction_probability!, REF.apollo_flight_heptane.p, 0.02, "P(ext)");
  assert.equal(r.k_basis, "physics");
  assert.equal(r.extinction_basis, "edge");
  assert.equal(r.verdict, "outside");
  assert.ok(r.notes.some((n) => n.includes("under-predicts")));
});

test("Mars heptane stays learned with a gravity honesty note", () => {
  const r = predict({ ...base, fuel: "Heptane", pressure_atm: 0.558, o2_frac: 0.34, gravity_g: 0.379 });
  approx(r.k_mm2_s, REF.mars_heptane.k, 0.02, "K");
  assert.equal(r.k_basis, "learned");
  assert.ok(r.notes.some((n) => n.includes("microgravity")));
});

test("d2 law and trajectory are self-consistent", () => {
  approx(burnDuration(2.5, 0.8, 0.5), (2.5 ** 2 - 0.8 ** 2) / 0.5, 1e-9, "burn duration");
  const path = trajectory(2.5, 0.8, 0.5, 50);
  assert.equal(path.length, 50);
  approx(path[0].diameter_mm, 2.5, 1e-9, "trajectory start");
  approx(path[path.length - 1].diameter_mm, 0.8, 1e-9, "trajectory end");
  // d² decreases linearly in time.
  const d2 = path.map((s) => s.diameter_mm ** 2);
  approx(d2[10], 2.5 ** 2 - 0.5 * path[10].time_s, 1e-6, "d² linearity");
});

test("tested ranges expose per-fuel NASA bounds for slider bands", () => {
  const heptaneO2 = testedRange("Heptane", "o2_frac");
  assert.ok(heptaneO2);
  approx(heptaneO2[0], 0.13, 1e-6, "heptane O2 low");
  approx(heptaneO2[1], 0.40, 1e-6, "heptane O2 high");
  const methanolO2 = testedRange("Methanol", "o2_frac");
  approx(methanolO2![0], 0.12, 1e-6, "methanol O2 low");
  // n-decane falls back to its surrogate's range.
  approx(testedRange("n-decane", "o2_frac")![0], 0.13, 1e-6, "n-decane surrogate O2");
});

test("proximity badge labels come from the dataset's own gap statistics", () => {
  const inside = assessProximity(base);
  assert.equal(inside.verdict, "inside");
  assert.equal(inside.label, "Measured here");
  const far = assessProximity({ ...base, o2_frac: 1.0 });
  assert.equal(far.verdict, "outside");
  assert.ok(far.explanation.includes("extrapolation") || far.explanation.includes("No NASA test"));
});
