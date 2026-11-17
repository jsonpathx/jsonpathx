# Module Format Guide

jsonpathx is an **ES module (ESM) package** (`"type": "module"`). There is no separate CommonJS build. CommonJS code can still load it with `require()` on Node.js versions that support `require(esm)`, and browsers without a bundler can use the UMD script from a CDN.

## What's in the package

- **ESM**: `dist/index.js` and the modules it imports
- **TypeScript**: `dist/index.d.ts` and the other `.d.ts` files next to the JavaScript
- **Browser script (UMD/IIFE)**: `dist/jsonpathx.umd.js` and `dist/jsonpathx.umd.min.js`, with source maps. Loading one sets the global `window.JSONPathX`. These are for `<script>` tags from a CDN (see [Script tag](#script-tag-umd-global)); they are files in the package, not entry points in `exports`.

### Package configuration

```json
{
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "unpkg": "./dist/jsonpathx.umd.min.js",
  "jsdelivr": "./dist/jsonpathx.umd.min.js",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  },
  "engines": {
    "node": ">=22"
  }
}
```

Both `import` and `require()` resolve `"."` to the same ESM file, so there is only ever one copy of the library in memory (no dual-package hazard).

---

## ESM (`import`)

This is the primary way to use jsonpathx: Node.js, Deno, Bun, TypeScript and every modern bundler (Vite, webpack 5, Rollup, esbuild, Parcel) load it directly.

### Named imports

jsonpathx has **named exports only**; there is no default export.

```typescript
import { JSONPath, QueryBuilder, PathUtils } from '@jsonpathx/jsonpathx';

const result = await JSONPath.query('$.users[*].name', data);

const builder = new QueryBuilder(data);
const filtered = await builder.query('$.items[*]').execute();

const pathArray = PathUtils.toPathArray('$.store.book[0]');
```

### Namespace import

```typescript
import * as jsonpathx from '@jsonpathx/jsonpathx';

const result = await jsonpathx.JSONPath.query('$.data', { data: [1, 2, 3] });
```

### Dynamic import

Works from ESM and from CommonJS, on every Node.js version jsonpathx supports (22+):

```javascript
async function queryData(data) {
  const { JSONPath } = await import('@jsonpathx/jsonpathx');
  return JSONPath.query('$.users[*]', data);
}
```

---

## CommonJS (`require()`)

`require('@jsonpathx/jsonpathx')` loads the ESM build through Node.js's `require(esm)` support. jsonpathx needs Node.js 22 or later (`engines.node` is `>=22`); within that range `require(esm)` is **on by default** in:

| Node.js line | `require()` works from | Notes |
|--------------|------------------------|-------|
| 22.x | 22.12.0 | 22.12.x prints an `ExperimentalWarning`; no warning from 22.13.0 |
| 23.x and later | 23.0.0 | covers all of Node.js 24 and 26; no warning from 23.5.0 |

Source: the Node.js docs, [Loading ECMAScript modules using `require()`](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require). The feature is marked stable from 24.15.0 and 25.4.0.

```javascript
// CommonJS on a Node.js version from the table above
const { JSONPath, QueryBuilder } = require('@jsonpathx/jsonpathx');

JSONPath.query('$.users[*].name', data).then((names) => console.log(names));
```

`require()` returns the module namespace, so use the named exports; `require('@jsonpathx/jsonpathx').default` is `undefined`.

On Node.js 22.0–22.11, `require()` throws `ERR_REQUIRE_ESM`. Use [dynamic `import()`](#dynamic-import) there, or upgrade to 22.12 or later.

---

## TypeScript

### ESM projects (recommended)

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "target": "ES2022"
  }
}
```

With `"module": "NodeNext"` in a `"type": "module"` project, the same `import { JSONPath } from '@jsonpathx/jsonpathx'` works unchanged.

### CommonJS output

When TypeScript compiles to CommonJS, `import` statements become `require()` calls, so the Node.js versions in the [table above](#commonjs-require) apply at runtime.

- `"module": "NodeNext"` (TypeScript 5.8 or later): `import { JSONPath } from '@jsonpathx/jsonpathx'` in a CommonJS file (`.cts`, or `.ts` without `"type": "module"`) type-checks and compiles to `require()`.
- `"module": "Node16"`, or TypeScript before 5.8: the compiler rejects that import with TS1479 ("…the referenced file is an ECMAScript module and cannot be imported with 'require'"). Use `await import('@jsonpathx/jsonpathx')`, or switch to `NodeNext`.

### Type imports

```typescript
import type { QueryOptions, ResultType } from '@jsonpathx/jsonpathx';
import { JSONPath, type QueryOptions } from '@jsonpathx/jsonpathx';

const options: QueryOptions = {
  resultType: 'path',
  flatten: true
};
```

---

## Bundlers

Vite, webpack 5, Rollup (with `@rollup/plugin-node-resolve`), esbuild and Parcel resolve the `exports` map and bundle the ESM build without extra configuration. A bundle built with CommonJS output (for example esbuild `format: 'cjs'`) also works, because the bundler inlines jsonpathx.

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';
```

---

## Browsers

### With a bundler

Import it as shown in [ESM](#esm-import).

### ESM from a CDN

```html
<script type="module">
  import { JSONPath } from 'https://esm.sh/@jsonpathx/jsonpathx';

  const result = await JSONPath.query('$.items[*]', { items: [1, 2, 3] });
  console.log(result);
</script>
```

### Script tag (UMD / global)

The `unpkg` and `jsdelivr` fields point at the minified UMD build, so the short CDN URLs serve it:

```html
<script src="https://unpkg.com/@jsonpathx/jsonpathx/dist/jsonpathx.umd.min.js"></script>
<!-- or: https://cdn.jsdelivr.net/npm/@jsonpathx/jsonpathx -->
<script>
  const { JSONPath } = window.JSONPathX;
  JSONPath.query('$.items[*]', { items: [1, 2, 3] }).then(console.log);
</script>
```

Pin a version in production, for example `https://unpkg.com/@jsonpathx/jsonpathx@0.1.7/dist/jsonpathx.umd.min.js` or `https://cdn.jsdelivr.net/npm/@jsonpathx/jsonpathx@0.1.7/dist/jsonpathx.umd.min.js`. The UMD files are classic scripts for `<script>` tags; they have no exports and no type definitions. Earlier versions also exposed them as `@jsonpathx/jsonpathx/umd` and `@jsonpathx/jsonpathx/umd.min` in `exports`; those subpaths are gone, so load the files from a CDN URL (or copy `node_modules/@jsonpathx/jsonpathx/dist/jsonpathx.umd.min.js` into your static assets) instead of importing them.

---

## Testing frameworks

- **Vitest**, **Node's test runner**, and **Jest in ESM mode** import jsonpathx like any ESM code.
- **Jest in CommonJS mode** loads modules through its own runtime, not Node.js's `require()`, so `require(esm)` support depends on the Jest version. If `require('@jsonpathx/jsonpathx')` fails there, run Jest in ESM mode, or let Jest transform the package (`transformIgnorePatterns: ['node_modules/(?!@jsonpathx/)']`).

---

## Troubleshooting

### `ERR_REQUIRE_ESM` / "require() of ES Module … not supported"

Your Node.js version doesn't support `require(esm)` (see the [table](#commonjs-require)). Upgrade Node.js, or use dynamic import:

```javascript
const { JSONPath } = await import('@jsonpathx/jsonpathx');
```

### "does not provide an export named 'default'"

There is no default export. Use a named import:

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';
```

### TS1479 in a CommonJS TypeScript file

See [CommonJS output](#commonjs-output): use `"module": "NodeNext"` with TypeScript 5.8 or later, or a dynamic `import()`.

---

## Compatibility

| Environment | `import` | `require()` | Notes |
|-------------|----------|-------------|-------|
| Node.js 22.12+, 23+ | ✅ | ✅ | `require(esm)` on by default |
| Node.js 22.0–22.11 | ✅ | ❌ | use `import()` |
| Node.js < 22 | – | – | not supported (`engines.node` is `>=22`) |
| Deno | ✅ | n/a | |
| Bun | ✅ | ✅ | |
| Browsers | ✅ via bundler or ESM CDN | n/a | or the UMD script tag |
| Vite, webpack 5, Rollup, esbuild, Parcel | ✅ | ✅ in CJS output | bundled |

---

## Further reading

- [Node.js: Loading ECMAScript modules using `require()`](https://nodejs.org/api/modules.html#loading-ecmascript-modules-using-require)
- [Node.js ESM documentation](https://nodejs.org/api/esm.html)
- [Package.json `exports` field](https://nodejs.org/api/packages.html#exports)
- [TypeScript module resolution](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
