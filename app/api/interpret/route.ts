import { NextRequest, NextResponse } from "next/server";
import { generateGroundedInterpretation } from "@/lib/synthesis";
import { RankedEvidence, SearchQuery } from "@/types/evidence";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const query: SearchQuery = body.query || {};
    const topRanked: RankedEvidence[] = body.topRanked || [];

    const apiKey = process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY;
    const interpretation = await generateGroundedInterpretation(query, topRanked, apiKey);

    return NextResponse.json(interpretation);
  } catch (error: any) {
    console.error("Interpret route error:", error);
    return NextResponse.json(
      { error: "Failed to generate interpretation", details: error.message },
      { status: 500 }
    );
  }
}
