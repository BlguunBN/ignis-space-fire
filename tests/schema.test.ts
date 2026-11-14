import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { ExperimentRecord } from "../src/types/evidence";

describe("Evidence Corpus Schema Validation", () => {
  const dataPath = path.resolve(process.cwd(), "src/data/experiments.json");

  it("experiments.json exists and is valid JSON", () => {
    assert.equal(fs.existsSync(dataPath), true, "src/data/experiments.json must exist");
    const raw = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(raw);
    assert.equal(Array.isArray(data), true, "Corpus must be a JSON array");
    assert.ok(data.length > 0, "Corpus must have at least one record");
  });

  it("every record adheres to ExperimentRecord schema invariants", () => {
    const raw = fs.readFileSync(dataPath, "utf-8");
    const records: ExperimentRecord[] = JSON.parse(raw);

    const validRecordTypes = ["experiment_run", "investigation_summary", "paper_finding"];
    const validVerificationStatuses = ["verified", "needs_review", "unsupported"];
    const validSourceTypes = ["NASA_PSI", "PEER_REVIEWED", "NTRS"];
    const validGravities = ["microgravity", "partial_gravity", "terrestrial"];
    const validQualities = ["primary_nasa", "peer_reviewed_nasa", "supporting"];

    const seenIds = new Set<string>();

    for (const rec of records) {
      assert.ok(rec.id, `Record must have non-empty id: ${JSON.stringify(rec)}`);
      assert.ok(!seenIds.has(rec.id), `Duplicate record ID detected: ${rec.id}`);
      seenIds.add(rec.id);

      assert.ok(rec.programme, `Record ${rec.id} must have programme`);
      assert.ok(rec.investigation, `Record ${rec.id} must have investigation`);
      assert.ok(validRecordTypes.includes(rec.record_type), `Invalid record_type for ${rec.id}: ${rec.record_type}`);
      assert.ok(validVerificationStatuses.includes(rec.verification_status), `Invalid verification_status for ${rec.id}: ${rec.verification_status}`);
      assert.ok(validSourceTypes.includes(rec.source_type), `Invalid source_type for ${rec.id}: ${rec.source_type}`);
      assert.ok(validGravities.includes(rec.gravity), `Invalid gravity for ${rec.id}: ${rec.gravity}`);
      assert.ok(rec.platform, `Record ${rec.id} must have platform`);
      assert.ok(rec.material, `Record ${rec.id} must have material`);
      assert.ok(Array.isArray(rec.measurements), `Record ${rec.id} measurements must be an array`);
      assert.ok(rec.measurements.length > 0, `Record ${rec.id} must have at least one measurement`);
      assert.ok(rec.finding, `Record ${rec.id} must have a finding`);
      assert.ok(rec.fire_safety_relevance, `Record ${rec.id} must have fire_safety_relevance`);
      assert.ok(Array.isArray(rec.limitations), `Record ${rec.id} limitations must be an array`);
      assert.ok(rec.source_url, `Record ${rec.id} must have a source_url`);
      assert.ok(validQualities.includes(rec.quality), `Invalid quality for ${rec.id}: ${rec.quality}`);

      // Scientific condition validation: preserve nulls or positive numbers
      if (rec.oxygen_pct !== null && rec.oxygen_pct !== undefined) {
        assert.ok(rec.oxygen_pct >= 0 && rec.oxygen_pct <= 100, `Oxygen percentage out of range for ${rec.id}: ${rec.oxygen_pct}`);
      }
      if (rec.pressure_kpa !== null && rec.pressure_kpa !== undefined) {
        assert.ok(rec.pressure_kpa >= 0, `Pressure must be non-negative for ${rec.id}: ${rec.pressure_kpa}`);
      }
      if (rec.airflow_cm_s !== null && rec.airflow_cm_s !== undefined) {
        assert.ok(rec.airflow_cm_s >= 0, `Airflow velocity must be non-negative for ${rec.id}: ${rec.airflow_cm_s}`);
      }
    }
  });

  it("all verified records have source locator and verifier provenance", () => {
    const raw = fs.readFileSync(dataPath, "utf-8");
    const records: ExperimentRecord[] = JSON.parse(raw);

    for (const rec of records) {
      if (rec.verification_status === "verified") {
        assert.ok(rec.source_locator, `Verified record ${rec.id} must have source_locator`);
        assert.ok(rec.verified_by, `Verified record ${rec.id} must have verified_by`);
      }
    }
  });
});
