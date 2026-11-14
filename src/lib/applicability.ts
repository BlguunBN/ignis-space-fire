import { ExperimentRecord, SearchQuery } from "../types/evidence";

export type ApplicabilityVerdict =
  | "EXACT_MATCH"
  | "CONDITION_VARIANCE"
  | "GENERAL_RELEVANCE"
  | "UNKNOWN_CONDITIONS"
  | "UNSUPPORTED";

export interface ApplicabilityAssessment {
  verdict: ApplicabilityVerdict;
  verdictLabel: string;
  verdictColor: "emerald" | "amber" | "slate" | "rose" | "cyan";
  reasons: string[];
  differences: string[];
  missingParameters: string[];
}

export function assessApplicability(
  record: ExperimentRecord,
  query: SearchQuery
): ApplicabilityAssessment {
  const reasons: string[] = [];
  const differences: string[] = [];
  const missingParameters: string[] = [];

  // Check if query provided any conditions
  const hasConditions =
    query.oxygenPct != null ||
    query.pressureKpa != null ||
    query.airflowCmS != null ||
    query.material != null ||
    query.gravity != null;

  if (!hasConditions) {
    return {
      verdict: "GENERAL_RELEVANCE",
      verdictLabel: "General Topic Match",
      verdictColor: "cyan",
      reasons: ["Matches query text/keyword; query did not constrain physical conditions."],
      differences: [],
      missingParameters: [],
    };
  }

  // Material check
  let materialMatches = true;
  if (query.material && query.material.trim() !== "") {
    const qMat = query.material.toLowerCase().trim();
    const rMat = record.material.toLowerCase();
    const rClass = record.material_class.toLowerCase();
    if (rMat.includes(qMat) || rClass.includes(qMat)) {
      reasons.push(`Material match: "${record.material}" matches "${query.material}"`);
    } else {
      materialMatches = false;
      differences.push(
        `Material variance: Query asked for "${query.material}", study tested "${record.material}"`
      );
    }
  }

  // Gravity check
  if (query.gravity) {
    if (record.gravity === query.gravity) {
      reasons.push(`Gravity matched: ${record.gravity}`);
    } else {
      differences.push(`Gravity variance: ${record.gravity} vs requested ${query.gravity}`);
    }
  }

  // Oxygen check
  let oxygenMatches = true;
  if (query.oxygenPct != null) {
    if (record.oxygen_pct == null) {
      missingParameters.push("Oxygen concentration unknown in record");
    } else {
      const diff = Math.abs(record.oxygen_pct - query.oxygenPct);
      if (diff <= 1.0) {
        reasons.push(`Oxygen concentration matches (±1%): ${record.oxygen_pct}%`);
      } else {
        oxygenMatches = false;
        differences.push(
          `Oxygen variance: Record tested ${record.oxygen_pct}% O₂, query specified ${query.oxygenPct}% O₂ (Δ ${diff.toFixed(1)}%)`
        );
      }
    }
  }

  // Pressure check
  let pressureMatches = true;
  if (query.pressureKpa != null) {
    if (record.pressure_kpa == null) {
      missingParameters.push("Ambient pressure unknown in record");
    } else {
      const diff = Math.abs(record.pressure_kpa - query.pressureKpa);
      if (diff <= 5.0) {
        reasons.push(`Pressure matches (±5 kPa): ${record.pressure_kpa} kPa`);
      } else {
        pressureMatches = false;
        differences.push(
          `Pressure variance: Record tested ${record.pressure_kpa} kPa, query specified ${query.pressureKpa} kPa (Δ ${diff.toFixed(1)} kPa)`
        );
      }
    }
  }

  // Airflow check
  let airflowMatches = true;
  if (query.airflowCmS != null) {
    if (record.airflow_cm_s == null) {
      missingParameters.push("Forced airflow velocity unknown in record");
    } else {
      const diff = Math.abs(record.airflow_cm_s - query.airflowCmS);
      if (diff <= 3.0) {
        reasons.push(`Airflow matches (±3 cm/s): ${record.airflow_cm_s} cm/s`);
      } else {
        airflowMatches = false;
        differences.push(
          `Airflow variance: Record tested ${record.airflow_cm_s} cm/s, query specified ${query.airflowCmS} cm/s (Δ ${diff.toFixed(1)} cm/s)`
        );
      }
    }
  }

  // Decide verdict
  if (missingParameters.length > 0 && differences.length === 0) {
    return {
      verdict: "UNKNOWN_CONDITIONS",
      verdictLabel: "Unknown Conditions",
      verdictColor: "slate",
      reasons,
      differences,
      missingParameters,
    };
  }

  if (materialMatches && oxygenMatches && pressureMatches && airflowMatches && differences.length === 0) {
    return {
      verdict: "EXACT_MATCH",
      verdictLabel: "Matching Reported Conditions",
      verdictColor: "emerald",
      reasons,
      differences,
      missingParameters,
    };
  }

  if (differences.length > 0 && (materialMatches || reasons.length > 0)) {
    return {
      verdict: "CONDITION_VARIANCE",
      verdictLabel: "Related Evidence (Variance)",
      verdictColor: "amber",
      reasons,
      differences,
      missingParameters,
    };
  }

  return {
    verdict: "UNSUPPORTED",
    verdictLabel: "Outside Tested Domain",
    verdictColor: "rose",
    reasons,
    differences,
    missingParameters,
  };
}
