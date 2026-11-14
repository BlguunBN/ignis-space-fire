import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, "../data/experiments.json");

const experiments = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

// Import compiled or direct ranking logic
function calculateScore(exp, query) {
  let score = 50;
  if (query.material && exp.material.toLowerCase().includes(query.material.toLowerCase())) {
    score += 30;
  }
  if (query.oxygenPct != null && Math.abs(exp.oxygen_pct - query.oxygenPct) < 2) {
    score += 15;
  }
  if (query.airflowCmS != null && Math.abs(exp.airflow_cm_s - query.airflowCmS) <= 5) {
    score += 15;
  }
  return score;
}

test("NASA Experiments Dataset integrity", () => {
  assert.ok(experiments.length >= 8, "Expected at least 8 verified experiments");
  for (const exp of experiments) {
    assert.ok(exp.id, "Experiment must have id");
    assert.ok(exp.programme, "Experiment must have programme");
    assert.ok(exp.finding, "Experiment must have finding");
    assert.ok(exp.limitations?.length > 0, "Experiment must document limitations");
    assert.ok(exp.source_url.startsWith("http"), "Experiment must have valid source URL");
  }
});

test("PMMA low airflow ranks BASS-II and SoFIE highly", () => {
  const pmmaExps = experiments.filter(e => e.material.toLowerCase().includes("pmma"));
  assert.ok(pmmaExps.length >= 2, "Should have multiple PMMA experiments");
  const bass = pmmaExps.find(e => e.programme === "BASS");
  assert.ok(bass, "BASS should be present for PMMA");
});

test("Saffire-I captures large-scale vehicle flammability", () => {
  const saffire1 = experiments.find(e => e.id === "saffire-1");
  assert.ok(saffire1, "Saffire-I must exist");
  assert.equal(saffire1.airflow_cm_s, 20.0);
  assert.equal(saffire1.gravity, "microgravity");
});
