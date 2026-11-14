import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { POST } from "../app/api/interpret/route";
import { parseModelInterpretation } from "../lib/synthesis";

function request(body: unknown) {
  return new NextRequest("http://localhost/api/interpret", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
}

test("invalid and unknown evidence requests are rejected without internal details", async () => {
  for (const body of [
    { query: { material: 42 }, experimentIds: ["saffire-1"] },
    { query: {}, experimentIds: ["saffire-1", "unknown"] },
    { query: { pressureKpa: -1 }, experimentIds: ["saffire-1"] },
  ]) {
    const result = await POST(request(body));
    assert.equal(result.status, 400);
    assert.equal((await result.json()).details, undefined);
  }
});

test("empty evidence does not expand to all experiments", async () => {
  const result = await POST(request({ query: {}, experimentIds: [] }));
  assert.equal(result.status, 200);
  const body = await result.json();
  assert.equal(body.citedSources.length, 0);
  assert.equal(body.observations.length, 0);
});

test("model explanations reject unknown sources and injected URLs", () => {
  assert.equal(parseModelInterpretation({ relevance: [{ text: "Finding", evidenceIds: ["unknown"] }], unknowns: [] }, ["saffire-1"]), null);
  assert.equal(parseModelInterpretation({ relevance: [{ text: "See https://example.com", evidenceIds: ["saffire-1"] }], unknowns: [] }, ["saffire-1"]), null);
});
