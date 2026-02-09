import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import jsonpath from "jsonpath";
import { JSONPath as JSONPathPlus } from "jsonpath-plus";
import { JSONPath as JSONPathX } from "../packages/jsonpathx/src/index.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const carsPath = path.join(__dirname, "cars.json");

const smallFixture = {
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

const syntheticFixture = {
  items: Array.from({ length: 2000 }, (_, index) => ({
    id: index,
    price: (index * 37) % 1000,
    category: index % 5 === 0 ? "A" : "B",
    tags: {
      featured: index % 10 === 0,
      discount: index % 7 === 0
    },
    specs: {
      weight: index % 50,
      color: index % 2 === 0 ? "red" : "blue"
    }
  })),
  groups: Array.from({ length: 50 }, (_, groupIndex) => ({
    id: `group-${groupIndex}`,
    items: Array.from({ length: 40 }, (_, itemIndex) => ({
      id: groupIndex * 100 + itemIndex,
      rating: (itemIndex % 5) + 1
    }))
  }))
};

const wideFixture = {
  props: Object.fromEntries(
    Array.from({ length: 2000 }, (_, index) => [
      `key_${index}`,
      {
        value: index,
        nested: {
          flag: index % 3 === 0,
          tags: [`t${index % 5}`]
        }
      }
    ])
  )
};

const arrayFixture = {
  data: Array.from({ length: 50000 }, (_, index) => index)
};

const unicodeFixture = {
  "naïve key": {
    "emoji😀": [{ "sp ace": 1 }, { "sp ace": 2 }]
  }
};

function buildNestedFixture(depth = 6) {
  let node = { leaf: true };
  for (let i = 0; i < depth; i += 1) {
    node = { level: depth - i, child: node, siblings: [node, { leaf: true }] };
  }
  return { tree: node };
}

const nestedFixture = buildNestedFixture();

const carsRaw = await readFile(carsPath, "utf8");
const isLfsPointer = carsRaw.startsWith("version https://git-lfs.github.com/spec/v1");
const carsJson = isLfsPointer ? null : JSON.parse(carsRaw);

const datasets = [
  { name: "fixture", label: "Fixture (Goessner)", json: smallFixture, targetMs: 500 },
  { name: "synthetic", label: "Synthetic (2k items)", json: syntheticFixture, targetMs: 450 },
  { name: "nested", label: "Nested (tree)", json: nestedFixture, targetMs: 400 },
  { name: "wide", label: "Wide (2k keys)", json: wideFixture, targetMs: 400 },
  { name: "array", label: "Array (50k items)", json: arrayFixture, targetMs: 350 },
  { name: "unicode", label: "Unicode (quoted names)", json: unicodeFixture, targetMs: 300 },
  ...(carsJson ? [{ name: "cars", label: "Cars (100MB)", json: carsJson, targetMs: 350 }] : [])
];

const queries = [
  { name: "root", path: "$", datasets: ["fixture", "synthetic", "nested", "wide", "array", "unicode", "cars"] },
  { name: "dot", path: "$.store.book[0].author", datasets: ["fixture"] },
  { name: "bracket", path: "$['store']['book'][0]['author']", datasets: ["fixture"] },
  { name: "union-names", path: "$.store['book','bicycle']", datasets: ["fixture"] },
  { name: "wildcard", path: "$.store.*", datasets: ["fixture"] },
  { name: "recursive", path: "$..author", datasets: ["fixture"] },
  { name: "slice", path: "$.store.book[0:2]", datasets: ["fixture"] },
  { name: "slice-negative", path: "$.store.book[-3:-1]", datasets: ["fixture"] },
  { name: "index-negative", path: "$.store.book[-1]", datasets: ["fixture"] },
  { name: "union", path: "$.store.book[0,2]", datasets: ["fixture"] },
  { name: "filter", path: "$..book[?(@.price < 10)]", eval: true, datasets: ["fixture"] },
  { name: "script", path: "$..book[(@.length-1)]", eval: true, datasets: ["fixture"] },
  { name: "parent", path: "$..book[?(@.price > 10)]^", eval: true, datasets: ["fixture"] },
  { name: "property", path: "$.store.*~", datasets: ["fixture"] },
  { name: "type-selector", path: "$..*@number()", datasets: ["fixture"] },
  {
    name: "rfc-length",
    path: "$..book[?length(@.author) > 3]",
    filterMode: "rfc",
    datasets: ["fixture"]
  },
  {
    name: "rfc-match",
    path: "$..book[?match(@.author, '^[A-Z]')]",
    filterMode: "rfc",
    datasets: ["fixture"]
  },
  { name: "synthetic-items", path: "$.items[*].id", datasets: ["synthetic"] },
  {
    name: "synthetic-filter",
    path: "$.items[?(@.price > 750 && @.tags.featured)].id",
    eval: true,
    datasets: ["synthetic"]
  },
  {
    name: "synthetic-filter-heavy",
    path: "$.items[?(@.price > 500 && @.specs.weight < 20)].id",
    eval: true,
    datasets: ["synthetic"]
  },
  { name: "synthetic-recursive", path: "$..tags.featured", datasets: ["synthetic"] },
  { name: "synthetic-groups", path: "$.groups[*].items[*].id", datasets: ["synthetic"] },
  {
    name: "synthetic-slice",
    path: "$.items[100:500:5].price",
    datasets: ["synthetic"]
  },
  {
    name: "synthetic-slice-reverse",
    path: "$.items[200:0:-3].price",
    datasets: ["synthetic"]
  },
  { name: "nested-recursive", path: "$.tree..leaf", datasets: ["nested"] },
  { name: "nested-siblings", path: "$.tree.siblings[*].leaf", datasets: ["nested"] },
  { name: "nested-filter", path: "$..[?(@.leaf == true)]", eval: true, datasets: ["nested"] },
  { name: "wide-specific", path: "$.props.key_1999.value", datasets: ["wide"] },
  { name: "wide-wildcard", path: "$.props.*.value", datasets: ["wide"] },
  { name: "wide-filter", path: "$.props.*[?(@.nested.flag)].value", eval: true, datasets: ["wide"] },
  { name: "wide-recursive", path: "$..value", datasets: ["wide"] },
  { name: "array-slice-large", path: "$.data[1000:5000:7]", datasets: ["array"] },
  { name: "array-union", path: "$.data[0,100,1000,10000]", datasets: ["array"] },
  { name: "array-last", path: "$.data[-1]", datasets: ["array"] },
  { name: "unicode-quoted", path: "$['naïve key']['emoji😀'][*]['sp ace']", datasets: ["unicode"] },
  { name: "unicode-recursive", path: "$..['sp ace']", datasets: ["unicode"] },
  { name: "cars-brand", path: "$.cars[*].brand.name", datasets: ["cars"] },
  { name: "cars-models", path: "$.cars[:25].model", datasets: ["cars"] },
  { name: "cars-union", path: "$.cars[0,1,2].manufacturer", datasets: ["cars"] },
  { name: "cars-recursive", path: "$..engineDisplacement", datasets: ["cars"] },
  { name: "cars-filter", path: "$.cars[?(@.fuelType == 'Petrol')].model", eval: true, datasets: ["cars"] },
  { name: "cars-script", path: "$.cars[(@.length-1)].model", eval: true, datasets: ["cars"] },
  { name: "cars-property", path: "$.cars[0].extraFeatures.*~", datasets: ["cars"] }
];

const engines = [
  {
    name: "jsonpathx",
    fn: (options) => JSONPathX(options)
  },
  {
    name: "jsonpath-plus",
    fn: (options) => JSONPathPlus(options)
  },
  {
    name: "jsonpath",
    fn: (options) => jsonpath.query(options.json, options.path)
  }
];

function formatNumber(value) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
}

const totalQueries = queries.length;
const evalQueries = queries.filter((query) => query.eval).length;
const datasetNames = datasets.map((dataset) => dataset.name);
const tagSet = new Set();
for (const query of queries) {
  if (query.name.includes("rfc-")) tagSet.add("rfc-functions");
  if (query.name.includes("reverse")) tagSet.add("reverse-slice");
  if (query.name.includes("recursive")) tagSet.add("recursion");
  if (query.name.includes("filter")) tagSet.add("filters");
  if (query.name.includes("unicode")) tagSet.add("unicode");
}
const tags = Array.from(tagSet.values());

function runTimed(fn, targetMs) {
  const start = process.hrtime.bigint();
  let iterations = 0;
  let elapsedMs = 0;
  while (elapsedMs < targetMs || iterations < 5) {
    fn();
    iterations += 1;
    elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  }
  const seconds = elapsedMs / 1000;
  return { iterations, seconds, ops: iterations / seconds };
}

function safeRun(fn, targetMs) {
  try {
    return { ...runTimed(fn, targetMs), error: null };
  } catch (error) {
    return {
      iterations: 0,
      seconds: 0,
      ops: Number.NaN,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

function winnerLabel(entries) {
  const valid = entries.filter((entry) => Number.isFinite(entry.ops));
  if (valid.length === 0) {
    return "unsupported";
  }
  valid.sort((a, b) => b.ops - a.ops);
  const [top, second] = valid;
  if (second && Math.abs(top.ops - second.ops) / top.ops < 0.05) {
    return `tie (${top.engine})`;
  }
  return top.engine;
}

const results = [];

for (const dataset of datasets) {
  for (const query of queries) {
    if (!query.datasets.includes(dataset.name)) {
      continue;
    }
    for (const engine of engines) {
      const options = {
        path: query.path,
        json: dataset.json,
        resultType: "value",
        wrap: true,
        eval: query.eval ? "native" : false,
        filterMode: query.filterMode
      };
      const runner = () => engine.fn(options);
      const outcome = safeRun(runner, dataset.targetMs);
      results.push({
        dataset: dataset.name,
        query: query.name,
        path: query.path,
        engine: engine.name,
        eval: query.eval ? "native" : "false",
        iterations: outcome.iterations,
        seconds: Number(outcome.seconds.toFixed(4)),
        ops: Number.isFinite(outcome.ops) ? Number(outcome.ops.toFixed(2)) : Number.NaN,
        error: outcome.error
      });
    }
  }
}

const generated = new Date().toISOString().slice(0, 10);
const jsonOutput = {
  generated,
  node: process.version,
  datasets: datasets.map((dataset) => ({ name: dataset.name, targetMs: dataset.targetMs })),
  results
};

const grouped = new Map();
for (const entry of results) {
  const key = `${entry.dataset}:${entry.query}`;
  if (!grouped.has(key)) {
    grouped.set(key, []);
  }
  grouped.get(key).push(entry);
}

const lines = [
  "# Benchmarks",
  "",
  `Generated: ${generated}`,
  `Node: ${process.version}`,
  "",
  "## Summary",
  "- Each query is time-boxed per dataset (see targetMs in results.json).",
  "- Eval is disabled unless required by a query.",
  "- Suite includes RFC 9535 filter functions (length/match) and reverse slices.",
  "- Datasets cover small fixtures, synthetic collections, deep trees, wide objects, large arrays, and Unicode-heavy keys.",
  `- Datasets: ${datasetNames.length} (${datasetNames.join(", ")}).`,
  `- Queries: ${totalQueries} total (${evalQueries} eval, ${totalQueries - evalQueries} non-eval).`,
  `- Tags: ${tags.length > 0 ? tags.join(", ") : "none"}.`,
  `- Cars dataset is loaded from bench/cars.json (~100MB)${carsJson ? "." : " when Git LFS data is available."}`,
  ...(carsJson ? [] : ["- Cars dataset skipped (Git LFS pointer file detected)."]),
  "- Some queries are unsupported by certain engines and marked as such.",
  "",
  "## Results"
];

for (const dataset of datasets) {
  lines.push("", `### ${dataset.label}`);
  lines.push(
    "",
    "| Query | Path | Eval | JsonPathX ops/sec | JSONPath Plus ops/sec | jsonpath ops/sec | Winner |",
    "| --- | --- | --- | --- | --- | --- | --- |"
  );

  const datasetQueries = queries.filter((query) => query.datasets.includes(dataset.name));
  for (const query of datasetQueries) {
    const key = `${dataset.name}:${query.name}`;
    const entries = grouped.get(key) ?? [];
    const xEntry = entries.find((entry) => entry.engine === "jsonpathx");
    const plusEntry = entries.find((entry) => entry.engine === "jsonpath-plus");
    const jsonpathEntry = entries.find((entry) => entry.engine === "jsonpath");

    const xOps = xEntry && Number.isFinite(xEntry.ops) ? formatNumber(xEntry.ops) : "unsupported";
    const plusOps = plusEntry && Number.isFinite(plusEntry.ops) ? formatNumber(plusEntry.ops) : "unsupported";
    const jsonpathOps =
      jsonpathEntry && Number.isFinite(jsonpathEntry.ops) ? formatNumber(jsonpathEntry.ops) : "unsupported";

    const winner = winnerLabel(entries);

    lines.push(
      `| ${query.name} | \`${query.path}\` | ${query.eval ? "native" : "false"} | ${xOps} | ${plusOps} | ${jsonpathOps} | ${winner} |`
    );
  }
}

const markdown = `${lines.join("\n")}\n`;
const benchMd = path.join(root, "bench", "results.md");
const benchJson = path.join(root, "bench", "results.json");
const docsDir = path.join(root, "apps", "docs");
const docsBenchMd = path.join(docsDir, "bench.md");

await writeFile(benchMd, markdown, "utf8");
await writeFile(benchJson, JSON.stringify(jsonOutput, null, 2) + "\n", "utf8");
await mkdir(docsDir, { recursive: true });
const docsMarkdown = `---\nlayout: doc\ntitle: Benchmarks\n---\n\n${markdown}`;
await writeFile(docsBenchMd, docsMarkdown, "utf8");

console.log(`Wrote ${benchMd}`);
console.log(`Wrote ${benchJson}`);
console.log(`Wrote ${docsBenchMd}`);
