import { NextRequest, NextResponse } from "next/server";
import { fetchAndExtractPaperFromUrl, parseUploadedDocument, ScrapedPaperContent } from "../../../../lib/paper-scraper";
import { auditScientificDocument, GatekeeperAuditReport } from "../../../../lib/scientific-gatekeeper";
import { stageNewDocument, StagedCandidateRecord } from "../../../../lib/ingestion";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export interface ScrapeIngestRequestBody {
  url?: string;
  fileText?: string;
  filename?: string;
  title?: string;
}

export interface ScrapeIngestResponse {
  success: boolean;
  verdict: "STAGED_FOR_REVIEW" | "REJECTED_UNVERIFIED" | "REJECTED_SECURITY_THREAT";
  audit: GatekeeperAuditReport;
  scrapedContent?: Partial<ScrapedPaperContent>;
  stagedRecord?: StagedCandidateRecord;
  error?: string;
}

export async function POST(req: NextRequest) {
  const { authenticateResearcher } = await import("../../../../lib/auth-server");
  const user = await authenticateResearcher(req);
  if (!user) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  try {
    const body: ScrapeIngestRequestBody = await req.json();

    if (!body.url && !body.fileText) {
      return NextResponse.json(
        { error: "Must provide either a paper URL ('url') or document text ('fileText')." },
        { status: 400 }
      );
    }

    let scraped: ScrapedPaperContent;

    if (body.url) {
      scraped = await fetchAndExtractPaperFromUrl(body.url);
    } else {
      scraped = parseUploadedDocument(body.filename || "uploaded-research-data.txt", body.fileText || "");
      if (body.title) {
        scraped.title = body.title;
      }
    }

    // Run Layer 1 & 2 Harsh Scientific Gatekeeper and Prompt Injection Firewall
    const audit = auditScientificDocument(scraped.rawText, {
      title: scraped.title,
      filename: scraped.filename,
      sourceUrl: scraped.url,
    });

    // Handle Threat Reject
    if (audit.verdict === "REJECTED_SECURITY_THREAT") {
      return NextResponse.json(
        {
          success: false,
          verdict: audit.verdict,
          audit,
          scrapedContent: {
            title: scraped.title,
            filename: scraped.filename,
            url: scraped.url,
          },
          error: "Document rejected by Adversarial Prompt Injection Firewall.",
        },
        { status: 422 }
      );
    }

    // Handle Unverified Reject
    if (audit.verdict === "REJECTED_UNVERIFIED") {
      return NextResponse.json(
        {
          success: false,
          verdict: audit.verdict,
          audit,
          scrapedContent: {
            title: scraped.title,
            filename: scraped.filename,
            url: scraped.url,
          },
          error: "Document rejected due to insufficient empirical rigor or failed admission gates.",
        },
        { status: 422 }
      );
    }

    // Staging Approval: Add to staging queue for human flight verification
    const stagedRecord = stageNewDocument({
      documentTitle: audit.extractedCandidate?.documentTitle || scraped.title,
      filename: audit.extractedCandidate?.filename || scraped.filename,
      candidateProgramme: audit.extractedCandidate?.candidateProgramme || "Candidate Programme",
      candidatePlatform: audit.extractedCandidate?.candidatePlatform || "Microgravity Platform",
      candidateMaterial: audit.extractedCandidate?.candidateMaterial || "Tested Specimen",
      candidateOxygenPct: audit.extractedCandidate?.candidateOxygenPct ?? 21,
      candidateAirflowCmS: audit.extractedCandidate?.candidateAirflowCmS ?? 0,
      candidatePressureKpa: audit.extractedCandidate?.candidatePressureKpa ?? 101.3,
      extractedFinding:
        audit.extractedCandidate?.extractedFinding ||
        `Empirical data extracted by FLARE Gatekeeper (${scraped.rawText.slice(0, 160).trim()}...).`,
      extractedQuote: audit.extractedCandidate?.extractedQuote || scraped.rawText.slice(0, 120).trim(),
      pageNumber: audit.extractedCandidate?.pageNumber || 1,
      sourceLocator: audit.extractedCandidate?.sourceLocator || scraped.url || "Local Upload Queue",
      doi: audit.extractedCandidate?.doi || scraped.extractedMetadata.doi,
    });

    const { getSupabaseAdmin } = await import("../../../../lib/supabase");
    const { candidateToRow } = await import("../../../../lib/supabase-db");
    const admin = getSupabaseAdmin();
    if (!admin) return NextResponse.json({ error: "Research storage unavailable" }, { status: 503 });
    const { error: saveError } = await admin.from("staged_candidates").insert({ ...candidateToRow(stagedRecord), owner_id: user.id });
    if (saveError) return NextResponse.json({ error: "Could not save submission" }, { status: 503 });
    return NextResponse.json({
      success: true,
      verdict: "STAGED_FOR_REVIEW",
      audit,
      scrapedContent: {
        title: scraped.title,
        filename: scraped.filename,
        url: scraped.url,
        extractedMetadata: scraped.extractedMetadata,
      },
      stagedRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Failed to scrape and audit scientific document",
        message: err?.message || String(err),
      },
      { status: 500 }
    );
  }
}
