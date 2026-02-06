# Utilities API Reference

Complete API reference for jsonpathx utility functions. Includes path manipulation, cache management, parent chain tracking, and helper functions.

## PathUtils

Utilities for working with JSONPath expressions and JSON Pointers.

### Import

```typescript
import { PathUtils } from '@jsonpathx/jsonpathx';
```

### Methods

#### `toPointer(path: string | (string | number)[]): string`

Convert JSONPath expression (or path array) to JSON Pointer (RFC 6901).

**Parameters**:
- `path` - JSONPath expression

**Returns**: JSON Pointer string

**Example**:
```typescript
PathUtils.toPointer('$.store.books[0].title');
// Returns: '/store/books/0/title'

PathUtils.toPointer('$');
// Returns: ''
```

**Throws**: Error if path contains wildcards or filters

---

#### `fromPointer(pointer: string): string`

Convert JSON Pointer to JSONPath expression.

**Parameters**:
- `pointer` - JSON Pointer string

**Returns**: JSONPath expression

**Example**:
```typescript
PathUtils.fromPointer('/store/books/0/title');
// Returns: '$.store.books[0].title'

PathUtils.fromPointer('');
// Returns: '$'
```

---

#### `normalize(path: string): string`

Normalize JSONPath to canonical bracket notation.

**Parameters**:
- `path` - JSONPath expression

**Returns**: Normalized path

**Example**:
```typescript
PathUtils.normalize('$.user.name');
// Returns: "$['user']['name']"

PathUtils.normalize('$.items[0]');
// Returns: "$['items'][0]"
```

---

#### `parse(path: string): PathComponent[]`

Parse JSONPath into components.

**Parameters**:
- `path` - JSONPath expression

**Returns**: Array of path components

**Types**:
```typescript
interface PathComponent {
  type: 'root' | 'property' | 'index' | 'wildcard' | 'slice' | 'filter' | 'recursive';
  value: string | number;
}
```

**Example**:
```typescript
PathUtils.parse('$.store.books[0]');
// Returns:
// [
//   { type: 'root', value: '$' },
//   { type: 'property', value: 'store' },
//   { type: 'property', value: 'books' },
//   { type: 'index', value: 0 }
// ]
```

---

#### `stringify(components: PathComponent[]): string`

Build JSONPath from components.

**Parameters**:
- `components` - Array of path components

**Returns**: JSONPath expression

**Example**:
```typescript
const components = [
  { type: 'root', value: '$' },
  { type: 'property', value: 'store' },
  { type: 'index', value: 0 }
];

PathUtils.stringify(components);
// Returns: '$.store[0]'
```

---

#### `build(segments: (string | number)[]): string`

Build JSONPath from array of segments.

**Parameters**:
- `segments` - Array of property names, indices, or wildcards

**Returns**: JSONPath expression

**Example**:
```typescript
PathUtils.build(['store', 'books', 0, 'title']);
// Returns: '$.store.books[0].title'

PathUtils.build(['items', '*', 'price']);
// Returns: '$.items[*].price'
```

---

#### `parent(path: string): string | null`

Get parent path.

**Parameters**:
- `path` - JSONPath expression

**Returns**: Parent path or null if root

**Example**:
```typescript
PathUtils.parent('$.store.books[0].title');
// Returns: '$.store.books[0]'

PathUtils.parent('$');
// Returns: null
```

---

#### `append(basePath: string, ...segments: string[]): string`

Append segments to path.

**Parameters**:
- `basePath` - Base JSONPath
- `segments` - Segments to append

**Returns**: Extended path

**Example**:
```typescript
PathUtils.append('$.store', '.books', '[0]');
// Returns: '$.store.books[0]'
```

---

#### `isValid(path: string): boolean`

Check if path is valid JSONPath syntax.

**Parameters**:
- `path` - String to validate

**Returns**: true if valid

**Example**:
```typescript
PathUtils.isValid('$.store.books');  // true
PathUtils.isValid('$.items[*]');     // true
PathUtils.isValid('store.books');    // false
```

---

#### `isPointer(str: string): boolean`

Check if string is valid JSON Pointer.

**Parameters**:
- `str` - String to validate

**Returns**: true if valid JSON Pointer

**Example**:
```typescript
PathUtils.isPointer('/store/books');  // true
PathUtils.isPointer('');              // true
PathUtils.isPointer('$.store');       // false
```

---

#### `equals(path1: string, path2: string): boolean`

Compare two paths for equality.

**Parameters**:
- `path1` - First path
- `path2` - Second path

**Returns**: true if paths are equivalent

**Example**:
```typescript
PathUtils.equals('$.store.books', "$['store']['books']");
// Returns: true
```

---

#### `startsWith(path: string, prefix: string): boolean`

Check if path starts with prefix.

**Parameters**:
- `path` - Path to check
- `prefix` - Prefix to match

**Returns**: true if path starts with prefix

**Example**:
```typescript
PathUtils.startsWith('$.store.books[0]', '$.store');
// Returns: true
```

---

#### `contains(path: string, segment: string | number): boolean`

Check if path contains segment.

**Parameters**:
- `path` - Path to search
- `segment` - Segment to find

**Returns**: true if segment exists in path

**Example**:
```typescript
PathUtils.contains('$.store.books[0]', 'books');
// Returns: true
```

---

## Cache Management

### Import

```typescript
import { QueryCache, getGlobalCache, resetGlobalCache } from '@jsonpathx/jsonpathx';
```

### QueryCache Class

LRU cache with TTL support.

#### Constructor

```typescript
new QueryCache(options?: CacheOptions)
```

**Options**:
```typescript
interface CacheOptions {
  maxSize?: number;  // Default: 100
  ttl?: number;      // Default: 60000 (1 minute)
}
```

**Example**:
```typescript
const cache = new QueryCache({
  maxSize: 200,
  ttl: 120000
});
```

#### Methods

##### `get(key: string): any | undefined`

Get cached value.

**Parameters**:
- `key` - Cache key

**Returns**: Cached value or undefined

**Example**:
```typescript
const value = cache.get('$.items[*]');
```

---

##### `set(key: string, value: any): void`

Store value in cache.

**Parameters**:
- `key` - Cache key
- `value` - Value to cache

**Example**:
```typescript
cache.set('$.items[*]', resultData);
```

---

##### `clear(key?: string): void`

Clear cache entries.

**Parameters**:
- `key` - Optional specific key to clear

**Example**:
```typescript
// Clear all
cache.clear();

// Clear specific
cache.clear('$.items[*]');
```

---

##### `getStats(): CacheStats`

Get cache statistics.

**Returns**:
```typescript
interface CacheStats {
  size: number;       // Current entries
  hits: number;       // Cache hits
  misses: number;     // Cache misses
  hitRate: number;    // Hit rate (0-1)
  maxSize: number;    // Configured max
  ttl: number;        // Configured TTL
}
```

**Example**:
```typescript
const stats = cache.getStats();
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
```

---

### Global Cache Functions

#### `getGlobalCache(): QueryCache`

Get the global cache instance.

**Returns**: Global QueryCache instance

**Example**:
```typescript
const cache = getGlobalCache();
const stats = cache.getStats();
```

---

#### `resetGlobalCache(): void`

Reset global cache to default settings.

**Example**:
```typescript
resetGlobalCache();
// Global cache is now reset
```

---

## Parent Chain Tracking

### Import

```typescript
import {
  ParentChainTracker,
  buildParentChain,
  navigateUp
} from '@jsonpathx/jsonpathx';
```

### ParentChainTracker Class

Tracks parent relationships in query results.

#### Constructor

```typescript
new ParentChainTracker()
```

**Example**:
```typescript
const tracker = new ParentChainTracker();
```

#### Methods

##### `track(result: AllTypesResult, index: number): void`

Track parent chain for result.

**Parameters**:
- `result` - Query result with parents
- `index` - Result index

**Example**:
```typescript
tracker.track(queryResult, 0);
```

---

##### `getChain(index: number): unknown[]`

Get parent chain for tracked result.

**Parameters**:
- `index` - Result index

**Returns**: Array of parent objects (root to immediate parent)

**Example**:
```typescript
const chain = tracker.getChain(0);
// [rootObj, level1Obj, level2Obj, immediateParent]
```

---

### Helper Functions

#### `buildParentChain(result: AllTypesResult, index: number): unknown[]`

Build parent chain from query result.

**Parameters**:
- `result` - Query result with parents
- `index` - Result index

**Returns**: Array of parent objects

**Example**:
```typescript
const result = await JSONPath.query('$..value', data, {
  resultType: 'all'
});

const chain = buildParentChain(result, 0);
// Returns: [root, parent1, parent2, ...]
```

---

#### `navigateUp(chain: unknown[], levels: number): unknown | null`

Navigate up parent chain.

**Parameters**:
- `chain` - Parent chain array
- `levels` - Number of levels to go up

**Returns**: Parent at specified level or null

**Example**:
```typescript
const immediateParent = navigateUp(chain, 1);
const grandparent = navigateUp(chain, 2);
const root = navigateUp(chain, chain.length);
```

---

## Engine Management

`init()` is a no-op for the JS engine and is kept for API compatibility.

## Sandbox Utilities

### Import

```typescript
import {
  validateSandbox,
  createSafeSandbox,
  resolveSandbox,
  getFunctionNames
} from '@jsonpathx/jsonpathx';
```

### Functions

#### `validateSandbox(sandbox: Sandbox): void`

Validate sandbox object.

**Parameters**:
- `sandbox` - Sandbox object to validate

**Throws**: Error if sandbox is invalid

**Example**:
```typescript
const sandbox = {
  myFunc: (x) => x > 10
};

validateSandbox(sandbox);  // OK

// Invalid sandbox
validateSandbox({ constructor: () => {} });  // Throws
```

---

#### `createSafeSandbox(sandbox: Sandbox): Sandbox`

Create safe copy of sandbox.

**Parameters**:
- `sandbox` - Original sandbox

**Returns**: Safe sandbox copy

**Example**:
```typescript
const userSandbox = {
  filter: (x) => x.active
};

const safeSandbox = createSafeSandbox(userSandbox);
// Safe to use in queries
```

---

#### `resolveSandbox(sandbox: Sandbox, functionName: string): Function | undefined`

Resolve function from sandbox.

**Parameters**:
- `sandbox` - Sandbox object
- `functionName` - Function name

**Returns**: Function or undefined

**Example**:
```typescript
const func = resolveSandbox(sandbox, 'myFunc');
if (func) {
  const result = func(item);
}
```

---

#### `getFunctionNames(sandbox: Sandbox): string[]`

Get all function names from sandbox.

**Parameters**:
- `sandbox` - Sandbox object

**Returns**: Array of function names

**Example**:
```typescript
const names = getFunctionNames(sandbox);
console.log('Available functions:', names);
// ['isExpensive', 'inStock', 'validate']
```

---

## Result Formatter

### Import

```typescript
import { ResultFormatter } from '@jsonpathx/jsonpathx';
```

### ResultFormatter Class

Format query results or payloads.

#### Static Methods

##### `format(result: unknown, options: QueryOptions): unknown`

Format query results based on options.

**Parameters**:
- `result` - Result array or payloads
- `options` - Query options

**Returns**: Formatted result

**Example**:
```typescript
const formatted = ResultFormatter.format(resultPayloads, {
  resultType: 'value',
  flatten: true
});
```

---

##### `formatValues(values: unknown[], options: QueryOptions): unknown[]`

Format value array.

**Parameters**:
- `values` - Value array
- `options` - Query options

**Returns**: Formatted values

**Example**:
```typescript
const formatted = ResultFormatter.formatValues(values, {
  flatten: true
});
```

---

## Type Guards

Utility type guards for TypeScript.

### Import

```typescript
import { isAllTypesResult } from '@jsonpathx/jsonpathx';
```

### Functions

#### `isAllTypesResult(result: unknown): result is AllTypesResult`

Check if result is AllTypesResult.

**Example**:
```typescript
if (isAllTypesResult(result)) {
  console.log(result.values);
  console.log(result.paths);
  console.log(result.parents);
}
```

---

## See Also

- [Path Utilities Guide](../guide/path-utilities.md) - Path utility usage
- [Caching Guide](../guide/caching.md) - Cache configuration
- [Parent Selector Guide](../guide/parent-selector.md) - Parent tracking
- [Types Reference](./types.md) - TypeScript types
#### `fromPointerArray(pointer: string): (string | number)[]`

Convert JSON Pointer to a path array.

**Parameters**:
- `pointer` - JSON Pointer string

**Returns**: Path array

**Example**:
```typescript
const array = PathUtils.fromPointerArray('/store/books/0/title');
// Returns: ['$', 'store', 'books', 0, 'title']
```

---
