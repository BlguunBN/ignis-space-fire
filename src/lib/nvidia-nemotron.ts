import OpenAI from "openai";
import { ExperimentRecord } from "../types/evidence";
import {
  GroundedCitation,
  detectPhysicalBoundaryViolations,
  generateGroundedAssistantResponse,
  GroundedAssistantResponse,
} from "./grounded-assistant";

export const NVIDIA_CONFIG = {
  baseURL: process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
  apiKey: process.env.NVIDIA_API_KEY || "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",
  model: process.env.NVIDIA_MODEL || "nvidia/nemotron-3.5-lightning-30b-a3b",
};

export interface NemotronResponse extends GroundedAssistantResponse {
  reasoning?: string;
  model: string;
}

/**
 * Builds the NASA PSI domain system prompt for NVIDIA Nemotron.
 */
export function buildNemotronSystemPrompt(corpus: ExperimentRecord[]): string {
  const corpusContext = corpus
    .map((r) => {
      const claimId = r.claim_locator_details?.claimId || `CLM-${r.id.toUpperCase()}`;
      const page = r.claim_locator_details?.pageNumber || 1;
      const flow = r.airflow_cm_s != null ? `${r.airflow_cm_s} cm/s` : "quiescent";
      const o2 = r.oxygen_pct != null ? `${r.oxygen_pct}% O₂` : "unspecified";
      const p = r.pressure_kpa != null ? `${r.pressure_kpa} kPa` : "101.3 kPa";

      return `[INVESTIGATION: ${r.investigation} | Record ID: ${r.id}]
- Fuel Material: ${r.material} (${r.material_class})
- Environmental Conditions: ${o2}, Forced Airflow: ${flow}, Pressure: ${p}
- Flight Platform: ${r.platform} (${r.programme})
- Verified Finding: ${r.finding}
- Fire Safety Impact: ${r.fire_safety_relevance}
- Physical Limitations: ${r.limitations.join("; ")}
- Primary Source Locator: ${r.source_locator}
- Claim Citation ID: ${claimId} (Page ${page})`;
    })
    .join("\n\n");

  return `You are IGNIS, the NASA Microgravity Combustion Research Intelligence Agent.
You are powered by NVIDIA Nemotron-3.5-Lightning-30B with deep scientific reasoning.

CRITICAL AEROSPACE RESEARCH GUIDELINES:
1. Strict Provenance: You MUST ground all conclusions exclusively in the verified NASA Physical Sciences Informatics (PSI) flight records provided below.
2. Citation Grounding: Every empirical claim, comparison, or rate quoted MUST explicitly reference its Claim ID in brackets, e.g. [CLM-SAFFIRE-001 (Page 4)] or [CLM-BASS-001 (Page 14)].
3. Physical Boundary Safety: If the user's inquiry touches conditions beyond indexed flight microgravity (e.g. Martian 0.38g, Lunar 0.16g, or hyperoxic atmospheres >40% O₂), you MUST issue an explicit "Physical Boundary Warning" explaining why microgravity buoyancy suppression cannot be quantitatively extrapolated to partial gravity where buoyant convection re-emerges.
4. Scientific Abstention: If the indexed corpus does not contain verified flight records for the specific fuel, regime, or condition requested, declare "Scientific Abstention" explicitly. Never speculate or invent empirical values.
5. Structure: Provide structured, dense, objective responses using comparison tables and precise aerodynamic/combustion nomenclature.

VERIFIED NASA PSI FLIGHT CORPUS:
${corpusContext}`;
}

/**
 * Executes a grounded scientific inquiry using NVIDIA Nemotron 3.5 Lightning.
 * Streams reasoning tokens (thinking) and final content, validating citations.
 */
export async function generateNemotronGroundedResponse(
  queryText: string,
  corpus: ExperimentRecord[],
  options: { reasoningBudget?: number; maxTokens?: number } = {}
): Promise<NemotronResponse> {
  const boundaryWarnings = detectPhysicalBoundaryViolations(queryText);
  const reasoningBudget = options.reasoningBudget ?? 2048;
  const maxTokens = options.maxTokens ?? 8192;

  try {
    const client = new OpenAI({
      baseURL: NVIDIA_CONFIG.baseURL,
      apiKey: NVIDIA_CONFIG.apiKey,
      timeout: 30000,
    });

    const systemPrompt = buildNemotronSystemPrompt(corpus);

    const stream = (await client.chat.completions.create({
      model: NVIDIA_CONFIG.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: queryText },
      ],
      temperature: 0.6,
      top_p: 0.95,
      max_tokens: maxTokens,
      stream: true,
      chat_template_kwargs: { enable_thinking: true },
      reasoning_budget: reasoningBudget,
    } as any)) as unknown as AsyncIterable<any>;

    let reasoningTotal = "";
    let contentTotal = "";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta as any;
      if (!delta) continue;
      if (delta.reasoning_content) {
        reasoningTotal += delta.reasoning_content;
      }
      if (delta.content) {
        contentTotal += delta.content;
      }
    }

    if (!contentTotal.trim()) {
      // If content was empty due to excessive thinking, fall back to deterministic
      throw new Error("Nemotron stream generated empty content");
    }

    // Match citations mentioned in the generated content
    const matchedCitations: GroundedCitation[] = [];
    const claimRegex = /\[(CLM-[A-Z0-9-]+)(?:\s*\((?:Page\s*)?(\d+)\))?\]/gi;
    let match: RegExpExecArray | null;

    const seenClaims = new Set<string>();

    while ((match = claimRegex.exec(contentTotal)) !== null) {
      const claimId = match[1].toUpperCase();
      if (seenClaims.has(claimId)) continue;
      seenClaims.add(claimId);

      const record = corpus.find(
        (r) =>
          r.claim_locator_details?.claimId?.toUpperCase() === claimId ||
          `CLM-${r.id.toUpperCase()}` === claimId
      );

      if (record) {
        matchedCitations.push({
          claimId,
          recordId: record.id,
          investigation: record.investigation,
          pageNumber: record.claim_locator_details?.pageNumber || 1,
          quote: record.finding,
          sourceLocator: record.source_locator || "NASA PSI Archive",
        });
      }
    }

    // If Nemotron didn't format claim tags explicitly, extract relevant records matching keywords
    if (matchedCitations.length === 0) {
      const lower = contentTotal.toLowerCase();
      for (const r of corpus) {
        if (
          lower.includes(r.investigation.toLowerCase()) ||
          lower.includes(r.id.toLowerCase()) ||
          (r.material && lower.includes(r.material.toLowerCase().slice(0, 5)))
        ) {
          matchedCitations.push({
            claimId: r.claim_locator_details?.claimId || `CLM-${r.id.toUpperCase()}`,
            recordId: r.id,
            investigation: r.investigation,
            pageNumber: r.claim_locator_details?.pageNumber || 1,
            quote: r.finding,
            sourceLocator: r.source_locator || "NASA PSI Archive",
          });
        }
      }
    }

    const isAbstention =
      contentTotal.toLowerCase().includes("scientific abstention") ||
      contentTotal.toLowerCase().includes("abstention:") ||
      matchedCitations.length === 0;

    // Compile limitations
    const limitationsSet = new Set<string>();
    for (const c of matchedCitations) {
      const rec = corpus.find((r) => r.id === c.recordId);
      if (rec) {
        for (const lim of rec.limitations) {
          limitationsSet.add(lim);
        }
      }
    }

    return {
      query: queryText,
      answer: contentTotal.trim(),
      reasoning: reasoningTotal.trim() || undefined,
      citations: matchedCitations,
      isAbstention,
      abstentionReason: isAbstention
        ? "Corpus boundary constraints or absence of verified flight records in queried regime."
        : undefined,
      boundaryWarnings,
      scientificLimitations: Array.from(limitationsSet).slice(0, 4),
      provenanceHash: `nemotron-${Date.now().toString(16)}`,
      model: NVIDIA_CONFIG.model,
    };
  } catch (error) {
    console.warn("NVIDIA Nemotron call failed or unavailable, falling back to deterministic generator:", error);
    // Graceful offline fallback
    const fallback = generateGroundedAssistantResponse(queryText, corpus);
    return {
      ...fallback,
      model: "ignis-deterministic-grounded-fallback",
    };
  }
}
