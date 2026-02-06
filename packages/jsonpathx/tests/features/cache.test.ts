import test from "node:test";
import assert from "node:assert/strict";
import { querySync } from "../../src/index.js";
import { getGlobalCache, resetGlobalCache } from "../../src/core/cache.js";

const fixture = { store: { book: [{ author: "Nigel" }, { author: "Evelyn" }] } };

test("cache stores and returns results", () => {
  resetGlobalCache();
  const cache = getGlobalCache();
  const result1 = querySync("$.store.book[*].author", fixture, { enableCache: true });
  const result2 = querySync("$.store.book[*].author", fixture, { enableCache: true });

  assert.deepStrictEqual(result1, ["Nigel", "Evelyn"]);
  assert.deepStrictEqual(result2, ["Nigel", "Evelyn"]);

  const stats = cache.stats();
  assert.equal(stats.hits, 1);
  assert.equal(stats.misses, 1);
});
