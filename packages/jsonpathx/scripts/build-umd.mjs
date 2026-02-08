import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const entry = path.resolve(root, "src/index.ts");
const outDir = path.resolve(root, "dist");

const common = {
  entryPoints: [entry],
  bundle: true,
  format: "iife",
  globalName: "JSONPathX",
  platform: "browser",
  target: "es2018",
  sourcemap: true,
  external: ["node:fs/promises"]
};

await build({
  ...common,
  outfile: path.resolve(outDir, "jsonpathx.umd.js")
});

await build({
  ...common,
  minify: true,
  outfile: path.resolve(outDir, "jsonpathx.umd.min.js")
});
