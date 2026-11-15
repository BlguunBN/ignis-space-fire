import { NextRequest, NextResponse } from "next/server";
import { runIngestionAgentSwarm, IngestionSwarmInput } from "../../../../lib/ingestion-swarm";
import { stageNewDocument, StagedCandidateRecord } from "../../../../lib/ingestion";
import experimentsData from "../../../../data/experiments.json";
import { ExperimentRecord } from "../../../../types/evidence";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body: IngestionSwarmInput = await req.json();

    if (!body.url && !body.fileText) {
      return NextResponse.json(
        { error: "Must provide either a paper URL ('url') or document text ('fileText')." },
        { status: 400 }
      );
    }

    const corpus = experimentsData as unknown as ExperimentRecord[];
    const report = await runIngestionAgentSwarm(body, corpus);

    let stagedRecord: StagedCandidateRecord | undefined;
    if (report.overallVerdict === "STAGED_FOR_REVIEW" && report.stagedCandidate) {
      stagedRecord = stageNewDocument(report.stagedCandidate);
    }

    const statusCode = report.overallVerdict === "STAGED_FOR_REVIEW" ? 200 : 422;

    return NextResponse.json(
      {
        success: report.overallVerdict === "STAGED_FOR_REVIEW",
        verdict: report.overallVerdict,
        report,
        stagedRecord,
      },
      { status: statusCode }
    );
  } catch (err: any) {
    console.error("Ingestion Agent Swarm failed:", err);
    return NextResponse.json(
      {
        error: "Failed to run unified ingestion agent swarm",
        message: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
