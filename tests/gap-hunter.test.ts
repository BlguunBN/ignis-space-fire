import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  scanCorpusForResearchGaps,
  generateArtemisHypothesisTree,
  ResearchGapScanResult,
  ResearchGapCell,
} from "../src/lib/gap-hunter-agent";
import experimentsData from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";
import { BuildHypothesisTreeArgs } from "../src/lib/agent-tools";

const corpus = experimentsData as ExperimentRecord[];

describe("Autonomous Gap Hunter & Artemis Lunar Experiment Generator (Phase 5)", () => {
  test("scans the 72-cell research matrix and identifies empirical white spaces", () => {
    const result: ResearchGapScanResult = scanCorpusForResearchGaps(corpus);

    assert.strictEqual(result.totalCells, 72);
    assert.ok(result.emptyCount > 20, "Must detect authentic gaps in reduced-gravity matrix");
    assert.ok(result.strongCount > 0, "Microgravity standard air regime must have strong cells");
    assert.strictEqual(result.emptyCount + result.limitedCount + result.strongCount, 72);
    assert.ok(result.gaps.length > 0);
  });

  test("prioritizes Lunar (0.16g) and Partial Gravity Exploration Atmosphere gaps as CRITICAL", () => {
    const result = scanCorpusForResearchGaps(corpus);
    const lunarGaps = result.gaps.filter((g) => g.gravityId === "lunar");

    assert.ok(lunarGaps.length >= 3, "Multiple lunar gap cells must be detected");
    assert.ok(
      lunarGaps.some((g) => g.priority === "CRITICAL" && g.o2Id === "high"),
      "Lunar high-oxygen Exploration Atmosphere gap must have CRITICAL priority"
    );
  });

  test("generates a complete 4-tier Artemis hypothesis tree compatible with Whiteboard Studio", () => {
    const result = scanCorpusForResearchGaps(corpus);
    const targetGap = result.gaps.find((g) => g.gravityId === "lunar" && g.materialId === "pmma") || result.gaps[0];

    const tree: BuildHypothesisTreeArgs = generateArtemisHypothesisTree(targetGap, corpus);

    assert.ok(tree.question.title.length > 10);
    assert.ok(tree.question.details.length > 20);
    assert.ok(Array.isArray(tree.evidenceClaims));
    assert.ok(tree.evidenceClaims.length >= 1);
    assert.ok(tree.hypothesis.title.length > 5);
    assert.ok(tree.hypothesis.prediction.length > 10);
    assert.ok(tree.counterHypothesis && tree.counterHypothesis.title.length > 5);
    assert.ok(tree.validationExperiment.facility.length > 5);
    assert.ok(tree.validationExperiment.oxygen.includes("%"));
    assert.ok(tree.validationExperiment.pressure.includes("kPa") || tree.validationExperiment.pressure.includes("atm"));
  });
});
