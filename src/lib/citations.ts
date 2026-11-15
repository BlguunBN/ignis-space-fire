import Cite from "citation-js";
import { ExperimentRecord } from "../types/evidence";

export interface FormattedCitations {
  apa: string;
  bibtex: string;
  ris: string;
  ieee: string;
}

export function generateCslJson(record: ExperimentRecord): any {
  // Extract authors if in source_locator, verified_by, or fallback to NASA GRC
  let authorFamily = "NASA Physical Sciences Research Team";
  let authorGiven = "";

  const textToScan = `${record.source_locator || ""} ${record.investigation || ""} ${record.verified_by || ""}`;
  const locatorMatch = (record.source_locator || "").match(/([A-Z][a-z]+)\s+et\s+al/i);

  if (locatorMatch) {
    authorFamily = locatorMatch[1];
  } else if (record.verified_by && record.verified_by.includes("et al") && !record.verified_by.includes("IGNIS") && !record.verified_by.includes("FLARE")) {
    const parts = record.verified_by.split("et al")[0].trim().split(" ");
    authorFamily = parts[parts.length - 1];
    authorGiven = parts.slice(0, parts.length - 1).join(" ");
  } else if (/bhattacharjee/i.test(textToScan) || record.id.startsWith("bass-")) {
    authorFamily = "Bhattacharjee";
    authorGiven = "S.";
  } else if (/urban/i.test(textToScan) || record.id.startsWith("saffire-")) {
    authorFamily = "Urban";
    authorGiven = "D. L.";
  } else if (/olson/i.test(textToScan)) {
    authorFamily = "Olson";
    authorGiven = "S.";
  } else if (/ferkul/i.test(textToScan)) {
    authorFamily = "Ferkul";
    authorGiven = "P.";
  }

  // Extract year from locator or default
  let year = 2021;
  const yearMatch = (record.source_locator || "").match(/20\d\d/);
  if (yearMatch) {
    year = parseInt(yearMatch[0], 10);
  }

  return {
    id: record.id,
    type: "article-journal",
    title: record.investigation,
    author: [{ family: authorFamily, given: authorGiven }],
    issued: { "date-parts": [[year]] },
    "container-title": "NASA Physical Sciences Informatics (PSI)",
    DOI: record.doi || undefined,
    URL: record.source_url,
    note: record.source_locator ? `Locator: ${record.source_locator}` : undefined,
  };
}

export function formatCitations(record: ExperimentRecord): FormattedCitations {
  const csl = generateCslJson(record);

  let apa = "";
  let bibtex = "";
  let ris = "";
  let ieee = "";

  try {
    const cite = new Cite(csl);

    apa = cite.format("bibliography", { template: "apa", format: "text" }).trim();
    bibtex = cite.format("bibtex").trim();
    ris = cite.format("ris").trim();
  } catch (err) {
    // Graceful fallback
    apa = `${csl.author[0].family}. (${csl.issued["date-parts"][0][0]}). ${record.investigation}. NASA PSI Repository. ${
      record.doi ? `https://doi.org/${record.doi}` : record.source_url
    } (Locator: ${record.source_locator || "N/A"})`;

    bibtex = `@article{nasa_${record.id.replace(/-/g, "_")},
  title = {${record.investigation}},
  author = {${csl.author[0].family}},
  journal = {NASA Physical Sciences Informatics},
  year = {${csl.issued["date-parts"][0][0]}},
  doi = {${record.doi || "N/A"}},
  url = {${record.source_url}},
  note = {${record.source_locator || "N/A"}}
}`;

    ris = `TY  - JOUR
AU  - ${csl.author[0].family}
TI  - ${record.investigation}
PY  - ${csl.issued["date-parts"][0][0]}
DO  - ${record.doi || ""}
UR  - ${record.source_url}
N1  - ${record.source_locator || ""}
ER  - `;
  }

  // IEEE format
  const authorInit = csl.author[0].given ? `${csl.author[0].given[0]}. ` : "";
  ieee = `[1] ${authorInit}${csl.author[0].family}, "${record.investigation}," NASA Physical Sciences Informatics (PSI), ${
    csl.issued["date-parts"][0][0]
  }.${record.doi ? ` doi: ${record.doi}.` : ""} [Online]. Available: ${record.source_url}. (Locator: ${
    record.source_locator || "N/A"
  })`;

  return { apa, bibtex, ris, ieee };
}
