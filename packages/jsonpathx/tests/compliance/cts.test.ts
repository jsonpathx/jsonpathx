import test from "node:test";
import assert from "node:assert/strict";
import { isDeepStrictEqual } from "node:util";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { JSONPath, parsePath } from "../../src/index.js";

type CtsCase = {
  name: string;
  selector: string;
  document?: unknown;
  result?: unknown[];
  results?: unknown[][];
  result_paths?: string[];
  results_paths?: string[][];
  invalid_selector?: boolean;
  tags?: string[];
};

type CtsFile = {
  tests: CtsCase[];
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "../../../..");
const ctsPath = path.join(rootDir, "vendor", "jsonpath-compliance-test-suite", "cts.json");

function matchesAny(actual: unknown[], expected: unknown[][]): boolean {
  return expected.some((candidate) => isDeepStrictEqual(actual, candidate));
}

function matchesAnyPaired(
  values: unknown[],
  paths: string[],
  expectedValues: unknown[][],
  expectedPaths: string[][]
): boolean {
  for (let i = 0; i < expectedValues.length; i += 1) {
    if (isDeepStrictEqual(values, expectedValues[i]) && isDeepStrictEqual(paths, expectedPaths[i])) {
      return true;
    }
  }
  return false;
}

test("RFC 9535 compliance test suite (filtered)", async () => {
  const raw = await readFile(ctsPath, "utf8");
  const cts = JSON.parse(raw) as CtsFile;
  const failures: Array<{ name: string; message: string }> = [];
  const traceEnabled = process.env.CTS_TRACE === "1" || process.env.CTS_TRACE === "true";
  const traceEvery = Number.parseInt(process.env.CTS_TRACE_EVERY ?? "200", 10);
  const startedAt = Date.now();

  for (let index = 0; index < cts.tests.length; index += 1) {
    const entry = cts.tests[index];
    if (traceEnabled && index % traceEvery === 0) {
      const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);
      console.log(`[CTS] ${index}/${cts.tests.length} ${entry.name} (${elapsed}s)`);
    }
    if (entry.invalid_selector) {
      let invalid = false;
      try {
        parsePath(entry.selector);
      } catch {
        invalid = true;
      }
      if (!invalid) {
        try {
          JSONPath({
            path: entry.selector,
            json: entry.document ?? {},
            resultType: "value",
            wrap: true,
            filterMode: "rfc"
          });
        } catch {
          invalid = true;
        }
      }
      if (!invalid) {
        failures.push({ name: entry.name, message: "expected selector to be invalid" });
      }
      continue;
    }

    try {
      const values = JSONPath({
        path: entry.selector,
        json: entry.document,
        resultType: "value",
        wrap: true,
        filterMode: "rfc"
      }) as unknown[];
      const paths = JSONPath({
        path: entry.selector,
        json: entry.document,
        resultType: "path",
        wrap: true,
        filterMode: "rfc"
      }) as string[];

      if (entry.results && entry.results_paths) {
        if (!matchesAnyPaired(values, paths, entry.results, entry.results_paths)) {
          failures.push({
            name: entry.name,
            message: "results or paths did not match any accepted permutation"
          });
        }
      } else if (entry.result && entry.result_paths) {
      if (!isDeepStrictEqual(values, entry.result)) {
        failures.push({ name: entry.name, message: "values did not match expected result" });
      } else if (!isDeepStrictEqual(paths, entry.result_paths)) {
        failures.push({ name: entry.name, message: "paths did not match expected result" });
      }
    } else {
        failures.push({ name: entry.name, message: "missing expected result data" });
      }
    } catch (error) {
      failures.push({
        name: entry.name,
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }

  if (failures.length > 0) {
    const summary = failures.slice(0, 8).map((entry) => `- ${entry.name}: ${entry.message}`);
    if (failures.length > 8) {
      summary.push(`- ...and ${failures.length - 8} more`);
    }
    assert.fail(`CTS failures (${failures.length}):\n${summary.join("\n")}`);
  }
});
