import test, { describe } from "node:test";
import assert from "node:assert";
import experimentsData from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";
import { evaluatePaperQARetrieval } from "../src/lib/paperqa-eval";

const corpus = experimentsData as ExperimentRecord[];

describe("Stage 4 PaperQA2 Multi-Paper Query Evaluation Harness", () => {
  test("synthesizes cross-paper evidence when retrieval confidence exceeds threshold", () => {
    const result = evaluatePaperQARetrieval("Saffire PMMA forced airflow flame spread", corpus, 0.6);

    assert.strictEqual(result.isAbstained, false);
    assert.ok(result.confidenceScore >= 0.6);
    assert.ok(result.citedPapers.length > 0);
    assert.ok(result.answer.includes("Verified multi-paper synthesis"));
  });

  test("triggers scientific abstention when cross-paper retrieval confidence is below threshold", () => {
    const result = evaluatePaperQARetrieval(
      "cryogenic propellant tank rupture at 5 kelvin",
      corpus,
      0.75
    );

    assert.strictEqual(result.isAbstained, true);
    assert.ok(result.answer.includes("PaperQA2 Evaluation: Confidence score fell below"));
    assert.strictEqual(result.citedPapers.length, 0);
  });
});
