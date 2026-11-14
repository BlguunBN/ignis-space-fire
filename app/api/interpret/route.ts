import { sourceReviewedRecords } from "@/lib/sourceReviewedRecords";
import { NextRequest, NextResponse } from "next/server";
import { generateGroundedInterpretation } from "@/lib/synthesis";
import { rankEvidence } from "@/lib/ranking";
import { ExperimentRecord, SearchQuery } from "@/types/evidence";
import trustedExperiments from "@/data/experiments.json";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: SearchQuery = body.query || {};
    const requestedIds: string[] = Array.isArray(body.experimentIds) ? body.experimentIds : [];

    // Security & Data Integrity: Always load and trust records directly from server-side JSON
    const allExperiments = sourceReviewedRecords(trustedExperiments as ExperimentRecord[]);
    
    let candidateRecords: ExperimentRecord[];
    if (requestedIds.length > 0) {
      candidateRecords = allExperiments.filter((e) => requestedIds.includes(e.id));
      if (candidateRecords.length === 0) {
        candidateRecords = allExperiments;
      }
    } else {
      candidateRecords = allExperiments;
    }

    // Rank the trusted records deterministically on the server
    const serverRanked = rankEvidence(candidateRecords, query);
    const topRanked = serverRanked.slice(0, 3);

    const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;
    const interpretation = await generateGroundedInterpretation(query, topRanked, apiKey);

    return NextResponse.json(interpretation);
  } catch (error: any) {
    console.error("Server API Interpret Error:", error);
    return NextResponse.json(
      { error: "Failed to generate interpretation", details: error.message },
      { status: 500 }
    );
  }
}
