import { describe, it } from "node:test";
import assert from "node:assert/strict";
import experimentsData from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";
import { formatCitations } from "../src/lib/citations";

const records = experimentsData as ExperimentRecord[];

describe("Stage 2 Primary PDF Evidence & Bounding Box Inspection", () => {
  it("every record has valid claim_locator_details with coordinate bounding box", () => {
    for (const rec of records) {
      assert.ok(rec.claim_locator_details, `Record ${rec.id} must have claim_locator_details`);
      const loc = rec.claim_locator_details;

      assert.ok(loc.claimId.startsWith("CLM-"), `Claim ID must start with CLM-: ${loc.claimId}`);
      assert.ok(loc.pageNumber > 0, `Page number must be positive: ${loc.pageNumber}`);
      assert.ok(loc.section, `Must have section: ${loc.section}`);
      assert.ok(loc.quote, `Must have quote: ${loc.quote}`);
      assert.ok(loc.reviewer, `Must have reviewer: ${loc.reviewer}`);

      // Bounding box coordinates
      const box = loc.boundingBox;
      assert.ok(box, `Must have boundingBox for ${rec.id}`);
      assert.ok(box.x >= 0 && box.x <= 100, `Box X must be 0-100: ${box.x}`);
      assert.ok(box.y >= 0 && box.y <= 100, `Box Y must be 0-100: ${box.y}`);
      assert.ok(box.width > 0 && box.width <= 100, `Box Width must be >0 and <=100: ${box.width}`);
      assert.ok(box.height > 0 && box.height <= 100, `Box Height must be >0 and <=100: ${box.height}`);
      assert.ok(box.x + box.width <= 100, `Box right edge must be <=100%: ${box.x + box.width}`);
      assert.ok(box.y + box.height <= 100, `Box bottom edge must be <=100%: ${box.y + box.height}`);
    }
  });

  it("formats citations for all records without throwing", () => {
    for (const rec of records) {
      const cites = formatCitations(rec);
      assert.ok(cites.apa.length > 10, `APA citation missing for ${rec.id}`);
      assert.ok(cites.bibtex.includes("@article"), `BibTeX citation missing for ${rec.id}`);
      assert.ok(cites.ris.includes("TY  -"), `RIS citation missing for ${rec.id}`);
      assert.ok(cites.ieee.includes("[1]"), `IEEE citation missing for ${rec.id}`);
    }
  });

  it("verifies Saffire-I primary bounding box points to Table 1", () => {
    const saffire1 = records.find((r) => r.id === "saffire-1")!;
    const loc = saffire1.claim_locator_details!;
    assert.equal(loc.pageNumber, 4);
    assert.ok(loc.tableOrFigure?.includes("Table 1"));
    assert.equal(loc.reviewStatus, "verified");
    assert.ok(loc.reviewer.includes("IGNIS team source check"));
  });
});
