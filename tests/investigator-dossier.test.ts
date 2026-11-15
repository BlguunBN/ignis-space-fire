import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { generateInvestigatorDossier, InvestigatorDossier } from "../src/lib/investigator-dossier";
import { StagedCandidateRecord } from "../src/lib/ingestion";
import experimentsData from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";

const corpus = experimentsData as ExperimentRecord[];

describe("Investigator Pre-Review Dossier Agent (Phase 3)", () => {
  const sampleCandidate: StagedCandidateRecord = {
    stagedId: "staged-saffire-5-extinction",
    documentTitle: "Saffire-V Low-Pressure Concurrent Flame Extinction in Cotton-Fiberglass Blends",
    filename: "NASA-TM-2022-0019284.pdf",
    extractedAt: "2026-11-10T08:30:00Z",
    candidateProgramme: "Saffire",
    candidatePlatform: "Cygnus Cargo Vehicle (OA-14)",
    candidateMaterial: "cotton-fiberglass (SIBAL)",
    candidateOxygenPct: 24,
    candidateAirflowCmS: 12,
    candidatePressureKpa: 70.3,
    extractedFinding:
      "Concurrent flame spread decelerates abruptly as cabin depressurization reaches 70 kPa under 12 cm/s airflow, demonstrating non-linear pressure quenching.",
    extractedQuote:
      "Flame length decreased by 40% when chamber pressure dropped below 75 kPa, indicating elevated limiting oxygen index.",
    pageNumber: 12,
    sourceLocator: "NASA Glenn Research Center / Saffire-V Table 3",
    doi: "10.60555/0t15-s5ex",
    reviewStatus: "PENDING_REVIEW",
  };

  test("generates structured dossier with executive summary and risk level", () => {
    const dossier: InvestigatorDossier = generateInvestigatorDossier(sampleCandidate, corpus);

    assert.ok(dossier.executiveSummary.length > 20);
    assert.ok(["LOW", "MEDIUM", "HIGH"].includes(dossier.riskLevel));
    assert.ok(Array.isArray(dossier.riskFactors));
  });

  test("generates a 3-point investigator verification checklist", () => {
    const dossier = generateInvestigatorDossier(sampleCandidate, corpus);

    assert.ok(Array.isArray(dossier.checklist));
    assert.strictEqual(dossier.checklist.length, 3);
    for (const item of dossier.checklist) {
      assert.ok(item.id.length > 0);
      assert.ok(item.label.length > 10);
      assert.strictEqual(typeof item.verified, "boolean");
    }
  });

  test("pre-drafts review rationale citing exact flight parameters and reference baseline", () => {
    const dossier = generateInvestigatorDossier(sampleCandidate, corpus);

    assert.ok(dossier.recommendedRationale.length > 30);
    assert.ok(dossier.recommendedRationale.includes("24% O₂") || dossier.recommendedRationale.includes("24"));
    assert.ok(dossier.recommendedRationale.includes("70.3 kPa") || dossier.recommendedRationale.includes("70"));
    assert.ok(dossier.recommendedRationale.includes("SIBAL") || dossier.recommendedRationale.includes("cotton"));
  });

  test("identifies nearest historical flight reference from corpus", () => {
    const dossier = generateInvestigatorDossier(sampleCandidate, corpus);

    assert.ok(dossier.nearestFlightReference);
    assert.ok(dossier.nearestFlightReference.investigation.length > 0);
    assert.ok(dossier.nearestFlightReference.programme.length > 0);
  });
});
