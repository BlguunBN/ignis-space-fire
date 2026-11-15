import { test } from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET, POST, PATCH } from "../src/app/api/ingestion/route";
import { POST as audit } from "../src/app/api/ingestion/agent-audit/route";
import { POST as scrape } from "../src/app/api/ingestion/scrape/route";

test("private ingestion endpoints reject anonymous requests before processing", async () => {
  for (const [handler, method, path] of [[GET, "GET", ""], [POST, "POST", ""], [PATCH, "PATCH", ""], [audit, "POST", "/agent-audit"], [scrape, "POST", "/scrape"]] as const) {
    const req = new NextRequest(`http://localhost/api/ingestion${path}`, { method });
    assert.equal((await handler(req)).status, 401, `${method} ${path}`);
  }
});

test("a signed-in researcher cannot review by supplying a reviewer name", async () => {
  const originalFetch = globalThis.fetch;
  const previous = { ...process.env };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  globalThis.fetch = async (input) => {
    const url = String(input);
    if (url.includes("/auth/v1/user")) return Response.json({ id: "00000000-0000-0000-0000-000000000001", email: "researcher@example.test", aud: "authenticated" });
    if (url.includes("/rest/v1/researcher_roles")) return Response.json(null);
    throw new Error(`Unexpected request: ${url}`);
  };
  try {
    const request = new NextRequest("http://localhost/api/ingestion", { method: "PATCH", headers: { Authorization: "Bearer test-token", "Content-Type": "application/json" }, body: JSON.stringify({ stagedId: "candidate", decision: "APPROVED_FOR_CORPUS", reviewerName: "Administrator" }) });
    assert.equal((await PATCH(request)).status, 403);
  } finally {
    globalThis.fetch = originalFetch;
    process.env = previous;
  }
});

test("a researcher only receives their own staging records", async () => {
  const originalFetch = globalThis.fetch;
  const previous = { ...process.env };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-service-key";
  let ownerFilter = "";
  globalThis.fetch = async input => {
    const url = new URL(String(input));
    if (url.pathname === "/auth/v1/user") return Response.json({ id: "researcher-a", email: "a@example.test", aud: "authenticated" });
    if (url.pathname === "/rest/v1/researcher_roles") return Response.json(null);
    if (url.pathname === "/rest/v1/staged_candidates") { ownerFilter = url.searchParams.get("owner_id") || ""; return Response.json([]); }
    throw new Error(`Unexpected request: ${url.pathname}`);
  };
  try {
    const request = new NextRequest("http://localhost/api/ingestion?owner_id=researcher-b", { headers: { Authorization: "Bearer test-token" } });
    assert.equal((await GET(request)).status, 200);
    assert.equal(ownerFilter, "eq.researcher-a");
  } finally { globalThis.fetch = originalFetch; process.env = previous; }
});
