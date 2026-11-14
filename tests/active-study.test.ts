import test from "node:test";
import assert from "node:assert/strict";
import { resolveActiveStudy } from "../src/lib/active-study";

test("study inspection is preserved outside analysis and while evidence is open", () => {
  assert.equal(resolveActiveStudy("explorer", false, "study-b", ["study-a"]), "study-b");
  assert.equal(resolveActiveStudy("split", true, "study-b", ["study-a"]), "study-b");
  assert.equal(resolveActiveStudy("split", false, "study-b", ["study-a"]), "study-a");
  assert.equal(resolveActiveStudy("split", false, "study-b", []), null);
});
