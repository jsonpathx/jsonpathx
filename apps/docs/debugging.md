# Debugging

This guide covers debugging jsonpathx in Node.js and browser environments.

## Basic Checks

```typescript
import { JSONPath } from 'jsonpathx';

const result = await JSONPath.query('$.items[*]', data);
console.log(result);
```

## Common Issues

### Invalid JSONPath

```typescript
try {
  JSONPath.parse('$.invalid..path');
} catch (error) {
  console.error('Invalid path:', error.message);
}
```

### Performance

- Prefer specific paths over `..`.
- Use `enableCache` for repeated queries on the same data.

```typescript
JSONPath.enableCache({ maxSize: 100, ttl: 60000 });
await JSONPath.query('$.items[*]', data, { enableCache: true });
```

## Notes

jsonpathx is JavaScript-only. There is no WASM initialization step.
