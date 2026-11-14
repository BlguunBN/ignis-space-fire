import { NextRequest, NextResponse } from "next/server";
import experimentsData from "../../../data/experiments.json";
import { ExperimentRecord } from "../../../types/evidence";
import {
  validateCitations,
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

    // Verify citations against authentic corpus
    const citationCheck = validateCitations(nemotronResponse.citations, corpus);
    if (!citationCheck.valid) {
      // Filter out invalid claims to maintain strict hallucination safety
      nemotronResponse.citations = nemotronResponse.citations.filter(
        (c) => !citationCheck.invalidClaims.includes(c.claimId)
      );
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
