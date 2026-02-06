# JSONPath Class

The main entry point for executing JSONPath queries.

## Static Methods

### query()

Execute a JSONPath query and return results.

```typescript
static async query<T = unknown>(
  path: string,
  data: unknown,
  options?: QueryOptions
): Promise<T[]>
```

**Parameters:**

- `path` - JSONPath expression to evaluate
- `data` - JSON data to query
- `options` - Optional query configuration

**Returns:** Array of results based on `resultType` option

**Example:**

```typescript
const data = { items: [{ name: 'Item 1' }, { name: 'Item 2' }] };

// Basic query
const items = await JSONPath.query('$.items[*]', data);
console.log(items); // [{ name: 'Item 1' }, { name: 'Item 2' }]

// With options
const paths = await JSONPath.query('$.items[*]', data, {
  resultType: 'path'
});
console.log(paths); // ['$.items[0]', '$.items[1]']
```

### querySync()

Synchronous query execution.

```typescript
static querySync<T = unknown>(
  path: string,
  data: unknown,
  options?: QueryOptions
): T[]
```

**Example:**

```typescript
const result = JSONPath.querySync('$.items[*]', data);
```

### paths()

Get JSONPath expressions for all matches.

```typescript
static async paths(path: string, data: unknown): Promise<string[]>
```

**Example:**

```typescript
const paths = await JSONPath.paths('$.store.book[*]', data);
// ['$.store.book[0]', '$.store.book[1]', '$.store.book[2]']
```

### pointers()

Get JSON Pointers (RFC 6901) for all matches.

```typescript
static async pointers(path: string, data: unknown): Promise<string[]>
```

**Example:**

```typescript
const pointers = await JSONPath.pointers('$.store.book[*]', data);
// ['/store/book/0', '/store/book/1', '/store/book/2']
```

### parents()

Get parent objects for all matches.

```typescript
static async parents(path: string, data: unknown): Promise<unknown[]>
```

**Example:**

```typescript
const data = {
  store: {
    book: [
      { title: 'Book 1', price: 8.95 },
      { title: 'Book 2', price: 12.99 }
    ]
  }
};

const parents = await JSONPath.parents('$.store.book[*].title', data);
// [{ title: 'Book 1', price: 8.95 }, { title: 'Book 2', price: 12.99 }]
```

### parentProperties()

Get parent property names/indices for all matches.

```typescript
static async parentProperties(
  path: string,
  data: unknown
): Promise<(string | number)[]>
```

**Example:**

```typescript
const props = await JSONPath.parentProperties('$.store.book[*]', data);
// [0, 1, 2]
```

### init()

Initialize the engine runtime. Currently a lightweight no-op that keeps API parity.

```typescript
static async init(): Promise<void>
```

**Example:**

```typescript
// Optional initialization
await JSONPath.init();

// Queries can run immediately
const result = await JSONPath.query('$.items[*]', data);
```

### isInitialized()

Check if `init()` has been called (no-op for JS engine).

```typescript
static isInitialized(): boolean
```

**Example:**

```typescript
if (JSONPath.isInitialized()) {
  console.log('init() was called');
}

// querySync works regardless
const result = JSONPath.querySync('$', data);
```

### create()

Create a fluent QueryBuilder instance.

```typescript
static create(data: unknown): QueryBuilder
```

**Example:**

```typescript
const result = await JSONPath.create(data)
  .query('$.items[*]')
  .filter(item => item.price < 100)
  .sort((a, b) => a.price - b.price)
  .execute();
```

### parse()

Parse and validate a JSONPath expression. Throws on invalid input.

```typescript
static parse(path: string): PathNode
```

**Example:**

```typescript
try {
  const ast = JSONPath.parse('$.store.book[*]');
  console.log(ast.type);
} catch (error) {
  console.error('Invalid path:', error.message);
}
```

## Cache Methods

### enableCache()

Enable query result caching.

```typescript
static enableCache(options?: {
  maxSize?: number;
  ttl?: number;
}): void
```

**Parameters:**

- `maxSize` - Maximum cache entries (default: 100)
- `ttl` - Time-to-live in milliseconds (default: 60000)

**Example:**

```typescript
// Enable with defaults
JSONPath.enableCache();

// Custom configuration
JSONPath.enableCache({
  maxSize: 200,
  ttl: 120000 // 2 minutes
});
```

### disableCache()

Disable query caching.

```typescript
static disableCache(): void
```

### clearCache()

Clear all cached results.

```typescript
static clearCache(): void
```

### getCacheStats()

Get cache statistics.

```typescript
static getCacheStats(): {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  maxSize: number;
  ttl: number;
}
```

**Example:**

```typescript
const stats = JSONPath.getCacheStats();
console.log(`Cache: ${stats.hits} hits, ${stats.misses} misses, ${stats.size} entries`);
```

## Path Utility Methods

### toPathArray()

Convert a JSONPath string to an array of path components.

```typescript
static toPathArray(pathString: string): (string | number)[]
```

**Example:**

```typescript
const array = JSONPath.toPathArray('$.store.book[0].title');
// ['$', 'store', 'book', 0, 'title']
```

### toPathString()

Convert a path array to a normalized JSONPath string.

```typescript
static toPathString(pathArray: (string | number)[]): string
```

**Example:**

```typescript
const path = JSONPath.toPathString(['$', 'store', 'book', 0, 'title']);
// "$['store']['book'][0]['title']"
```

### toPointer()

Convert a JSONPath string or path array to a JSON Pointer (RFC 6901).

```typescript
static toPointer(path: string | (string | number)[]): string
```

**Example:**

```typescript
const pointer = JSONPath.toPointer('$.store.book[0].title');
// "/store/book/0/title"
```

### fromPointer()

Parse a JSON Pointer into a JSONPath string.

```typescript
static fromPointer(pointer: string): string
```

**Example:**

```typescript
const path = JSONPath.fromPointer('/store/book/0/title');
// "$['store']['book'][0]['title']"
```

### fromPointerArray()

Parse a JSON Pointer into a path array.

```typescript
static fromPointerArray(pointer: string): (string | number)[]
```

**Example:**

```typescript
const array = JSONPath.fromPointerArray('/store/book/0/title');
// ['$', 'store', 'book', 0, 'title']
```

### normalizePath()

Normalize a path string to bracket notation.

```typescript
static normalizePath(path: string): string
```

**Example:**

```typescript
const normalized = JSONPath.normalizePath('$.store.book[0]');
// "$['store']['book'][0]"
```

### isValidPath()

Check if a path string is valid JSONPath syntax.

```typescript
static isValidPath(path: string): boolean
```

**Example:**

```typescript
if (JSONPath.isValidPath('$.store.book[*]')) {
  console.log('Valid path');
}
```

## QueryOptions

Configuration options for query execution:

```typescript
interface QueryOptions {
  // Result type to return
  resultType?: 'value' | 'path' | 'pointer' | 'parent' | 'parentProperty' | 'parentChain' | 'all';

  // Filter behavior mode
  filterMode?: 'jsonpath' | 'xpath';

  // Custom functions for filter expressions
  sandbox?: {
    [functionName: string]: (...args: any[]) => any;
  };

  // Eval mode for filter expressions
  eval?: 'safe' | false | Sandbox;

  // Ignore filter evaluation errors
  ignoreEvalErrors?: boolean;

  // Callback for each result
  callback?: (value: unknown, type: ResultType, path: string) => void;

  // Max depth for parent chain tracking
  maxParentChainDepth?: number;

  // Enable caching for this query
  enableCache?: boolean;

  // Wrap result with metadata
  wrap?: boolean;

  // Flatten nested arrays
  flatten?: boolean | number;

  // Parent context
  parent?: unknown;
  parentProperty?: string | number;
}
```

### Result Types

- `"value"` (default) - Return matched values
- `"path"` - Return JSONPath expressions
- `"pointer"` - Return JSON Pointers
- `"parent"` - Return parent objects
- `"parentProperty"` - Return parent properties
- `"parentChain"` - Return full parent chains
- `"all"` - Return all result types

**Example:**

```typescript
const data = { items: [1, 2, 3] };

// Values
const values = await JSONPath.query('$.items[*]', data);
// [1, 2, 3]

// Paths
const paths = await JSONPath.query('$.items[*]', data, {
  resultType: 'path'
});
// ['$.items[0]', '$.items[1]', '$.items[2]']

// All types
const all = await JSONPath.query('$.items[*]', data, {
  resultType: 'all'
});
// {
//   values: [1, 2, 3],
//   paths: ['$.items[0]', '$.items[1]', '$.items[2]'],
//   pointers: ['/items/0', '/items/1', '/items/2'],
//   parents: [/* arrays */],
//   parentProperties: [0, 1, 2],
//   entries: [/* full entries */]
// }
```

### Sandbox Functions

Provide custom functions for filter expressions:

```typescript
const result = await JSONPath.query(
  '$.products[?(@.isExpensive())]',
  data,
  {
    sandbox: {
      isExpensive: (product) => product.price > 100
    }
  }
);
```

### Callback

Execute a function for each result:

```typescript
await JSONPath.query('$.items[*]', data, {
  callback: (value, type, path) => {
    console.log(`Found ${value} at ${path}`);
  }
});
```

### Wrap

Wrap results with metadata:

```typescript
const result = await JSONPath.query('$.items[*]', data, {
  wrap: true
});

// {
//   values: [...],
//   path: '$.items[*]',
//   executionTime: 5,
//   cached: false
// }
```

## Complete Examples

### Basic Query

```typescript
const data = {
  store: {
    book: [
      { title: 'Book 1', price: 8.95 },
      { title: 'Book 2', price: 12.99 }
    ]
  }
};

const titles = await JSONPath.query('$.store.book[*].title', data);
console.log(titles); // ['Book 1', 'Book 2']
```

### Filter Query

```typescript
const cheap = await JSONPath.query(
  '$.store.book[?(@.price < 10)]',
  data
);
console.log(cheap); // [{ title: 'Book 1', price: 8.95 }]
```

### With Result Type

```typescript
const paths = await JSONPath.paths('$.store.book[*]', data);
console.log(paths);
// ['$.store.book[0]', '$.store.book[1]']
```

### With Caching

```typescript
JSONPath.enableCache();

// First call - cache miss
const result1 = await JSONPath.query('$.items[*]', data, {
  enableCache: true
});

// Second call - cache hit (faster)
const result2 = await JSONPath.query('$.items[*]', data, {
  enableCache: true
});

console.log(JSONPath.getCacheStats());
// { hits: 1, misses: 1, size: 1 }
```

### Path Utilities

```typescript
// Convert formats
const array = JSONPath.toPathArray('$.store.book[0]');
const path = JSONPath.toPathString(array);
const pointer = JSONPath.toPointer(array);

console.log(array);    // ['$', 'store', 'book', '0']
console.log(path);     // "$['store']['book'][0]"
console.log(pointer);  // "/store/book/0"
```

## See Also

- [QueryBuilder API](/api/query-builder) - Fluent query building
- [Types](/api/types) - TypeScript type definitions
- [Examples](/examples/) - More usage examples
