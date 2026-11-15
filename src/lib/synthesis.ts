import { ExperimentRecord, SearchQuery } from "../types/evidence";
import { assessApplicability } from "./applicability";
import { compareInvestigations } from "./comparison";

export interface EvidenceBrief {
  title: string;
  generatedAt: string;
  corpusVersion: string;
  querySummary: string;
  markdownContent: string;
  citedRecordIds: string[];
}

export function generateDeterministicBrief(
  query: SearchQuery,
  records: ExperimentRecord[],
  corpusVersion = "2026.11-MIXED-SOURCE-INDEX"
): EvidenceBrief {
  const timestamp = new Date().toISOString();
  const citedIds = records.map((r) => r.id);

  const queryParts: string[] = [];
  if (query.freeText) queryParts.push(`"${query.freeText}"`);
  if (query.material) queryParts.push(`Material: ${query.material}`);
  if (query.oxygenPct != null) queryParts.push(`O₂: ${query.oxygenPct}%`);
  if (query.pressureKpa != null) queryParts.push(`Pressure: ${query.pressureKpa} kPa`);
  if (query.airflowCmS != null) queryParts.push(`Flow: ${query.airflowCmS} cm/s`);
  if (query.gravity) queryParts.push(`Gravity: ${query.gravity}`);

  const querySummary = queryParts.length > 0 ? queryParts.join(" | ") : "All Indexed Evidence";

  if (records.length === 0) {
    const emptyMarkdown = `# FLARE Research Evidence Brief: No Applicable Evidence

**Generated:** ${timestamp}  
**Corpus Version:** ${corpusVersion}  
**Inquiry Parameters:** ${querySummary}

---

## 1. Finding & Applicability Status
> [!WARNING]
> **No indexed records match the current query filters. This does not prove the research does not exist.**
> 
> No source-backed conclusion can be drawn from these results. Broaden the search or inspect additional primary sources.

## 2. Recommended Next Steps
- Broaden oxygen or airflow bounds.
- Verify whether the requested fuel was tested in terrestrial drop towers (e.g. 2.2s / 5.18s ZGF) before orbital flight.
`;
    return {
      title: "No Applicable Evidence Brief",
      generatedAt: timestamp,
      corpusVersion,
      querySummary,
      markdownContent: emptyMarkdown,
      citedRecordIds: [],
    };
  }

  let md = `# FLARE Microgravity Combustion Evidence Brief

**Generated:** ${timestamp}  
**Corpus Version:** ${corpusVersion}  
**Inquiry Query:** ${querySummary}  
**Indexed Evidence Sources:** ${records.length} Indexed Record(s) (Internal Review Status May Vary)

---

## 1. Indexed Research Findings and Their Review Status

`;

  for (const rec of records) {
    const assess = assessApplicability(rec, query);
    md += `### ${rec.investigation} (${rec.platform})
- **Record ID:** \`${rec.id}\` | **Type:** \`${rec.record_type}\` | **Internal Review Status:** **${rec.verification_status.toUpperCase()}**
- **Material Tested:** ${rec.material} (*${rec.material_class}*)
- **Reported Conditions:** ${rec.oxygen_pct != null ? `${rec.oxygen_pct}% O₂` : "Unknown O₂"}, ${
      rec.pressure_kpa != null ? `${rec.pressure_kpa} kPa` : "Unknown Pressure"
    }, ${rec.airflow_cm_s != null ? `${rec.airflow_cm_s} cm/s forced flow` : "Airflow unreported"} (${rec.gravity})
- **Applicability Verdict:** **${assess.verdictLabel}**
- **Finding as Recorded (Check Original Source):**
  > "${rec.finding}"
- **Spacecraft Fire Safety Relevance:**
  ${rec.fire_safety_relevance}
- **Primary Source Citation:**
  - **Locator:** ${rec.source_locator || "N/A"}
  - **DOI:** ${rec.doi ? `https://doi.org/${rec.doi}` : "None"}
  - **Research Source:** [${rec.psi_id || rec.id}](${rec.source_url})
  - **Internal Attribution / Review Note:** ${rec.verified_by || "No independent validation recorded"}

`;
  }

  md += `---

## 2. Environmental Applicability & Physical Confounders

`;

  if (records.length >= 2) {
    const comp = compareInvestigations(records);
    md += `> [!IMPORTANT]
> **${comp.aggregationWarning}**

`;
    if (comp.confounders.length > 0) {
      md += `### Detected Confounders Between Selected Studies:\n`;
      for (const c of comp.confounders) {
        md += `- **${c.title} (${c.severity.toUpperCase()}):** ${c.description}\n`;
      }
      md += `\n`;
    }
  }

  for (const rec of records) {
    const assess = assessApplicability(rec, query);
    if (assess.differences.length > 0) {
      md += `- **${rec.investigation}:** ${assess.differences.join("; ")}\n`;
    }
  }

  md += `
- **Flow Velocity Boundaries:** Differences between quiescent and forced flow affect oxidizer delivery and flame behavior. Do not interpolate numerically across regimes without a validated model.
- **Scale and Enclosure Geometry:** Flight investigations can differ greatly in fuel size, enclosure geometry, ventilation and instrumentation. Treat cross-study comparisons as qualitative unless conditions are controlled.

---

## 3. Stated Scientific Limitations & Unknowns

`;

  const allLimits: string[] = [];
  for (const rec of records) {
    for (const lim of rec.limitations) {
      allLimits.push(`- [${rec.id}] ${lim}`);
    }
  }

  md += allLimits.join("\n") + "\n\n";

  md += `---

## 4. Next Research Inquiry
1. Confirm the original source and internal review status of each finding before relying on it.
2. Identify which material, gravity, pressure, oxygen or airflow conditions differ from the proposed habitat.
3. Seek further flight evidence or propose a controlled experiment to address those gaps.
`;

  return {
    title: `Evidence Brief (${records.length} Investigations)`,
    generatedAt: timestamp,
    corpusVersion,
    querySummary,
    markdownContent: md,
    citedRecordIds: citedIds,
  };
}
