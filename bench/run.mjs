import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const iterations = 50000;
const sample = {
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

function accessNested() {
  return sample.store.book[2].author;
}

function scanPrices() {
  let total = 0;
  for (const book of sample.store.book) {
    total += book.price;
  }
  return total;
}

function stringifyStore() {
  return JSON.stringify(sample.store);
}

const benchmarks = [
  { name: "nested access", fn: accessNested },
  { name: "scan prices", fn: scanPrices },
  { name: "stringify store", fn: stringifyStore }
];

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

function runBench(fn) {
  const start = process.hrtime.bigint();
  for (let i = 0; i < iterations; i += 1) {
    fn();
  }
  const durationNs = Number(process.hrtime.bigint() - start);
  const seconds = durationNs / 1e9;
  return iterations / seconds;
}

const results = benchmarks.map((bench) => {
  const ops = runBench(bench.fn);
  return { name: bench.name, ops };
});

const generated = new Date().toISOString().slice(0, 10);
const lines = [
  "# Benchmarks",
  "",
  `Generated: ${generated}`,
  `Node: ${process.version}`,
  `Iterations: ${iterations}`,
  "",
  "| Benchmark | Ops/sec |",
  "| --- | --- |",
  ...results.map((result) => `| ${result.name} | ${formatNumber(result.ops)} |`),
  "",
  "Notes:",
  "- These are baseline JavaScript operations used for regression tracking.",
  "- Replace or expand once JsonPathX benchmarks are available."
];

const output = `${lines.join("\n")}\n`;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const benchPath = path.join(root, "bench", "results.md");
const docsPath = path.join(root, "apps", "docs", "bench.md");

await writeFile(benchPath, output, "utf8");
await writeFile(docsPath, output, "utf8");

console.log(`Wrote ${benchPath}`);
console.log(`Wrote ${docsPath}`);
