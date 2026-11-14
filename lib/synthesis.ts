import { RankedEvidence, SearchQuery } from "@/types/evidence";

export interface SynthesisResponse {
  summary: string;
  keyFindings: string[];
  fireSafetyImplications: string[];
  scientificLimitations: string[];
  reasoningSteps?: string;
  citedSources: Array<{
    id: string;
    title: string;
    doi?: string;
    sourceUrl: string;
    platform: string;
    sourceLocator?: string;
  }>;
  aiMode: "live_llm" | "deterministic_fallback";
  modelUsed?: string;
}

/**
 * Generate grounded scientific interpretation from ranked NASA microgravity evidence.
 * Supports NVIDIA Nemotron-30B Reasoning Model with full offline deterministic fallback.
 */
export async function generateGroundedInterpretation(
  query: SearchQuery,
  topRanked: RankedEvidence[],
  apiKey?: string
): Promise<SynthesisResponse> {
  const nvidiaKey = apiKey || process.env.NVIDIA_API_KEY;

  if (nvidiaKey) {
    try {
      const llmResult = await callNvidiaNemotronLLM(query, topRanked, nvidiaKey);
      if (llmResult) return llmResult;
    } catch (err) {
      console.warn("NVIDIA LLM API call failed, falling back to deterministic synthesis:", err);
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

  if (topExps.length === 0) {
    return {
      summary: "No verified NASA microgravity evidence records matched the specified inquiry criteria.",
      keyFindings: [],
      fireSafetyImplications: [],
      scientificLimitations: [
        "Absence of evidence in the indexed corpus does not imply absence of NASA testing. Expand search filters to inspect related flight investigations."
      ],
      citedSources: [],
      aiMode: "deterministic_fallback",
      modelUsed: "IGNIS Grounded Science Engine (Deterministic)",
    };
  }

  const summariesByStudy = topExps.map((e) => {
    const o2Text = e.oxygen_pct != null ? `${e.oxygen_pct}% O₂` : "unreported O₂";
    const flowText = e.airflow_cm_s != null ? `${e.airflow_cm_s} cm/s airflow` : "unreported airflow";
    return `${e.investigation} (${e.programme}, ${e.platform}) evaluated ${e.material} under ${o2Text} and ${flowText}: ${e.finding}`;
  });

  const summary = `Evidence synthesis of ${topExps.length} top-ranked NASA flight records: ${summariesByStudy.join(" ")}`;

  const keyFindings = topExps.map((e) => `[${e.investigation}]: ${e.finding}`);

  const fireSafetyImplications = topExps.map((e) =>
    `[${e.programme}]: ${e.fire_safety_relevance}`
  );

  // Collect specific limitations from each cited experiment
  const studyLimitations = topExps.flatMap((e) => e.limitations.map((lim) => `[${e.investigation}] ${lim}`));

  const scientificLimitations = [
    "Domain Boundary: All indexed empirical data represents sustained orbital microgravity (~0g). These findings cannot be quantitatively extrapolated to Lunar (0.16g) or Martian (0.38g) partial-gravity environments without dedicated reduced-gravity flammability verification (e.g. FLARE).",
    ...studyLimitations,
  ];

  const citedSources = topExps.map((e) => ({
    id: e.id,
    title: `${e.investigation} (${e.programme})`,
    doi: e.doi || e.psi_id || "NASA Technical Publication",
    sourceUrl: e.source_url,
    platform: e.platform,
    sourceLocator: e.source_locator,
  }));

  return {
    summary,
    keyFindings,
    fireSafetyImplications,
    scientificLimitations,
    citedSources,
    aiMode: "deterministic_fallback",
    modelUsed: "IGNIS Grounded Science Engine (Deterministic)",
  };
}

async function callNvidiaNemotronLLM(
  query: SearchQuery,
  topRanked: RankedEvidence[],
  apiKey: string
): Promise<SynthesisResponse | null> {
  const topExps = topRanked.slice(0, 3).map((r) => r.experiment);
  const promptContext = JSON.stringify(topExps, null, 2);

  const systemPrompt = `You are IGNIS, an expert research synthesis engine for NASA microgravity combustion data (NASA Space Apps 2026).
STRICT EVIDENCE GROUNDING RULES:
1. Base all synthesis STRICTLY on the supplied NASA flight experiment evidence.
2. If any parameter is missing or null, explicitly state "not reported in the indexed evidence". Never assume terrestrial defaults (21% O2, 101.3 kPa, 0 cm/s).
3. NEVER extrapolate microgravity (~0g) results quantitatively to Lunar (0.16g) or Martian (0.38g) gravity. Explicitly cite this scientific boundary.
4. Return a clean JSON object ONLY, with no markdown code blocks outside, matching this exact JSON schema:
{
  "summary": "Concise paragraph synthesizing cross-study insights grounded only in the provided experiments",
  "keyFindings": ["Point 1 with study cite", "Point 2 with study cite"],
  "fireSafetyImplications": ["Implication 1", "Implication 2"],
  "scientificLimitations": ["Limitation 1 regarding microgravity boundary"]
}`;

  const userPrompt = `MISSION INQUIRY:
Material: ${query.material || "Unspecified"}
Oxygen %: ${query.oxygenPct ?? "Unspecified"}
Ventilation Airflow: ${query.airflowCmS ?? "Unspecified"} cm/s
Phenomenon: ${query.phenomenon || "Unspecified"}
Question: ${query.freeText || "Evaluate combustion safety insights"}

INDEXED NASA EXPERIMENTAL EVIDENCE:
${promptContext}

Respond with the requested JSON object.`;

  const invokeUrl = process.env.NVIDIA_BASE_URL
    ? `${process.env.NVIDIA_BASE_URL}/chat/completions`
    : "https://integrate.api.nvidia.com/v1/chat/completions";

  const modelName = process.env.NVIDIA_MODEL || "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning";

  const response = await fetch(invokeUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: 4096,
      top_p: 0.95,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.warn(`NVIDIA API returned ${response.status}: ${errText}`);
    return null;
  }

  const data = await response.json();
  const choice = data.choices?.[0]?.message;
  if (!choice) return null;

  const rawContent = choice.content || "";
  const reasoningContent = choice.reasoning_content || undefined;

  let cleanJson = rawContent.trim();
  if (cleanJson.startsWith("```json")) {
    cleanJson = cleanJson.replace(/^```json\s*/, "").replace(/```$/, "").trim();
  } else if (cleanJson.startsWith("```")) {
    cleanJson = cleanJson.replace(/^```\s*/, "").replace(/```$/, "").trim();
  }

  try {
    const parsed = JSON.parse(cleanJson);
    return {
      summary: parsed.summary || rawContent,
      keyFindings: parsed.keyFindings || [],
      fireSafetyImplications: parsed.fireSafetyImplications || [],
      scientificLimitations: parsed.scientificLimitations || [],
      reasoningSteps: reasoningContent,
      citedSources: topExps.map((e) => ({
        id: e.id,
        title: `${e.investigation} (${e.programme})`,
        doi: e.doi || e.psi_id || "NASA Publication",
        sourceUrl: e.source_url,
        platform: e.platform,
        sourceLocator: e.source_locator,
      })),
      aiMode: "live_llm",
      modelUsed: "NVIDIA Nemotron-30B Reasoning (NIM)",
    };
  } catch (parseError) {
    console.warn("Failed to parse JSON from NVIDIA model response, using text fallback:", parseError);
    return {
      summary: rawContent,
      keyFindings: topExps.map((e) => `[${e.investigation}]: ${e.finding}`),
      fireSafetyImplications: topExps.map((e) => `[${e.programme}]: ${e.fire_safety_relevance}`),
      scientificLimitations: [
        "NASA Caution: Findings restricted to microgravity conditions; do not extrapolate to Lunar or Martian gravity."
      ],
      reasoningSteps: reasoningContent,
      citedSources: topExps.map((e) => ({
        id: e.id,
        title: `${e.investigation} (${e.programme})`,
        doi: e.doi || e.psi_id || "NASA Publication",
        sourceUrl: e.source_url,
        platform: e.platform,
        sourceLocator: e.source_locator,
      })),
      aiMode: "live_llm",
      modelUsed: "NVIDIA Nemotron-30B Reasoning (NIM)",
    };
  }
}
