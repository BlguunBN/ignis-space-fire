export type RecordType = "experiment_run" | "investigation_summary" | "paper_finding";
export type VerificationStatus = "verified" | "needs_review" | "unsupported";

export interface BoundingBox {
  x: number; // percentage from left, 0-100
  y: number; // percentage from top, 0-100
  width: number; // percentage width, 0-100
  height: number; // percentage height, 0-100
}

export interface ClaimLocator {
  claimId: string;
  sourceId: string;
  pdfUrl?: string;
  pageNumber: number;
  boundingBox: BoundingBox;
  section: string;
  tableOrFigure?: string;
  quote: string;
  reviewStatus: VerificationStatus;
  reviewer: string;
  reviewDate: string;
}

export type SourceType = "NASA_PSI" | "PEER_REVIEWED" | "NTRS" | "NASA_WEB" | "AGENCY_REPORT";

export interface ExperimentRecord {
  id: string;
  programme: string;
  investigation: string;
  record_type: RecordType;
  verification_status: VerificationStatus;
  source_type: SourceType;
  psi_id?: string | null;
  doi?: string;
  source_locator?: string;
  gravity: "microgravity" | "partial_gravity" | "terrestrial";
  platform: string;
  material: string;
  material_class: string;
  oxygen_pct: number | null;
  pressure_kpa?: number | null;
  airflow_cm_s: number | null;
  measurements: string[];
  finding: string;
  fire_safety_relevance: string;
  limitations: string[];
  source_url: string;
  quality: "primary_nasa" | "peer_reviewed_nasa" | "supporting";
  verified_by?: string;
  claim_locator_details?: ClaimLocator;
}

export type SortOption =
  | "relevance"
  | "oxygen_desc"
  | "oxygen_asc"
  | "airflow_desc"
  | "airflow_asc"
  | "pressure_desc"
  | "pressure_asc"
  | "name_asc"
  | "name_desc";

export interface SearchQuery {
  material?: string;
  materialClass?: string;
  facility?: string;
  oxygenPct?: number | null;
  oxygenMin?: number | null;
  oxygenMax?: number | null;
  pressureKpa?: number | null;
  pressureMin?: number | null;
  pressureMax?: number | null;
  airflowCmS?: number | null;
  airflowMin?: number | null;
  airflowMax?: number | null;
  phenomenon?: string;
  programme?: string;
  missionContext?: string;
  freeText?: string;
  gravity?: "microgravity" | "partial_gravity" | "terrestrial";
  pillar?: "Prevention" | "Detection" | "Suppression" | "Partial-g Simulation";
  toleranceMode?: "strict" | "standard" | "wide";
  sortBy?: SortOption;
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
  score: number;
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
