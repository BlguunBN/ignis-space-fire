import test from "node:test";
import assert from "node:assert/strict";
import experiments from "../data/experiments.json";
import { sourceReviewedRecords, isEligibleEvidence } from "../lib/sourceReviewedRecords";
import { rankEvidence, assessQuerySupport } from "../lib/ranking";
import { computeEvidenceCoverage } from "../lib/coverage";
import type { ExperimentRecord } from "../types/evidence";

const raw = experiments as ExperimentRecord[];

test("reviewed evidence corrects source identities and excludes unsupported records", () => {
  const records = sourceReviewedRecords(raw);
  const bass = records.find(record => record.id === "bass-2-pmma")!;
  assert.equal(bass.psi_id, "PSI-25");
  assert.equal(bass.oxygen_pct, null);
  assert.equal(records.find(record => record.id === "saffire-4")?.verification_status, "needs_review");
  assert.ok(isEligibleEvidence(bass));
  assert.ok(!isEligibleEvidence(records.find(record => record.id === "saffire-4")!));
});

test("unrelated questions do not produce applicable evidence", () => {
  const query = { freeText: "banana quantum toaster" };
  const results = rankEvidence(sourceReviewedRecords(raw), query);
  assert.equal(assessQuerySupport(query, results).kind, "no_relevant_evidence");
  assert.equal(results.length, 0);
});

test("requested pressure distinguishes otherwise identical studies", () => {
  const base = sourceReviewedRecords(raw).find(record => record.id === "saffire-1")!;
  const near = { ...base, id: "near", oxygen_pct: 21, pressure_kpa: 100 };
  const far = { ...base, id: "far", oxygen_pct: 21, pressure_kpa: 500 };
  const results = rankEvidence([far, near], { oxygenPct: 21, pressureKpa: 100 });
  assert.equal(results[0].experiment.id, "near");
  assert.ok(results[0].score > results[1].score);
});

test("coverage excludes values outside the displayed bounds", () => {
  const base = sourceReviewedRecords(raw).find(record => record.id === "saffire-1")!;
  const outlier = { ...base, material_class: "solid_polymer", oxygen_pct: 90, airflow_cm_s: 100 };
  assert.ok(computeEvidenceCoverage([outlier]).cells.every(cell => cell.count === 0));
});
