import test from "node:test";
import assert from "node:assert/strict";
import { matchesReportedConditions } from "../src/lib/explorer-conditions";

test("condition filters distinguish missing values from matches", () => {
  const missing = { oxygen_pct: null, pressure_kpa: null };
  assert.equal(matchesReportedConditions(missing, [0, 40], "any"), true);
  assert.equal(matchesReportedConditions(missing, [0, 30], "any"), false);
  assert.equal(matchesReportedConditions(missing, [0, 40], "low"), false);
  assert.equal(matchesReportedConditions({ oxygen_pct: 21, pressure_kpa: 70 }, [0, 30], "low"), true);
  assert.equal(matchesReportedConditions({ oxygen_pct: 50, pressure_kpa: 101 }, [0, 40], "any"), true);
});
