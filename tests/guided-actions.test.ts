import test from "node:test";
import assert from "node:assert/strict";
import { takeNextAction } from "../src/lib/guided-actions";

test("guided actions advance one at a time in their original order", () => {
  const completed: string[] = [];
  const actions = [() => completed.push("explore"), () => completed.push("whiteboard"), () => completed.push("simulate")];
  const first = takeNextAction(actions);
  first.next?.();
  assert.deepEqual(completed, ["explore"]);
  const second = takeNextAction(first.remaining);
  second.next?.();
  assert.deepEqual(completed, ["explore", "whiteboard"]);
  assert.equal(second.remaining.length, 1);
  assert.equal(takeNextAction([]).next, undefined);
});
