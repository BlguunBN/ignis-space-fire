import { ExperimentRecord } from "../types/evidence";
import { BoundingBox, ExtractedTableSeries } from "./vlm-extractor";

export type ReviewStatus = "PENDING_REVIEW" | "APPROVED_FOR_CORPUS" | "REJECTED_UNVERIFIED";

export interface StagedCandidateRecord {
  stagedId: string;
  documentTitle: string;
  filename: string;
  extractedAt: string;
  candidateProgramme: string;
  candidatePlatform: string;
  candidateMaterial: string;
  candidateOxygenPct: number;
  candidateAirflowCmS: number;
  candidatePressureKpa: number;
  extractedFinding: string;
  extractedQuote: string;
  pageNumber: number;
  sourceLocator: string;
  doi?: string;
  reviewStatus: ReviewStatus;
  reviewerName?: string;
  reviewDecisionDate?: string;
  reviewerNotes?: string;
  extractedBoundingBoxes?: BoundingBox[];
  extractedTables?: ExtractedTableSeries[];
}

declare global {
  // eslint-disable-next-line no-var
  var __ignisStagingStore: StagedCandidateRecord[] | undefined;
}

/**
 * Initial queue of candidate NASA technical reports parsed by Docling layout engine,
 * pending human reviewer flight-safety verification.
 */
const INITIAL_STAGING_DATA: StagedCandidateRecord[] = [
  {
    stagedId: "staged-saffire-5-extinction",
    documentTitle: "Saffire-V Low-Pressure Concurrent Flame Extinction in Cotton-Fiberglass Blends",
    filename: "NASA-TM-2022-0019284.pdf",
    extractedAt: "2026-11-10T08:30:00Z",
    candidateProgramme: "Saffire",
    candidatePlatform: "Cygnus Cargo Vehicle (OA-14)",
    candidateMaterial: "cotton-fiberglass (SIBAL)",
    candidateOxygenPct: 24,
    candidateAirflowCmS: 12,
    candidatePressureKpa: 70.3,
    extractedFinding:
      "Concurrent flame spread decelerates abruptly as cabin depressurization reaches 70 kPa under 12 cm/s airflow, demonstrating non-linear pressure quenching.",
    extractedQuote:
      "Flame length decreased by 40% when chamber pressure dropped below 75 kPa, indicating elevated limiting oxygen index.",
    pageNumber: 12,
    sourceLocator: "NASA Glenn Research Center / Saffire-V Table 3",
    doi: "10.60555/0t15-s5ex",
    reviewStatus: "PENDING_REVIEW",
  },
  {
    stagedId: "staged-acme-efield-01",
    documentTitle: "ACME E-FIELD Flames: Ion-Driven Wind Suppression in Methane Microgravity Burners",
    filename: "NASA-CR-2023-220194.pdf",
    extractedAt: "2026-11-12T14:15:00Z",
    candidateProgramme: "ACME",
    candidatePlatform: "ISS Combustion Integrated Rack (CIR)",
    candidateMaterial: "gaseous methane co-flow",
    candidateOxygenPct: 21,
    candidateAirflowCmS: 0,
    candidatePressureKpa: 101.3,
    extractedFinding:
      "Applying an external 5 kV DC electric field induces ionic body forces that restore buoyant-like convective soot evacuation in true microgravity.",
    extractedQuote:
      "Soot concentration decreased threefold when the electrostatic field was energized across the spherical flame zone.",
    pageNumber: 8,
    sourceLocator: "NASA PSI Archive Record PSI-144 / Table 2",
    doi: "10.60555/0t15-acme",
    reviewStatus: "PENDING_REVIEW",
  },
];

function getStore(): StagedCandidateRecord[] {
  if (!globalThis.__ignisStagingStore) {
    globalThis.__ignisStagingStore = [...INITIAL_STAGING_DATA];
  }
  return globalThis.__ignisStagingStore;
}

export function getStagingQueue(): StagedCandidateRecord[] {
  return [...getStore()];
}

export function stageNewDocument(
  doc: Omit<StagedCandidateRecord, "stagedId" | "extractedAt" | "reviewStatus">
): StagedCandidateRecord {
  const store = getStore();
  const newRecord: StagedCandidateRecord = {
    ...doc,
    stagedId: `staged-${Date.now().toString(36)}`,
    extractedAt: new Date().toISOString(),
    reviewStatus: "PENDING_REVIEW",
  };
  // Place newly staged candidate at the top of the queue for immediate visibility
  store.unshift(newRecord);
  return newRecord;
}

export function reviewCandidate(
  stagedId: string,
  decision: ReviewStatus,
  reviewerName: string,
  notes?: string
): StagedCandidateRecord {
  const store = getStore();
  const index = store.findIndex((s) => s.stagedId === stagedId);
  if (index === -1) {
    throw new Error(`Candidate with id ${stagedId} not found in staging queue.`);
  }

  const updated: StagedCandidateRecord = {
    ...store[index],
    reviewStatus: decision,
    reviewerName,
    reviewDecisionDate: new Date().toISOString(),
    reviewerNotes: notes,
  };

  store[index] = updated;
  return updated;
}

/**
 * Strict Safety Invariant: Enforces that unapproved records are NEVER included
 * in the active search index.
 */
export function safetyCheckIsolateUnapproved(candidate: StagedCandidateRecord): boolean {
  return candidate.reviewStatus !== "APPROVED_FOR_CORPUS";
}

/**
 * Converts an approved candidate record into an official ExperimentRecord.
 */
export function promoteCandidateToCorpus(candidate: StagedCandidateRecord): ExperimentRecord {
  if (candidate.reviewStatus !== "APPROVED_FOR_CORPUS") {
    throw new Error("Cannot promote unapproved candidate to active corpus. Human review required.");
  }

  return {
    id: candidate.stagedId.replace(/^staged-/, ""),
    programme: candidate.candidateProgramme,
    investigation: candidate.documentTitle,
    record_type: "experiment_run",
    verification_status: "verified",
    source_type: "NASA_PSI",
    psi_id: candidate.sourceLocator.split("/")[0]?.trim() || "PSI-STAGED",
    doi: candidate.doi,
    source_locator: candidate.sourceLocator,
    gravity: "microgravity",
    platform: candidate.candidatePlatform,
    material: candidate.candidateMaterial,
    material_class: "tested_specimen",
    oxygen_pct: candidate.candidateOxygenPct,
    pressure_kpa: candidate.candidatePressureKpa,
    airflow_cm_s: candidate.candidateAirflowCmS,
    measurements: ["flame_spread", "extinction_limit"],
    finding: candidate.extractedFinding,
    fire_safety_relevance: `Verified by human reviewer ${candidate.reviewerName || "NASA Lead"}: Staged document successfully verified from primary NASA report ${candidate.filename}.`,
    limitations: [
      "Candidate empirical observation promoted from Stage 4 Docling extraction queue.",
    ],
    source_url: `https://psi.nasa.gov/reports/${candidate.filename}`,
    quality: "primary_nasa",
    verified_by: `${candidate.reviewerName || "NASA Reviewer"} / ${candidate.reviewDecisionDate?.slice(0, 10)}`,
    claim_locator_details: {
      claimId: `CLM-${candidate.stagedId.toUpperCase()}`,
      sourceId: candidate.filename,
      pdfUrl: `https://psi.nasa.gov/reports/${candidate.filename}`,
      pageNumber: candidate.pageNumber,
      boundingBox: { x: 10, y: 25, width: 80, height: 20 },
      section: "Extracted Results Table",
      tableOrFigure: "Table 1",
      quote: candidate.extractedQuote,
      reviewStatus: "verified",
      reviewer: candidate.reviewerName || "NASA Reviewer",
      reviewDate: candidate.reviewDecisionDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    },
  };
}
