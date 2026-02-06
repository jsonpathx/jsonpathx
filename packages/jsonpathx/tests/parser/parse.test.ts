import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import assert from "node:assert/strict";
import { parsePath } from "../../src/parser/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const snapshotPath = path.join(__dirname, "__snapshots__", "parse.snap.json");

async function loadSnapshots() {
  const raw = await readFile(snapshotPath, "utf8");
  return JSON.parse(raw) as {
    cases: Array<{ name: string; path: string; ast: unknown }>;
  };
}

test("parser snapshots", async () => {
  const snapshots = await loadSnapshots();
  for (const entry of snapshots.cases) {
    const actual = parsePath(entry.path);
    assert.deepStrictEqual(actual, entry.ast, `snapshot mismatch: ${entry.name}`);
  }
});
