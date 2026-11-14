import { NextRequest, NextResponse } from "next/server";
import { generateGroundedInterpretation } from "@/lib/synthesis";
import { assessQuerySupport, rankEvidence } from "@/lib/ranking";
import { isEligibleEvidence, sourceReviewedRecords } from "@/lib/sourceReviewedRecords";
import type { ExperimentRecord, SearchQuery } from "@/types/evidence";
import experiments from "@/data/experiments.json";

const records = sourceReviewedRecords(experiments as ExperimentRecord[]);

function parseInterpretationRequest(body: unknown): { query: SearchQuery; experimentIds: string[] } | null {
  if (!body || typeof body !== "object" || Array.isArray(body)) return null;
  const input = body as Record<string, unknown>;
  if (!input.query || typeof input.query !== "object" || Array.isArray(input.query) || !Array.isArray(input.experimentIds)) return null;
  if (input.experimentIds.length > 3 || input.experimentIds.some(id => typeof id !== "string") || new Set(input.experimentIds).size !== input.experimentIds.length) return null;
  const query = input.query as Record<string, unknown>;
  const allowed = ["material", "oxygenPct", "pressureKpa", "airflowCmS", "phenomenon", "programme", "missionContext", "freeText"];
  if (Object.keys(query).some(key => !allowed.includes(key))) return null;
  for (const key of ["material", "phenomenon", "programme", "missionContext", "freeText"]) {
    const value = query[key];
    if (value != null && (typeof value !== "string" || value.length > (key === "freeText" ? 1000 : 120))) return null;
  }
  for (const key of ["oxygenPct", "pressureKpa", "airflowCmS"]) {
    const value = query[key];
    if (value != null && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || (key === "oxygenPct" && value > 100) || (key === "pressureKpa" && value === 0))) return null;
  }
  if (query.programme && !records.some(e => isEligibleEvidence(e) && e.programme.toLowerCase() === String(query.programme).toLowerCase())) return null;
  const ids = input.experimentIds as string[];
  if (ids.some(id => !records.some(e => e.id === id && isEligibleEvidence(e)))) return null;
  return { query: query as SearchQuery, experimentIds: ids };
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > 12000) return NextResponse.json({ error: "Request is too large" }, { status: 413 });
    let body: unknown;
    try { body = JSON.parse(raw); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
    const input = parseInterpretationRequest(body);
    if (!input) return NextResponse.json({ error: "Invalid inquiry or evidence selection" }, { status: 400 });
    const candidates = records.filter(e => input.experimentIds.includes(e.id));
    const ranked = rankEvidence(candidates, input.query);
    if (ranked.length !== candidates.length || (candidates.length && assessQuerySupport(input.query, ranked).kind === "no_relevant_evidence")) {
      return NextResponse.json({ error: "Selected evidence does not match the inquiry" }, { status: 400 });
    }
    const result = await generateGroundedInterpretation(input.query, ranked, process.env.NVIDIA_API_KEY);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Could not generate an interpretation" }, { status: 500 });
  }
}
