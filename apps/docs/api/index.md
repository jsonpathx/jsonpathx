# API Reference

Complete API documentation for jsonpathx.

## Core Classes

### JSONPath

The main class for executing JSONPath queries.

**Static Methods:**
- `query()` - Execute a JSONPath query
- `querySync()` - Synchronous query execution
- `paths()` - Get JSONPath expressions
- `pointers()` - Get JSON Pointers
- `parents()` - Get parent objects
- `parentProperties()` - Get parent properties
- `init()` - Initialize engine
- `isInitialized()` - Check initialization status
- `create()` - Create QueryBuilder instance
- `parse()` - Parse and validate path

**Cache Methods:**
- `enableCache()` - Enable result caching
- `disableCache()` - Disable caching
- `clearCache()` - Clear cache
- `getCacheStats()` - Get cache statistics

**Path Utilities:**
- `toPathArray()` - Convert path to array
- `toPathString()` - Convert array to path
- `toPointer()` - Convert to JSON Pointer
- `fromPointer()` - Parse JSON Pointer
- `fromPointerArray()` - Parse JSON Pointer into path array
- `normalizePath()` - Normalize path format
- `isValidPath()` - Validate path syntax

[Read more →](/api/jsonpath)

### QueryBuilder

Fluent API for building and executing queries.

**Configuration Methods:**
- `query()` - Set JSONPath expression
- `withOptions()` - Set query options
- `resultType()` - Set result type
- `cached()` - Enable caching
- `wrapped()` - Wrap results
- `withParent()` - Set parent context

**Transformation Methods:**
- `filter()` - Filter results
- `map()` - Transform results
- `sort()` - Sort results
- `take()` - Take first N results
- `skip()` - Skip first N results
- `deduplicate()` - Remove duplicates

**Terminal Methods:**
- `execute()` - Execute and return all results
- `executeSync()` - Execute synchronously and return all results
- `first()` - Get first result
- `last()` - Get last result
- `count()` - Count results
- `exists()` - Check if results exist
- `every()` - Check if all match predicate
- `some()` - Check if any match predicate
- `find()` - Find first matching result
- `reduce()` - Reduce results
- `groupBy()` - Group results
- `partition()` - Partition results
- `unique()` - Get unique results
- `flatten()` - Flatten nested arrays
- `stats()` - Get statistics

[Read more →](/api/query-builder)

## Type Definitions

### QueryOptions

```typescript
interface QueryOptions {
  resultType?: ResultType;
  filterMode?: FilterMode;
  sandbox?: Sandbox;
  eval?: EvalMode;
  ignoreEvalErrors?: boolean;
  callback?: CallbackFunction;
  maxParentChainDepth?: number;
  enableCache?: boolean;
  wrap?: boolean;
  flatten?: boolean | number;
  parent?: unknown;
  parentProperty?: string | number;
}
```

### ResultType

```typescript
type ResultType =
  | 'value'          // Matched values (default)
  | 'path'           // JSONPath expressions
  | 'pointer'        // JSON Pointers
  | 'parent'         // Parent objects
  | 'parentProperty' // Parent properties
  | 'parentChain'    // Full parent chain
  | 'all';           // All result types
```

[Read more →](/api/types)

## Utility Functions

### Path Utilities

```typescript
import { PathUtils } from '@jsonpathx/jsonpathx';

// Or individual functions
import { JSONPath } from '@jsonpathx/jsonpathx';
JSONPath.toPathArray('$.store.book[0]');
```

**Available functions:**
- `toPathArray(path: string)` - Convert path to array
- `toPathString(array: (string | number)[])` - Convert array to path
- `toPointer(path: string | (string | number)[])` - Convert to JSON Pointer
- `fromPointer(pointer: string)` - Parse JSON Pointer to JSONPath string
- `fromPointerArray(pointer: string)` - Parse JSON Pointer into path array
- `normalizePath(path: string)` - Normalize path
- `isValidPath(path: string)` - Validate path

[Read more →](/api/utilities)

## Usage Examples

### Basic Query

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

const data = { items: [1, 2, 3] };
const result = await JSONPath.query('$.items[*]', data);
console.log(result); // [1, 2, 3]
```

### With Options

```typescript
const paths = await JSONPath.query('$.items[*]', data, {
  resultType: 'path',
  enableCache: true
});
console.log(paths); // ['$.items[0]', '$.items[1]', '$.items[2]']
```

### Fluent API

```typescript
const result = await JSONPath.create(data)
  .query('$.products[*]')
  .filter(p => p.price < 100)
  .sort((a, b) => a.price - b.price)
  .take(10)
  .execute();
```

### With Caching

```typescript
// Enable globally
JSONPath.enableCache({ maxSize: 100, ttl: 60000 });

const result = await JSONPath.query('$.items[*]', data);
// Subsequent calls will use cache

// Check stats
const stats = JSONPath.getCacheStats();
console.log(stats); // { hits: 0, misses: 1, size: 1 }
```

## Quick Reference

### Common Patterns

```typescript
// Get values
const values = await JSONPath.query('$.items[*]', data);

// Get paths
const paths = await JSONPath.paths('$.items[*]', data);

// Get pointers
const pointers = await JSONPath.pointers('$.items[*]', data);

// Filter results
const filtered = await JSONPath.query('$.items[?(@.price < 100)]', data);

// First result
const first = await JSONPath.create(data).query('$.items[*]').first();

// Count results
const count = await JSONPath.create(data).query('$.items[*]').count();

// Check existence
const exists = await JSONPath.create(data).query('$.items[*]').exists();
```

### Error Handling

```typescript
try {
  const result = await JSONPath.query('$.invalid..path', data);
} catch (error) {
  console.error('Query failed:', error.message);
}
```

### TypeScript

```typescript
interface Product {
  name: string;
  price: number;
}

const products = await JSONPath.query<Product>('$.products[*]', data);
// products: Product[]

const names = await JSONPath.create(data)
  .query('$.products[*]')
  .map(p => p.name) // Full type inference
  .execute();
// names: string[]
```

## API Status

| Feature | Status | Notes |
|---------|--------|-------|
| Basic queries | ✅ Stable | Production ready |
| Filter expressions | ✅ Stable | Full RFC 9535 support |
| Type selectors | ✅ Stable | jsonpathx extension |
| Parent selector | ✅ Stable | jsonpathx extension |
| QueryBuilder | ✅ Stable | 20+ methods |
| Caching | ✅ Stable | LRU cache with TTL |
| Path utilities | ✅ Stable | RFC 6901 support |
| engine performance | ✅ Stable | See benchmarks for current results |

## Version Compatibility

jsonpathx follows [Semantic Versioning](https://semver.org/).

- **Current version**: 0.1.0
- **Node.js**: 18.0.0+
- **TypeScript**: 5.0+
- **Browser**: Modern browsers with engine support

## See Also

- [JSONPath Class](/api/jsonpath) - Main API
- [QueryBuilder](/api/query-builder) - Fluent API
- [Types](/api/types) - TypeScript types
- [Examples](/examples/) - Usage examples
- [Guide](/guide/) - Getting started
