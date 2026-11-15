import test, { describe } from "node:test";
import assert from "node:assert";
import experimentsData from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";
import {
  validateCitations,
  detectPhysicalBoundaryViolations,
  generateGroundedAssistantResponse,
  GroundedAssistantResponseSchema,
  GroundedCitation,
} from "../src/lib/grounded-assistant";

const corpus = experimentsData as ExperimentRecord[];

describe("Stage 3 Grounded AI Assistant & Hallucination Guard", () => {
  test("strictly validates citation grounding against authentic NASA PSI claims", () => {
    const validCitation: GroundedCitation = {
      claimId: "CLM-SAFFIRE-001",
      recordId: "saffire-1",
      investigation: "Saffire-I Flight Experiment",
      pageNumber: 4,
      quote: "Large-scale flame spread in microgravity without buoyancy proceeds steadily under forced airflow.",
      sourceLocator: "PSI Investigation Record PSI-98",
    };

    const check = validateCitations([validCitation], corpus);
    assert.strictEqual(check.valid, true);
    assert.strictEqual(check.invalidClaims.length, 0);
  });

  test("rejects a real claim ID attached to the wrong record or page", () => {
    const saffire = corpus.find((r) => r.id === "saffire-1")!;
    const flex = corpus.find((r) => r.id === "flex-droplet-1")!;
    const citation: GroundedCitation = {
      claimId: saffire.claim_locator_details!.claimId,
      recordId: flex.id,
      investigation: flex.investigation,
      pageNumber: saffire.claim_locator_details!.pageNumber,
      quote: "Incorrectly borrowed from a different experiment",
      sourceLocator: flex.source_locator || "NASA PSI",
    };
    assert.strictEqual(validateCitations([citation], corpus).valid, false);
    assert.strictEqual(validateCitations([{
      ...citation,
      recordId: saffire.id,
      pageNumber: 999,
    }], corpus).valid, false);
  });

  test("rejects hallucinated claim IDs and invalid records", () => {
    const hallucinatedCitation: GroundedCitation = {
      claimId: "CLM-FAKE-FLIGHT-999",
      recordId: "nonexistent-record-id",
      investigation: "Fabricated Mars Fire Test",
      pageNumber: 42,
      quote: "Fabricated quote not in NASA PSI.",
      sourceLocator: "Fake Archive",
    };

    const check = validateCitations([hallucinatedCitation], corpus);
    assert.strictEqual(check.valid, false);
    assert.ok(check.invalidClaims.includes("CLM-FAKE-FLIGHT-999"));
  });

  test("detects physical boundary violations for Martian (0.38g) and hyperoxic (>40% O2) queries", () => {
    const marsViolations = detectPhysicalBoundaryViolations(
      "Predict flame spread rate in Martian 0.38g gravity"
    );
    assert.ok(marsViolations.length > 0);
    assert.ok(marsViolations[0].includes("Martian partial-gravity (0.38g)"));

    const hyperoxicViolations = detectPhysicalBoundaryViolations(
      "Test PMMA ignition at 50% O2 atmosphere"
    );
    assert.ok(hyperoxicViolations.length > 0);
    assert.ok(hyperoxicViolations[0].includes("50% O₂"));
  });

  test("generates deterministic grounded synthesis for authentic query", () => {
    const res = generateGroundedAssistantResponse("saffire flame spread", corpus);
    assert.strictEqual(res.isAbstention, false);
    assert.ok(res.citations.length > 0);
    assert.ok(res.citations.some((c) => c.recordId.includes("saffire")));
    assert.ok(res.answer.includes("CLM-SAFFIRE"));

    // Verify Zod schema compliance
    const parseResult = GroundedAssistantResponseSchema.safeParse(res);
    assert.strictEqual(parseResult.success, true);
  });

  test("triggers scientific abstention when no verified records match", () => {
    const res = generateGroundedAssistantResponse("cryogenic plutonium nuclear thermal thruster nozzle 9999", corpus);
    assert.strictEqual(res.isAbstention, true);
    assert.ok(res.answer.includes("Scientific Abstention"));
    assert.strictEqual(res.citations.length, 0);
  });
});
