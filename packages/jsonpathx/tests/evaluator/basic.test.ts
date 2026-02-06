import test from "node:test";
import assert from "node:assert/strict";
import { JSONPath } from "../../src/index.js";

const fixture = {
  store: {
    book: [
      { category: "reference", author: "Nigel", price: 8.95 },
      { category: "fiction", author: "Evelyn", price: 12.99 },
      { category: "fiction", author: "Herman", price: 8.99 },
      { category: "fiction", author: "J.R.R.", price: 22.99 }
    ],
    bicycle: { color: "red", price: 19.95 }
  }
};

test("root selection", () => {
  const result = JSONPath({ path: "$", json: fixture });
  assert.deepStrictEqual(result, [fixture]);
});

test("dot and index", () => {
  const result = JSONPath({ path: "$.store.book[0].author", json: fixture });
  assert.deepStrictEqual(result, ["Nigel"]);
});

test("wildcard", () => {
  const result = JSONPath({ path: "$.store.*", json: fixture });
  assert.deepStrictEqual(result, [fixture.store.book, fixture.store.bicycle]);
});

test("recursive", () => {
  const result = JSONPath({ path: "$..author", json: fixture });
  assert.deepStrictEqual(result, ["Nigel", "Evelyn", "Herman", "J.R.R."]);
});

test("slice", () => {
  const result = JSONPath({ path: "$.store.book[0:2]", json: fixture });
  assert.deepStrictEqual(result, [fixture.store.book[0], fixture.store.book[1]]);
});

test("union", () => {
  const result = JSONPath({ path: "$.store.book[0,2]", json: fixture });
  assert.deepStrictEqual(result, [fixture.store.book[0], fixture.store.book[2]]);
});
