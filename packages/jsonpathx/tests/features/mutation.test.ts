import test from "node:test";
import assert from "node:assert/strict";
import { set, update, deleteAtPath, push, toggle } from "../../src/index.js";

const fixture = {
  store: {
    book: [
      { author: "Nigel", price: 8.95, featured: false },
      { author: "Evelyn", price: 12.99, featured: true }
    ]
  }
};

test("set updates value", async () => {
  const result = await set(fixture, "$.store.book[0].price", 10);
  assert.equal((result.data as any).store.book[0].price, 10);
});

test("update transforms value", async () => {
  const result = await update(fixture, "$.store.book[1].price", (value) => (value as number) + 1);
  assert.equal((result.data as any).store.book[1].price, 13.99);
});

test("delete removes value", async () => {
  const result = await deleteAtPath(fixture, "$.store.book[0]");
  assert.equal((result.data as any).store.book.length, 1);
});

test("push adds value", async () => {
  const result = await push(fixture, "$.store.book", { author: "Herman", price: 8.99 });
  assert.equal((result.data as any).store.book.length, 3);
});

test("toggle flips boolean", async () => {
  const result = await toggle(fixture, "$.store.book[0].featured");
  assert.equal((result.data as any).store.book[0].featured, true);
});
