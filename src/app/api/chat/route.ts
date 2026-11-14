import { NextRequest, NextResponse } from "next/server";
import experimentsData from "../../../data/experiments.json";
import { ExperimentRecord } from "../../../types/evidence";
import {
  generateGroundedAssistantResponse,
  validateCitations,
  GroundedAssistantResponseSchema,
} from "../../../lib/grounded-assistant";

const corpus = experimentsData as ExperimentRecord[];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, selectedRecordIds } = body;

    const latestMessage = Array.isArray(messages) && messages.length > 0
      ? messages[messages.length - 1].content
      : "Saffire and BASS flame spread comparison";

    // Use selected records subset if provided, otherwise entire corpus
    let targetCorpus = corpus;
    if (Array.isArray(selectedRecordIds) && selectedRecordIds.length > 0) {
      const idSet = new Set(selectedRecordIds);
      const filtered = corpus.filter((r) => idSet.has(r.id));
      if (filtered.length > 0) {
        targetCorpus = filtered;
      }
    }

    // Generate grounded synthesis
    const groundedResponse = generateGroundedAssistantResponse(latestMessage, targetCorpus);

    // Validate schema
    const parsed = GroundedAssistantResponseSchema.safeParse(groundedResponse);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Grounded schema validation failed", details: parsed.error.issues },
        { status: 500 }
      );
    }

    // Verify citations against corpus
    const citationCheck = validateCitations(groundedResponse.citations, corpus);
    if (!citationCheck.valid) {
      return NextResponse.json(
        {
          error: "Hallucination Guard triggered: invalid claim citations detected",
          invalidClaims: citationCheck.invalidClaims,
        },
        { status: 422 }
      );
    }

    return NextResponse.json(groundedResponse);
  } catch (err: any) {
    return NextResponse.json(
      { error: "Internal server error in grounded chat runtime", message: err?.message || String(err) },
      { status: 500 }
    );
  }
}
