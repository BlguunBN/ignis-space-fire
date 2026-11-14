import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateD2,
  calculateBurnoutTime,
  calculateRMSE,
  calculateMAE,
  evaluateD2Simulation,
} from "../lib/simulationEngine";
import simulationCases from "../data/simulation-cases.json";
import { SimulationCase } from "../types/simulation";

test("d² Law: D(0)² equals D₀² and remains non-negative", () => {
  const d0 = 3.0; // mm
  const k = 0.76; // mm²/s

  // At t=0, D² must be exactly D₀² = 9.0 mm²
  assert.equal(calculateD2(d0, k, 0), 9.0);

  // Monotonic decrease over time
  const d2_t1 = calculateD2(d0, k, 2.0);
  const d2_t2 = calculateD2(d0, k, 4.0);
  const d2_t3 = calculateD2(d0, k, 6.0);

  assert.ok(d2_t1 < 9.0, "D² must decrease after ignition");
  assert.ok(d2_t2 < d2_t1, "D² must be monotonically decreasing when K > 0");
  assert.ok(d2_t3 < d2_t2, "D² must be monotonically decreasing when K > 0");

  // Non-negative clamp at and past burnout time
  const t_burn = calculateBurnoutTime(d0, k); // 9.0 / 0.76 ≈ 11.84 s
  assert.equal(calculateD2(d0, k, t_burn), 0);
  assert.equal(calculateD2(d0, k, t_burn + 50), 0, "D² must never be negative");
});

test("d² Law: K = 0 produces steady droplet with no burnout", () => {
  const d0 = 2.5;
  assert.equal(calculateD2(d0, 0, 10), 6.25);
  assert.equal(calculateBurnoutTime(d0, 0), Infinity);
});

test("Error metrics: RMSE and MAE correctly evaluate measured residuals", () => {
  const measured = [
    { t_sec: 1.0, d2_mm2: 8.0 },
    { t_sec: 2.0, d2_mm2: 7.0 },
  ];
  const d0 = 3.0; // d0^2 = 9.0
  const k = 1.0; // model gives d2(1)=8.0, d2(2)=7.0 -> residuals = 0

  const perfectRmse = calculateRMSE(measured, d0, k);
  const perfectMae = calculateMAE(measured, d0, k);

  assert.equal(perfectRmse, 0);
  assert.equal(perfectMae, 0);

  // Now with known offset (+0.5 on each)
  const offsetMeasured = [
    { t_sec: 1.0, d2_mm2: 8.5 },
    { t_sec: 2.0, d2_mm2: 7.5 },
  ];
  const offsetRmse = calculateRMSE(offsetMeasured, d0, k);
  const offsetMae = calculateMAE(offsetMeasured, d0, k);

  assert.ok(Math.abs((offsetRmse ?? 0) - 0.5) < 1e-6);
  assert.ok(Math.abs((offsetMae ?? 0) - 0.5) < 1e-6);
});

test("Domain safety: Out-of-bounds parameters generate explicit warnings", () => {
  const cases = simulationCases as SimulationCase[];
  const flexCase = cases.find((c) => c.caseId === "flex-droplet-psi69")!;
  assert.ok(flexCase);

  // Within calibrated domain
  const normalResult = evaluateD2Simulation(
    flexCase.measurementSeries,
    3.0,
    0.76,
    flexCase.calibration
  );
  assert.equal(normalResult.isWithinDomain, true);

  // Out of domain (initial diameter 8 mm vs calibrated 3 mm)
  const outOfDomainResult = evaluateD2Simulation(
    flexCase.measurementSeries,
    8.0,
    0.76,
    flexCase.calibration
  );
  assert.equal(outOfDomainResult.isWithinDomain, false);
  assert.match(outOfDomainResult.validDomainMessage ?? "", /Warning: Initial diameter/);
});

test("Dataset schema compliance: All simulation cases have valid citations, conclusions, and modes", () => {
  const cases = simulationCases as SimulationCase[];
  assert.ok(cases.length >= 4, "Must have at least 4 curated simulation cases");

  const allowedModes = ["observed", "calibrated_model", "conceptual", "external_demo"];

  for (const c of cases) {
    assert.ok(c.caseId, `Case must have caseId: ${c.caseId}`);
    assert.ok(c.title, `Case must have title: ${c.caseId}`);
    assert.ok(allowedModes.includes(c.mode), `Invalid mode: ${c.mode} in ${c.caseId}`);
    assert.ok(c.citation.title, `Citation must have title in ${c.caseId}`);
    assert.ok(c.citation.url, `Citation must have url in ${c.caseId}`);
    assert.ok(c.conclusions.allowed.length > 0, `Must have allowed conclusions in ${c.caseId}`);
    assert.ok(c.conclusions.disallowed.length > 0, `Must have disallowed conclusions in ${c.caseId}`);

    // If calibrated model, verify calibration metadata exists
    if (c.mode === "calibrated_model") {
      assert.ok(c.calibration, `Calibrated model must include calibration object in ${c.caseId}`);
      assert.ok(c.calibration.fitted_k_mm2_s! > 0);
      assert.ok(c.calibration.rmse_d2 < 0.1, "Fitted RMSE must be < 0.1 mm² for hot flame");
    }

    // Check user controls have valid statuses
    for (const ctrl of c.userControls) {
      assert.ok(
        ["measured", "fitted", "user_assumption", "unsupported"].includes(ctrl.status),
        `Invalid control status ${ctrl.status} in ${c.caseId}`
      );
      assert.ok(ctrl.validDomain, `Control must declare valid domain in ${c.caseId}`);
    }
  }
});

test("Scientific Integrity: FLEX cool flame phase exhibits empirical divergence from d² law", () => {
  const cases = simulationCases as SimulationCase[];
  const flexCase = cases.find((c) => c.caseId === "flex-droplet-psi69")!;
  
  // Verify that cool-flame points exist in measurement series
  const coolFlamePoints = flexCase.measurementSeries.filter((p) => p.regime === "cool_flame");
  assert.ok(coolFlamePoints.length >= 2, "Must contain cool flame measurements");

  // Calculate residuals in cool flame regime using hot flame K=0.76
  const sim = evaluateD2Simulation(flexCase.measurementSeries, 3.0, 0.76, flexCase.calibration);
  const coolFlameSimPoints = sim.timeSeries.filter((p) => p.regime === "cool_flame");

  // In cool flame, the actual droplet shrinks MUCH slower (K ~ 0.31) than the hot flame model (K = 0.76),
  // which means d2_measured > d2_model (positive residual growing with time).
  const matureCoolFlame = coolFlameSimPoints.filter((pt) => pt.t_sec >= 8.5);
  for (const pt of matureCoolFlame) {
    assert.ok(
      (pt.residual ?? 0) > 0.3,
      `Mature cool flame point at t=${pt.t_sec}s must exhibit positive residual divergence from hot-flame d² model`
    );
  }
});
