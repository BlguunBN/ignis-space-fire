import { ExperimentRecord, SearchQuery, RankedEvidence, ScoreBreakdown } from "@/types/evidence";

/**
 * Deterministic Evidence Relevance Ranking Engine for NASA Microgravity Studies.
 * Implements the formula described in the NASA Space Apps 2026 IGNIS Plan:
 * 
 * Score = 0.30 * material_similarity
 *       + 0.20 * atmosphere_similarity
 *       + 0.20 * airflow_similarity
 *       + 0.15 * phenomenon_similarity
 *       + 0.10 * scale_platform_relevance
 *       + 0.05 * metadata_completeness
 * 
 * IMPORTANT: This score ranks *research relevance* to an engineering inquiry.
 * It is NOT a physical fire danger or hazard probability metric.
 */

export function rankEvidence(
  experiments: ExperimentRecord[],
  query: SearchQuery
): RankedEvidence[] {
  const ranked = experiments.map((exp) => {
    const breakdown = calculateScoreBreakdown(exp, query);
    const totalScore = Math.round(
      0.30 * breakdown.materialScore +
      0.20 * breakdown.atmosphereScore +
      0.20 * breakdown.airflowScore +
      0.15 * breakdown.phenomenonScore +
      0.10 * breakdown.platformScore +
      0.05 * breakdown.completenessScore
    );

    let confidenceLevel: "HIGH" | "MODERATE" | "LOW" | "SPARSE" = "SPARSE";
    if (totalScore >= 80) confidenceLevel = "HIGH";
    else if (totalScore >= 60) confidenceLevel = "MODERATE";
    else if (totalScore >= 35) confidenceLevel = "LOW";

    return {
      experiment: exp,
      score: Math.min(100, Math.max(0, totalScore)),
      confidenceLevel,
      breakdown,
    };
  });

  return ranked.sort((a, b) => b.score - a.score);
}

function calculateScoreBreakdown(
  exp: ExperimentRecord,
  query: SearchQuery
): ScoreBreakdown {
  const missingParams: string[] = [];
  const reasons: string[] = [];

  // 1. Material Similarity (0 - 100)
  let materialScore = 60; // baseline neutral
  if (query.material) {
    const qMat = query.material.toLowerCase();
    const expMat = exp.material.toLowerCase();
    const expClass = exp.material_class.toLowerCase();

    if (expMat.includes(qMat) || qMat.includes(expMat)) {
      materialScore = 100;
      reasons.push(`Direct material match (${exp.material})`);
    } else if (
      (qMat.includes("pmma") || qMat.includes("acrylic") || qMat.includes("polymer")) &&
      expClass.includes("polymer")
    ) {
      materialScore = 90;
      reasons.push("Solid polymer category match");
    } else if (
      (qMat.includes("fabric") || qMat.includes("cotton") || qMat.includes("nomex") || qMat.includes("sibal")) &&
      expClass.includes("fabric")
    ) {
      materialScore = 90;
      reasons.push("Textile/fabric material category match");
    } else if (
      (qMat.includes("smoke") || qMat.includes("wire") || qMat.includes("insulation")) &&
      expClass.includes("insulation")
    ) {
      materialScore = 90;
      reasons.push("Wire insulation electrical harness match");
    } else if (
      (qMat.includes("droplet") || qMat.includes("fuel") || qMat.includes("heptane")) &&
      expClass.includes("liquid")
    ) {
      materialScore = 85;
      reasons.push("Liquid hydrocarbon droplet match");
    } else {
      materialScore = 20;
    }
  }

  // 2. Atmosphere / Oxygen Similarity (0 - 100)
  let atmosphereScore = 70;
  if (query.oxygenPct != null) {
    const diff = Math.abs(exp.oxygen_pct - query.oxygenPct);
    if (diff < 1.0) {
      atmosphereScore = 100;
      reasons.push(`Close oxygen concentration match (${exp.oxygen_pct}%)`);
    } else if (diff < 5.0) {
      atmosphereScore = 80;
      reasons.push(`Comparable oxygen regime (${exp.oxygen_pct}%)`);
    } else if (diff < 10.0) {
      atmosphereScore = 55;
    } else {
      atmosphereScore = 25;
    }
  }

  if (query.pressureKpa != null) {
    if (exp.pressure_kpa == null) {
      missingParams.push("ambient pressure (kPa)");
      atmosphereScore = Math.max(10, atmosphereScore - 15);
    } else {
      const pDiff = Math.abs(exp.pressure_kpa - query.pressureKpa);
      if (pDiff < 10.0) {
        atmosphereScore = Math.min(100, atmosphereScore + 15);
        reasons.push(`Reduced pressure exploration regime match (${exp.pressure_kpa} kPa)`);
      }
    }
  }

  // 3. Airflow Similarity (0 - 100)
  let airflowScore = 70;
  if (query.airflowCmS != null) {
    const diff = Math.abs(exp.airflow_cm_s - query.airflowCmS);
    if (diff <= 2.0) {
      airflowScore = 100;
      reasons.push(`Direct ventilation airflow match (${exp.airflow_cm_s} cm/s)`);
    } else if (diff <= 8.0) {
      airflowScore = 80;
      reasons.push(`Comparable low forced-convection velocity`);
    } else if (diff <= 15.0) {
      airflowScore = 50;
    } else {
      airflowScore = 25;
    }
  } else {
    // If not specified, look for low flow indicator in query
    if (query.freeText && query.freeText.toLowerCase().includes("low airflow")) {
      if (exp.airflow_cm_s <= 5.0) {
        airflowScore = 95;
        reasons.push("Low-airflow quiescent regime match (< 5 cm/s)");
      }
    }
  }

  // 4. Phenomenon / Measurement Similarity (0 - 100)
  let phenomenonScore = 65;
  if (query.phenomenon) {
    const qPhen = query.phenomenon.toLowerCase();
    const hasPhen = exp.measurements.some((m) =>
      m.toLowerCase().includes(qPhen) || qPhen.includes(m.toLowerCase())
    );
    if (hasPhen) {
      phenomenonScore = 100;
      reasons.push(`Directly measures target phenomenon (${query.phenomenon})`);
    } else if (
      qPhen.includes("spread") && exp.measurements.includes("flame_spread")
    ) {
      phenomenonScore = 95;
      reasons.push("Direct flame spread empirical rate measurement");
    } else if (
      qPhen.includes("extinction") && exp.measurements.some(m => m.includes("extinction"))
    ) {
      phenomenonScore = 95;
      reasons.push("Flame extinction & quenching limit data");
    } else if (
      qPhen.includes("smoke") && exp.measurements.some(m => m.includes("smoke") || m.includes("aerosol"))
    ) {
      phenomenonScore = 95;
      reasons.push("Aerosol and smoke particle measurement");
    } else {
      phenomenonScore = 30;
    }
  }

  // 5. Scale & Platform Relevance (0 - 100)
  let platformScore = 75;
  if (exp.platform.toLowerCase().includes("cygnus")) {
    platformScore = 95;
    reasons.push("Flight-vehicle scale experiment (Cygnus large tunnel)");
  } else if (exp.platform.toLowerCase().includes("iss")) {
    platformScore = 90;
    reasons.push("ISS flight-certified operational microgravity facility");
  }

  // 6. Metadata Completeness (0 - 100)
  let completenessScore = 100;
  if (exp.pressure_kpa == null) {
    completenessScore -= 20;
    if (!missingParams.includes("pressure_kpa")) missingParams.push("pressure_kpa");
  }
  if (!exp.psi_id && !exp.doi) {
    completenessScore -= 30;
    missingParams.push("persistent identifier / DOI");
  }

  return {
    materialScore,
    atmosphereScore,
    airflowScore,
    phenomenonScore,
    platformScore,
    completenessScore,
    missingParameters: missingParams,
    reasons,
    limitationsWarning:
      "NASA Caution: Conducted in sustained microgravity (0g). Do not extrapolate quantitatively as a predictive model for Lunar (0.16g) or Martian (0.38g) partial gravity environments.",
  };
}
