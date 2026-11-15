import test, { describe } from "node:test";
import assert from "node:assert";
import experimentsData from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";
import {
  buildNemotronSystemPrompt,
  NVIDIA_CONFIG,
} from "../src/lib/nvidia-nemotron";

const corpus = experimentsData as ExperimentRecord[];

describe("NVIDIA Nemotron 3.5 Lightning Agent Integration", () => {
  test("loads valid NVIDIA NIM configuration and endpoint", () => {
    assert.strictEqual(NVIDIA_CONFIG.baseURL, "https://integrate.api.nvidia.com/v1");
    assert.strictEqual(NVIDIA_CONFIG.model, "nvidia/nemotron-3.5-lightning-30b-a3b");
    assert.strictEqual(NVIDIA_CONFIG.apiKey, process.env.NVIDIA_API_KEY || "");
  });

  test("compiles comprehensive NASA PSI system prompt with authentic flight citations", () => {
    const prompt = buildNemotronSystemPrompt(corpus);
    assert.ok(prompt.includes("You are FLARE"));
    assert.ok(prompt.includes("NVIDIA Nemotron-3.5-Lightning-30B"));
    assert.ok(prompt.includes("Saffire-I Flight Experiment"));
    assert.ok(prompt.includes("BASS-II"));
    assert.ok(prompt.includes("CLM-SAFFIRE-001"));
    assert.ok(prompt.includes("Physical Boundary Safety"));
    assert.ok(prompt.includes("Scientific Abstention"));
  });

  test("enforces citation claim IDs for all 10 verified flight investigations in prompt context", () => {
    const prompt = buildNemotronSystemPrompt(corpus);
    for (const record of corpus) {
      assert.ok(prompt.includes(record.id));
      assert.ok(prompt.includes(record.investigation));
    }
  });
});
