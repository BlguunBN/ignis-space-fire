import test, { describe } from "node:test";
import assert from "node:assert";
import {
  NEMOTRON_AGENT_TOOLS,
  determineAgentToolsFromQuery,
} from "../src/lib/agent-tools";
import {
  GroundedAssistantResponseSchema,
} from "../src/lib/grounded-assistant";
import { generateNemotronGroundedResponse } from "../src/lib/nvidia-nemotron";
import experimentsData from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";

const corpus = experimentsData as ExperimentRecord[];

describe("AI Agent Tools & Schema Verification", () => {
  test("defines the 6 OpenAI-compatible tool specifications with descriptions and parameters", () => {
    assert.strictEqual(NEMOTRON_AGENT_TOOLS.length, 6);
    const names = NEMOTRON_AGENT_TOOLS.map((t) => t.function.name);
    assert.ok(names.includes("build_hypothesis_tree"));
    assert.ok(names.includes("run_combustion_simulation"));
    assert.ok(names.includes("inspect_optical_diagnostics"));
    assert.ok(names.includes("open_primary_evidence"));
    assert.ok(names.includes("filter_research_explorer"));
    assert.ok(names.includes("ingest_research_paper"));

    for (const tool of NEMOTRON_AGENT_TOOLS) {
      assert.strictEqual(tool.type, "function");
      assert.ok(tool.function.name);
      assert.ok(tool.function.description.length > 15);
      assert.strictEqual(tool.function.parameters.type, "object");
      assert.ok(tool.function.parameters.properties);
    }
  });

  test("generates structured build_hypothesis_tree for Artemis Lunar queries", () => {
    const query = "Formulate Artemis Lunar (0.16g / 56kPa) hypothesis tree for PMMA flammability";
    const calls = determineAgentToolsFromQuery(query, corpus);

    assert.ok(calls.length >= 1);
    const treeCall = calls.find((c) => c.name === "build_hypothesis_tree");
    assert.ok(treeCall);
    assert.ok(treeCall.args.question.title.includes("Artemis"));
    assert.ok(treeCall.args.evidenceClaims.includes("CLM-SAFFIRE-004"));
    assert.ok(treeCall.args.validationExperiment.pressure.includes("56 kPa"));
  });

  test("generates structured simulation tool call for microgravity droplet queries", () => {
    const query = "Simulate droplet extinction and cool flames for Heptane in microgravity";
    const calls = determineAgentToolsFromQuery(query, corpus);

    assert.ok(calls.length >= 1);
    const simCall = calls.find((c) => c.name === "run_combustion_simulation");
    assert.ok(simCall);
    assert.strictEqual(simCall.args.gravity, "µg");
    assert.strictEqual(simCall.args.fuel, "Heptane");
  });

  test("generates optical diagnostics tool call for pyrometry and chemiluminescence", () => {
    const query = "Inspect optical diagnostics and chemiluminescence filter on SoFIE plate";
    const calls = determineAgentToolsFromQuery(query, corpus);
    const diagCall = calls.find((c) => c.name === "inspect_optical_diagnostics");
    assert.ok(diagCall);
    assert.strictEqual(diagCall.args.plateId, "sofie");
    assert.strictEqual(diagCall.args.filterMode, "chemiluminescence");
  });

  test("generates ingest_research_paper tool call when external research paper URL is provided", () => {
    const query = "Examine and ingest paper: https://ntrs.nasa.gov/citations/20220014245 into library if safe";
    const calls = determineAgentToolsFromQuery(query, corpus);
    const ingestCall = calls.find((c) => c.name === "ingest_research_paper");
    assert.ok(ingestCall);
    assert.strictEqual(ingestCall.args.sourceType, "url");
    assert.strictEqual(ingestCall.args.urlOrText, "https://ntrs.nasa.gov/citations/20220014245");
  });

  test("generates research explorer filter call for material and gravity queries", () => {
    const query = "Filter explorer to show Lunar 0.16g studies on PMMA fabric";
    const calls = determineAgentToolsFromQuery(query, corpus);

    const filterCall = calls.find((c) => c.name === "filter_research_explorer");
    assert.ok(filterCall);
    assert.ok(filterCall.args.gravityRegimes);
  });

  test("validates GroundedAssistantResponseSchema allows reasoning and toolCalls", () => {
    const mockPayload = {
      query: "Test query",
      answer: "Grounded answer citing verified flight records.",
      citations: [
        {
          claimId: "CLM-SAFFIRE-001",
          recordId: "reg-record-001",
          investigation: "Saffire-I Flight Experiment",
          pageNumber: 1,
          quote: "Test verified finding quote.",
          sourceLocator: "NASA PSI Archive",
        },
      ],
      isAbstention: false,
      boundaryWarnings: [],
      scientificLimitations: [],
      provenanceHash: "test-hash-123",
      reasoning: "[1. PHYSICAL BOUNDARY DECOMPOSITION]\nRegime analyzed.\n[2. TOOL DISPATCH]\nDispatched.",
      toolCalls: [
        {
          id: "call-1",
          name: "build_hypothesis_tree",
          args: { question: { title: "Test Q", details: "Details" } },
          status: "dispatched",
        },
      ],
      model: "nvidia/nemotron-3.5-lightning-30b-a3b",
    };

    const parsed = GroundedAssistantResponseSchema.safeParse(mockPayload);
    assert.strictEqual(parsed.success, true);
    if (parsed.success) {
      assert.ok(parsed.data.reasoning);
      assert.strictEqual(parsed.data.toolCalls?.length, 1);
    }
  });

  test("provides a usable fallback when the model is unavailable", async (t) => {
    t.mock.method(globalThis, "fetch", async () => { throw new Error("Offline test"); });
    const res = await generateNemotronGroundedResponse(
      "Formulate Artemis Lunar (0.16g / 56kPa) hypothesis tree",
      corpus
    );

    assert.ok(res);
    assert.ok(res.answer);
    assert.ok(res.reasoning);
    assert.ok(res.reasoning.length > 10);
    assert.ok(res.toolCalls);
    assert.ok(res.toolCalls.length > 0);
    assert.ok(res.toolCalls.some((call) => call.name === "build_hypothesis_tree"));
  });
});
