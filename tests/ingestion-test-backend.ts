import { candidateToRow } from "../src/lib/supabase-db";
import { getStagingQueue } from "../src/lib/ingestion";

export const reviewerHeaders = { Authorization: "Bearer reviewer-token" };

export function installIngestionTestBackend() {
  const previousFetch = globalThis.fetch;
  const previousEnvironment = { ...process.env };
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test-project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "test-admin";
  const staged = new Map(getStagingQueue().map(item => [item.stagedId, { ...candidateToRow(item), owner_id: null }]));
  globalThis.fetch = async (input, init) => {
    const url = new URL(String(input));
    if (url.hostname !== "test-project.supabase.co") return previousFetch(input, init);
    if (url.pathname === "/auth/v1/user") return Response.json({ id: "00000000-0000-0000-0000-000000000001", email: "reviewer@example.test", aud: "authenticated" });
    if (url.pathname === "/rest/v1/researcher_roles") return Response.json({ role: "reviewer" });
    if (url.pathname === "/rest/v1/rpc/review_research_submission") {
      const review = JSON.parse(String(init?.body));
      const row = staged.get(review.p_staged_id);
      if (!row) return Response.json({ message: "Not found" }, { status: 404 });
      staged.set(review.p_staged_id, { ...row, review_status: review.p_decision, reviewer_name: review.p_reviewer, reviewer_notes: review.p_notes, review_decision_date: new Date().toISOString() });
      return new Response(null, { status: 204 });
    }
    if (url.pathname === "/rest/v1/corpus_experiments") return new Response(null, { status: 201 });
    if (url.pathname === "/rest/v1/staged_candidates") {
      const method = init?.method || "GET";
      if (method === "POST") {
        const row = JSON.parse(String(init?.body));
        staged.set(row.staged_id, row);
        return new Response(null, { status: 201 });
      }
      const id = url.searchParams.get("staged_id")?.replace(/^eq\./, "");
      if (method === "PATCH" && id) {
        const row = staged.get(id);
        if (row) staged.set(id, { ...row, ...JSON.parse(String(init?.body)) });
        return new Response(null, { status: 204 });
      }
      const rows = id ? [...staged.values()].filter(row => row.staged_id === id) : [...staged.values()];
      return Response.json(rows);
    }
    throw new Error(`Unexpected test request: ${url.pathname}`);
  };
  return () => { globalThis.fetch = previousFetch; process.env = previousEnvironment; };
}
