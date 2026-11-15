import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateDeterministicBrief } from "../src/lib/synthesis";
import { ExperimentRecord } from "../src/types/evidence";

const mockRecord: ExperimentRecord = {
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
  finding: "Large-scale flame spread in microgravity proceeds steadily under forced airflow.",
  fire_safety_relevance: "Impacts spacecraft flammability standards.",
  limitations: ["Tested only at 21% O2 and 20 cm/s flow."],
  source_url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-98",
  quality: "primary_nasa",
  verified_by: "NASA GRC / PSI-98",
};

describe("Deterministic Synthesis Generator", () => {
  it("generates an abstention brief when no records match", () => {
    const brief = generateDeterministicBrief({ freeText: "unsupported query" }, []);
    assert.ok(brief.markdownContent.includes("No indexed records match the current query filters"));
    assert.equal(brief.citedRecordIds.length, 0);
  });

  it("generates structured brief with citations for matched records", () => {
    const brief = generateDeterministicBrief({ freeText: "Saffire" }, [mockRecord]);
    assert.ok(brief.markdownContent.includes("Indexed Research Findings and Their Review Status"));
    assert.ok(brief.markdownContent.includes("Saffire-I Flight Experiment"));
    assert.ok(brief.markdownContent.includes("PSI Investigation Record PSI-98"));
    assert.ok(brief.markdownContent.includes("https://doi.org/10.60555/0t15-1z43"));
    assert.ok(brief.markdownContent.includes("Stated Scientific Limitations"));
    assert.equal(brief.citedRecordIds.length, 1);
    assert.equal(brief.citedRecordIds[0], "saffire-1");
  });
});
