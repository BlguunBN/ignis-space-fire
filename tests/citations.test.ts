import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { formatCitations, generateCslJson } from "../src/lib/citations";
import experimentsData from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";

const records = experimentsData as ExperimentRecord[];

describe("Citation.js Scholarly Reference Formatter", () => {
  const saffire1 = records.find((r) => r.id === "saffire-1")!;
  const bassPmma = records.find((r) => r.id === "bass-2-pmma")!;

  it("converts experiment record to valid CSL-JSON schema", () => {
    const csl = generateCslJson(saffire1);
    assert.equal(csl.id, "saffire-1");
    assert.equal(csl.type, "article-journal");
    assert.equal(csl.title, "Saffire-I Flight Experiment");
    assert.equal(csl.DOI, "10.60555/0t15-1z43");
    assert.ok(csl.URL);
    assert.ok(csl.issued["date-parts"][0][0]);
  });

  it("formats citations in APA, BibTeX, RIS, and IEEE formats", () => {
    const cites = formatCitations(saffire1);

    // APA
    assert.ok(cites.apa.includes("Saffire-I Flight Experiment"), "APA must include title");
    assert.ok(cites.apa.includes("10.60555/0t15-1z43"), "APA must include DOI");

    // BibTeX
    assert.ok(cites.bibtex.includes("@article{"), "BibTeX must contain @article");
    assert.ok(cites.bibtex.includes("Saffire"), "BibTeX must contain study name");
    assert.ok(cites.bibtex.includes("title = "), "BibTeX must contain title field");
    assert.ok(cites.bibtex.includes("10.60555/0t15-1z43"), "BibTeX must contain DOI");

    // RIS
    assert.ok(cites.ris.includes("TY  - JOUR"), "RIS must start with TY - JOUR");
    assert.ok(cites.ris.includes("TI  - Saffire-I Flight Experiment"), "RIS must have TI tag");
    assert.ok(cites.ris.includes("DO  - 10.60555/0t15-1z43"), "RIS must have DO tag");

    // IEEE
    assert.ok(cites.ieee.includes('"Saffire-I Flight Experiment,"'), "IEEE must contain quoted title");
    assert.ok(cites.ieee.includes("NASA Physical Sciences Informatics (PSI)"), "IEEE must contain journal");
  });

  it("extracts author names from verified_by or locator", () => {
    const cites = formatCitations(bassPmma);
    assert.ok(cites.apa.includes("Bhattacharjee"), "Should detect Bhattacharjee from verified_by");
    assert.ok(cites.bibtex.includes("Bhattacharjee"), "BibTeX should contain author");
  });
});
