# Installation

## Package Manager

Install jsonpathx using your preferred package manager:

::: code-group

```bash [npm]
npm install @jsonpathx/jsonpathx
```

```bash [yarn]
yarn add @jsonpathx/jsonpathx
```

```bash [pnpm]
pnpm add @jsonpathx/jsonpathx
```

```bash [bun]
bun add @jsonpathx/jsonpathx
```

:::

## Requirements

- **Node.js**: 22 or higher
- **TypeScript**: 5.0 or higher (optional, but recommended)

## Import

jsonpathx is an ES module package with named exports (there is no default export):

::: code-group

```typescript [ESM]
import { JSONPath } from '@jsonpathx/jsonpathx';
```

```javascript [CommonJS]
// Node.js 22.12+ (require(esm))
const { JSONPath } = require('@jsonpathx/jsonpathx');

// On Node.js 22.0–22.11, use dynamic import instead:
// const { JSONPath } = await import('@jsonpathx/jsonpathx');
```

:::

There is no separate CommonJS build: `require()` loads the ESM build on Node.js versions with `require(esm)` support. See [Module Formats](../module-formats.md) for details.

## TypeScript Configuration

For the best experience with TypeScript, ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

## Browser Usage

jsonpathx works in modern browsers:

```html
<!-- Via CDN (ESM) -->
<script type="module">
  import { JSONPath } from 'https://esm.sh/@jsonpathx/jsonpathx';

  const data = { items: [1, 2, 3] };
  const result = await JSONPath.query('$.items[*]', data);
  console.log(result);
</script>
```

```html
<!-- Via CDN (UMD / global) -->
<script src="https://unpkg.com/@jsonpathx/jsonpathx/dist/jsonpathx.umd.min.js"></script>
<script>
  const { JSONPath } = window.JSONPathX;
  const data = { items: [1, 2, 3] };
  JSONPath.query('$.items[*]', data).then(console.log);
</script>
```

The UMD script is also on jsDelivr (`https://cdn.jsdelivr.net/npm/@jsonpathx/jsonpathx`). It is a classic script, not an entry point in `exports`, so load it with a `<script>` tag rather than importing it.

### Browser Support

- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 16+

### Bundlers

No special bundler configuration is required for the JS engine.


## Initialization

Initialization is a no-op for the JS engine. You can call it for API compatibility if you want:

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';
await JSONPath.init();
```


## Verification

Verify your installation:

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

const data = { greeting: 'Hello, jsonpathx!' };
const result = await JSONPath.query('$.greeting', data);

console.log(result); // ['Hello, jsonpathx!']
console.log('jsonpathx is working!');
```

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors:

1. Ensure TypeScript 5.0+ is installed
2. Check your `tsconfig.json` configuration
3. Run `npm install @types/node` if using Node.js APIs

### Performance Issues

If queries are slow:

1. Enable caching for repeated queries
2. Use the fluent API for complex transformations

## Next Steps

- [Quick Start Tutorial](/guide/quick-start) - Learn the basics
- [JSONPath Syntax](/guide/syntax) - Understand the query language
- [API Reference](/api/) - Explore the full API
