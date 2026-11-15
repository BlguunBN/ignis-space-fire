import { NextRequest, NextResponse } from "next/server";
import experimentsData from "../../../data/experiments.json";
import { ExperimentRecord } from "../../../types/evidence";
import {
  validateCitations,
  isConversationalGreeting,
  GroundedAssistantResponseSchema,
} from "../../../lib/grounded-assistant";
import { generateNemotronGroundedResponse } from "../../../lib/nvidia-nemotron";

const corpus = experimentsData as ExperimentRecord[];

// Configure Vercel Serverless Function execution limits
export const maxDuration = 60; // Up to 60s for deep scientific reasoning stream
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, selectedRecordIds } = body;

    const latestMessage =
      Array.isArray(messages) && messages.length > 0
        ? messages[messages.length - 1].content
        : "Compare Saffire vs BASS flame spread under forced airflow";

    // Use selected records subset if provided, otherwise entire corpus
    let targetCorpus = corpus;
    if (Array.isArray(selectedRecordIds) && selectedRecordIds.length > 0) {
      const idSet = new Set(selectedRecordIds);
      const filtered = corpus.filter((r) => idSet.has(r.id));
      if (filtered.length > 0) {
        targetCorpus = filtered;
      }
    }

    // Call NVIDIA Nemotron-3.5-Lightning-30B with deep reasoning and NASA PSI grounding
    const nemotronResponse = await generateNemotronGroundedResponse(
      latestMessage,
      targetCorpus
    );

    // Validate schema
    const parsed = GroundedAssistantResponseSchema.safeParse(nemotronResponse);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Grounded schema validation failed", details: parsed.error.issues },
        { status: 500 }
      );
    }

    // Validate the claim-to-record-to-page mapping before returning the answer.
    // Silently dropping a bad citation while retaining the claim text would
    // make unsupported scientific statements appear source-backed.
    const citationCheck = validateCitations(nemotronResponse.citations, targetCorpus);
    if (!citationCheck.valid) {
      return NextResponse.json({
        ...nemotronResponse,
        answer: "I could not verify the source citation for this result against the indexed research. Please inspect the primary document or narrow the research question.",
        citations: [],
        isAbstention: true,
        abstentionReason: "One or more claim, record and page references did not match the indexed corpus.",
        scientificLimitations: [
          ...nemotronResponse.scientificLimitations,
          "Source verification is incomplete; no safety conclusion should be drawn from this answer.",
        ],
        toolCalls: [],
      });
    }

    // An uncited scientific response is not evidence-grounded, even if its
    // schema is well-formed. Greetings and already-abstained answers are exempt.
    if (!nemotronResponse.isAbstention &&
        !isConversationalGreeting(latestMessage) &&
        nemotronResponse.citations.length === 0) {
      return NextResponse.json({
        ...nemotronResponse,
        answer: "I could not find an indexed source that directly supports an answer to this research question. Please refine the query or inspect the original NASA reports.",
        isAbstention: true,
        abstentionReason: "No supporting record-level scientific citation was identified.",
        toolCalls: [],
      });
    }

    return NextResponse.json(nemotronResponse);
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Internal server error in grounded chat runtime",
        message: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
