import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  reconcileCandidateWithSimulation,
  simulateTheoreticalFlameSpread,
  SimulationReconciliationResult,
} from "../src/lib/simulation-reconciler";

describe("Closed-Loop Simulation Reconciliation Agent (Phase 4)", () => {
  test("simulates theoretical flame spread rate for SIBAL under flight conditions", () => {
    const sim = simulateTheoreticalFlameSpread({
      material: "SIBAL cotton-fiberglass blend",
      oxygenPct: 24,
      pressureKpa: 70.3,
      airflowCmS: 12,
      gravityG: 0,
    });

    assert.ok(sim.spreadRateMmS > 0.4 && sim.spreadRateMmS < 1.6);
    assert.ok(sim.burnoutTimeSec > 0);
    assert.strictEqual(sim.isQuenched, false);
  });

  test("calculates percentDelta and diagnoses excellent agreement when reported matches theory", () => {
    const result: SimulationReconciliationResult = reconcileCandidateWithSimulation({
      stagedId: "staged-test-01",
      material: "SIBAL cotton-fiberglass",
      oxygenPct: 24,
      pressureKpa: 70.3,
      airflowCmS: 12,
      reportedSpreadRateMmS: 0.95,
    });

    assert.ok(result.simulatedSpreadRateMmS > 0);
    assert.ok(typeof result.percentDelta === "number");
    assert.ok(result.percentDelta < 30);
    assert.ok(["EXCELLENT", "MODERATE"].includes(result.agreementLevel));
    assert.strictEqual(result.isReconciled, true);
    assert.ok(result.physicalMechanisms.length > 0);
  });

  test("diagnoses conductive or radiative quenching discrepancy when reported rate is depressed", () => {
    const result: SimulationReconciliationResult = reconcileCandidateWithSimulation({
      stagedId: "staged-test-02",
      material: "thick PMMA cylinder (30mm)",
      oxygenPct: 34,
      pressureKpa: 101.3,
      airflowCmS: 4.5,
      sampleThicknessMm: 30,
      reportedSpreadRateMmS: 0.12, // Much slower than thin PMMA due to thick conductive heat sink
    });

    assert.strictEqual(result.agreementLevel, "HIGH_DISCREPANCY");
    assert.ok(
      result.physicalMechanisms.some(
        (m) => m.toLowerCase().includes("conductive") || m.toLowerCase().includes("heat sink")
      )
    );
    assert.ok(result.discrepancyDiagnosis.length > 20);
  });

  test("identifies extinction and quench boundary for sub-LOI conditions", () => {
    const sim = simulateTheoreticalFlameSpread({
      material: "PMMA plastic",
      oxygenPct: 12, // Below LOI
      pressureKpa: 101.3,
      airflowCmS: 5,
    });

    assert.strictEqual(sim.isQuenched, true);
    assert.strictEqual(sim.spreadRateMmS, 0);
    assert.ok(sim.quenchReason?.includes("oxygen"));
  });
});
