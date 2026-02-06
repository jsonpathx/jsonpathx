# Query Options

Comprehensive guide to all query configuration options in jsonpathx. Learn how to customize query behavior, control output formats, enable caching, and configure security settings.

## Overview

Query options allow you to customize how JSONPath queries are executed and what results are returned. Options are passed as the third parameter to query methods.

```typescript
await JSONPath.query(path, data, options);
```

## Core Options

### `resultType`

Controls the format of query results.

**Type**: `'value' | 'path' | 'pointer' | 'all'`
**Default**: `'value'`

```typescript
// Return matched values (default)
const values = await JSONPath.query('$.items[*]', data, {
  resultType: 'value'
});
// Result: [item1, item2, item3]

// Return JSONPath strings
const paths = await JSONPath.query('$.items[*]', data, {
  resultType: 'path'
});
// Result: ['$.items[0]', '$.items[1]', '$.items[2]']

// Return JSON Pointers
const pointers = await JSONPath.query('$.items[*]', data, {
  resultType: 'pointer'
});
// Result: ['/items/0', '/items/1', '/items/2']

// Return all result types
const all = await JSONPath.query('$.items[*]', data, {
  resultType: 'all'
});
// Result: { values: [...], paths: [...], pointers: [...], parents: [...] }
```

**See Also**: [Result Types Guide](./result-types.md)

### `flatten`

Flattens nested array results into a single array.

**Type**: `boolean`
**Default**: `false`

```typescript
const data = {
  categories: [
    { items: [1, 2] },
    { items: [3, 4] }
  ]
};

// Without flatten
const nested = await JSONPath.query('$.categories[*].items', data);
// Result: [[1, 2], [3, 4]]

// With flatten
const flat = await JSONPath.query('$.categories[*].items', data, {
  flatten: true
});
// Result: [1, 2, 3, 4]
```

### `sandbox`

Provides custom functions for filter expressions.

**Type**: `Record<string, Function>`
**Default**: `{}`

```typescript
const sandbox = {
  isExpensive: (item) => item.price > 100,
  inStock: (item) => item.quantity > 0
};

const result = await JSONPath.query(
  '$.products[?(@.isExpensive() && @.inStock())]',
  data,
  { sandbox }
);
```

**Security**: Function names are validated. Reserved names are blocked.

**See Also**: [Custom Functions Guide](./custom-functions.md)

## Caching Options

### `enableCache`

Enables query result caching for the current query.

**Type**: `boolean`
**Default**: `false`

```typescript
// Enable cache for this query
const result = await JSONPath.query(path, data, {
  enableCache: true
});

// Subsequent identical queries use cached results
const cached = await JSONPath.query(path, data, {
  enableCache: true
});  // Instant return from cache
```

### Global Cache Configuration

```typescript
// Configure global cache
JSONPath.enableCache({
  maxSize: 200,      // Maximum entries
  ttl: 120000       // Time to live (ms)
});

// Use cache in queries
await JSONPath.query(path, data, { enableCache: true });
```

**See Also**: [Caching Guide](./caching.md)

## Error Handling Options

### `ignoreEvalErrors`

Treats filter evaluation errors as false instead of throwing.

**Type**: `boolean`
**Default**: `false`

```typescript
const data = {
  items: [
    { name: 'A', value: 10 },
    { name: 'B' },  // Missing 'value' property
    { name: 'C', value: 20 }
  ]
};

// Without ignoreEvalErrors (throws error on item B)
try {
  await JSONPath.query('$.items[?(@.value > 15)]', data);
} catch (error) {
  console.error('Error accessing missing property');
}

// With ignoreEvalErrors (treats missing as false)
const result = await JSONPath.query('$.items[?(@.value > 15)]', data, {
  ignoreEvalErrors: true
});
// Result: [{ name: 'C', value: 20 }]
```

**Use Cases**:
- Optional properties
- Heterogeneous data
- Graceful degradation

## Advanced Options

### `includeParents`

Include parent nodes in results (requires `resultType: 'all'`).

**Type**: `boolean`
**Default**: `false`

```typescript
const result = await JSONPath.query('$.items[*].name', data, {
  resultType: 'all',
  includeParents: true
});

console.log(result.parents);  // Parent objects
console.log(result.parentProperties);  // Property names
```

**See Also**: [Parent Selector Guide](./parent-selector.md)

### `wrap`

Wraps single results in an array.

**Type**: `boolean`
**Default**: `true`

```typescript
// With wrap (default)
const wrapped = await JSONPath.query('$.single', { single: 'value' });
// Result: ['value']

// Without wrap
const unwrapped = await JSONPath.query('$.single', { single: 'value' }, {
  wrap: false
});
// Result: 'value'
```

**Note**: Most code expects array results. Use `wrap: false` carefully.

## Option Combinations

### Common Patterns

#### 1. Debug Mode

Get comprehensive information about query results:

```typescript
const debug = await JSONPath.query(path, data, {
  resultType: 'all',
  includeParents: true,
  ignoreEvalErrors: true
});

console.log('Values:', debug.values);
console.log('Paths:', debug.paths);
console.log('Parents:', debug.parents);
```

#### 2. Performance Mode

Optimize for speed with caching:

```typescript
const result = await JSONPath.query(path, data, {
  enableCache: true,
  flatten: true,  // Reduce array nesting
  wrap: false     // Skip array wrapping
});
```

#### 3. Safe Mode

Handle unpredictable data gracefully:

```typescript
const result = await JSONPath.query(path, data, {
  ignoreEvalErrors: true,
  wrap: true  // Always return array
});
```

## TypeScript Interface

Complete type definition for query options:

```typescript
interface QueryOptions {
  // Result format
  resultType?: 'value' | 'path' | 'pointer' | 'all';

  // Array handling
  flatten?: boolean;
  wrap?: boolean;

  // Custom functions
  sandbox?: Record<string, Function>;

  // Caching
  enableCache?: boolean;

  // Error handling
  ignoreEvalErrors?: boolean;

  // Parent tracking
  includeParents?: boolean;

  // Internal options (advanced)
  preventEval?: boolean;  // Disable eval in filters
  callback?: CallbackFunction;  // Result processing
}
```

## Default Values

When no options are provided, these defaults are used:

```typescript
const defaultOptions: QueryOptions = {
  resultType: 'value',
  flatten: false,
  wrap: true,
  sandbox: {},
  enableCache: false,
  ignoreEvalErrors: false,
  includeParents: false,
  preventEval: false
};
```

## Option Validation

Options are validated before execution:

```typescript
// ✅ Valid
await JSONPath.query(path, data, {
  resultType: 'value'
});

// ❌ Invalid result type
await JSONPath.query(path, data, {
  resultType: 'invalid'  // Error: Invalid resultType
});

// ❌ Invalid sandbox
await JSONPath.query(path, data, {
  sandbox: {
    constructor: () => {}  // Error: Reserved name
  }
});
```

## Performance Impact

### Option Overhead

| Option | Performance Impact |
|--------|-------------------|
| `resultType: 'value'` | Baseline |
| `resultType: 'path'` | +5% |
| `resultType: 'all'` | +10% |
| `flatten: true` | +2-5% |
| `sandbox` | +10-20% (filter execution) |
| `enableCache: true` | -50% to -90% (cached) |
| `includeParents: true` | +5% |
| `ignoreEvalErrors: true` | +2% |

### Optimization Tips

```typescript
// ❌ Slow: Heavy options for simple query
await JSONPath.query('$.simple', data, {
  resultType: 'all',
  includeParents: true,
  flatten: true
});

// ✅ Fast: Minimal options
await JSONPath.query('$.simple', data);

// ✅ Fast: Cache for repeated queries
await JSONPath.query(expensivePath, data, {
  enableCache: true
});
```

## Examples

### E-Commerce Query

```typescript
const products = await JSONPath.query(
  '$.categories[*].products[?(@.inStock() && @.onSale())]',
  catalog,
  {
    sandbox: {
      inStock: (p) => p.quantity > 0,
      onSale: (p) => p.discount > 0
    },
    flatten: true,          // Flatten nested category arrays
    enableCache: true,      // Cache result
    ignoreEvalErrors: true  // Handle missing properties
  }
);
```

### Data Validation

```typescript
const result = await JSONPath.query(
  '$..requiredField',
  data,
  {
    resultType: 'all',      // Get paths for missing fields
    ignoreEvalErrors: true, // Don't throw on missing
    includeParents: true    // Track where fields should be
  }
);

// Check which objects are missing required fields
const missingFields = result.parents.filter((parent, index) =>
  !result.values[index]
);
```

### Debug Query

```typescript
const debug = await JSONPath.query(
  '$.complex[?(@.custom())]',
  data,
  {
    resultType: 'all',
    includeParents: true,
    sandbox: { custom: (x) => x.value > 10 }
  }
);

console.log('Matched values:', debug.values);
console.log('Match locations:', debug.paths);
console.log('Parent objects:', debug.parents);
```

## Migration Notes

### From jsonpath-plus

jsonpath-plus uses different option names:

```typescript
// jsonpath-plus
JSONPath({
  path: '$.items[*]',
  json: data,
  resultType: 'path',
  flatten: true,
  wrap: false
});

// jsonpathx (similar API)
await JSONPath.query('$.items[*]', data, {
  resultType: 'path',
  flatten: true,
  wrap: false
});
```

### From other libraries

Common mapping:

| Other Library | jsonpathx |
|--------------|-----------|
| `json` | `data` parameter |
| `path` | `path` parameter |
| `evalType` | `sandbox` |
| `otherTypeAnnouncement` | Not needed |

## See Also

- [Result Types](./result-types.md) - Understanding result formats
- [Custom Functions](./custom-functions.md) - Using the sandbox
- [Caching](./caching.md) - Cache configuration
- [Error Handling](./error-handling.md) - Error strategies
- [API Reference](../api/jsonpath.md) - Complete API
