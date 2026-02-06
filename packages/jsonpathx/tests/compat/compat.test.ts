import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSONPath as JSONPathPlus } from "jsonpath-plus";
import { JSONPath as JSONPathX } from "../../src/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const knownDiffPath = path.join(__dirname, "known-differences.json");

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

const cases = [
  { name: "authors", path: "$.store.book[*].author" },
  { name: "recursive-author", path: "$..author" },
  { name: "all-store", path: "$.store.*" },
  { name: "prices", path: "$.store..price" },
  { name: "third-book", path: "$..book[2]" },
  { name: "last-book", path: "$..book[(@.length-1)]" },
  { name: "first-two", path: "$..book[:2]" },
  { name: "isbn-books", path: "$..book[?(@.isbn)]" },
  { name: "cheap-books", path: "$..book[?(@.price < 10)]" },
  { name: "property-names", path: "$.store.*~" },
  { name: "parent-of-expensive", path: "$..[?(@.price>19)]^" }
];

type KnownDiff = { name: string; reason: string };

async function loadKnownDiffs() {
  const raw = await readFile(knownDiffPath, "utf8");
  const parsed = JSON.parse(raw) as { cases: KnownDiff[] };
  return new Map(parsed.cases.map((entry) => [entry.name, entry.reason]));
}

test("compatibility with jsonpath-plus", async () => {
  const diffs = await loadKnownDiffs();
  for (const entry of cases) {
    const reason = diffs.get(entry.name);
    if (reason) {
      continue;
    }
    const plusResult = JSONPathPlus({ path: entry.path, json: fixture });
    const xResult = JSONPathX({ path: entry.path, json: fixture });
    assert.deepStrictEqual(xResult, plusResult, `mismatch: ${entry.name}`);
  }
});
