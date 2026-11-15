import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  isSupabaseConfigured,
  getSupabaseClient,
  getSupabaseAdmin,
} from "../src/lib/supabase";
import {
  candidateToRow,
  rowToCandidate,
  fetchStagedCandidatesFromDb,
  saveStagedCandidateToDb,
  updateCandidateReviewInDb,
  StagedCandidateRow,
} from "../src/lib/supabase-db";
import { StagedCandidateRecord } from "../src/lib/ingestion";

describe("Supabase Database Persistence & Fallback Bridge", () => {
  const sampleCandidate: StagedCandidateRecord = {
    stagedId: "staged-db-test-01",
    documentTitle: "Saffire-V Deep Low-Pressure Telemetry Report",
    filename: "NASA-TM-2022-0019284.pdf",
    extractedAt: "2026-11-15T12:00:00Z",
    candidateProgramme: "Saffire",
    candidatePlatform: "Cygnus Cargo Vehicle",
    candidateMaterial: "cotton-fiberglass (SIBAL)",
    candidateOxygenPct: 24,
    candidateAirflowCmS: 12,
    candidatePressureKpa: 70.3,
    extractedFinding: "Concurrent flame spread decelerates under 70 kPa depressurization.",
    extractedQuote: "Flame length decreased by 40% under low pressure.",
    pageNumber: 12,
    sourceLocator: "NASA GRC Saffire Table 3",
    doi: "10.60555/0t15-s5ex",
    reviewStatus: "PENDING_REVIEW",
    extractedBoundingBoxes: [
      {
        id: "box-1",
        pageNumber: 1,
        label: "OXYGEN_TELEMETRY",
        box: [0.1, 0.1, 0.2, 0.5],
        confidence: 95,
        textSnippet: "24% O2",
      },
    ],
  };

  test("accurately detects unconfigured state in offline test environment", () => {
    // In local tests without actual Supabase credentials
    const configured = isSupabaseConfigured();
    if (!configured) {
      assert.strictEqual(getSupabaseClient(), null);
      assert.strictEqual(getSupabaseAdmin(), null);
    }
  });

  test("converts candidate record to snake_case database row and back without data loss", () => {
    const row: StagedCandidateRow = candidateToRow(sampleCandidate);

    assert.strictEqual(row.staged_id, sampleCandidate.stagedId);
    assert.strictEqual(row.document_title, sampleCandidate.documentTitle);
    assert.strictEqual(row.candidate_oxygen_pct, 24);
    assert.strictEqual(row.candidate_pressure_kpa, 70.3);
    assert.strictEqual(row.candidate_airflow_cm_s, 12);
    assert.ok(Array.isArray(row.extracted_bounding_boxes));

    const restored: StagedCandidateRecord = rowToCandidate(row);
    assert.strictEqual(restored.stagedId, sampleCandidate.stagedId);
    assert.strictEqual(restored.candidateMaterial, sampleCandidate.candidateMaterial);
    assert.strictEqual(restored.candidateOxygenPct, sampleCandidate.candidateOxygenPct);
    assert.strictEqual(restored.reviewStatus, "PENDING_REVIEW");
    assert.strictEqual(restored.extractedBoundingBoxes?.length, 1);
  });

  test("gracefully falls back to in-memory staging store when Supabase is offline", async () => {
    const queue = await fetchStagedCandidatesFromDb();
    assert.ok(Array.isArray(queue));
    assert.ok(queue.length >= 1);

    const saved = await saveStagedCandidateToDb(sampleCandidate);
    assert.strictEqual(saved.stagedId, sampleCandidate.stagedId);

    const updated = await updateCandidateReviewInDb(
      sampleCandidate.stagedId,
      "APPROVED_FOR_CORPUS",
      "Dr. Sarah Chen (NASA GRC)",
      "Corroborated with NASA PSI"
    );
    assert.ok(updated);
    assert.strictEqual(updated?.reviewStatus, "APPROVED_FOR_CORPUS");
    assert.strictEqual(updated?.reviewerName, "Dr. Sarah Chen (NASA GRC)");
  });
});
