import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { PaperVisualStoryboard } from "../components/papers/PaperVisualStoryboard";
import experiments from "../data/experiments.json";
import packages from "../data/visualizations.json";
import type { ExperimentRecord } from "../types/evidence";
import type { VisualExperimentPackage } from "../types/visualization";

test("Studio does not display GEL images or the unverified sequence for another experiment", () => {
  const records = experiments as ExperimentRecord[];
  const pkg = (packages as VisualExperimentPackage[]).find(p => p.experimentId === "sofie-gel")!;
  const saffire = records.find(e => e.id === "saffire-1")!;
  const markup = renderToStaticMarkup(<PaperVisualStoryboard experiment={saffire} pkg={pkg} />);
  assert.match(markup, /No source-matched imagery/);
  assert.match(markup, /No source-matched frame sequence/);
  assert.doesNotMatch(markup, /NASA provides a GEL snapshot montage/);
  assert.doesNotMatch(markup, /sofie-gel\/frames|sofie-gel-pmma/);
});

test("GEL Studio uses its source-linked still and withholds the unmatched sequence", () => {
  const exp = (experiments as ExperimentRecord[]).find(e => e.id === "sofie-gel")!;
  const pkg = (packages as VisualExperimentPackage[]).find(p => p.experimentId === exp.id)!;
  const markup = renderToStaticMarkup(<PaperVisualStoryboard experiment={exp} pkg={pkg} />);
  assert.match(markup, /sofie-gel-pmma-1080p\.png/);
  assert.match(markup, /Zoom in/);
  assert.match(markup, /Reset view/);
  assert.doesNotMatch(markup, /sofie-gel\/frames/);
  assert.match(markup, /Frame ordering and crops need review/);
});

test("GEL's unsupported indexed numbers and DOI are withheld without mutating raw data", async () => {
  const { sourceReviewedRecords } = await import("../lib/sourceReviewedRecords");
  const raw = (experiments as ExperimentRecord[]).find(e => e.id === "sofie-gel")!;
  const reviewed = sourceReviewedRecords([raw])[0];
  assert.equal(reviewed.oxygen_pct, null);
  assert.equal(reviewed.airflow_cm_s, null);
  assert.equal(reviewed.pressure_kpa, null);
  assert.equal(reviewed.doi, undefined);
  assert.equal(reviewed.verification_status, "needs_review");
  assert.notEqual(raw.oxygen_pct, null);
});

test("PSI citations use NASA identifiers and omit known unresolved or mismatched DOIs", async () => {
  const { sourceReviewedRecords } = await import("../lib/sourceReviewedRecords");
  const records = sourceReviewedRecords(experiments as ExperimentRecord[]);
  assert.equal(records.find(e => e.id === "saffire-2")?.doi, "10.60555/2chp-m469");
  assert.equal(records.find(e => e.id === "same-r-smoke")?.doi, "10.60555/2np7-jv14");
  assert.equal(records.find(e => e.id === "spice-soot")?.doi, "10.60555/9kbh-e962");
  assert.equal(records.find(e => e.id === "saffire-4")?.doi, undefined);
  assert.equal(records.find(e => e.id === "bass-2-cylinders")?.doi, undefined);
});
