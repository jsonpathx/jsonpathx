import test from "node:test";
import assert from "node:assert/strict";
import { JSONPath } from "../../src/index.js";

const fixture = {
  store: {
    book: [
      { author: "Nigel" },
      { author: "Evelyn" }
    ]
  }
};

test("parentChain result type", () => {
  const result = JSONPath({
    path: "$.store.book[0].author",
    json: fixture,
    resultType: "parentChain"
  }) as Array<{ property: string | number; parent: unknown }>;

  assert.deepStrictEqual(result[0], [
    { property: "store", parent: fixture },
    { property: "book", parent: fixture.store },
    { property: 0, parent: fixture.store.book },
    { property: "author", parent: fixture.store.book[0] }
  ]);
});
