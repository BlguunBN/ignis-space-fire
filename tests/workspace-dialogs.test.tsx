import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { SourcesModal } from "../src/components/SourcesModal";
import { PDFEvidenceViewer } from "../src/components/PDFEvidenceViewer";
import records from "../src/data/experiments.json";
import { ExperimentRecord } from "../src/types/evidence";

test("sources provide a named dialog, search and honest missing measurements", () => {
  const record: ExperimentRecord = { ...(records[0] as ExperimentRecord), oxygen_pct: null, airflow_cm_s: null };
  const html = renderToStaticMarkup(<SourcesModal isOpen onClose={() => {}} records={[record]} />);
  assert.match(html, /role="dialog"/);
  assert.match(html, /aria-label="Search sources"/);
  assert.match(html, /autofocus=""/);
  assert.match(html, /Oxygen not stated/);
  assert.match(html, /Airflow not stated/);
  assert.match(html, /aria-label="Close sources"/);
});

test("evidence viewer distinguishes a recorded finding from a source document", () => {
  const record: ExperimentRecord = { ...(records[0] as ExperimentRecord), claim_locator_details: undefined, oxygen_pct: null, airflow_cm_s: null, pressure_kpa: null };
  const html = renderToStaticMarkup(<PDFEvidenceViewer isOpen onClose={() => {}} record={record} />);
  assert.match(html, /Recorded finding/);
  assert.match(html, /Open source/);
  assert.match(html, /Not stated/);
  assert.doesNotMatch(html, /Page 4 of 28|NASA Primary Source Verified|Verified Evidence Passage/);
});

test("evidence viewer does not expose unsafe source links", () => {
  const record: ExperimentRecord = { ...(records[0] as ExperimentRecord), claim_locator_details: undefined, source_url: "javascript:alert(1)" };
  const html = renderToStaticMarkup(<PDFEvidenceViewer isOpen onClose={() => {}} record={record} />);
  assert.doesNotMatch(html, /href="javascript:/);
});

