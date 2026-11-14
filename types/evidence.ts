export type RecordType = "experiment_run" | "investigation_summary" | "paper_finding";
export type VerificationStatus = "verified" | "needs_review" | "unsupported";

export interface ExperimentRecord {
  id: string;
  programme: string;
  investigation: string;
  record_type: RecordType;
  verification_status: VerificationStatus;
  source_type: "NASA_PSI" | "PEER_REVIEWED" | "NTRS";
  psi_id?: string | null;
  doi?: string;
  source_locator?: string; // Exact page, table, or section reference in primary source
  gravity: "microgravity" | "partial_gravity" | "terrestrial";
  platform: string;
  material: string;
  material_class: string;
  oxygen_pct: number | null; // Nullable if not reported in primary record
  pressure_kpa?: number | null; // Nullable if not reported
  airflow_cm_s: number | null; // Nullable if not reported
  measurements: string[];
  finding: string;
  fire_safety_relevance: string;
  limitations: string[];
  source_url: string;
  quality: "primary_nasa" | "peer_reviewed_nasa" | "supporting";
  verified_by?: string;
}

export interface SearchQuery {
  material?: string;
  oxygenPct?: number | null;
  pressureKpa?: number | null;
  airflowCmS?: number | null;
  phenomenon?: string;
  programme?: string;
  missionContext?: string;
  freeText?: string;
}

export interface ScoreBreakdown {
  materialScore: number;
  atmosphereScore: number;
  airflowScore: number;
  phenomenonScore: number;
  platformScore: number;
  completenessScore: number;
  missingParameters: string[];
  reasons: string[];
  limitationsWarning: string;
}

export interface RankedEvidence {
  experiment: ExperimentRecord;
  score: number; // 0 - 100
  confidenceLevel: "HIGH" | "MODERATE" | "LOW" | "SPARSE";
  breakdown: ScoreBreakdown;
}

export interface CoverageCell {
  materialClass: string;
  atmosphereRegime: string;
  airflowRegime: string;
  count: number;
  status: "ADEQUATE" | "LIMITED" | "NO_INDEXED_EVIDENCE";
  matchingIds: string[];
  notes: string;
}
