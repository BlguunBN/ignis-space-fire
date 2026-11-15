import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ExecutiveAnalyticsDashboard } from "../src/components/ExecutiveAnalyticsDashboard";
import records from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";

test("overview reports source quality without inventing missing measurements", () => {
  const record: ExperimentRecord = {
    ...(records[0] as ExperimentRecord),
    oxygen_pct: null,
    pressure_kpa: null,
    airflow_cm_s: null,
  };
  const html = renderToStaticMarkup(<ExecutiveAnalyticsDashboard records={[record]} />);
  assert.match(html, /Source quality/);
  assert.match(html, /0 records with oxygen measurements/);
  assert.match(html, /0 records with airflow measurements/);
  assert.match(html, /Evidence coverage/);
  assert.match(html, /Missing values are never treated as zero/);
  assert.doesNotMatch(html, /69%|90%|0\.2–0\.4 atm/);
});

test("overview renders honest evidence provenance and real entrypoints", () => {
  const html = renderToStaticMarkup(
    <ExecutiveAnalyticsDashboard
      records={records as ExperimentRecord[]}
      onOpenExplorer={() => {}}
      onOpenSimulator={() => {}}
      onOpenAssistant={() => {}}
      onOpenCoverage={() => {}}
    />
  );
  assert.match(html, /Indexed records/);
  assert.match(html, /NASA PSI records/);
  assert.match(html, /Open flame lab/);
  assert.match(html, /Full coverage map/);
  assert.match(html, /Ask the evidence/);
  assert.match(html, /not proof that no research exists/);
});
