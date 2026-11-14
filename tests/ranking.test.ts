import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { rankEvidence } from "../lib/ranking";
import { computeEvidenceCoverage } from "../lib/coverage";
import { ExperimentRecord } from "../types/evidence";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "../data/experiments.json");

const experiments: ExperimentRecord[] = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

test("NASA Experiments Dataset integrity & schema compliance", () => {
  assert.ok(experiments.length >= 10, "Expected at least 10 verified experiments");
  for (const exp of experiments) {
    assert.ok(exp.id, "Experiment must have id");
    assert.ok(exp.programme, "Experiment must have programme");
    assert.ok(exp.finding, "Experiment must have finding");
    assert.ok(exp.record_type, "Experiment must have record_type");
    assert.ok(exp.verification_status, "Experiment must have verification_status");
    assert.ok(exp.limitations?.length > 0, "Experiment must document limitations");
    assert.ok(exp.source_url.startsWith("http"), "Experiment must have valid source URL");
  }
});

test("Real rankEvidence logic: PMMA low airflow ranks BASS-II at #1", () => {
  const query = {
    material: "PMMA",
    airflowCmS: 3.5,
    oxygenPct: 21.0,
    phenomenon: "flame_spread",
  };

  const results = rankEvidence(experiments, query);
  assert.ok(results.length > 0, "Should return ranked results");
  assert.equal(results[0].experiment.id, "bass-2-pmma", "BASS-II PMMA should rank #1");
  assert.ok(results[0].score >= 80, "Expected high relevance score for direct match");
  assert.equal(results[0].confidenceLevel, "HIGH");
});

test("Real rankEvidence logic: Large-scale fabric ventilation ranks Saffire-I at #1", () => {
  const query = {
    material: "cotton-fiberglass",
    airflowCmS: 20.0,
    oxygenPct: 21.0,
    phenomenon: "flame_spread",
  };

  const results = rankEvidence(experiments, query);
  assert.equal(results[0].experiment.id, "saffire-1", "Saffire-I should rank #1");
  assert.ok(results[0].score >= 85, "Expected high relevance score for Saffire-I");
});

test("Real rankEvidence logic: Missing parameters degrade confidence cleanly", () => {
  const query = {
    material: "PMMA",
    pressureKpa: 70.0,
  };

  const results = rankEvidence(experiments, query);
  const bass = results.find((r) => r.experiment.id === "bass-2-pmma");
  assert.ok(bass);
  // Confirm limitations warning is present
  assert.ok(bass.breakdown.limitationsWarning.includes("NASA Caution"));
});

test("Dynamic Evidence Coverage Matrix: Bins with 0 records are labeled NO_INDEXED_EVIDENCE", () => {
  const coverage = computeEvidenceCoverage(experiments);
  assert.equal(coverage.totalRecords, experiments.length);
  assert.ok(coverage.summary.coveredBins > 0, "Should have covered bins");
  assert.ok(coverage.summary.emptyBins > 0, "Should have unindexed bins");

  const unindexedCell = coverage.cells.find((c) => c.status === "NO_INDEXED_EVIDENCE");
  assert.ok(unindexedCell, "Should identify empty regimes");
  assert.ok(
    unindexedCell.notes.includes("No verified records in current indexed corpus"),
    "Notes must explicitly clarify that zero records does not mean NASA never tested it"
  );
});

test("Research Papers Dataset integrity & authentic scientific citations", () => {
  const papersPath = path.join(__dirname, "../data/papers.json");
  const papers = JSON.parse(fs.readFileSync(papersPath, "utf-8"));
  assert.ok(papers.length >= 10, "Expected at least 10 verified research papers");

  for (const paper of papers) {
    assert.ok(paper.id, "Paper must have id");
    assert.ok(paper.title, "Paper must have title");
    assert.ok(Array.isArray(paper.authors) && paper.authors.length > 0, "Paper must have authors array");
    assert.ok(paper.journal, "Paper must have journal/conference");
    assert.ok(paper.year >= 2000, "Paper must have valid publication year");
    assert.ok(paper.url?.startsWith("http"), "Paper must have valid URL");
    assert.ok(paper.programme, "Paper must have programme");
    assert.ok(paper.summary, "Paper must have summary");
    assert.ok(paper.relevance, "Paper must have relevance statement");
    assert.ok(paper.verified_source, "Paper must have verified source provenance");
    assert.ok(paper.doi || paper.ntrs_id, "Paper must have either DOI or NTRS ID");
  }
});
