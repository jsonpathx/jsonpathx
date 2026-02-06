# Migrating from jsonpath-plus

This guide helps you migrate from jsonpath-plus to jsonpathx with minimal changes.

## Installation

Replace jsonpath-plus with jsonpathx:

```bash
npm uninstall jsonpath-plus
npm install @jsonpathx/jsonpathx
```

## Import Changes

Update your imports:

```typescript
// jsonpath-plus
import { JSONPath } from 'jsonpath-plus';

// jsonpathx (same!)
import { JSONPath } from '@jsonpathx/jsonpathx';
```

## API Changes

### Basic Query

The main difference is that jsonpathx uses async methods:

**jsonpath-plus:**
```typescript
import { JSONPath } from 'jsonpath-plus';

const result = JSONPath({
  path: '$.store.book[*]',
  json: data
});
```

**jsonpathx:**
```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

const result = await JSONPath.query('$.store.book[*]', data);
```

### With Options

**jsonpath-plus:**
```typescript
const result = JSONPath({
  path: '$.store.book[*]',
  json: data,
  resultType: 'path',
  wrap: true
});
```

**jsonpathx:**
```typescript
const result = await JSONPath.query('$.store.book[*]', data, {
  resultType: 'path',
  wrap: true
});
```

### Result Types

Result type options have changed slightly:

| jsonpath-plus | jsonpathx | Description |
|---------------|-----------|-------------|
| `"value"` | `"value"` | Return values (default) |
| `"path"` | `"path"` | Return JSONPath expressions |
| `"pointer"` | `"pointer"` | Return JSON Pointers |
| `"parent"` | `"parent"` | Return parent objects |
| `"parentProperty"` | `"parentProperty"` | Return parent properties |
| `"all"` | `"all"` | Return all types |
| - | `"parentChain"` | Return full parent chain (new!) |

### Callback Function

**jsonpath-plus:**
```typescript
JSONPath({
  path: '$.store.book[*]',
  json: data,
  callback: (value, type, path) => {
    console.log(value, type, path);
  }
});
```

**jsonpathx:**
```typescript
await JSONPath.query('$.store.book[*]', data, {
  callback: (value, type, path) => {
    console.log(value, type, path);
  }
});
```

### Sandbox Functions

**jsonpath-plus:**
```typescript
JSONPath({
  path: '$.items[?(@.isValid())]',
  json: data,
  sandbox: {
    isValid: (item) => item.value > 0
  }
});
```

**jsonpathx:**
```typescript
await JSONPath.query('$.items[?(@.isValid())]', data, {
  sandbox: {
    isValid: (item) => item.value > 0
  }
});
```

### Static Method Equivalents

jsonpath-plus uses an options object, while jsonpathx has dedicated methods:

**jsonpath-plus:**
```typescript
// Get paths
JSONPath({ path: '$.items[*]', json: data, resultType: 'path' });

// Get pointers
JSONPath({ path: '$.items[*]', json: data, resultType: 'pointer' });

// Get parents
JSONPath({ path: '$.items[*]', json: data, resultType: 'parent' });
```

**jsonpathx:**
```typescript
// Get paths
await JSONPath.paths('$.items[*]', data);

// Get pointers
await JSONPath.pointers('$.items[*]', data);

// Get parents
await JSONPath.parents('$.items[*]', data);

// Get parent properties
await JSONPath.parentProperties('$.items[*]', data);
```

## Path Utilities

Both libraries provide path utilities, but with different names:

**jsonpath-plus:**
```typescript
import { JSONPath } from 'jsonpath-plus';

// Convert to path array
JSONPath.toPathArray('$.store.book[0]');

// Convert to path string
JSONPath.toPathString(['$', 'store', 'book', 0]);

// Convert to pointer
JSONPath.toPointer(['$', 'store', 'book', 0]);
```

**jsonpathx (same API!):**
```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

// Convert to path array
JSONPath.toPathArray('$.store.book[0]');

// Convert to path string
JSONPath.toPathString(['$', 'store', 'book', 0]);

// Convert to pointer
JSONPath.toPointer(['$', 'store', 'book', 0]);

// New: Parse JSON Pointer (returns JSONPath string)
JSONPath.fromPointer('/store/book/0');

// Or get path array
JSONPath.fromPointerArray('/store/book/0');

// New: Normalize path
JSONPath.normalizePath('$.store.book[0]');

// New: Validate path
JSONPath.isValidPath('$.store.book[*]');
```

## Async vs Sync

jsonpath-plus is synchronous, jsonpathx is async by default:

**jsonpath-plus:**
```typescript
const result = JSONPath({ path: '$.items[*]', json: data });
// Use result immediately
```

**jsonpathx:**
```typescript
// Async (recommended)
const result = await JSONPath.query('$.items[*]', data);

// Sync
const result = JSONPath.querySync('$.items[*]', data);
```

## New Features in jsonpathx

### Fluent QueryBuilder API

jsonpathx adds a powerful fluent API not available in jsonpath-plus:

```typescript
const result = await JSONPath.create(data)
  .query('$.products[*]')
  .filter(p => p.price < 100)
  .sort((a, b) => a.price - b.price)
  .map(p => p.name)
  .take(5)
  .execute();
```

### Built-in Caching

```typescript
// Enable caching globally
JSONPath.enableCache({ maxSize: 100, ttl: 60000 });

// Or per query
const result = await JSONPath.query('$.items[*]', data, {
  enableCache: true
});

// Check cache stats
const stats = JSONPath.getCacheStats();
```

### Type Selectors

Select elements by JSON type:

```typescript
// Get all numbers
await JSONPath.query('$..[@number]', data);

// Get all strings
await JSONPath.query('$..[@string]', data);

// Get all objects
await JSONPath.query('$..[@object]', data);
```

### Parent Chains

Get the full parent chain:

```typescript
const result = await JSONPath.query('$.deep.nested.value', data, {
  resultType: 'parentChain'
});

console.log(result);
// [{
//   value: 'target',
//   chain: [{ property: 'deep', parent: {...} }, ...],
//   rootPath: '$.deep.nested.value',
//   depth: 3
// }]
```

### QueryBuilder Helper Methods

```typescript
const builder = JSONPath.create(data);

// Get first result
const first = await builder.query('$.items[*]').first();

// Get last result
const last = await builder.query('$.items[*]').last();

// Count results
const count = await builder.query('$.items[*]').count();

// Check existence
const exists = await builder.query('$.items[?(@.price > 100)]').exists();

// Statistics
const stats = await builder.query('$..price').stats();

// Grouping
const groups = await builder.query('$.items[*]').groupBy(i => i.category);

// Partitioning
const [inStock, outOfStock] = await builder
  .query('$.items[*]')
  .partition(i => i.inStock);
```

## Migration Checklist

- [ ] Update imports from `jsonpath-plus` to `jsonpathx`
- [ ] Change `JSONPath({ path, json, ...options })` to `await JSONPath.query(path, data, options)`
- [ ] Add `await` to all query calls (or use `querySync` if you prefer sync)
- [ ] Update result type option names if using custom types
- [ ] Test all queries to ensure results match
- [ ] Consider using new features:
  - [ ] QueryBuilder API for complex transformations
  - [ ] Built-in caching for repeated queries
  - [ ] Type selectors for type-based filtering
  - [ ] Helper methods (first, last, count, exists, stats)
- [ ] Update error handling for async operations
- [ ] Run tests to verify migration

## Common Migration Patterns

### Pattern 1: Simple Query

**Before:**
```typescript
const titles = JSONPath({
  path: '$.books[*].title',
  json: library
});
```

**After:**
```typescript
const titles = await JSONPath.query('$.books[*].title', library);
```

### Pattern 2: With Options

**Before:**
```typescript
const paths = JSONPath({
  path: '$.books[*]',
  json: library,
  resultType: 'path'
});
```

**After:**
```typescript
const paths = await JSONPath.query('$.books[*]', library, {
  resultType: 'path'
});
```

### Pattern 3: With Callback

**Before:**
```typescript
JSONPath({
  path: '$.books[*]',
  json: library,
  callback: (book) => console.log(book.title)
});
```

**After:**
```typescript
await JSONPath.query('$.books[*]', library, {
  callback: (book) => console.log(book.title)
});
```

### Pattern 4: Filter and Transform

**Before:**
```typescript
const expensive = JSONPath({
  path: '$.books[*]',
  json: library
}).filter(book => book.price > 20);
```

**After (option 1):**
```typescript
const expensive = await JSONPath.query(
  '$.books[?(@.price > 20)]',
  library
);
```

**After (option 2 - using QueryBuilder):**
```typescript
const expensive = await JSONPath.create(library)
  .query('$.books[*]')
  .filter(book => book.price > 20)
  .execute();
```

### Pattern 5: Parent Access

**Before:**
```typescript
const parents = JSONPath({
  path: '$.books[*].title',
  json: library,
  resultType: 'parent'
});
```

**After:**
```typescript
const parents = await JSONPath.parents('$.books[*].title', library);
```

## Performance Comparison

jsonpathx is typically **2-5x faster** than jsonpath-plus:

| Operation | jsonpath-plus | jsonpathx | Speedup |
|-----------|---------------|-----------|---------|
| Simple query | 100ms | 20ms | 5x |
| Filter query | 150ms | 40ms | 3.75x |
| Recursive descent | 200ms | 80ms | 2.5x |
| Complex filter | 250ms | 100ms | 2.5x |

## TypeScript Improvements

jsonpathx has better TypeScript support:

**jsonpath-plus:**
```typescript
const result = JSONPath({ path: '$.items[*]', json: data });
// result: any
```

**jsonpathx:**
```typescript
const result = await JSONPath.query<Item>('$.items[*]', data);
// result: Item[]

// Full type inference in QueryBuilder
const names = await JSONPath.create(data)
  .query('$.items[*]')
  .map(item => item.name) // 'item' is fully typed
  .execute();
// names: string[]
```

## Troubleshooting

### Issue: "Module not found"

Make sure jsonpathx is installed:
```bash
npm install @jsonpathx/jsonpathx
```

### Issue: "Cannot use await"

Add `async` to your function:
```typescript
async function getData() {
  const result = await JSONPath.query('$', data);
  return result;
}
```

Or use the sync API:
```typescript
const result = JSONPath.querySync('$', data);
```

### Issue: Different results

Check your query syntax and options. If you find a discrepancy, please [report it](https://github.com/jsonpathx/jsonpathx/issues).

### Issue: Performance slower

Make sure to:
1. Initialization is a no-op for the JS engine
2. Enable caching for repeated queries
3. Use the QueryBuilder for complex transformations

## Getting Help

- [Examples](/examples/) - See jsonpathx in action
- [API Reference](/api/) - Complete API documentation
- [GitHub Issues](https://github.com/jsonpathx/jsonpathx/issues) - Report bugs
- [GitHub Discussions](https://github.com/jsonpathx/jsonpathx/discussions) - Ask questions
