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

const path = "$.store.book[1].author";

const expectedPath = "$['store']['book'][1]['author']";
const expectedPointer = "/store/book/1/author";

const expectedParent = fixture.store.book[1];

const expectedAll = {
  value: "Evelyn",
  path: expectedPath,
  pointer: expectedPointer,
  parent: expectedParent,
  parentProperty: "author",
  parentChain: undefined
};

test("resultType value", () => {
  const result = JSONPath({ path, json: fixture, resultType: "value" });
  assert.deepStrictEqual(result, ["Evelyn"]);
});

test("resultType path", () => {
  const result = JSONPath({ path, json: fixture, resultType: "path" });
  assert.deepStrictEqual(result, [expectedPath]);
});

test("resultType pointer", () => {
  const result = JSONPath({ path, json: fixture, resultType: "pointer" });
  assert.deepStrictEqual(result, [expectedPointer]);
});

test("resultType parent", () => {
  const result = JSONPath({ path, json: fixture, resultType: "parent" });
  assert.deepStrictEqual(result, [expectedParent]);
});

test("resultType parentProperty", () => {
  const result = JSONPath({ path, json: fixture, resultType: "parentProperty" });
  assert.deepStrictEqual(result, ["author"]);
});

test("resultType all", () => {
  const result = JSONPath({ path, json: fixture, resultType: "all" });
  assert.deepStrictEqual(result, [expectedAll]);
});

test("resultType parentChain", () => {
  const result = JSONPath({ path, json: fixture, resultType: "parentChain" }) as Array<
    Array<{ property: string | number; parent: unknown }>
  >;
  assert.deepStrictEqual(result[0], [
    { property: "store", parent: fixture },
    { property: "book", parent: fixture.store },
    { property: 1, parent: fixture.store.book },
    { property: "author", parent: fixture.store.book[1] }
  ]);
});

test("wrap false uses scalar", () => {
  const result = JSONPath({ path, json: fixture, resultType: "value", wrap: false });
  assert.strictEqual(result, "Evelyn");
});

test("flatten flattens arrays", () => {
  const result = JSONPath({ path: "$.store.book", json: fixture, flatten: true });
  assert.deepStrictEqual(result, fixture.store.book);
});
