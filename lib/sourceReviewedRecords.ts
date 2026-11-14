import { ExperimentRecord } from "@/types/evidence";

// Preserve the raw index while excluding GEL values not supported by its cited NASA overview.
export function sourceReviewedRecords(records: ExperimentRecord[]): ExperimentRecord[] {
  const correctedDois: Record<string, string | undefined> = {
    "saffire-2": "10.60555/2chp-m469",
    "same-r-smoke": "10.60555/2np7-jv14",
    "spice-soot": "10.60555/9kbh-e962",
    "saffire-4": undefined,
    "bass-2-cylinders": undefined,
  };
  return records.map(record => record.id !== "sofie-gel" ? (
    Object.prototype.hasOwnProperty.call(correctedDois, record.id)
      ? { ...record, doi: correctedDois[record.id] }
      : record
  ) : {
    ...record,
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
  });
}
