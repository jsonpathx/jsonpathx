import { build } from "esbuild";
import { stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const entry = path.resolve(root, "src/index.ts");
const outFile = path.resolve(root, "dist/size/index.js");

await build({
  entryPoints: [entry],
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2020",
  minify: true,
  sourcemap: false,
  outfile: outFile
});

const { size } = await stat(outFile);
const output = readFileSync(outFile);
const gzipSize = gzipSync(output).byteLength;

const kb = (size / 1024).toFixed(1);
const gzKb = (gzipSize / 1024).toFixed(1);

console.log(`Bundle size (minified, esm): ${kb} KB`);
console.log(`Gzip size: ${gzKb} KB`);
