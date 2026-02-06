import test from "node:test";
import assert from "node:assert/strict";
import { toPathArray, toPathString, toPointer, fromPointer } from "../../src/index.js";

test("path utils round trip", () => {
  const path = "$.store.book[0].title";
  const array = toPathArray(path);
  const str = toPathString(array);
  const pointer = toPointer(array);
  assert.strictEqual(str, "$.store.book[0].title");
  assert.strictEqual(pointer, "/store/book/0/title");
  assert.deepStrictEqual(fromPointer(pointer), ["$", "store", "book", 0, "title"]);
});
