import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { compareInvestigations } from "../src/lib/comparison";
import experimentsData from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";

const records = experimentsData as ExperimentRecord[];

describe("Cross-Investigation Comparison Engine", () => {
  const saffire1 = records.find((r) => r.id === "saffire-1")!;
  const bassPmma = records.find((r) => r.id === "bass-2-pmma")!;
  const saffireV2 = records.find((r) => r.id === "reg-record-002")!;
  const bass032 = records.find((r) => r.id === "reg-record-032")!;
  const flexDroplet = records.find((r) => r.id === "flex-droplet-1")!;

  it("handles single record by reporting insufficient records", () => {
    const comp = compareInvestigations([saffire1]);
    assert.equal(comp.canQuantitativelyAggregate, false);
    assert.ok(comp.aggregationWarning.includes("At least two investigations"));
  });

  it("detects apparatus scale disparity between Saffire and BASS", () => {
    const comp = compareInvestigations([saffire1, bass032]);
    assert.equal(comp.canQuantitativelyAggregate, false);

    const scaleConfounder = comp.confounders.find((c) => c.type === "SCALE_DISPARITY");
    assert.ok(scaleConfounder, "Must detect scale disparity between Saffire and BASS");
    assert.ok(scaleConfounder?.description.includes("0.4 m x 1.0 m"));

    const flowConfounder = comp.confounders.find((c) => c.type === "FLOW_REGIME");
    assert.ok(flowConfounder, "Must detect flow disparity (20 cm/s vs 2.2 cm/s)");
  });

  it("detects pressure variance between standard and exploration atmospheres", () => {
    const comp = compareInvestigations([saffire1, saffireV2]);
    const pressureConfounder = comp.confounders.find((c) => c.type === "PRESSURE_VARIANCE");
    assert.ok(pressureConfounder, "Must detect pressure variance (101.3 kPa vs 70.7 kPa)");
    assert.ok(comp.divergentConditions.some((d) => d.includes("Divergent Pressure")));
  });

  it("detects geometry disparity between liquid droplets and solid slabs", () => {
    const comp = compareInvestigations([bassPmma, flexDroplet]);
    const geomConfounder = comp.confounders.find((c) => c.type === "GEOMETRY_DIFFERENCE");
    assert.ok(geomConfounder, "Must detect fuel phase/geometry difference");
  });

  it("strictly enforces that quantitative aggregation is false", () => {
    const comp = compareInvestigations([saffire1, bassPmma]);
    assert.equal(comp.canQuantitativelyAggregate, false);
    assert.ok(comp.aggregationWarning.includes("SCIENTIFIC INVARIANT"));
  });
});
