import { test } from "node:test";
import assert from "node:assert/strict";
import { bearerToken } from "../src/lib/auth-boundaries";

test("accepts only a single bearer credential", () => {
  assert.equal(bearerToken("Bearer abc.def"), "abc.def");
  assert.equal(bearerToken("Basic abc"), null);
  assert.equal(bearerToken("Bearer abc extra"), null);
  assert.equal(bearerToken(null), null);
});

