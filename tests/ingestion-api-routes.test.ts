import { test, describe, before, after } from "node:test";
import { installIngestionTestBackend, reviewerHeaders } from "./ingestion-test-backend";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { GET, POST as POST_INGEST, PATCH as PATCH_INGEST } from "../src/app/api/ingestion/route";
import { POST as POST_SCRAPE } from "../src/app/api/ingestion/scrape/route";
import { getStagingQueue } from "../src/lib/ingestion";

let restoreBackend: () => void;
before(() => { restoreBackend = installIngestionTestBackend(); });
after(() => restoreBackend());

describe("Ingestion API Routes (/api/ingestion)", () => {
  test("GET /api/ingestion returns current staging queue", async () => {
    const res = await GET(new NextRequest("http://localhost:3000/api/ingestion", { headers: reviewerHeaders }));
    assert.strictEqual(res.status, 200);

    const data = await res.json();
    assert.ok(Array.isArray(data.queue));
    assert.ok(data.total >= 2);
    assert.strictEqual(data.total, data.queue.length);
  });

  test("POST /api/ingestion stages a new candidate report into the queue", async () => {
    const payload = {
      documentTitle: "SoFIE MIST: Material Ignition and Spread in Microgravity",
      filename: "NASA-TM-2024-SoFIE-MIST.pdf",
      candidateProgramme: "SoFIE",
      candidatePlatform: "ISS Combustion Integrated Rack",
      candidateMaterial: "thin PMMA sheet",
      candidateOxygenPct: 21,
      candidateAirflowCmS: 10,
      candidatePressureKpa: 101.3,
      extractedFinding: "Flame spread rate on thin PMMA measured at 1.8 mm/s under 10 cm/s flow.",
      extractedQuote: "Steady spread achieved with 10 cm/s opposed airflow in microgravity.",
      pageNumber: 7,
      sourceLocator: "NASA Glenn Research Center / SoFIE Table 2",
      doi: "10.60555/sofie-mist-01",
    };

    const req = new NextRequest("http://localhost:3000/api/ingestion", {
      method: "POST",
      headers: reviewerHeaders,
      body: JSON.stringify(payload),
    });

    const res = await POST_INGEST(req);
    assert.strictEqual(res.status, 201);

    const data = await res.json();
    assert.strictEqual(data.success, true);
    assert.ok(data.staged?.stagedId.startsWith("staged-"));
    assert.strictEqual(data.staged.reviewStatus, "PENDING_REVIEW");

    // Verify it is now in the queue
    const queue = getStagingQueue();
    const found = queue.find((q) => q.stagedId === data.staged.stagedId);
    assert.ok(found);
  });

  test("PATCH /api/ingestion approves candidate and returns promoted ExperimentRecord", async () => {
    // Stage first
    const stageReq = new NextRequest("http://localhost:3000/api/ingestion", {
      method: "POST",
      headers: reviewerHeaders,
      body: JSON.stringify({
        documentTitle: "FLEX Heptane Droplet Microgravity Test Run #12",
        filename: "NASA-TM-FLEX-12.pdf",
        candidateProgramme: "FLEX",
        candidatePlatform: "ISS CIR / MDCA",
        candidateMaterial: "n-heptane droplet",
        candidateOxygenPct: 21,
        candidateAirflowCmS: 0,
        candidatePressureKpa: 101.3,
        extractedFinding: "Heptane droplet exhibited cool flame burning after radiative extinction.",
        extractedQuote: "Secondary cool-flame period persisted for 6.2 seconds.",
        pageNumber: 4,
        sourceLocator: "NASA PSI Archive PSI-69",
        doi: "10.60555/mbq8-0451",
      }),
    });
    const stageRes = await POST_INGEST(stageReq);
    const stageData = await stageRes.json();
    const stagedId = stageData.staged.stagedId;

    // Now review and approve
    const patchReq = new NextRequest("http://localhost:3000/api/ingestion", {
      method: "PATCH",
      headers: reviewerHeaders,
      body: JSON.stringify({
        stagedId,
        decision: "APPROVED_FOR_CORPUS",
        reviewerName: "reviewer@example.test",
        notes: "Extracted cool-flame parameters verified against raw CIR radiometer telemetry.",
      }),
    });

    const patchRes = await PATCH_INGEST(patchReq);
    assert.strictEqual(patchRes.status, 200);

    const patchData = await patchRes.json();
    assert.strictEqual(patchData.success, true);
    assert.strictEqual(patchData.updated.reviewStatus, "APPROVED_FOR_CORPUS");
    assert.strictEqual(patchData.updated.reviewerName, "reviewer@example.test");

    // Check promoted record
    assert.ok(patchData.promotedRecord);
    assert.strictEqual(patchData.promotedRecord.verification_status, "verified");
    assert.strictEqual(patchData.promotedRecord.quality, "primary_nasa");
    assert.strictEqual(patchData.promotedRecord.claim_locator_details?.reviewStatus, "verified");
    assert.strictEqual(patchData.promotedRecord.claim_locator_details?.reviewer, "reviewer@example.test");
  });

  test("PATCH /api/ingestion rejects candidate and isolates it", async () => {
    // Stage first
    const stageReq = new NextRequest("http://localhost:3000/api/ingestion", {
      method: "POST",
      headers: reviewerHeaders,
      body: JSON.stringify({
        documentTitle: "Ambiguous Low-Gravity Report",
        filename: "UNCONFIRMED-REPORT.pdf",
        candidateProgramme: "UNKNOWN",
        candidatePlatform: "Ground Test",
        candidateMaterial: "unspecified fuel",
        candidateOxygenPct: 21,
        candidateAirflowCmS: 0,
        candidatePressureKpa: 101.3,
        extractedFinding: "Unverified ground data.",
        extractedQuote: "Data collected without flight sensor calibration.",
        pageNumber: 1,
        sourceLocator: "Unverified",
      }),
    });
    const stageRes = await POST_INGEST(stageReq);
    const stageData = await stageRes.json();
    const stagedId = stageData.staged.stagedId;

    // Reject
    const patchReq = new NextRequest("http://localhost:3000/api/ingestion", {
      method: "PATCH",
      headers: reviewerHeaders,
      body: JSON.stringify({
        stagedId,
        decision: "REJECTED_UNVERIFIED",
        reviewerName: "NASA Flight Safety Lead",
        notes: "Sensor calibrations could not be corroborated.",
      }),
    });

    const patchRes = await PATCH_INGEST(patchReq);
    assert.strictEqual(patchRes.status, 200);

    const patchData = await patchRes.json();
    assert.strictEqual(patchData.success, true);
    assert.strictEqual(patchData.updated.reviewStatus, "REJECTED_UNVERIFIED");
    assert.strictEqual(patchData.promotedRecord, null);
  });

  test("end-to-end: Scraper stages PSI-102 and Ingestion API approves it", async () => {
    // Step 1: Scrape official NASA PSI-102
    const scrapeReq = new NextRequest("http://localhost:3000/api/ingestion/scrape", {
      method: "POST",
      headers: reviewerHeaders,
      body: JSON.stringify({
        url: "https://psi.nasa.gov/physci/repo/data/investigations/PSI-102",
      }),
    });

    const scrapeRes = await POST_SCRAPE(scrapeReq);
    assert.strictEqual(scrapeRes.status, 200);

    const scrapeData = await scrapeRes.json();
    assert.strictEqual(scrapeData.verdict, "STAGED_FOR_REVIEW");
    const stagedId = scrapeData.stagedRecord.stagedId;

    // Step 2: GET /api/ingestion and verify it appears at top of queue
    const getRes = await GET(new NextRequest("http://localhost:3000/api/ingestion", { headers: reviewerHeaders }));
    const getData = await getRes.json();
    const found = getData.queue.find((q: any) => q.stagedId === stagedId);
    assert.ok(found);
    assert.strictEqual(found.reviewStatus, "PENDING_REVIEW");

    // Step 3: Approve candidate via PATCH /api/ingestion
    const approveReq = new NextRequest("http://localhost:3000/api/ingestion", {
      method: "PATCH",
      headers: reviewerHeaders,
      body: JSON.stringify({
        stagedId,
        decision: "APPROVED_FOR_CORPUS",
        reviewerName: "Dr. Paul Ferkul (NASA GRC)",
        notes: "SAME smoke sensor calibrations validated against flight record.",
      }),
    });

    const approveRes = await PATCH_INGEST(approveReq);
    assert.strictEqual(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.success, true);
    assert.ok(approveData.promotedRecord);
    assert.strictEqual(approveData.promotedRecord.investigation, found.documentTitle);
  });
});
