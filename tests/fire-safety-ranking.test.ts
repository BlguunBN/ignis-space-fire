import test from "node:test";
import assert from "node:assert/strict";
import records from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";
import { assessFireSafetyRelevance, rankFireSafetyEvidence } from "../src/lib/fire-safety-ranking";

const prototype = records[0] as ExperimentRecord;
const solid = {
  ...prototype,
  id: "solid-test",
  investigation: "Solid-material flame spread",
  material: "PMMA solid sheet",
  material_class: "solid_plastic",
  finding: "Observed flame spread under forced ventilation in microgravity.",
  fire_safety_relevance: "Spacecraft material flammability evidence.",
  airflow_cm_s: 15,
  oxygen_pct: 21,
  pressure_kpa: 101,
  verification_status: "verified" as const,
  source_type: "NASA_PSI" as const,
  gravity: "microgravity" as const,
};
const droplet = {
  ...solid,
  id: "droplet-test",
  investigation: "Liquid droplet extinction",
  material: "Methanol droplet",
  material_class: "liquid_droplet",
  finding: "Droplet extinction in quiescent microgravity.",
  fire_safety_relevance: "Droplet combustion only.",
  airflow_cm_s: null,
};

test("ranks solid flame spread evidence ahead of droplet studies for habitat materials", () => {
  const candidates = rankFireSafetyEvidence([droplet, solid], "spacecraft cabin solid material flame spread under airflow");
  assert.equal(candidates[0].record.id, "solid-test");
  assert.ok(candidates[0].score > candidates[1].score);
  assert.ok(candidates[0].reasons.some((reason) => /material/i.test(reason)));
});

test("internally unreviewed records are clearly warned and never described as independently verified", () => {
  const pending = { ...solid, verification_status: "needs_review" as const };
  const rank = assessFireSafetyRelevance(pending, "flame spread in solid cabin material");
  assert.ok(rank.warnings.some((warning) => /internal review/i.test(warning)));
  assert.ok(rank.score < assessFireSafetyRelevance(solid, "flame spread in solid cabin material").score);
});

test("missing oxygen and airflow are not silently treated as zero", () => {
  const incomplete = { ...solid, oxygen_pct: null, airflow_cm_s: null };
  const rank = assessFireSafetyRelevance(incomplete, "oxygen and airflow effects on solid flame spread");
  assert.ok(rank.warnings.some((warning) => /Oxygen concentration is not reported/i.test(warning)));
  assert.ok(rank.warnings.some((warning) => /Airflow condition is not reported/i.test(warning)));
});

test("ranking is deterministic and does not mutate the supplied collection", () => {
  const input = [droplet, solid];
  const ranked = rankFireSafetyEvidence(input, "solid material flame spread");
  assert.equal(input[0].id, "droplet-test");
  assert.deepEqual(ranked.map((candidate) => candidate.record.id), rankFireSafetyEvidence(input, "solid material flame spread").map((candidate) => candidate.record.id));
});
