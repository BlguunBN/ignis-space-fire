import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ResearchExplorerGrid } from "../src/components/ResearchExplorerGrid";
import { TelemetryChart } from "../src/components/TelemetryChart";
import records from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";

const record: ExperimentRecord = { ...(records[0] as ExperimentRecord), oxygen_pct: null, pressure_kpa: null, airflow_cm_s: null };

test("explorer describes missing measurements without inventing values", () => {
  const html = renderToStaticMarkup(<ResearchExplorerGrid records={[record]} selectedIds={new Set()} onToggleSelect={() => {}} onInspect={() => {}} onOpenPdf={() => {}} />);
  assert.match(html, /Search studies/);
  assert.match(html, /Not stated/);
  assert.doesNotMatch(html, /14–17%|Evidence tier<\/span>.*?90%/);
});

test("chart explains when the selected studies cannot be plotted", () => {
  const html = renderToStaticMarkup(<TelemetryChart records={[record]} activeId={null} onSelectRecord={() => {}} />);
  assert.match(html, /No studies have both oxygen and airflow measurements/);
});

test("explorer limits the initial result cards and offers more", () => {
  const many = Array.from({ length: 13 }, (_, index) => ({ ...record, id: `study-${index}` }));
  const html = renderToStaticMarkup(<ResearchExplorerGrid records={many} selectedIds={new Set()} onToggleSelect={() => {}} onInspect={() => {}} onOpenPdf={() => {}} />);
  assert.match(html, /Show more studies/);
  assert.doesNotMatch(html, /STUDY-12/);
});

test("an unclassified study is not labeled as an extinction result", () => {
  const unknown: ExperimentRecord = { ...record, investigation: "Study A", finding: "Observation recorded", fire_safety_relevance: "Under review" };
  const html = renderToStaticMarkup(<ResearchExplorerGrid records={[unknown]} selectedIds={new Set()} onToggleSelect={() => {}} onInspect={() => {}} onOpenPdf={() => {}} />);
  assert.match(html, /Other topic/);
  assert.match(html, /Library order/);
  assert.doesNotMatch(html, /Mission relevance/);
});
