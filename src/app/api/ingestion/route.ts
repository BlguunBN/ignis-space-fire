import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { authenticateResearcher, isReviewer } from "../../../lib/auth-server";
import { getSupabaseAdmin } from "../../../lib/supabase";
import { candidateToRow, rowToCandidate } from "../../../lib/supabase-db";
import { promoteCandidateToCorpus, stageNewDocument } from "../../../lib/ingestion";

export const dynamic = "force-dynamic";

const candidateSchema = z.object({
  documentTitle: z.string().min(1).max(500), filename: z.string().min(1).max(500),
  candidateProgramme: z.string().min(1).max(200), candidatePlatform: z.string().min(1).max(200),
  candidateMaterial: z.string().min(1).max(200), candidateOxygenPct: z.number().min(0).max(100),
  candidateAirflowCmS: z.number().min(0).max(100000), candidatePressureKpa: z.number().positive().max(100000),
  extractedFinding: z.string().min(1).max(10000), extractedQuote: z.string().min(1).max(10000),
  pageNumber: z.number().int().positive(), sourceLocator: z.string().min(1).max(2000), doi: z.string().max(500).optional(),
});

export async function GET(req?: NextRequest) {
  if (!req) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const user = await authenticateResearcher(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Research storage unavailable" }, { status: 503 });
  const reviewer = await isReviewer(user.id);
  let query = admin.from("staged_candidates").select("*").order("extracted_at", { ascending: false });
  if (!reviewer) query = query.eq("owner_id", user.id);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Could not load submissions" }, { status: 503 });
  const queue = data.map(rowToCandidate);
  return NextResponse.json({ queue, total: queue.length, reviewer });
}

export async function POST(req: NextRequest) {
  const user = await authenticateResearcher(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Research storage unavailable" }, { status: 503 });
  const body = candidateSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  const staged = stageNewDocument(body.data);
  const { error } = await admin.from("staged_candidates").insert({ ...candidateToRow(staged), owner_id: user.id });
  if (error) return NextResponse.json({ error: "Could not save submission" }, { status: 503 });
  return NextResponse.json({ success: true, staged }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const user = await authenticateResearcher(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (!await isReviewer(user.id)) return NextResponse.json({ error: "Reviewer access required" }, { status: 403 });
  const admin = getSupabaseAdmin();
  if (!admin) return NextResponse.json({ error: "Research storage unavailable" }, { status: 503 });
  const schema = z.object({ stagedId: z.string().min(1).max(200), decision: z.enum(["APPROVED_FOR_CORPUS", "REJECTED_UNVERIFIED"]), notes: z.string().max(5000).optional() });
  const body = schema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "Invalid review" }, { status: 400 });
  const { data: row, error } = await admin.from("staged_candidates").select("*").eq("staged_id", body.data.stagedId).maybeSingle();
  if (error || !row) return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  const reviewed = { ...rowToCandidate(row), reviewStatus: body.data.decision, reviewerName: user.email || user.id, reviewDecisionDate: new Date().toISOString(), reviewerNotes: body.data.notes };
  const promotedRecord = body.data.decision === "APPROVED_FOR_CORPUS" ? promoteCandidateToCorpus(reviewed) : null;
  const { error: updateError } = await admin.rpc("review_research_submission", { p_staged_id: reviewed.stagedId, p_decision: reviewed.reviewStatus, p_reviewer: reviewed.reviewerName, p_notes: reviewed.reviewerNotes || null, p_record: promotedRecord });
  if (updateError) return NextResponse.json({ error: "Could not save review" }, { status: 503 });
  return NextResponse.json({ success: true, updated: reviewed, promotedRecord });
}
