import { ExperimentRecord } from "../types/evidence";

/**
 * Transparent, question-dependent discovery heuristic.
 * A higher score means a record better matches the research question and
 * supplies more inspectable context. It NEVER estimates fire probability,
 * material safety, or experimental certainty.
 */
export interface RankedFireSafetyEvidence {
  record: ExperimentRecord;
  score: number;
  reasons: string[];
  warnings: string[];
}

const SOLID_MATERIAL = /solid|fabric|pmma|plastic|polymer|cellulose|wire|insulat|nomex|sibal|foam/i;
const TOPIC_SIGNALS: Array<{ requested: RegExp; inRecord: RegExp; label: string }> = [
  { requested: /spread|propagat|flammab|burning material/i, inRecord: /flame spread|propagat|flammab|burn rate|burning.*solid/i, label: "Flame spread / flammability evidence" },
  { requested: /extinct|suppress|quench|put out/i, inRecord: /extinct|suppress|quench|blowoff|limiting oxygen/i, label: "Extinction / suppression evidence" },
  { requested: /smoke|aerosol|detect/i, inRecord: /smoke|aerosol|particle|detect/i, label: "Smoke / detection evidence" },
  { requested: /droplet|cool flame/i, inRecord: /droplet|cool flame|liquid fuel/i, label: "Droplet / cool-flame evidence" },
];

function normaliseQuestion(question: string): string {
  return question.trim().toLowerCase();
}

export function assessFireSafetyRelevance(
  record: ExperimentRecord,
  question: string
): RankedFireSafetyEvidence {
  const q = normaliseQuestion(question);
  const text = [record.investigation, record.programme, record.finding, record.fire_safety_relevance, record.material].join(" ").toLowerCase();
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  const topics = TOPIC_SIGNALS.filter((item) => item.requested.test(q));
  if (topics.length === 0) {
    score += 10;
    reasons.push("General combustion research context");
  } else if (topics.some((item) => item.inRecord.test(text))) {
    score += 35;
    reasons.push(topics.filter((item) => item.inRecord.test(text)).map((item) => item.label).join("; "));
  } else {
    warnings.push("The requested combustion phenomenon is not explicitly covered by this record");
  }

  const solidRequested = /solid|cabin|habitat|spacecraft material|fabric|polymer|wire|flammab|spread/i.test(q);
  const dropletRequested = /droplet|liquid fuel|cool flame/i.test(q);
  const solidRecord = SOLID_MATERIAL.test(record.material_class + " " + record.material);
  const dropletRecord = /droplet|liquid/i.test(record.material_class + " " + record.material);
  if ((solidRequested && solidRecord) || (dropletRequested && dropletRecord)) {
    score += 20;
    reasons.push("Relevant fuel or material class");
  } else if (!solidRequested && !dropletRequested) {
    score += 10;
    reasons.push("Material class recorded for comparison");
  } else {
    warnings.push("Fuel geometry/material differs from the requested scenario");
  }

  if (/moon|lunar|martian|mars|partial gravity|0\.16g|0\.38g/i.test(q)) {
    if (record.gravity === "partial_gravity") {
      score += 10;
      reasons.push("Partial-gravity evidence is indexed");
    } else {
      warnings.push("Do not extrapolate this gravity regime directly to lunar or Martian habitats");
    }
  } else if (record.gravity === "microgravity") {
    score += 10;
    reasons.push("Direct low-gravity experimental context");
  }
  if (/airflow|ventilat|flow|oxygen|o2|o₂|atmospher/i.test(q)) {
    if (record.airflow_cm_s != null && /airflow|ventilat|flow/i.test(q)) {
      score += 5;
      reasons.push("Measured airflow condition available");
    } else if (/airflow|ventilat|flow/i.test(q)) {
      warnings.push("Airflow condition is not reported");
    }
    if (record.oxygen_pct != null && /oxygen|o2|o₂|atmospher/i.test(q)) {
      score += 5;
      reasons.push("Reported oxygen condition available");
    } else if (/oxygen|o2|o₂|atmospher/i.test(q)) {
      warnings.push("Oxygen concentration is not reported");
    }
  }

  // Provenance bonus indicates traceability, NOT external scientific verification.
  if (record.source_type === "NASA_PSI") score += 10;
  else if (record.source_type === "NTRS" || record.source_type === "NASA_WEB") score += 8;
  else score += 5;
  if (record.source_url && /^https:\/\//i.test(record.source_url)) score += 3;
  if (record.verification_status === "verified") {
    score += 2;
    reasons.push("Internally marked reviewed");
  } else {
    warnings.push("Record has not completed internal review; verify with its primary source");
  }

  // Availability of inspectable conditions and limitations, not their scientific validity.
  if (record.oxygen_pct != null) score += 2;
  if (record.pressure_kpa != null) score += 2;
  if (record.airflow_cm_s != null) score += 2;
  if (record.claim_locator_details?.claimId) score += 2;
  if (record.limitations?.length) score += 2;
  if (!record.claim_locator_details?.claimId) warnings.push("No pinpoint claim locator indexed");

  return { record, score: Math.min(100, score), reasons, warnings };
}

export function rankFireSafetyEvidence(
  records: ExperimentRecord[],
  question: string
): RankedFireSafetyEvidence[] {
  return records.map((record) => assessFireSafetyRelevance(record, question))
    .sort((a, b) => b.score - a.score || a.record.investigation.localeCompare(b.record.investigation));
}
