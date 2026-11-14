import Fuse from "fuse.js";
import { ExperimentRecord, SearchQuery, RankedEvidence, ScoreBreakdown } from "@/types/evidence";
import { isEligibleEvidence } from "@/lib/sourceReviewedRecords";

type MatchKind = "browse" | "reported_conditions_match" | "related_only" | "no_relevant_evidence";

function materialMatch(exp: ExperimentRecord, value: string): number {
  const term = value.toLowerCase().trim();
  const material = exp.material.toLowerCase();
  if (material.includes(term)) return 100;
  if (["pmma", "acrylic", "polymer"].some(x => term.includes(x)) && exp.material_class.includes("polymer")) return 70;
  if (["fabric", "cotton", "sibal"].some(x => term.includes(x)) && exp.material_class.includes("fabric")) return 70;
  return 0;
}

function phenomenonMatch(exp: ExperimentRecord, value: string): number {
  const term = value.toLowerCase().replaceAll(" ", "_");
  return exp.measurements.some(m => m.toLowerCase().includes(term) || term.includes(m.toLowerCase())) ? 100 : 0;
}

export function rankEvidence(experiments: ExperimentRecord[], query: SearchQuery): RankedEvidence[] {
  const candidates = experiments.filter(e => isEligibleEvidence(e) && (!query.programme || e.programme.toLowerCase() === query.programme.toLowerCase()));
  const text = query.freeText?.trim() || "";
  const matches = new Map<string, number>();
  if (text) {
    const fuse = new Fuse(candidates, {
      keys: ["investigation", "programme", "material", "measurements", "finding", "fire_safety_relevance"],
      threshold: 0.45, includeScore: true, ignoreLocation: true,
    });
    for (const result of fuse.search(text)) matches.set(result.item.id, 100 * (1 - (result.score ?? 1)));
  }
  const structured = Boolean(query.material || query.phenomenon || query.oxygenPct != null || query.pressureKpa != null || query.airflowCmS != null);
  return candidates.flatMap(exp => {
    const material = query.material ? materialMatch(exp, query.material) : 0;
    const phenomenon = query.phenomenon ? phenomenonMatch(exp, query.phenomenon) : 0;
    if ((query.material && !material) || (query.phenomenon && !phenomenon)) return [];
    if (text && !structured && !matches.has(exp.id)) return [];
    const reasons: string[] = [];
    const missing: string[] = [];
    if (query.material) reasons.push(material === 100 ? "Material mentioned in this investigation" : "Related material category");
    if (query.phenomenon) reasons.push("Investigation addresses the selected phenomenon");
    const component = (name: string, actual: number | null | undefined, requested: number | null | undefined, distance: number) => {
      if (requested == null) return 0;
      if (actual == null) { missing.push(name); return 0; }
      reasons.push(actual === requested ? name + " matches the requested value" : name + " differs from the requested value");
      return Math.max(0, 100 * (1 - Math.abs(actual - requested) / distance));
    };
    const oxygen = component("Oxygen", exp.oxygen_pct, query.oxygenPct, 10);
    const pressure = component("Pressure", exp.pressure_kpa, query.pressureKpa, query.pressureKpa || 1);
    const flow = component("Airflow", exp.airflow_cm_s, query.airflowCmS, 15);
    const atmospheric = [query.oxygenPct != null ? oxygen : null, query.pressureKpa != null ? pressure : null].filter((n): n is number => n !== null);
    const atmosphere = atmospheric.length ? atmospheric.reduce((a, b) => a + b, 0) / atmospheric.length : 0;
    const parts: Array<[boolean, number, number]> = [
      [Boolean(query.material), material, 0.30],
      [atmospheric.length > 0, atmosphere, 0.20],
      [query.airflowCmS != null, flow, 0.20],
      [Boolean(query.phenomenon), phenomenon, 0.15],
      [Boolean(text), matches.get(exp.id) ?? 0, 0.15],
    ];
    const weight = parts.reduce((sum, [active, , w]) => sum + (active ? w : 0), 0);
    const score = weight ? Math.round(parts.reduce((sum, [active, value, w]) => sum + (active ? value * w : 0), 0) / weight) : 0;
    const breakdown: ScoreBreakdown = {
      materialScore: material, atmosphereScore: atmosphere, airflowScore: flow, phenomenonScore: phenomenon,
      platformScore: 0, completenessScore: 0, missingParameters: missing, reasons,
      limitationsWarning: "Microgravity findings do not predict lunar or Martian fire behavior.",
    };
    return [{ experiment: exp, score, confidenceLevel: score >= 80 ? "HIGH" as const : score >= 60 ? "MODERATE" as const : score >= 35 ? "LOW" as const : "SPARSE" as const, breakdown }];
  }).sort((a, b) => b.score - a.score || a.experiment.id.localeCompare(b.experiment.id));
}

export function assessQuerySupport(query: SearchQuery, ranked: RankedEvidence[]): { kind: MatchKind; reason: string } {
  const structured = Boolean(query.material || query.phenomenon || query.oxygenPct != null || query.pressureKpa != null || query.airflowCmS != null);
  if (!structured && !query.freeText?.trim()) return { kind: "browse", reason: "Browse the reviewed investigations." };
  if (!ranked.length) return { kind: "no_relevant_evidence", reason: "No applicable evidence was found in the reviewed index." };
  if (structured && ranked.some(({ experiment: e }) =>
    (!query.material || materialMatch(e, query.material) === 100) &&
    (!query.phenomenon || phenomenonMatch(e, query.phenomenon) === 100) &&
    (query.oxygenPct == null || e.oxygen_pct === query.oxygenPct) &&
    (query.pressureKpa == null || e.pressure_kpa === query.pressureKpa) &&
    (query.airflowCmS == null || e.airflow_cm_s === query.airflowCmS)
  )) return { kind: "reported_conditions_match", reason: "Requested reported inputs match; inspect all other conditions and limitations." };
  return { kind: "related_only", reason: "Related evidence is available, but some requested conditions differ or are not reported." };
}
