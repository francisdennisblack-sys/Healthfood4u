import test from "node:test";
import assert from "node:assert/strict";

import { isProductOpenable } from "./productAccess.ts";

test("profile product cannot be opened from the storefront", () => {
  assert.equal(isProductOpenable("Scoprio"), false);
  assert.equal(isProductOpenable("Organic Greens Box"), true);
});
