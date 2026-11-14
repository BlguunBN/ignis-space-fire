import { RankedEvidence, SearchQuery } from "@/types/evidence";

export interface SynthesisResponse {
  summary: string;
  keyFindings: string[];
  fireSafetyImplications: string[];
  scientificLimitations: string[];
  citedSources: Array<{
    id: string;
    title: string;
    doi?: string;
    sourceUrl: string;
    platform: string;
  }>;
  aiMode: "live_llm" | "deterministic_fallback";
}

/**
 * Generate grounded scientific interpretation from ranked NASA microgravity evidence.
 * Guaranteed to run even without external API keys or during offline hackathon demos.
 */
export async function generateGroundedInterpretation(
  query: SearchQuery,
  topRanked: RankedEvidence[],
  apiKey?: string
): Promise<SynthesisResponse> {
  // If an API key is provided and fetch is accessible, we can attempt live LLM call
  if (apiKey && process.env.OPENAI_API_KEY) {
    try {
      const llmResult = await callOpenAICompatibleLLM(query, topRanked, apiKey);
      if (llmResult) return llmResult;
    } catch (err) {
      console.warn("LLM API call failed, falling back to deterministic synthesis:", err);
    }
  }

  // Deterministic Grounded Synthesis (Baseline-first P0 Strategy)
  return buildDeterministicSynthesis(query, topRanked);
}

function buildDeterministicSynthesis(
  query: SearchQuery,
  topRanked: RankedEvidence[]
): SynthesisResponse {
  const topExps = topRanked.slice(0, 3).map((r) => r.experiment);

  const materials = Array.from(new Set(topExps.map((e) => e.material))).join(", ");
  const programmes = Array.from(new Set(topExps.map((e) => e.programme))).join(", ");

  const summary = `Based on ${topExps.length} top-ranked NASA microgravity investigations across the ${programmes} programme(s), combustion dynamics for ${materials} demonstrate that the absence of buoyant updraft fundamental alters flame stabilization, extinction thresholds, and smoke generation. Under low forced ventilation, flames exhibit rounded fronts with increased radiative sensitivity.`;

  const keyFindings = topExps.map((e) => `[${e.investigation}]: ${e.finding}`);

  const fireSafetyImplications = topExps.map((e) =>
    `[${e.programme}]: ${e.fire_safety_relevance}`
  );

  const scientificLimitations = [
    "Domain Restriction: All indexed data derived from orbital microgravity (~0g). Findings cannot be quantitatively extrapolated to Lunar (0.16g) or Martian (0.38g) partial-gravity environments without dedicated reduced-gravity testing (e.g. FLARE).",
    "Measurement Boundaries: Several investigations lack explicit ambient cabin pressure or rely on quiescent airflow tunnels; actual crew compartment HVAC ventilation may induce local vortices.",
    "Material Geometry: Small-scale samples (e.g. BASS-II 2 cm strips) underestimate propagation velocities observed in full-scale vehicle ducts (Saffire 1.0 m panels)."
  ];

  const citedSources = topExps.map((e) => ({
    id: e.id,
    title: `${e.investigation} (${e.programme})`,
    doi: e.doi || e.psi_id || "NASA Technical Publication",
    sourceUrl: e.source_url,
    platform: e.platform,
  }));

  return {
    summary,
    keyFindings,
    fireSafetyImplications,
    scientificLimitations,
    citedSources,
    aiMode: "deterministic_fallback",
  };
}

async function callOpenAICompatibleLLM(
  query: SearchQuery,
  topRanked: RankedEvidence[],
  apiKey: string
): Promise<SynthesisResponse | null> {
  const topExps = topRanked.slice(0, 3).map((r) => r.experiment);
  const promptContext = JSON.stringify(topExps, null, 2);

  const systemPrompt = `You are IGNIS, a NASA microgravity combustion evidence synthesis engine for spacecraft safety engineering.
STRICT RULES:
1. Ground every claim strictly in the provided JSON evidence.
2. If any parameter or information is absent, state explicitly "not reported in the indexed evidence".
3. NEVER predict spacecraft fire probability or claim a quantitative fire risk percentage.
4. NEVER extrapolate microgravity results to lunar or Martian gravity; explicitly warn about this domain mismatch.
5. Return clean JSON matching the requested structure.`;

  const userPrompt = `USER INQUIRY:
Material: ${query.material || "Unspecified"}
Oxygen %: ${query.oxygenPct ?? "Unspecified"}
Airflow: ${query.airflowCmS ?? "Unspecified"} cm/s
Phenomenon: ${query.phenomenon || "Unspecified"}
Question: ${query.freeText || "Evaluate combustion safety insights"}

INDEXED NASA EXPERIMENTAL EVIDENCE:
${promptContext}

Provide a JSON object with keys:
"summary": string,
"keyFindings": string[],
"fireSafetyImplications": string[],
"scientificLimitations": string[]`;

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  if (!response.ok) return null;
  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  return {
    summary: parsed.summary,
    keyFindings: parsed.keyFindings || [],
    fireSafetyImplications: parsed.fireSafetyImplications || [],
    scientificLimitations: parsed.scientificLimitations || [],
    citedSources: topExps.map((e) => ({
      id: e.id,
      title: `${e.investigation} (${e.programme})`,
      doi: e.doi || e.psi_id || "NASA Publication",
      sourceUrl: e.source_url,
      platform: e.platform,
    })),
    aiMode: "live_llm",
  };
}
