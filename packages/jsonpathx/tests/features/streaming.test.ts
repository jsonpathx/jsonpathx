import test from "node:test";
import assert from "node:assert/strict";
import { streamArray, streamArrayBatched, countMatches, findFirst } from "../../src/index.js";

const fixture = [
  { id: 1, price: 5 },
  { id: 2, price: 12 },
  { id: 3, price: 8 }
];

test("streamArray yields matches", async () => {
  const values: number[] = [];
  for await (const result of streamArray(fixture, "$.price")) {
    values.push(result.value as number);
  }
  assert.deepStrictEqual(values, [5, 12, 8]);
});

test("streamArrayBatched yields batches", async () => {
  const batches: number[][] = [];
  for await (const batch of streamArrayBatched(fixture, "$.price", { batchSize: 2 })) {
    batches.push(batch.map((entry) => entry.value as number));
  }
  assert.deepStrictEqual(batches, [[5, 12], [8]]);
});

test("countMatches counts predicate", async () => {
  const count = await countMatches(fixture, "$.price", (value) => (value as number) < 10);
  assert.equal(count, 2);
});

test("findFirst returns first match", async () => {
  const match = await findFirst(fixture, "$.price", (value) => (value as number) > 10);
  assert.equal(match, 12);
});
