import experimentsData from "../src/data/experiments.json" with { type: "json" };
import { ExperimentRecord } from "../src/types/evidence";
import { generateNemotronGroundedResponse } from "../src/lib/nvidia-nemotron";

const corpus = experimentsData as ExperimentRecord[];

async function runTest(title: string, query: string) {
  console.log(`\n================================================================================`);
  console.log(`TEST: ${title}`);
  console.log(`QUERY: "${query}"`);
  console.log(`================================================================================`);

  const response = await generateNemotronGroundedResponse(query, corpus);

  console.log(`\n[MODEL]: ${response.model}`);
  if (response.reasoning) {
    console.log(`\n--- [CHAIN-OF-THOUGHT / REASONING] ---`);
    console.log(response.reasoning.trim());
  }

  console.log(`\n--- [EXECUTIVE SCIENTIFIC SYNTHESIS] ---`);
  console.log(response.answer.trim());

  if (response.citations && response.citations.length > 0) {
    console.log(`\n--- [VERIFIED CITATIONS (${response.citations.length})] ---`);
    for (const c of response.citations) {
      console.log(`• [${c.claimId}] ${c.investigation} (p.${c.pageNumber}): "${c.quote.slice(0, 100)}..."`);
    }
  }

  if (response.toolCalls && response.toolCalls.length > 0) {
    console.log(`\n--- [DISPATCHED AGENTIC TOOLS (${response.toolCalls.length})] ---`);
    for (const call of response.toolCalls) {
      console.log(`⚙️ Tool: ${call.name}`);
      console.log(`   Args: ${JSON.stringify(call.args, null, 2)}`);
    }
  }

  if (response.boundaryWarnings && response.boundaryWarnings.length > 0) {
    console.log(`\n⚠️ Boundary Warnings:`, response.boundaryWarnings);
  }
}

async function main() {
  console.log(`IGNIS Agentic AI Research Intelligence Officer Test Suite`);
  console.log(`Total Indexed Flight Investigations: ${corpus.length}`);

  // Test 1: Hypothesis Tree Generation for Artemis Lunar conditions
  await runTest(
    "1. Autonomous Hypothesis Tree Generation (Whiteboard Dispatch)",
    "Formulate an Artemis Lunar (0.16g / 56kPa) hypothesis tree for PMMA flammability and upward flame spread"
  );

  // Test 2: Physics Combustion Simulation Dispatch
  await runTest(
    "2. Physics Combustion Simulation Dispatch",
    "Simulate droplet extinction and cool flames for Heptane in microgravity"
  );

  // Test 3: Optical Diagnostics & Spectroscopy
  await runTest(
    "3. Optical Flame Diagnostics Dispatch",
    "Inspect optical diagnostics and chemiluminescence filter on SoFIE plate"
  );

  // Test 4: Exploration Filter Dispatch
  await runTest(
    "4. Research Corpus Explorer Filter Dispatch",
    "Filter explorer to show Lunar 0.16g studies on PMMA fabric"
  );
}

main().catch(console.error);
