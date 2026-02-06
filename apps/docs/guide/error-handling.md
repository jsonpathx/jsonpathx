# Error Handling

This guide covers common error scenarios and how to handle them.

## Invalid JSONPath

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

try {
  JSONPath.parse('$.invalid..path');
} catch (error) {
  console.error('Invalid path:', error.message);
}
```

## Query Errors

```typescript
try {
  const result = await JSONPath.query('$.items[*]', data, {
    eval: 'safe',
    ignoreEvalErrors: true
  });
} catch (error) {
  console.error('Query failed:', error.message);
}
```

## QueryBuilder Errors

```typescript
// Missing .query() will throw
const builder = JSONPath.create(data);
try {
  await builder.execute();
} catch (error) {
  console.error(error.message);
}
```

## Notes

jsonpathx is JavaScript-only. There is no WASM initialization step; `init()` is a no-op kept for compatibility.
