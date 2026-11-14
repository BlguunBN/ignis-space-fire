import { ExperimentRecord } from "@/types/evidence";

export const CORPUS_VERSION = "2026.11.15-reviewed-1";

const doiCorrections: Record<string, string | undefined> = {
  "saffire-2": "10.60555/2chp-m469",
  "same-r-smoke": "10.60555/2np7-jv14",
  "spice-soot": "10.60555/9kbh-e962",
  "saffire-4": undefined,
  "bass-2-cylinders": undefined,
};

const reviewed: Record<string, Partial<ExperimentRecord>> = {
  "saffire-1": {
    record_type: "investigation_summary",
    verification_status: "verified",
    source_locator: "NASA PSI-98, Approach; Urban et al. 2019, abstract",
    oxygen_pct: null,
    pressure_kpa: null,
    airflow_cm_s: 20,
    finding: "Saffire-I burned a cotton-fiberglass fabric in a Cygnus flow duct at 20 cm/s. The Saffire studies reported a steady downstream flame spread over thin fabric in microgravity.",
    fire_safety_relevance: "The investigation provides large-scale flight evidence for studying flame spread in forced flow.",
    limitations: ["The indexed source does not establish the oxygen and pressure values for this summary.", "Microgravity observations do not predict lunar or Martian flame spread."],
    verified_by: "IGNIS source review, 2026-11-14",
  },
  "saffire-2": {
    record_type: "investigation_summary",
    verification_status: "verified",
    source_locator: "NASA PSI-99, Approach",
    oxygen_pct: null,
    pressure_kpa: null,
    airflow_cm_s: null,
    finding: "Saffire-II investigated nine smaller samples including SIBAL, silicone, PMMA and PMMA with Nomex. NASA describes 20 or 30 cm/s airflow depending on the sample.",
    fire_safety_relevance: "The investigation provides flight-test context for comparing materials and sample configurations.",
    limitations: ["Conditions vary by sample; this overview does not identify a single run.", "The indexed source does not establish a single oxygen or pressure value for this summary.", "Microgravity observations do not predict lunar or Martian flame spread."],
    verified_by: "IGNIS source review, 2026-11-14",
  },
  "bass-2-pmma": {
    investigation: "BASS-II: Burning and Suppression of Solids",
    record_type: "investigation_summary",
    verification_status: "verified",
    source_type: "NASA_PSI",
    psi_id: "PSI-25",
    doi: "10.60555/4qc4-de67",
    source_locator: "NASA PSI-25, Objectives and Approach",
    source_url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-25",
    material: "Solid fuels, including PMMA",
    oxygen_pct: null,
    pressure_kpa: null,
    airflow_cm_s: null,
    measurements: ["flame_spread", "flame_growth", "extinction"],
    finding: "BASS-II investigated ignition, flame growth, spread and extinction of solid fuels in low-velocity forced flows in microgravity.",
    fire_safety_relevance: "The investigation supports research into solid-fuel flammability and fire detection and suppression models.",
    limitations: ["This investigation summary covers multiple fuels and test conditions; it is not a single PMMA run.", "Specific oxygen, pressure and airflow values are not reported for this summary.", "Microgravity observations do not predict lunar or Martian flame spread."],
    verified_by: "IGNIS source review, 2026-11-14",
  },
};

export function sourceReviewedRecords(records: ExperimentRecord[]): ExperimentRecord[] {
  return records.map(record => {
    const corrected = Object.prototype.hasOwnProperty.call(doiCorrections, record.id)
      ? { ...record, doi: doiCorrections[record.id] }
      : record;
    if (reviewed[record.id]) return { ...corrected, ...reviewed[record.id] };
    if (record.id === "sofie-gel") return {
      ...corrected,
      verification_status: "needs_review",
      psi_id: null,
      doi: undefined,
      source_locator: "NASA Science: SoFIE-GEL experiment description",
      source_url: "https://science.nasa.gov/biological-physical/investigations/sofie-gel/",
      material: "PMMA sphere",
      oxygen_pct: null,
      pressure_kpa: null,
      airflow_cm_s: null,
      finding: "NASA describes an investigation of flame growth and extinction over a PMMA sphere under varying experimental conditions.",
      fire_safety_relevance: "NASA states that the investigation may improve understanding of early fire growth and suppression.",
      limitations: [...record.limitations, "Specific numeric conditions and results in the indexed record require source review."],
    };
    return { ...corrected, verification_status: "needs_review" };
  });
}

export function isEligibleEvidence(record: ExperimentRecord): boolean {
  if (record.verification_status !== "verified" || !record.source_locator?.trim()) return false;
  try {
    return ["http:", "https:"].includes(new URL(record.source_url).protocol);
  } catch {
    return false;
  }
}
