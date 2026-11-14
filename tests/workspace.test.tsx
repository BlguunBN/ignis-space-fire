import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ResearchWorkspace } from "../components/research/ResearchWorkspace";
import { createInquiryKey } from "../lib/inquiry";

test("research workspace opens with a question and an empty comparison", () => {
  const html = renderToStaticMarkup(<ResearchWorkspace />);
  assert.match(html, /What would you like to investigate/);
  assert.match(html, /Compare \(0\/2\)/);
  assert.match(html, /Sources &amp; Methods/);
  assert.doesNotMatch(html, /Simulation Lab|99%|CALIBRATED MODEL/);
});

test("inquiry identity includes conditions, selection and corpus version", () => {
  const first = createInquiryKey({ pressureKpa: 100 }, ["b", "a"], "v1");
  assert.equal(first, createInquiryKey({ pressureKpa: 100 }, ["a", "b"], "v1"));
  assert.notEqual(first, createInquiryKey({ pressureKpa: 500 }, ["a", "b"], "v1"));
  assert.notEqual(first, createInquiryKey({ pressureKpa: 100 }, ["a", "b"], "v2"));
});
