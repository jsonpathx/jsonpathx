import test from "node:test";
import assert from "node:assert/strict";
import { QueryBuilder, JSONPathQuery, query, querySync } from "../../src/index.js";

const fixture = {
  store: {
    book: [
      { category: "reference", author: "Nigel", price: 8.95 },
      { category: "fiction", author: "Evelyn", price: 12.99 },
      { category: "fiction", author: "Herman", price: 8.99 }
    ]
  }
};

test("query function supports config object", async () => {
  const result = await query({ path: "$.store.book[*].author", json: fixture });
  assert.deepStrictEqual(result, ["Nigel", "Evelyn", "Herman"]);
});

test("query supports autostart false", async () => {
  const queryInstance = await query({ path: "$.store.book[*].author", autostart: false });
  assert.ok(queryInstance instanceof JSONPathQuery);
  const result = await queryInstance.evaluate(fixture);
  assert.deepStrictEqual(result, ["Nigel", "Evelyn", "Herman"]);
});

test("querySync uses path signature", () => {
  const result = querySync("$.store.book[0].author", fixture);
  assert.deepStrictEqual(result, ["Nigel"]);
});

test("query builder supports post processing", async () => {
  const builder = new QueryBuilder(fixture)
    .query("$.store.book[*].price")
    .filter((value) => typeof value === "number" && value < 10)
    .sort((a, b) => (a as number) - (b as number))
    .map((value) => (value as number) * 10)
    .take(2);

  const result = await builder.execute();
  assert.deepStrictEqual(result, [89.5, 89.9]);
});
