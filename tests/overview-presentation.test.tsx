import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ExecutiveAnalyticsDashboard } from "../src/components/ExecutiveAnalyticsDashboard";
import records from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";

test("overview reports source quality without inventing missing measurements", () => {
  const record: ExperimentRecord = { ...(records[0] as ExperimentRecord), oxygen_pct: null, pressure_kpa: null };
  const html = renderToStaticMarkup(<ExecutiveAnalyticsDashboard records={[record]} />);
  assert.match(html, /Source quality/);
  assert.match(html, /0 studies with oxygen measurements/);
  assert.doesNotMatch(html, /69%|90%|0\.2–0\.4 atm/);
});
