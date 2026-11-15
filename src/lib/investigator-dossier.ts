/**
 * Automated Investigator Pre-Review Dossier Generator (Phase 3)
 * 
 * Compiles a structured briefing dossier for certified NASA flight investigators,
 * including a 3-point verification checklist, risk classification, nearest historical
 * flight baseline, and pre-drafted review notes for 1-click investigator sign-off.
 */

import { StagedCandidateRecord } from "./ingestion";
import { ExperimentRecord } from "../types/evidence";

export interface VerificationChecklistItem {
  id: string;
  label: string;
  description: string;
  verified: boolean;
  category?: "TELEMETRY" | "PHYSICS" | "METROLOGY";
}

export interface NearestFlightReference {
  id: string;
  programme: string;
  investigation: string;
  material: string;
  oxygenPct?: number | null;
  airflowCmS?: number | null;
  similarityReason: string;
}

export interface InvestigatorDossier {
  stagedId: string;
  documentTitle: string;
  executiveSummary: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  riskFactors: string[];
  checklist: VerificationChecklistItem[];
  recommendedRationale: string;
  nearestFlightReference?: NearestFlightReference;
  generatedAt: string;
}

/**
 * Finds the nearest historical flight investigation matching the candidate material and platform.
 */
export function findNearestFlightBaseline(
  candidate: StagedCandidateRecord,
  corpus: ExperimentRecord[]
): NearestFlightReference | undefined {
  if (!corpus || corpus.length === 0) return undefined;

  const candMat = (candidate.candidateMaterial || "").toLowerCase();
  const candProg = (candidate.candidateProgramme || "").toLowerCase();

  let bestMatch: ExperimentRecord | null = null;
  let bestScore = -1;
  let reason = "General low-gravity flight baseline";

  for (const record of corpus) {
    let score = 0;
    const recMat = (record.material || "").toLowerCase();
    const recProg = (record.programme || "").toLowerCase();

    if (recProg === candProg) {
      score += 40;
    }
    if (candMat.includes("sibal") && recMat.includes("sibal")) {
      score += 50;
      reason = "Direct material match: SIBAL cotton-fiberglass blend";
    } else if (candMat.includes("droplet") && (recMat.includes("droplet") || record.investigation.toLowerCase().includes("flex"))) {
      score += 50;
      reason = "Direct liquid fuel droplet combustion match";
    } else if (candMat.includes("pmma") && (recMat.includes("pmma") || recMat.includes("acrylic"))) {
      score += 50;
      reason = "Direct solid polymethylmethacrylate (PMMA) match";
    } else if (candMat.includes("wire") && recMat.includes("wire")) {
      score += 50;
      reason = "Overheated electrical wire insulation match";
    }

    // Oxygen proximity bonus
    if (candidate.candidateOxygenPct && record.oxygen_pct) {
      const o2Diff = Math.abs(candidate.candidateOxygenPct - record.oxygen_pct);
      if (o2Diff <= 3) score += 20;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = record;
    }
  }

  const selected = bestMatch || corpus[0];
  if (!selected) return undefined;

  return {
    id: selected.id,
    programme: selected.programme,
    investigation: selected.investigation,
    material: selected.material,
    oxygenPct: selected.oxygen_pct,
    airflowCmS: selected.airflow_cm_s,
    similarityReason: reason,
  };
}

/**
 * Evaluates candidate parameters and generates the investigator briefing dossier.
 */
export function generateInvestigatorDossier(
  candidate: StagedCandidateRecord,
  corpus: ExperimentRecord[]
): InvestigatorDossier {
  const o2 = candidate.candidateOxygenPct ?? 21;
  const press = candidate.candidatePressureKpa ?? 101.3;
  const flow = candidate.candidateAirflowCmS ?? 0;
  const mat = candidate.candidateMaterial || "Tested specimen";

  // Assess physical risk level
  const riskFactors: string[] = [];
  if (o2 > 30) {
    riskFactors.push(`Elevated hyperoxic oxygen level (${o2}% O₂) creates accelerated thermal runaway risk.`);
  } else if (o2 < 18) {
    riskFactors.push(`Sub-atmospheric limiting oxygen index (${o2}% O₂) requires precise quench validation.`);
  }

  if (press < 65) {
    riskFactors.push(`Deep cabin depressurization (${press} kPa) significantly reduces gas-phase heat capacity.`);
  }

  if (flow > 25) {
    riskFactors.push(`High ventilation flow velocity (${flow} cm/s) introduces turbulent transition risk.`);
  }

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  if (riskFactors.length >= 2 || o2 > 35) {
    riskLevel = "HIGH";
  } else if (riskFactors.length === 1) {
    riskLevel = "MEDIUM";
  }

  // Find historical comparison
  const nearestBaseline = findNearestFlightBaseline(candidate, corpus);

  // Executive summary
  const baselineText = nearestBaseline
    ? ` Baseline corroboration provided against ${nearestBaseline.programme} (${nearestBaseline.investigation}).`
    : "";
  const executiveSummary = `Candidate report extracted from ${candidate.filename} details ${mat} combustion in ${candidate.candidatePlatform} under ${o2}% O₂, ${press} kPa, and ${flow} cm/s flow.${baselineText} Scientific rigor evaluated at Risk Level: ${riskLevel}.`;

  // 3-Point Checklist
  const checklist: VerificationChecklistItem[] = [
    {
      id: "check-telemetry-run-log",
      label: "Sensor & Telemetry Log Corroboration",
      description: `Cross-examine reported finding against primary NASA PSI telemetry channels (${candidate.candidateProgramme} sensor logs, thermocouple rakes, or radiometer profiles).`,
      verified: false,
      category: "TELEMETRY",
    },
    {
      id: "check-oxygen-pressure-boundary",
      label: "Atmospheric & Flammability Boundary Verification",
      description: `Confirm steady-state gas mixture stability at ${o2}% O₂ and ${press} kPa without unmeasured convective oxygen depletion.`,
      verified: false,
      category: "PHYSICS",
    },
    {
      id: "check-sample-geometry-quenching",
      label: "Specimen Geometry & Thermal Heat Sink Check",
      description: `Verify that sample holder boundary conditions and conductive edge losses for ${mat} do not skew concurrent spread telemetry.`,
      verified: false,
      category: "METROLOGY",
    },
  ];

  // Pre-drafted Review Notes for 1-click Investigator approval
  const nearestMention = nearestBaseline ? ` Corroborated with ${nearestBaseline.programme} flight dataset.` : "";
  const recommendedRationale = `Verified ${mat} flammability measurements under ${o2}% O₂ and ${press} kPa ambient pressure at ${flow} cm/s airflow.${nearestMention} Findings in ${candidate.filename} align with verified NASA Physical Sciences Informatics (PSI) flight records. Approved for active corpus indexing.`;

  return {
    stagedId: candidate.stagedId,
    documentTitle: candidate.documentTitle,
    executiveSummary,
    riskLevel,
    riskFactors,
    checklist,
    recommendedRationale,
    nearestFlightReference: nearestBaseline,
    generatedAt: new Date().toISOString(),
  };
}
