import { RankedEvidence, SearchQuery } from "@/types/evidence";
import { CORPUS_VERSION } from "@/lib/sourceReviewedRecords";
import { createInquiryKey } from "@/lib/inquiry";

type Statement = { text: string; evidenceIds: string[] };
export interface SynthesisResponse {
  observations: { evidenceId: string; text: string }[];
  relevance: Statement[];
  unknowns: Statement[];
  citedSources: Array<{ id: string; title: string; doi?: string; sourceUrl: string; platform: string; sourceLocator?: string }>;
  queryKey: string;
  corpusVersion: string;
  aiMode: "live_llm" | "deterministic_fallback";
  modelUsed?: string;
  summary: string;
  keyFindings: string[];
  fireSafetyImplications: string[];
  scientificLimitations: string[];
  reasoningSteps?: string;
}

export function buildDeterministicSynthesis(query: SearchQuery, ranked: RankedEvidence[]): SynthesisResponse {
  const records = ranked.slice(0, 3).map(r => r.experiment);
  const observations = records.map(e => ({ evidenceId: e.id, text: e.finding }));
  const relevance = ranked.slice(0, 3).map(r => ({
    text: r.breakdown.reasons.length ? r.breakdown.reasons.join("; ") : "This investigation is available in the reviewed index.",
    evidenceIds: [r.experiment.id],
  }));
  const unknowns = [
    { text: "Microgravity findings cannot be used to predict lunar or Martian fire behavior without dedicated evidence.", evidenceIds: [] },
    ...records.flatMap(e => e.limitations.map(text => ({ text, evidenceIds: [e.id] }))),
  ];
  const citedSources = records.map(e => ({
    id: e.id, title: e.investigation, doi: e.doi, sourceUrl: e.source_url, platform: e.platform, sourceLocator: e.source_locator,
  }));
  return {
    observations, relevance, unknowns, citedSources,
    queryKey: createInquiryKey(query, records.map(e => e.id), CORPUS_VERSION),
    corpusVersion: CORPUS_VERSION, aiMode: "deterministic_fallback", modelUsed: "Deterministic evidence summary",
    summary: records.length ? "The following reviewed investigations provide context for this inquiry. Check their conditions before drawing conclusions." : "No applicable evidence was selected from the reviewed index.",
    keyFindings: observations.map(o => o.text), fireSafetyImplications: relevance.map(r => r.text), scientificLimitations: unknowns.map(u => u.text),
  };
}

export function parseModelInterpretation(payload: unknown, allowedIds: string[]): { relevance: Statement[]; unknowns: Statement[] } | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const obj = payload as Record<string, unknown>;
  if (Object.keys(obj).some(key => !["relevance", "unknowns"].includes(key))) return null;
  const parse = (value: unknown): Statement[] | null => {
    if (!Array.isArray(value) || value.length > 8) return null;
    const result: Statement[] = [];
    for (const item of value) {
      if (!item || typeof item !== "object" || Array.isArray(item)) return null;
      const entry = item as Record<string, unknown>;
      if (Object.keys(entry).some(k => !["text", "evidenceIds"].includes(k))) return null;
      if (typeof entry.text !== "string" || !entry.text.trim() || entry.text.length > 1000 || /https?:\/\/|www\./i.test(entry.text)) return null;
      if (!Array.isArray(entry.evidenceIds) || !entry.evidenceIds.length || entry.evidenceIds.some(id => typeof id !== "string" || !allowedIds.includes(id))) return null;
      result.push({ text: entry.text.trim(), evidenceIds: entry.evidenceIds });
    }
    return result;
  };
  const relevance = parse(obj.relevance);
  const unknowns = parse(obj.unknowns);
  return relevance?.length && unknowns ? { relevance, unknowns } : null;
}

export async function generateGroundedInterpretation(query: SearchQuery, ranked: RankedEvidence[], apiKey?: string): Promise<SynthesisResponse> {
  const fallback = buildDeterministicSynthesis(query, ranked);
  if (!apiKey || !ranked.length) return fallback;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  const model = process.env.NVIDIA_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";
  try {
    const base = process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1";
    const response = await fetch(base + "/chat/completions", {
      method: "POST", signal: controller.signal,
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + apiKey },
      body: JSON.stringify({ model, temperature: 0.1, max_tokens: 1500, messages: [
        { role: "system", content: "Explain only supplied evidence. Do not infer unreported conditions or partial-gravity results. Return JSON only: {relevance:[{text,evidenceIds}],unknowns:[{text,evidenceIds}]}. Each statement must cite at least one supplied evidence id. Do not output URLs." },
        { role: "user", content: JSON.stringify({ query, evidence: ranked.slice(0, 3).map(r => r.experiment) }) },
      ] }),
    });
    if (!response.ok) return fallback;
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return fallback;
    const parsed = parseModelInterpretation(JSON.parse(content.replace(/^```(?:json)?\s*|\s*```$/g, "")), fallback.citedSources.map(s => s.id));
    if (!parsed) return fallback;
    const unknowns = [...fallback.unknowns, ...parsed.unknowns];
    return { ...fallback, relevance: parsed.relevance, unknowns, aiMode: "live_llm", modelUsed: model,
      fireSafetyImplications: parsed.relevance.map(x => x.text), scientificLimitations: unknowns.map(x => x.text) };
  } catch {
    return fallback;
  } finally {
    clearTimeout(timer);
  }
}
