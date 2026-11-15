import { NextRequest, NextResponse } from "next/server";
import {
  fetchStagedCandidatesFromDb,
  saveStagedCandidateToDb,
  updateCandidateReviewInDb,
  savePromotedRecordToDb,
} from "../../../lib/supabase-db";
import { promoteCandidateToCorpus } from "../../../lib/ingestion";

export const dynamic = "force-dynamic";

export async function GET() {
  const queue = await fetchStagedCandidatesFromDb();
  return NextResponse.json({ queue, total: queue.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const staged = await saveStagedCandidateToDb(body);
    return NextResponse.json({ success: true, staged }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Failed to stage document", message: err?.message || String(err) },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { stagedId, decision, reviewerName, notes } = body;

    if (!stagedId || !decision || !reviewerName) {
      return NextResponse.json(
        { error: "Missing required fields: stagedId, decision, reviewerName" },
        { status: 400 }
      );
    }

    const updated = await updateCandidateReviewInDb(stagedId, decision, reviewerName, notes);
    if (!updated) {
      return NextResponse.json(
        { error: `Candidate record '${stagedId}' not found.` },
        { status: 404 }
      );
    }

    let promotedRecord = null;
    if (decision === "APPROVED_FOR_CORPUS") {
      promotedRecord = promoteCandidateToCorpus(updated);
      await savePromotedRecordToDb(promotedRecord);
    }

    return NextResponse.json({
      success: true,
      updated,
      promotedRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "Review update failed", message: err?.message || String(err) },
      { status: 500 }
    );
  }
}
