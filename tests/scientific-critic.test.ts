import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  auditScientificTransportAndContradictions,
  computeDimensionlessTransport,
  CriticReport,
  DimensionlessTransport,
} from "../src/lib/scientific-critic-agent";
import experimentsData from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";

const corpus = experimentsData as ExperimentRecord[];

describe("Adversarial Scientific Red-Team Critic (Phase 2)", () => {
  test("computes dimensionless transport numbers (Re, Gr, Ri, Da) for microgravity flow", () => {
    const transport: DimensionlessTransport = computeDimensionlessTransport({
      airflowCmS: 20, // 0.2 m/s
      characteristicLengthMm: 50, // 0.05 m
      gravityG: 0,
      oxygenPct: 21,
      pressureKpa: 101.3,
    });

    assert.ok(transport.reynoldsNumber > 100 && transport.reynoldsNumber < 1500);
    assert.strictEqual(transport.grashofNumber, 0, "Grashof number in microgravity (0g) must be 0");
    assert.strictEqual(transport.richardsonNumber, 0, "Richardson number in microgravity (0g) must be 0");
    assert.strictEqual(transport.flowRegime, "FORCED_CONVECTION_LAMINAR");
    assert.ok(transport.damkohlerNumber > 0);
  });

  test("detects critical contradictions when candidate claims PMMA combustion below Limiting Oxygen Index (LOI)", () => {
    const report: CriticReport = auditScientificTransportAndContradictions(
      {
        material: "PMMA plastic",
        oxygenPct: 10.0, // Impossibly low: PMMA LOI is ~17-18%
        pressureKpa: 101.3,
        airflowCmS: 5.0,
        claim: "PMMA cylindrical rods maintained continuous vigorous combustion at 10% oxygen.",
      },
      corpus
    );

    assert.strictEqual(report.isThermodynamicallySound, false);
    assert.ok(report.confidencePenalty >= 20);
    assert.ok(
      report.contradictionsDetected.some(
        (c) => c.severity === "CRITICAL" && c.finding.toLowerCase().includes("oxygen")
      )
    );
  });

  test("detects quench boundary violation under extreme low pressure or high flow blow-off", () => {
    const report: CriticReport = auditScientificTransportAndContradictions(
      {
        material: "SIBAL cotton-fiberglass",
        oxygenPct: 21.0,
        pressureKpa: 15.0, // Severe depressurization
        airflowCmS: 120.0, // High blow-off flow
        claim: "SIBAL fabric burned steadily at 120 cm/s flow and 15 kPa vacuum.",
      },
      corpus
    );

    assert.ok(
      report.contradictionsDetected.some(
        (c) => c.severity === "CRITICAL" || c.severity === "WARNING"
      )
    );
    assert.ok(report.critiqueNotes.length > 20);
  });

  test("approves physically verified NASA flight conditions without false penalties", () => {
    const report: CriticReport = auditScientificTransportAndContradictions(
      {
        material: "SIBAL cotton-fiberglass blend",
        oxygenPct: 24.0,
        pressureKpa: 70.3,
        airflowCmS: 12.0,
        claim: "Saffire-V flame decelerates as chamber depressurizes to 70 kPa under 12 cm/s airflow.",
      },
      corpus
    );

    assert.strictEqual(report.isThermodynamicallySound, true);
    assert.strictEqual(report.confidencePenalty, 0);
    assert.strictEqual(
      report.contradictionsDetected.filter((c) => c.severity === "CRITICAL").length,
      0
    );
  });
});
