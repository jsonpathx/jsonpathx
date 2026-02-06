# Module Format Guide

jsonpathx is published as a **dual-format package** supporting both ESM (ES Modules) and CommonJS, ensuring compatibility with all Node.js projects and bundlers.

## 📦 Package Format Overview

### What's Included

Every npm package includes:
- **ESM**: `dist/index.js` (ES Modules)
- **CommonJS**: `dist/index.cjs` (require-compatible)
- **TypeScript**: `dist/index.d.ts` & `dist/index.d.cts` (type definitions)
- **Source Maps**: `.map` files for debugging

### Package Configuration

```json
{
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs",
      "types": "./dist/index.d.ts"
    }
  }
}
```

---

## 🔷 ESM (ES Modules)

### When to Use ESM

- ✅ Modern Node.js projects (v14+)
- ✅ TypeScript projects
- ✅ Front-end with bundlers (Vite, Webpack 5+, Rollup)
- ✅ Next.js, Nuxt, SvelteKit
- ✅ Deno runtime

### Named Imports

```typescript
// Recommended: Import what you need
import { JSONPath, QueryBuilder, PathUtils } from 'jsonpathx';

// Query data
const result = await JSONPath.query('$.users[*].name', data);

// Use QueryBuilder
const builder = new QueryBuilder(data);
const filtered = await builder.query('$.items[*]').execute();

// Use PathUtils
const pathArray = PathUtils.toPathArray('$.store.book[0]');
```

### Default Import

```typescript
// Import default (the JSONPath class)
import JSONPath from 'jsonpathx';

const result = await JSONPath.query('$.data', { data: [1, 2, 3] });
```

### Mixed Imports

```typescript
// Both default and named imports
import JSONPath, { QueryBuilder, PathUtils } from 'jsonpathx';
```

### Dynamic Imports

```typescript
// Lazy load for code splitting
async function queryData() {
  const { JSONPath } = await import('jsonpathx');
  return JSONPath.query('$.users[*]', data);
}
```

### package.json Configuration

```json
{
  "type": "module",
  "scripts": {
    "start": "node index.js"
  }
}
```

---

## 🔶 CommonJS

### When to Use CommonJS

- ✅ Legacy Node.js projects
- ✅ Projects without "type": "module"
- ✅ Jest testing (default mode)
- ✅ Older bundler configurations

### Named Exports (Recommended)

```javascript
// Recommended: Use named exports
const { JSONPath, QueryBuilder, PathUtils } = require('jsonpathx');

// Query data
const result = await JSONPath.query('$.users[*].name', data);

// Use QueryBuilder
const builder = new QueryBuilder(data);
const filtered = await builder.query('$.items[*]').execute();
```

### Default Export

```javascript
// Access via .default property
const module = require('jsonpathx');
const JSONPath = module.default || module.JSONPath;

const result = await JSONPath.query('$.data', { data: [1, 2, 3] });
```

### package.json Configuration

```json
{
  "type": "commonjs",
  "scripts": {
    "start": "node index.js"
  }
}
```

---

## 🔀 TypeScript

### With Modern Config (ESM)

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "module": "ES2022",
    "moduleResolution": "bundler",
    "target": "ES2022",
    "esModuleInterop": true
  }
}
```

```typescript
// index.ts
import { JSONPath } from 'jsonpathx';

const result = await JSONPath.query('$.users[*].email', data);
```

### With CommonJS Config

```typescript
// tsconfig.json
{
  "compilerOptions": {
    "module": "CommonJS",
    "moduleResolution": "node",
    "target": "ES2022",
    "esModuleInterop": true
  }
}
```

```typescript
// index.ts (will compile to require())
import { JSONPath } from 'jsonpathx';

const result = await JSONPath.query('$.users[*].email', data);
```

### Type Imports

```typescript
// Import types only (no runtime code)
import type { QueryOptions, ResultType } from 'jsonpathx';

// Import runtime and types
import { JSONPath, type QueryOptions } from 'jsonpathx';

const options: QueryOptions = {
  resultType: 'path',
  flatten: true
};
```

---

## 🎯 Bundler Support

### Vite

Works out of the box:

```typescript
// vite.config.ts
export default {
  // No special configuration needed
}
```

```typescript
// src/main.ts
import { JSONPath } from 'jsonpathx';
```

### Webpack 5

```javascript
// webpack.config.js
module.exports = {
  resolve: {
    extensions: ['.ts', '.js'],
  },
  // jsonpathx works automatically
};
```

### Rollup

```javascript
// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';

export default {
  plugins: [
    resolve({
      preferBuiltins: false
    })
  ]
};
```

### esbuild

```javascript
// build.js
import * as esbuild from 'esbuild';

await esbuild.build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  format: 'esm', // or 'cjs'
  outfile: 'dist/bundle.js',
});
```

### Parcel

Works automatically:

```html
<!-- index.html -->
<script type="module" src="./index.ts"></script>
```

```typescript
// index.ts
import { JSONPath } from 'jsonpathx';
```

---

## 🌐 Framework Integration

### Next.js

```typescript
// app/page.tsx (App Router)
import { JSONPath } from 'jsonpathx';

export default async function Page() {
  const data = await fetch('https://api.example.com/data');
  const json = await data.json();
  const users = await JSONPath.query('$.users[*].name', json);

  return <div>{users.join(', ')}</div>;
}
```

### Nuxt 3

```typescript
// composables/useJsonPath.ts
import { JSONPath } from 'jsonpathx';

export const useJsonPath = () => {
  return {
    query: (path: string, data: unknown) => JSONPath.query(path, data)
  };
};
```

### SvelteKit

```typescript
// src/routes/+page.ts
import { JSONPath } from 'jsonpathx';

export async function load() {
  const data = { users: [{ name: 'Alice' }] };
  const names = await JSONPath.query('$.users[*].name', data);

  return { names };
}
```

### React (Vite)

```typescript
// src/App.tsx
import { JSONPath } from 'jsonpathx';
import { useEffect, useState } from 'react';

export function App() {
  const [result, setResult] = useState([]);

  useEffect(() => {
    JSONPath.query('$.data[*]', myData).then(setResult);
  }, []);

  return <div>{JSON.stringify(result)}</div>;
}
```

### Vue 3

```typescript
// src/App.vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { JSONPath } from 'jsonpathx';

const result = ref([]);

onMounted(async () => {
  result.value = await JSONPath.query('$.items[*]', data);
});
</script>
```

---

## 🧪 Testing Frameworks

### Vitest (ESM)

```typescript
// vitest.config.ts
export default {
  test: {
    globals: true
  }
};
```

```typescript
// test.ts
import { describe, it, expect } from 'vitest';
import { JSONPath } from 'jsonpathx';

describe('JSONPath', () => {
  it('should query data', async () => {
    const result = await JSONPath.query('$.name', { name: 'test' });
    expect(result).toEqual(['test']);
  });
});
```

### Jest (CommonJS)

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'node',
};
```

```javascript
// test.js
const { JSONPath } = require('jsonpathx');

test('should query data', async () => {
  const result = await JSONPath.query('$.name', { name: 'test' });
  expect(result).toEqual(['test']);
});
```

### Jest (ESM)

```javascript
// jest.config.js
module.exports = {
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
  },
};
```

```javascript
// package.json
{
  "type": "module"
}
```

---

## 🔧 Troubleshooting

### Error: "Cannot use import outside a module"

**Cause:** Using ESM syntax in CommonJS project.

**Solution 1:** Add to package.json:
```json
{
  "type": "module"
}
```

**Solution 2:** Use CommonJS:
```javascript
const { JSONPath } = require('jsonpathx');
```

**Solution 3:** Use .mjs extension:
```bash
mv index.js index.mjs
```

---

### Error: "require() of ES Module not supported"

**Cause:** Trying to require() an ESM package.

**Solution:** Use dynamic import:
```javascript
// Instead of:
const { JSONPath } = require('jsonpathx'); // ❌

// Use:
const { JSONPath } = await import('jsonpathx'); // ✅
```

---

### Error: "Module not found"

**Cause:** Bundler not configured correctly.

**Solution:** Check package.json exports field is supported:
```json
{
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  }
}
```

For older bundlers, use main/module fields:
```json
{
  "main": "./dist/index.cjs",
  "module": "./dist/index.js"
}
```

---

### TypeScript "Could not find declaration file"

**Cause:** TypeScript can't find type definitions.

**Solution:** Check types field in package.json:
```json
{
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts"
    }
  }
}
```

---

## 📊 Compatibility Matrix

| Environment | ESM | CommonJS | Notes |
|-------------|-----|----------|-------|
| Node.js 14+ | ✅ | ✅ | Full support |
| Node.js 12 | ⚠️ | ✅ | ESM experimental |
| Deno | ✅ | ❌ | ESM only |
| Bun | ✅ | ✅ | Full support |
| Browsers | ✅ | N/A | Via bundler |
| TypeScript | ✅ | ✅ | Full support |
| Vite | ✅ | ⚠️ | ESM preferred |
| Webpack 5 | ✅ | ✅ | Full support |
| Webpack 4 | ⚠️ | ✅ | CJS preferred |
| Rollup | ✅ | ✅ | Full support |
| Parcel | ✅ | ✅ | Full support |
| esbuild | ✅ | ✅ | Full support |

---

## 🎓 Best Practices

### 1. Prefer Named Imports

```typescript
// ✅ Good - Tree-shakeable
import { JSONPath } from 'jsonpathx';

// ⚠️ Less optimal - Imports everything
import * as jsonpathx from 'jsonpathx';
```

### 2. Use Type-Only Imports

```typescript
// ✅ Good - No runtime cost
import { JSONPath, type QueryOptions } from 'jsonpathx';

// ⚠️ Less optimal - Runtime import
import { JSONPath, QueryOptions } from 'jsonpathx';
```

### 3. Lazy Load When Possible

```typescript
// ✅ Good - Code splitting
const loadJSONPath = () => import('jsonpathx');

button.onclick = async () => {
  const { JSONPath } = await loadJSONPath();
  // Use JSONPath
};
```

### 4. Match Your Project's Module System

```typescript
// If your project uses ESM, use ESM
// If your project uses CommonJS, use CommonJS
// Don't mix unless necessary
```

---

## 📚 Additional Resources

- [Node.js ESM Documentation](https://nodejs.org/api/esm.html)
- [TypeScript Module Resolution](https://www.typescriptlang.org/docs/handbook/module-resolution.html)
- [Package.json Exports Field](https://nodejs.org/api/packages.html#exports)
- [Dual Package Hazards](https://nodejs.org/api/packages.html#dual-package-hazard)

---

## 🆘 Need Help?

If you're having module format issues:

1. Check your package.json "type" field
2. Verify your bundler configuration
3. Check the [GitHub issues](https://github.com/jsonpathx/jsonpathx/issues)
4. Review error messages carefully
5. Try the opposite format (ESM ↔ CommonJS)

---

Happy coding! 📦✨
