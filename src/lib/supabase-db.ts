import { getSupabaseAdmin, isSupabaseConfigured } from "./supabase";
import { StagedCandidateRecord, ReviewStatus, getStagingQueue, reviewCandidate, stageNewDocument } from "./ingestion";
import { ExperimentRecord } from "../types/evidence";

export interface StagedCandidateRow {
  staged_id: string;
  document_title: string;
  filename: string;
  extracted_at: string;
  candidate_programme: string;
  candidate_platform: string;
  candidate_material: string;
  candidate_oxygen_pct: number;
  candidate_airflow_cm_s: number;
  candidate_pressure_kpa: number;
  extracted_finding: string;
  extracted_quote: string;
  page_number: number;
  source_locator: string;
  doi?: string | null;
  review_status: string;
  reviewer_name?: string | null;
  review_decision_date?: string | null;
  reviewer_notes?: string | null;
  extracted_bounding_boxes?: any;
  extracted_tables?: any;
}

export function candidateToRow(candidate: StagedCandidateRecord): StagedCandidateRow {
  return {
    staged_id: candidate.stagedId,
    document_title: candidate.documentTitle,
    filename: candidate.filename,
    extracted_at: candidate.extractedAt,
    candidate_programme: candidate.candidateProgramme,
    candidate_platform: candidate.candidatePlatform,
    candidate_material: candidate.candidateMaterial,
    candidate_oxygen_pct: candidate.candidateOxygenPct,
    candidate_airflow_cm_s: candidate.candidateAirflowCmS,
    candidate_pressure_kpa: candidate.candidatePressureKpa,
    extracted_finding: candidate.extractedFinding,
    extracted_quote: candidate.extractedQuote,
    page_number: candidate.pageNumber,
    source_locator: candidate.sourceLocator,
    doi: candidate.doi || null,
    review_status: candidate.reviewStatus,
    reviewer_name: candidate.reviewerName || null,
    review_decision_date: candidate.reviewDecisionDate || null,
    reviewer_notes: candidate.reviewerNotes || null,
    extracted_bounding_boxes: candidate.extractedBoundingBoxes || null,
    extracted_tables: candidate.extractedTables || null,
  };
}

export function rowToCandidate(row: StagedCandidateRow): StagedCandidateRecord {
  return {
    stagedId: row.staged_id,
    documentTitle: row.document_title,
    filename: row.filename,
    extractedAt: row.extracted_at,
    candidateProgramme: row.candidate_programme,
    candidatePlatform: row.candidate_platform,
    candidateMaterial: row.candidate_material,
    candidateOxygenPct: Number(row.candidate_oxygen_pct),
    candidateAirflowCmS: Number(row.candidate_airflow_cm_s),
    candidatePressureKpa: Number(row.candidate_pressure_kpa),
    extractedFinding: row.extracted_finding,
    extractedQuote: row.extracted_quote,
    pageNumber: row.page_number,
    sourceLocator: row.source_locator,
    doi: row.doi || undefined,
    reviewStatus: row.review_status as ReviewStatus,
    reviewerName: row.reviewer_name || undefined,
    reviewDecisionDate: row.review_decision_date || undefined,
    reviewerNotes: row.reviewer_notes || undefined,
    extractedBoundingBoxes: row.extracted_bounding_boxes || undefined,
    extractedTables: row.extracted_tables || undefined,
  };
}

/**
 * Loads all candidate records from Supabase if configured, otherwise returns local memory store.
 */
export async function fetchStagedCandidatesFromDb(): Promise<StagedCandidateRecord[]> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return getStagingQueue();
  }

  try {
    const { data, error } = await supabase
      .from("staged_candidates")
      .select("*")
      .order("extracted_at", { ascending: false });

    if (error || !data) {
      console.warn("Supabase query error, falling back to local staging store:", error?.message);
      return getStagingQueue();
    }

    if (data.length === 0) {
      // Seed default initial candidates if table is freshly created
      const initial = getStagingQueue();
      for (const item of initial) {
        await supabase.from("staged_candidates").upsert(candidateToRow(item));
      }
      return initial;
    }

    return data.map((row) => rowToCandidate(row as StagedCandidateRow));
  } catch (err: any) {
    console.warn("Error communicating with Supabase database:", err?.message);
    return getStagingQueue();
  }
}

/**
 * Persists a new staged candidate into Supabase and updates in-memory queue.
 */
export async function saveStagedCandidateToDb(
  candidate: StagedCandidateRecord
): Promise<StagedCandidateRecord> {
  const staged = stageNewDocument(candidate);
  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const row = candidateToRow(staged);
      const { error } = await supabase.from("staged_candidates").upsert(row);
      if (error) {
        console.warn("Failed to persist staged candidate to Supabase:", error.message);
      }
    } catch (err: any) {
      console.warn("Supabase upsert error:", err?.message);
    }
  }
  return staged;
}

/**
 * Updates candidate review decision (APPROVED/REJECTED) in Supabase and memory.
 */
export async function updateCandidateReviewInDb(
  stagedId: string,
  decision: ReviewStatus,
  reviewerName: string,
  notes?: string
): Promise<StagedCandidateRecord | null> {
  let updated: StagedCandidateRecord;
  try {
    updated = reviewCandidate(stagedId, decision, reviewerName, notes);
  } catch (err) {
    return null;
  }
  const supabase = getSupabaseAdmin();

  if (supabase && updated) {
    try {
      const { error } = await supabase
        .from("staged_candidates")
        .update({
          review_status: decision,
          reviewer_name: reviewerName,
          review_decision_date: updated.reviewDecisionDate || new Date().toISOString(),
          reviewer_notes: notes || null,
        })
        .eq("staged_id", stagedId);

      if (error) {
        console.warn("Failed to update candidate in Supabase:", error.message);
      }
    } catch (err: any) {
      console.warn("Supabase update error:", err?.message);
    }
  }

  return updated;
}

/**
 * Persists an approved candidate record into the active flight corpus database.
 */
export async function savePromotedRecordToDb(record: ExperimentRecord): Promise<void> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return;

  try {
    const { error } = await supabase.from("corpus_experiments").upsert({
      id: record.id,
      programme: record.programme,
      investigation: record.investigation,
      material: record.material,
      material_class: record.material_class,
      oxygen_pct: record.oxygen_pct,
      pressure_kpa: record.pressure_kpa,
      airflow_cm_s: record.airflow_cm_s,
      gravity: record.gravity,
      platform: record.platform,
      finding: record.finding,
      fire_safety_relevance: record.fire_safety_relevance,
      source_url: record.source_url,
      doi: record.doi || null,
      metadata: record,
      promoted_at: new Date().toISOString(),
    });

    if (error) {
      console.warn("Failed to save promoted record to Supabase corpus:", error.message);
    }
  } catch (err: any) {
    console.warn("Supabase promotion error:", err?.message);
  }
}
