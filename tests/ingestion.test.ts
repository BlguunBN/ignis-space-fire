import test, { describe } from "node:test";
import assert from "node:assert";
import {
  getStagingQueue,
  stageNewDocument,
  reviewCandidate,
  safetyCheckIsolateUnapproved,
  promoteCandidateToCorpus,
} from "../src/lib/ingestion";

describe("Stage 4 Paper Ingestion & Human Review Staging Queue", () => {
  test("maintains pre-staged candidate documents in the review queue", () => {
    const queue = getStagingQueue();
    assert.ok(queue.length >= 2);
    assert.ok(queue.some((item) => item.candidateProgramme === "Saffire"));
  });

  test("strictly enforces safety invariant: unapproved candidates are isolated from active search index", () => {
    const queue = getStagingQueue();
    const pendingItem = queue.find((item) => item.reviewStatus === "PENDING_REVIEW");
    assert.ok(pendingItem);

    // Safety check must return true (meaning it IS isolated from active index)
    assert.strictEqual(safetyCheckIsolateUnapproved(pendingItem), true);
  });

  test("supports staging a new candidate NASA technical report", () => {
    const staged = stageNewDocument({
      documentTitle: "ACME Electric Field Microgravity Burner Test",
      filename: "NASA-TM-2024-ACME.pdf",
      candidateProgramme: "ACME",
      candidatePlatform: "ISS CIR",
      candidateMaterial: "methane gas",
      candidateOxygenPct: 21,
      candidateAirflowCmS: 0,
      candidatePressureKpa: 101.3,
      extractedFinding: "Electrostatic field reduces soot emission.",
      extractedQuote: "Soot concentration decreased threefold under 5 kV field.",
      pageNumber: 5,
      sourceLocator: "NASA PSI Archive Record PSI-144",
      doi: "10.60555/0t15-acme-test",
    });

    assert.ok(staged.stagedId.startsWith("staged-"));
    assert.strictEqual(staged.reviewStatus, "PENDING_REVIEW");
  });

  test("executes human review sign-off and promotes approved candidate to active corpus record", () => {
    const staged = stageNewDocument({
      documentTitle: "Approved Spacecraft Wire Insulation Test",
      filename: "NASA-CR-2025-WIRE.pdf",
      candidateProgramme: "SAME-R",
      candidatePlatform: "ISS MSG",
      candidateMaterial: "PTFE / Kapton wire",
      candidateOxygenPct: 21,
      candidateAirflowCmS: 2,
      candidatePressureKpa: 101.3,
      extractedFinding: "Overheated wire insulation smoke detected within 30 seconds.",
      extractedQuote: "Particulate mass median diameter measured at 0.12 micrometers.",
      pageNumber: 3,
      sourceLocator: "NASA GRC Table 2",
    });

    const reviewed = reviewCandidate(
      staged.stagedId,
      "APPROVED_FOR_CORPUS",
      "Dr. David Urban (NASA GRC)",
      "Verified against raw sensor telemetry"
    );

    assert.strictEqual(reviewed.reviewStatus, "APPROVED_FOR_CORPUS");
    assert.strictEqual(safetyCheckIsolateUnapproved(reviewed), false);

    const promoted = promoteCandidateToCorpus(reviewed);
    assert.strictEqual(promoted.verification_status, "verified");
    assert.ok(promoted.claim_locator_details?.claimId.includes("STAGED-"));
  });
});
