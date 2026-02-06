import "./style.css";
import { JSONPath } from "@jsonpathx/jsonpathx";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app container");
}

const defaultJson = JSON.stringify(
  {
    store: {
      book: [
        { category: "reference", author: "Nigel Rees", price: 8.95 },
        { category: "fiction", author: "Evelyn Waugh", price: 12.99 },
        { category: "fiction", author: "Herman Melville", price: 8.99 },
        { category: "fiction", author: "J. R. R. Tolkien", price: 22.99 }
      ],
      bicycle: { color: "red", price: 19.95 }
    }
  },
  null,
  2
);

app.innerHTML = `
  <section class="header">
    <div class="title">JsonPathX Playground</div>
    <div class="subtitle">
      Explore JsonPathX behavior against real data. Filters and scripts are gated by eval policy
      to keep execution safe by default.
    </div>
    <span class="badge">Local sandbox</span>
  </section>
  <section class="controls">
    <div class="control">
      <label for="path">JSONPath</label>
      <input id="path" type="text" value="$.store.book[*].author" />
    </div>
    <div class="control">
      <label for="resultType">Result type</label>
      <select id="resultType">
        <option value="value">value</option>
        <option value="path">path</option>
        <option value="pointer">pointer</option>
        <option value="parent">parent</option>
        <option value="parentProperty">parentProperty</option>
        <option value="all">all</option>
      </select>
    </div>
    <div class="control">
      <label for="evalMode">Eval policy</label>
      <select id="evalMode">
        <option value="false">disabled</option>
        <option value="safe" selected>safe</option>
        <option value="native">native</option>
      </select>
    </div>
    <div class="control">
      <label for="wrap">Wrap results</label>
      <select id="wrap">
        <option value="true" selected>true</option>
        <option value="false">false</option>
      </select>
    </div>
  </section>
  <section class="editor-grid">
    <div class="panel">
      <h2>JSON Input</h2>
      <textarea id="json">${defaultJson}</textarea>
    </div>
    <div class="panel">
      <h2>Sandbox</h2>
      <textarea id="sandbox">{
  "limit": 10
}</textarea>
    </div>
    <div class="panel">
      <h2>Results</h2>
      <pre class="output" id="output"></pre>
    </div>
  </section>
  <div class="footer">Tip: Use \'safe\' eval with sandboxed variables like {"limit": 10}.</div>
`;

const pathInput = document.querySelector<HTMLInputElement>("#path");
const resultTypeInput = document.querySelector<HTMLSelectElement>("#resultType");
const evalModeInput = document.querySelector<HTMLSelectElement>("#evalMode");
const wrapInput = document.querySelector<HTMLSelectElement>("#wrap");
const jsonInput = document.querySelector<HTMLTextAreaElement>("#json");
const sandboxInput = document.querySelector<HTMLTextAreaElement>("#sandbox");
const output = document.querySelector<HTMLPreElement>("#output");

if (!pathInput || !resultTypeInput || !evalModeInput || !wrapInput || !jsonInput || !sandboxInput || !output) {
  throw new Error("Missing playground elements");
}

function format(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function parseJson(source: string) {
  return JSON.parse(source);
}

function parseSandbox(source: string) {
  if (!source.trim()) {
    return {};
  }
  return JSON.parse(source);
}

function run() {
  try {
    const json = parseJson(jsonInput.value);
    const sandbox = parseSandbox(sandboxInput.value);
    const evalMode = evalModeInput.value === "false" ? false : (evalModeInput.value as "safe" | "native");
    const wrap = wrapInput.value === "true";

    const result = JSONPath({
      path: pathInput.value,
      json,
      resultType: resultTypeInput.value as
        | "value"
        | "path"
        | "pointer"
        | "parent"
        | "parentProperty"
        | "all",
      eval: evalMode,
      sandbox,
      wrap
    });

    output.textContent = format(result);
  } catch (error) {
    output.textContent = error instanceof Error ? error.message : String(error);
  }
}

const inputs = [pathInput, resultTypeInput, evalModeInput, wrapInput, jsonInput, sandboxInput];
for (const input of inputs) {
  input.addEventListener("input", run);
}

run();
