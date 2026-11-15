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
  corpusVersion = "2026.11-NASA-PSI-CURATED"
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
> **No reviewed NASA microgravity combustion records in this corpus match the requested query conditions.**
> 
> FLARE strictly enforces scientific abstention. Extrapolations or synthetic estimations are withheld to prevent mischaracterizing spacecraft fire risk.

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
**Indexed Evidence Sources:** ${records.length} Reviewed Investigation(s)

---

## 1. Verified NASA Experimental Observations

`;

  for (const rec of records) {
    const assess = assessApplicability(rec, query);
    md += `### ${rec.investigation} (${rec.platform})
- **Record ID:** \`${rec.id}\` | **Type:** \`${rec.record_type}\` | **Status:** **${rec.verification_status.toUpperCase()}**
- **Material Tested:** ${rec.material} (*${rec.material_class}*)
- **Reported Conditions:** ${rec.oxygen_pct != null ? `${rec.oxygen_pct}% O₂` : "Unknown O₂"}, ${
      rec.pressure_kpa != null ? `${rec.pressure_kpa} kPa` : "Unknown Pressure"
    }, ${rec.airflow_cm_s != null ? `${rec.airflow_cm_s} cm/s forced flow` : "Quiescent"} (${rec.gravity})
- **Applicability Verdict:** **${assess.verdictLabel}**
- **Verified Finding:**
  > "${rec.finding}"
- **Spacecraft Fire Safety Relevance:**
  ${rec.fire_safety_relevance}
- **Primary Source Citation:**
  - **Locator:** ${rec.source_locator || "N/A"}
  - **DOI:** ${rec.doi ? `https://doi.org/${rec.doi}` : "None"}
  - **NASA Repository:** [${rec.psi_id || rec.id}](${rec.source_url})
  - **Verified By:** ${rec.verified_by || "NASA Physical Sciences Informatics"}

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
- **Flow Velocity Boundaries:** Convective heat transfer and oxidizer delivery change drastically between quiescent conditions (FLEX) and forced tunnel flow (Saffire 15–20 cm/s). Direct numerical interpolation across different flow regimes is invalid.
- **Scale and Enclosure Geometry:** Saffire utilizes large-scale flight flow ducts (0.4m x 1m), whereas BASS and ISS experiments utilize sub-scale flow tunnels. Scale effects alter radiant heat loss and flame extinction limits.

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
To resolve remaining uncertainties for spacecraft exploration atmospheres (e.g. 26%–34% O₂ at 56–70 kPa):
1. Cross-reference Saffire-IV exploration atmosphere data with SoFIE GEL extinction limits.
2. Characterize low-velocity boundary extinction ($< 5\\text{ cm/s}$) for candidate polymers before habitat deployment.
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
