import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  extractScientificTelemetryVLM,
  VLMExtractionResult,
  BoundingBox,
  ExtractedTableSeries,
} from "../src/lib/vlm-extractor";

describe("Multi-Modal Document Extraction & PDF Bounding Box Locator Agent (Phase 1)", () => {
  const samplePaperTextWithTable = `
NASA Technical Memorandum: NASA-TM-2024-SoFIE-GEL
Solid Fuel Ignition and Extinction in Low-Speed Cabin Flows (SoFIE GEL)
Facility: ISS Combustion Integrated Rack (CIR)
Gravity Regime: Microgravity (0g)

Table 1: Test Matrix & Quenching Telemetry for PMMA Cylindrical Specimens
| Run ID | Specimen | Diameter (mm) | Oxygen (%) | Pressure (kPa) | Airflow (cm/s) | Spread Rate (mm/s) | Outcome |
| GEL-01 | PMMA     | 30.0          | 34.0       | 101.3          | 4.5            | 0.42               | Steady  |
| GEL-02 | PMMA     | 30.0          | 28.0       | 101.3          | 4.5            | 0.12               | Quenched|
| GEL-03 | PMMA     | 20.0          | 25.0       | 70.0           | 2.0            | 0.28               | Steady  |

Extracted Finding:
Extinction limit for 30mm thick cylindrical PMMA requires minimum 34% O2 in sub-5 cm/s flow regimes due to internal conductive quenching. Thick samples undergo radiative and conductive heat loss exceeding chemical heat release below 34% oxygen concentration.
Apparatus: Cir MDCA radiometers, IR thermography, and OH* emission diagnostics.
DOI: 10.60555/0t15-sofie-gel
`;

  test("extracts physical telemetry including oxygen, pressure, airflow, and fuel dimensions", () => {
    const result: VLMExtractionResult = extractScientificTelemetryVLM(samplePaperTextWithTable, {
      filename: "NASA-TM-2024-SoFIE-GEL.pdf",
      title: "SoFIE GEL",
    });

    assert.ok(result);
    assert.strictEqual(typeof result.confidence, "number");
    assert.ok(result.confidence > 50);
    assert.strictEqual(result.telemetry.oxygenPct, 34.0);
    assert.strictEqual(result.telemetry.pressureKpa, 101.3);
    assert.strictEqual(result.telemetry.airflowCmS, 4.5);
    assert.strictEqual(result.telemetry.fuelMaterial, "PMMA");
    assert.ok(result.telemetry.fuelDimensionsMm);
    assert.strictEqual(result.telemetry.fuelDimensionsMm.diameterMm, 30.0);
    assert.strictEqual(result.telemetry.flameSpreadRateMmS, 0.42);
    assert.strictEqual(result.telemetry.extinctionLimitO2Pct, 34.0);
  });

  test("parses markdown and ASCII tables into structured TableSeries", () => {
    const result = extractScientificTelemetryVLM(samplePaperTextWithTable);

    assert.ok(Array.isArray(result.tables));
    assert.ok(result.tables.length >= 1);

    const table1: ExtractedTableSeries = result.tables[0];
    assert.ok(table1.headers.includes("Oxygen (%)") || table1.headers.some((h) => h.includes("Oxygen")));
    assert.ok(table1.rows.length >= 2);
  });

  test("generates normalized bounding boxes [ymin, xmin, ymax, xmax] with valid spatial geometry", () => {
    const result = extractScientificTelemetryVLM(samplePaperTextWithTable);

    assert.ok(Array.isArray(result.boundingBoxes));
    assert.ok(result.boundingBoxes.length >= 3);

    for (const bbox of result.boundingBoxes) {
      assert.ok(bbox.id.length > 0);
      assert.ok(bbox.pageNumber >= 1);
      assert.ok(bbox.label.length > 0);
      assert.strictEqual(bbox.box.length, 4);

      const [ymin, xmin, ymax, xmax] = bbox.box;
      assert.ok(ymin >= 0.0 && ymin <= 1.0, `ymin ${ymin} must be in [0, 1]`);
      assert.ok(xmin >= 0.0 && xmin <= 1.0, `xmin ${xmin} must be in [0, 1]`);
      assert.ok(ymax >= 0.0 && ymax <= 1.0, `ymax ${ymax} must be in [0, 1]`);
      assert.ok(xmax >= 0.0 && xmax <= 1.0, `xmax ${xmax} must be in [0, 1]`);
      assert.ok(ymin < ymax, `ymin (${ymin}) must be strictly less than ymax (${ymax})`);
      assert.ok(xmin < xmax, `xmin (${xmin}) must be strictly less than xmax (${xmax})`);
      assert.ok(bbox.textSnippet.length > 0);
    }
  });

  test("handles unstructured text via heuristic fallback with non-empty telemetry", () => {
    const unstructured = "Methanol droplet combustion aboard ISS at 21% O2 and 101.3 kPa with 0 cm/s flow. Extinction at 0.94 mm.";
    const result = extractScientificTelemetryVLM(unstructured);

    assert.ok(result);
    assert.strictEqual(result.telemetry.oxygenPct, 21);
    assert.strictEqual(result.telemetry.pressureKpa, 101.3);
    assert.strictEqual(result.telemetry.airflowCmS, 0);
    assert.ok(result.boundingBoxes.length > 0);
  });
});
