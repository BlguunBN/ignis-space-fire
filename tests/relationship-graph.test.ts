import test, { describe } from "node:test";
import assert from "node:assert";
import experimentsData from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";
import { buildKnowledgeGraph } from "../src/lib/graph";

const corpus = experimentsData as ExperimentRecord[];

describe("Stage 4 Global Knowledge Relationship Network", () => {
  test("builds complete tripartite knowledge graph from NASA PSI corpus", () => {
    const graph = buildKnowledgeGraph(corpus);

    assert.ok(graph.nodes.length > 0);
    assert.ok(graph.links.length > 0);

    // Verify presence of all 4 node types
    const types = new Set(graph.nodes.map((n) => n.type));
    assert.ok(types.has("investigation"));
    assert.ok(types.has("material"));
    assert.ok(types.has("regime"));
    assert.ok(types.has("platform"));
  });

  test("creates valid links for materials, facilities, and physical regimes", () => {
    const graph = buildKnowledgeGraph(corpus);

    const linkLabels = new Set(graph.links.map((l) => l.label));
    assert.ok(linkLabels.has("burns_material"));
    assert.ok(linkLabels.has("conducted_aboard"));
    assert.ok(linkLabels.has("operates_in_regime"));
  });

  test("correctly cross-links investigations sharing identical fuel materials", () => {
    const graph = buildKnowledgeGraph(corpus);

    const sharedFuelLinks = graph.links.filter((l) => l.label === "shares_fuel_composition");
    assert.ok(sharedFuelLinks.length > 0);
  });
});
