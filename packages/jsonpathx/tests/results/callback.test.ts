import test from "node:test";
import assert from "node:assert/strict";
import { JSONPath } from "../../src/index.js";

const fixture = {
  store: {
    book: [
      { category: "reference", author: "Nigel", price: 8.95 },
      { category: "fiction", author: "Evelyn", price: 12.99 }
    ],
    bicycle: { color: "red", price: 19.95 }
  }
};

test("callback can transform values", () => {
  const result = JSONPath({
    path: "$.store.book[*].author",
    json: fixture,
    callback: (value) => (typeof value === "string" ? value.toUpperCase() : value)
  });

  assert.deepStrictEqual(result, ["NIGEL", "EVELYN"]);
});

test("callback receives property type", () => {
  const seen: Array<{ value: unknown; type: string }> = [];
  JSONPath({
    path: "$.store.*~",
    json: fixture,
    callback: (value, type) => {
      seen.push({ value, type });
    }
  });

  assert.deepStrictEqual(seen, [
    { value: "book", type: "property" },
    { value: "bicycle", type: "property" }
  ]);
});
