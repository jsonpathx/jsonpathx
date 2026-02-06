# Installation

## Package Manager

Install jsonpathx using your preferred package manager:

::: code-group

```bash [npm]
npm install jsonpathx
```

```bash [yarn]
yarn add jsonpathx
```

```bash [pnpm]
pnpm add jsonpathx
```

```bash [bun]
bun add jsonpathx
```

:::

## Requirements

- **Node.js**: 18.0.0 or higher
- **TypeScript**: 5.0 or higher (optional, but recommended)

## Import

jsonpathx supports both ESM and CommonJS:

::: code-group

```typescript [ESM]
import { JSONPath } from 'jsonpathx';
// or
import JSONPath from 'jsonpathx';
```

```typescript [CommonJS]
const { JSONPath } = require('jsonpathx');
// or
const JSONPath = require('jsonpathx').default;
```

:::

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
  import { JSONPath } from 'https://esm.sh/jsonpathx';

  const data = { items: [1, 2, 3] };
  const result = await JSONPath.query('$.items[*]', data);
  console.log(result);
</script>
```

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
import { JSONPath } from 'jsonpathx';
await JSONPath.init();
```


## Verification

Verify your installation:

```typescript
import { JSONPath } from 'jsonpathx';

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
