import { describe, it } from "node:test";
import assert from "node:assert/strict";
import Fuse from "fuse.js";
import experimentsData from "../src/data/experiments.json";
import { ExperimentRecord, SearchQuery } from "../src/types/evidence";
import { assessApplicability } from "../src/lib/applicability";
import { compareInvestigations } from "../src/lib/comparison";
import { generateDeterministicBrief } from "../src/lib/synthesis";

const allRecords = experimentsData as ExperimentRecord[];

describe("Flagship Research Journey & Workspace Logic", () => {
  const fuse = new Fuse(allRecords, {
    keys: ["investigation", "programme", "material", "material_class", "finding"],
    threshold: 0.35,
    ignoreLocation: true,
  });

  it("executes the flagship question: ventilation-dependent flame spread", () => {
    // 1. Researcher defines inquiry
    const flagshipQuery: SearchQuery = {
      freeText: "flame spread forced airflow",
      airflowCmS: 15,
      oxygenPct: 21,
    };

    // 2. Retrieval via Fuse + filters
    const fuseMatches = fuse.search(flagshipQuery.freeText || "").map((m) => m.item);
    assert.ok(fuseMatches.length > 0, "Fuse search should return relevant studies");

    // Saffire and BASS records should be in the retrieved set
    const saffire1 = allRecords.find((r) => r.id === "saffire-1")!;
    const bassRecord = allRecords.find((r) => r.id === "reg-record-032")!;
    assert.ok(saffire1, "Saffire-I must exist in corpus");
    assert.ok(bassRecord, "BASS-II reg-record-032 must exist in corpus");

    // 3. Condition applicability assessment
    const saffireAssess = assessApplicability(saffire1, flagshipQuery);
    const bassAssess = assessApplicability(bassRecord, flagshipQuery);

    // BASS has PMMA match, but airflow differs (3.5 cm/s in study vs 15 cm/s in query)
    assert.equal(bassAssess.verdict, "CONDITION_VARIANCE");
    assert.ok(bassAssess.differences.some((d) => d.includes("Airflow variance")));

    // 4. Comparison detects physical confounder between Saffire and BASS
    const comparison = compareInvestigations([saffire1, bassRecord]);
    assert.equal(comparison.canQuantitativelyAggregate, false);
    assert.ok(comparison.confounders.some((c) => c.type === "SCALE_DISPARITY"));
    assert.ok(comparison.confounders.some((c) => c.type === "FLOW_REGIME"));

    // 5. Generates traceable brief with claim citations and confounders
    const brief = generateDeterministicBrief(flagshipQuery, [saffire1, bassRecord]);
    assert.ok(brief.markdownContent.includes("Saffire-I Flight Experiment"));
    assert.ok(brief.markdownContent.includes("BASS-II"));
    assert.ok(brief.markdownContent.includes("Apparatus Scale Disparity"));
    assert.ok(brief.markdownContent.includes("Disparate Flow Regimes"));
    assert.ok(brief.citedRecordIds.includes("saffire-1"));
    assert.ok(brief.citedRecordIds.includes("reg-record-032"));
  });

  it("enforces scientific abstention for unsupported physical queries", () => {
    const unsupportedQuery: SearchQuery = {
      oxygenPct: 75.0, // Extravagantly high oxygen
      airflowCmS: 80.0, // Hurricane forced flow
      material: "titanium",
    };

    // Filter against corpus
    const matched = allRecords.filter((r) => {
      if (r.oxygen_pct == null || r.airflow_cm_s == null) return false;
      return (
        Math.abs(r.oxygen_pct - (unsupportedQuery.oxygenPct as number)) <= 3.0 &&
        Math.abs(r.airflow_cm_s - (unsupportedQuery.airflowCmS as number)) <= 6.0
      );
    });

    assert.equal(matched.length, 0, "No records should match unsupported query");

    // Brief must abstain
    const brief = generateDeterministicBrief(unsupportedQuery, matched);
    assert.ok(brief.markdownContent.includes("No reviewed NASA microgravity combustion records"));
    assert.ok(brief.markdownContent.toLowerCase().includes("scientific abstention"));
    assert.equal(brief.citedRecordIds.length, 0);
  });

  it("accurately isolates Saffire-IV sample IV-1 conditions (22% O2 / 100 kPa)", () => {
    const saffire4Query: SearchQuery = {
      oxygenPct: 22.0,
      pressureKpa: 100.0,
    };

    const saffire4 = allRecords.find((r) => r.id === "saffire-4")!;
    const assess = assessApplicability(saffire4, saffire4Query);

    assert.equal(assess.verdict, "EXACT_MATCH");
    assert.equal(assess.differences.length, 0);
    assert.ok(assess.reasons.some((r) => r.includes("Oxygen concentration matches")));
    assert.ok(assess.reasons.some((r) => r.includes("Pressure matches")));
  });
});
