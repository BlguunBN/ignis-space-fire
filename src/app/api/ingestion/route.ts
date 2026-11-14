import { NextRequest, NextResponse } from "next/server";
import {
  getStagingQueue,
  stageNewDocument,
  reviewCandidate,
  promoteCandidateToCorpus,
} from "../../../lib/ingestion";

export async function GET() {
  const queue = getStagingQueue();
  return NextResponse.json({ queue, total: queue.length });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const staged = stageNewDocument(body);
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

    const updated = reviewCandidate(stagedId, decision, reviewerName, notes);

    let promotedRecord = null;
    if (decision === "APPROVED_FOR_CORPUS") {
      promotedRecord = promoteCandidateToCorpus(updated);
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
