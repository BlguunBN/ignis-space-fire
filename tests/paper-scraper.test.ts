import { test, describe } from "node:test";
import assert from "node:assert/strict";
import {
  validateExternalUrl,
  fetchAndExtractPaperFromUrl,
  parseUploadedDocument,
} from "../src/lib/paper-scraper";

describe("Research Paper & Experimental Data Scraper", () => {
  test("validates external URLs and blocks SSRF targets", () => {
    // Valid URLs
    assert.strictEqual(validateExternalUrl("https://ntrs.nasa.gov/citations/20220014245").valid, true);
    assert.strictEqual(validateExternalUrl("https://arxiv.org/abs/2205.99999").valid, true);
    assert.strictEqual(validateExternalUrl("http://psi.nasa.gov/papers/test.pdf").valid, true);

    // Blocked SSRF: Localhost & Loopback
    assert.strictEqual(validateExternalUrl("http://localhost:3000/admin").valid, false);
    assert.strictEqual(validateExternalUrl("http://127.0.0.1/secrets").valid, false);
    assert.strictEqual(validateExternalUrl("http://[::1]/debug").valid, false);

    // Blocked SSRF: Private RFC-1918 networks
    assert.strictEqual(validateExternalUrl("http://192.168.1.50/data").valid, false);
    assert.strictEqual(validateExternalUrl("http://10.0.0.1/cloud-metadata").valid, false);
    assert.strictEqual(validateExternalUrl("http://172.20.0.1/internal").valid, false);
    assert.strictEqual(validateExternalUrl("http://169.254.169.254/latest/meta-data").valid, false);

    // Blocked non-HTTP protocols
    assert.strictEqual(validateExternalUrl("file:///etc/passwd").valid, false);
    assert.strictEqual(validateExternalUrl("gopher://evil.com").valid, false);
    assert.strictEqual(validateExternalUrl("ftp://ftp.example.com").valid, false);
  });

  test("fetches and extracts structured paper from verified NASA NTRS URL", async () => {
    const scraped = await fetchAndExtractPaperFromUrl("https://ntrs.nasa.gov/citations/20220014245");
    assert.strictEqual(scraped.title, "Saffire-V Concurrent Flame Extinction in Cotton-Fiberglass Blends at Low Pressure");
    assert.strictEqual(scraped.filename, "NASA-TM-2022-0014245.pdf");
    assert.ok(scraped.rawText.includes("SIBAL fabric"));
    assert.ok(scraped.rawText.includes("24.0% O2"));
    assert.strictEqual(scraped.extractedMetadata.doi, "10.60555/0t15-s5ex");
  });

  test("parses uploaded local document correctly", () => {
    const fileContent = `
Title: Microgravity Droplet Burning of Heptane on ISS
DOI: 10.1016/j.combustflame.2023.01.002

We investigated spherical n-heptane droplet combustion aboard the International Space Station
under 21% O2 and 101.3 kPa pressure with 0 cm/s ambient flow.
Extinction occurred after complete depletion of liquid fuel.
    `;

    const parsed = parseUploadedDocument("droplet_iss_study.txt", fileContent);
    assert.strictEqual(parsed.title, "Microgravity Droplet Burning of Heptane on ISS");
    assert.strictEqual(parsed.filename, "droplet_iss_study.txt");
    assert.strictEqual(parsed.extractedMetadata.doi, "10.1016/j.combustflame.2023.01.002");
    assert.ok(parsed.rawText.includes("spherical n-heptane droplet combustion"));
  });
});
