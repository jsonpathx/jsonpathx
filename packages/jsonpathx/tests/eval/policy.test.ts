import test from "node:test";
import assert from "node:assert/strict";
import { JSONPath } from "../../src/index.js";

const fixture = {
  store: {
    book: [
      { category: "reference", author: "Nigel", price: 8.95 },
      { category: "fiction", author: "Evelyn", price: 12.99 }
    ]
  }
};

test("eval disabled by default", () => {
  assert.throws(() => JSONPath({ path: "$..book[?(@.price < 10)]", json: fixture }), {
    message: /eval/i
  });
});

test("preventEval overrides", () => {
  assert.throws(
    () => JSONPath({ path: "$..book[?(@.price < 10)]", json: fixture, eval: "native", preventEval: true }),
    { message: /preventEval/i }
  );
});

test("safe eval allows sandbox variables", () => {
  const result = JSONPath({
    path: "$..book[?(@.price < limit)].author",
    json: fixture,
    eval: "safe",
    sandbox: { limit: 10 }
  });
  assert.deepStrictEqual(result, ["Nigel"]);
});

test("safe eval rejects unknown identifiers", () => {
  assert.throws(
    () =>
      JSONPath({
        path: "$..book[?(@.price < limit + extra)].author",
        json: fixture,
        eval: "safe",
        sandbox: { limit: 10 }
      }),
    { message: /unsafe identifier/i }
  );
});
