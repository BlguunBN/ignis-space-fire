import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { assessApplicability } from "../src/lib/applicability";
import { ExperimentRecord } from "../src/types/evidence";

const sampleRecord: ExperimentRecord = {
  id: "saffire-1",
  programme: "Saffire",
  investigation: "Saffire-I Flight Experiment",
  record_type: "experiment_run",
  verification_status: "verified",
  source_type: "NASA_PSI",
  psi_id: "PSI-98",
  doi: "10.60555/0t15-1z43",
  source_locator: "PSI Investigation Record PSI-98 / Urban et al. 2019 Table 1",
  gravity: "microgravity",
  platform: "Cygnus Cargo Vehicle (OA-5)",
  material: "cotton-fiberglass (SIBAL)",
  material_class: "solid_fabric",
  oxygen_pct: 21.0,
  pressure_kpa: 101.3,
  airflow_cm_s: 20.0,
  measurements: ["flame_spread", "temperature"],
  finding: "Large-scale flame spread in microgravity without buoyancy proceeds steadily under forced airflow.",
  fire_safety_relevance: "Impacts spacecraft flammability standards.",
  limitations: ["Tested only at 21% O2 and 20 cm/s flow."],
  source_url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-98",
  quality: "primary_nasa",
  verified_by: "NASA GRC / PSI-98",
};

describe("Scientific Applicability Engine", () => {
  it("returns GENERAL_RELEVANCE when no conditions are set", () => {
    const assessment = assessApplicability(sampleRecord, {});
    assert.equal(assessment.verdict, "GENERAL_RELEVANCE");
  });

  it("returns EXACT_MATCH when conditions match within tolerance", () => {
    const assessment = assessApplicability(sampleRecord, {
      material: "cotton-fiberglass",
      oxygenPct: 21.0,
      pressureKpa: 101.3,
      airflowCmS: 20.0,
      gravity: "microgravity",
    });
    assert.equal(assessment.verdict, "EXACT_MATCH");
    assert.equal(assessment.differences.length, 0);
  });

  it("returns CONDITION_VARIANCE when oxygen or flow differs", () => {
    const assessment = assessApplicability(sampleRecord, {
      material: "cotton-fiberglass",
      oxygenPct: 28.0, // High oxygen variance
      pressureKpa: 101.3,
      airflowCmS: 20.0,
    });
    assert.equal(assessment.verdict, "CONDITION_VARIANCE");
    assert.ok(assessment.differences.some((d) => d.includes("Oxygen variance")));
  });

  it("flags missing parameters when study has null condition", () => {
    const nullRecord: ExperimentRecord = {
      ...sampleRecord,
      pressure_kpa: null,
    };
    const assessment = assessApplicability(nullRecord, {
      pressureKpa: 101.3,
    });
    assert.equal(assessment.verdict, "UNKNOWN_CONDITIONS");
    assert.ok(assessment.missingParameters.length > 0);
  });
});
