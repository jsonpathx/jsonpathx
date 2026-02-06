# TypeScript Type Reference

Complete TypeScript type definitions for jsonpathx. This reference covers all interfaces, types, and type parameters used throughout the library.

## Table of Contents

- [Overview](#overview)
- [Core Query Types](#core-query-types)
  - [QueryOptions](#queryoptions)
  - [QueryConfig](#queryconfig)
  - [ResultType](#resulttype)
  - [FilterMode](#filtermode)
- [Result Types](#result-types)
  - [QueryResultEntry](#queryresultentry)
  - [ParentChainResult](#parentchainresult)
  - [AllTypesResult](#alltypesresult)
- [Callback Types](#callback-types)
  - [CallbackFunction](#callbackfunction)
  - [CallbackPayload](#callbackpayload)
  - [CallbackType](#callbacktype)
- [Sandbox Types](#sandbox-types)
  - [Sandbox](#sandbox)
  - [EvalMode](#evalmode)
  - [FunctionCall](#functioncall)
- [Cache Types](#cache-types)
  - [CacheOptions](#cacheoptions)
- [Error Types](#error-types)
  - [QueryError](#queryerror)
- [AST Types](#ast-types)
- [Extension Types](#extension-types)
- [Type Usage Examples](#type-usage-examples)
- [Type Guards](#type-guards)

## Overview

jsonpathx is built with TypeScript-first design, providing comprehensive type definitions for type-safe JSONPath queries. All public APIs are fully typed with support for generic type parameters.

### Import Types

```typescript
// Import from main package
import type { QueryOptions, ResultType } from 'jsonpathx';

// All types are exported from the main package
import type { QueryOptions, ResultType } from 'jsonpathx';
```

---

## Core Query Types

### QueryOptions

Configuration options for JSONPath queries.

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
  autostart?: boolean;
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `resultType` | [ResultType](#resulttype) | `'value'` | Type of result to return |
| `filterMode` | [FilterMode](#filtermode) | `'jsonpath'` | Filter behavior mode |
| `sandbox` | [Sandbox](#sandbox) | `undefined` | Custom functions for filter expressions |
| `eval` | [EvalMode](#evalmode) | `false` | Eval mode for filter expressions |
| `ignoreEvalErrors` | `boolean` | `false` | Ignore errors during filter evaluation |
| `callback` | [CallbackFunction](#callbackfunction) | `undefined` | Callback invoked for each result |
| `maxParentChainDepth` | `number` | `Infinity` | Maximum depth for parent chain tracking |
| `enableCache` | `boolean` | `false` | Enable result caching |
| `wrap` | `boolean` | `true` | Wrap results in an array (default behavior) |
| `flatten` | `boolean \| number` | `false` | Flatten nested arrays (true = 1 level, number = N levels) |
| `parent` | `unknown` | `undefined` | Parent object context |
| `parentProperty` | `string \| number` | `undefined` | Parent property name/index |
| `autostart` | `boolean` | `true` | Execute immediately (true) or return query instance (false) |

**Example:**

```typescript
const options: QueryOptions = {
  resultType: 'path',
  filterMode: 'jsonpath',
  sandbox: {
    isExpensive: (item) => item.price > 1000
  },
  ignoreEvalErrors: true,
  enableCache: true,
  flatten: 1
};

const result = await JSONPath.query('$.items[*]', data, options);
```

---

### QueryConfig

Extended configuration for query creation (used with compatibility API).

```typescript
interface QueryConfig extends QueryOptions {
  path: string;
  json?: unknown;
}
```

**Properties:**

- Includes all [QueryOptions](#queryoptions) properties
- `path` - JSONPath expression to evaluate (required)
- `json` - JSON data to query (required if `autostart` is not `false`)

**Example:**

```typescript
import { JSONPath } from 'jsonpathx';

const config: QueryConfig = {
  path: '$.store.book[*]',
  json: data,
  resultType: 'value',
  flatten: true
};

const result = await JSONPathAsync(config);
```

---

### ResultType

Type of result to return from a query.

```typescript
type ResultType =
  | 'value'           // Matched values (default)
  | 'path'            // JSONPath expressions
  | 'pointer'         // JSON Pointer (RFC 6901)
  | 'parent'          // Immediate parent objects
  | 'parentProperty'  // Parent property names/indices
  | 'parentChain'     // Full chain from root to result
  | 'all';            // Object containing all result types
```

**Example:**

```typescript
// Get values (default)
const values = await JSONPath.query('$.items[*].name', data);
// ['Item 1', 'Item 2']

// Get paths
const paths = await JSONPath.query('$.items[*].name', data, {
  resultType: 'path'
});
// ['$.items[0].name', '$.items[1].name']

// Get JSON Pointers
const pointers = await JSONPath.query('$.items[*].name', data, {
  resultType: 'pointer'
});
// ['/items/0/name', '/items/1/name']

// Get all types
const all = await JSONPath.query('$.items[*].name', data, {
  resultType: 'all'
});
// { values: [...], paths: [...], pointers: [...], ... }
```

**See also:** [Result Types Guide](../guide/result-types.md)

---

### FilterMode

Filter behavior mode for JSONPath queries.

```typescript
type FilterMode = 'jsonpath' | 'xpath';
```

**Values:**

- `'jsonpath'` - Filters select matched items (default JSONPath behavior)
- `'xpath'` - Filters apply to the current node (XPath-style behavior)

**Example:**

```typescript
const data = {
  store: {
    book: [
      { title: "Book 1", price: 8.99 },
      { title: "Book 2", price: 12.99 }
    ]
  }
};

// JSONPath mode: Filter selects items
await JSONPath.query('$.store.book[?(@.price < 10)]', data, {
  filterMode: 'jsonpath'
});
// Returns: [{ title: "Book 1", price: 8.99 }]

// XPath mode: Filter applies to the current node
await JSONPath.query('$.store.book[*][?(@.price < 10)]', data, {
  filterMode: 'xpath'
});
// Returns: [{ title: "Book 1", price: 8.99 }]
```

---

## Result Types

### QueryResultEntry

Single result entry with complete metadata.

```typescript
interface QueryResultEntry {
  value: unknown;
  path: string;
  pointer: string;
  parent: unknown;
  parentProperty: string | number;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `unknown` | The matched value |
| `path` | `string` | JSONPath expression to this result |
| `pointer` | `string` | JSON Pointer (RFC 6901) |
| `parent` | `unknown` | Immediate parent object/array |
| `parentProperty` | `string \| number` | Property name or array index in parent |

**Example:**

```typescript
const entries = await JSONPath.query('$.items[*]', data, {
  resultType: 'all'
}) as AllTypesResult;

entries.entries.forEach(entry => {
  console.log('Value:', entry.value);
  console.log('Path:', entry.path);
  console.log('Pointer:', entry.pointer);
  console.log('Parent:', entry.parent);
  console.log('Property:', entry.parentProperty);
});
```

---

### ParentChainResult

Result with full parent chain from root to value.

```typescript
interface ParentChainResult {
  value: unknown;
  chain: ParentChainEntry[];
  rootPath: string;
  depth: number;
}

interface ParentChainEntry {
  property: string | number;
  parent: unknown;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `unknown` | The matched value |
| `chain` | `ParentChainEntry[]` | Chain of parents from root |
| `rootPath` | `string` | Full JSONPath expression |
| `depth` | `number` | Depth from root (chain length) |

**Example:**

```typescript
const results = await JSONPath.query('$.store.book[0].title', data, {
  resultType: 'parentChain'
}) as ParentChainResult[];

results.forEach(result => {
  console.log('Value:', result.value);
  console.log('Depth:', result.depth);
  console.log('Path:', result.rootPath);

  result.chain.forEach((entry, i) => {
    console.log(`Level ${i}:`, entry.property, entry.parent);
  });
});
```

**See also:** [Parent Options Guide](../parent-options.md)

---

### AllTypesResult

Complete query result containing all result types.

```typescript
interface AllTypesResult {
  values: unknown[];
  paths: string[];
  pointers: string[];
  parents: unknown[];
  parentProperties: (string | number)[];
  entries: QueryResultEntry[];
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `values` | `unknown[]` | Matched values |
| `paths` | `string[]` | JSONPath expressions |
| `pointers` | `string[]` | JSON Pointers (RFC 6901) |
| `parents` | `unknown[]` | Parent objects/arrays |
| `parentProperties` | `(string \| number)[]` | Property names or indices |
| `entries` | [QueryResultEntry](#queryresultentry)`[]` | Full result entries |

**Example:**

```typescript
const all = await JSONPath.query('$.items[*]', data, {
  resultType: 'all'
}) as AllTypesResult;

console.log('Values:', all.values);
console.log('Paths:', all.paths);
console.log('Pointers:', all.pointers);

// All arrays have the same length
all.entries.forEach((entry, i) => {
  console.log({
    value: all.values[i],
    path: all.paths[i],
    pointer: all.pointers[i],
    parent: all.parents[i],
    property: all.parentProperties[i]
  });
});
```

---

## Callback Types

### CallbackFunction

Callback function invoked for each matched result.

```typescript
type CallbackFunction = (
  value: unknown,
  type: CallbackType,
  payload: CallbackPayload
) => unknown | void;
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `value` | `unknown` | The matched value |
| `type` | [CallbackType](#callbacktype) | Type of callback invocation |
| `payload` | [CallbackPayload](#callbackpayload) | Full metadata payload |

**Returns:** Optional transformed value (returned value replaces original in result)

**Example:**

```typescript
await JSONPath.query('$.items[*]', data, {
  callback: (value, type, payload) => {
    console.log('Matched:', value);
    console.log('Path:', payload.path);
    console.log('Pointer:', payload.pointer);

    // Optionally transform the value
    if (typeof value === 'object' && value !== null) {
      return { ...value, _path: payload.path };
    }
  }
});
```

---

### CallbackPayload

Full metadata payload passed to callback functions.

```typescript
interface CallbackPayload {
  value: unknown;
  path: string;
  pointer: string;
  parent: unknown;
  parentProperty: string | number;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `value` | `unknown` | The matched value |
| `path` | `string` | JSONPath expression to this value |
| `pointer` | `string` | JSON Pointer (RFC 6901) |
| `parent` | `unknown` | Parent object/array |
| `parentProperty` | `string \| number` | Property name or array index |

**Example:**

```typescript
const enriched: any[] = [];

await JSONPath.query('$.products[*]', data, {
  callback: (value, type, payload) => {
    enriched.push({
      product: value,
      location: payload.path,
      rfc6901: payload.pointer
    });
  }
});
```

---

### CallbackType

Type of callback invocation.

```typescript
type CallbackType = 'value' | 'property';
```

**Values:**

- `'value'` - Callback invoked for matched values (default)
- `'property'` - Callback invoked for property names/indices

---

## Sandbox Types

### Sandbox

Custom function sandbox for filter expressions.

```typescript
interface Sandbox {
  [functionName: string]: (...args: any[]) => any;
}
```

**Example:**

```typescript
const sandbox: Sandbox = {
  // Simple predicate
  isExpensive: (item) => item.price > 1000,

  // Function with multiple arguments
  inRange: (item, min, max) => item.value >= min && item.value <= max,

  // Function using external data
  isPopular: (item) => popularItems.has(item.id),

  // Type checking
  isValid: (item) => item && typeof item === 'object' && 'id' in item
};

const result = await JSONPath.query(
  '$.products[?(@.isExpensive())]',
  data,
  { sandbox }
);
```

**See also:** [Custom Functions Guide](../guide/custom-functions.md)

---

### EvalMode

Eval mode for filter expressions.

```typescript
type EvalMode = 'safe' | false | Sandbox;
```

**Values:**

- `'safe'` - Use provided sandbox functions only
- `false` - Disable function evaluation (default)
- [Sandbox](#sandbox) object - Custom sandbox functions (alias for `sandbox` option)

**Example:**

```typescript
// Disable eval (default)
await JSONPath.query('$.items[*]', data, { eval: false });

// Safe mode with predefined functions
await JSONPath.query('$.items[?(@.isValid())]', data, {
  eval: 'safe',
  sandbox: { isValid: (x) => x !== null }
});

// Direct sandbox (equivalent to sandbox option)
await JSONPath.query('$.items[?(@.check())]', data, {
  eval: { check: (x) => x > 10 }
});
```

---

### FunctionCall

Function call tracking for sandbox execution.

```typescript
interface FunctionCall {
  functionName: string;
  currentValue: unknown;
  args: unknown[];
  result?: boolean;
  callIndex?: number;
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `functionName` | `string` | Function name being called |
| `currentValue` | `unknown` | Current context value (@ in filter) |
| `args` | `unknown[]` | Arguments passed to the function |
| `result` | `boolean?` | Result from JS execution |
| `callIndex` | `number?` | Index in filter evaluation (for debugging) |

**Note:** This is an internal type used for engine-JS communication.

---

## Cache Types

### CacheOptions

Configuration for the query result cache.

```typescript
interface CacheOptions {
  maxSize?: number;
  ttl?: number;
  persistence?: boolean;
}
```

**Properties:**

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `maxSize` | `number` | `100` | Maximum number of cached queries (LRU eviction) |
| `ttl` | `number` | `60000` | Time-to-live for cached results in milliseconds |
| `persistence` | `boolean` | `false` | Enable cache persistence (localStorage/file system) |

**Default Values:**

```typescript
const DEFAULT_CACHE_OPTIONS: Required<CacheOptions> = {
  maxSize: 100,
  ttl: 60000,      // 1 minute
  persistence: false
};
```

**Example:**

```typescript
import { JSONPath } from 'jsonpathx';

// Enable caching with custom options
JSONPath.enableCache({
  maxSize: 200,    // Cache up to 200 queries
  ttl: 120000,     // 2 minutes
  persistence: true // Persist cache
});

// Query with caching
const result = await JSONPath.query('$.items[*]', data, {
  enableCache: true
});

// Get cache statistics
const stats = JSONPath.getCacheStats();
console.log('Cache size:', stats.size);
console.log('Hit rate:', stats.totalAccesses / stats.size);
```

**See also:** [Caching Guide](../features/caching.md)

---

## Error Types

### QueryError

Error information from failed queries.

```typescript
interface QueryError {
  type: 'parse' | 'evaluation' | 'type' | 'sandbox';
  message: string;
  location?: {
    line: number;
    column: number;
    length: number;
  };
  suggestions?: string[];
}
```

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `type` | Error type enum | Category of error |
| `message` | `string` | Human-readable error message |
| `location` | Location object | Position in query expression (if applicable) |
| `suggestions` | `string[]?` | Suggestions for fixing the error |

**Error Types:**

- `'parse'` - Syntax error in JSONPath expression
- `'evaluation'` - Error during query evaluation
- `'type'` - Type mismatch or type checking error
- `'sandbox'` - Error in custom sandbox function

**Example:**

```typescript
try {
  await JSONPath.query('$.invalid[syntax', data);
} catch (error) {
  if (isQueryError(error)) {
    console.error('Error type:', error.type);
    console.error('Message:', error.message);

    if (error.location) {
      console.error('At line', error.location.line,
                    'column', error.location.column);
    }

    if (error.suggestions) {
      console.log('Suggestions:', error.suggestions);
    }
  }
}

// Type guard
function isQueryError(error: any): error is { error: QueryError } {
  return error && typeof error.error === 'object' &&
         'type' in error.error && 'message' in error.error;
}
```

**See also:** [Error Handling Guide](../guide/error-handling.md)

---

## AST Types

Abstract Syntax Tree types for JSONPath expressions (advanced usage).

### ASTNode

Union type of all AST node types.

```typescript
type ASTNode =
  | RootNode
  | ChildNode
  | RecursiveDescentNode
  | WildcardNode
  | ArraySliceNode
  | UnionNode
  | FilterNode
  | ParentNode
  | PropertyNameNode
  | TypeSelectorNode
  | GroupNode;
```

### Node Types

```typescript
interface RootNode extends BaseNode {
  type: 'root';
}

interface ChildNode extends BaseNode {
  type: 'child';
  name: string;
}

interface RecursiveDescentNode extends BaseNode {
  type: 'recursive_descent';
  selector: ASTNode;
}

interface WildcardNode extends BaseNode {
  type: 'wildcard';
}

interface ArraySliceNode extends BaseNode {
  type: 'array_slice';
  start?: number;
  end?: number;
  step?: number;
}

interface UnionNode extends BaseNode {
  type: 'union';
  elements: ASTNode[];
}

interface FilterNode extends BaseNode {
  type: 'filter';
  expression: FilterExpression;
}

interface ParentNode extends BaseNode {
  type: 'parent';
  levels?: number;
}

interface PropertyNameNode extends BaseNode {
  type: 'property_name';
}

interface TypeSelectorNode extends BaseNode {
  type: 'type_selector';
  valueType: JSONType;
}

interface GroupNode extends BaseNode {
  type: 'group';
  selectors: ASTNode[];
}
```

### Filter Expression Types

```typescript
type FilterExpression =
  | ComparisonExpression
  | LogicalExpression
  | UnaryExpression
  | CurrentNodeExpression
  | RootExpression
  | LiteralExpression;

interface ComparisonExpression {
  type: 'comparison';
  operator: ComparisonOperator;  // '==' | '!=' | '<' | '<=' | '>' | '>='
  left: FilterExpression;
  right: FilterExpression;
}

interface LogicalExpression {
  type: 'logical';
  operator: LogicalOperator;  // '&&' | '||'
  left: FilterExpression;
  right: FilterExpression;
}

type JSONType =
  | 'null' | 'boolean' | 'number' | 'string'
  | 'array' | 'object' | 'integer' | 'scalar' | 'undefined';
```

### Complete AST

```typescript
interface JSONPathAST {
  root: RootNode;
  segments: ASTNode[];
}
```

**Note:** AST types are primarily for advanced use cases like custom parsers, query analysis, or query optimization.

---

## Extension Types

Types for future/extended features.

```typescript
interface UnionConfig {
  deduplicate?: boolean;
  compareFn?: (a: unknown, b: unknown) => boolean;
}

interface GroupingConfig {
  flatten?: boolean;
  optimize?: boolean;
}

interface XPathFilterConfig {
  mode: 'xpath' | 'jsonpath';
  allowMixed?: boolean;
}

interface ParentChainConfig {
  maxDepth?: number;
  includeProperties?: boolean;
  includeTypes?: boolean;
}

interface ExtendedQueryOptions {
  union?: UnionConfig;
  grouping?: GroupingConfig;
  xpathFilter?: XPathFilterConfig;
  parentChain?: ParentChainConfig;
}
```

**Note:** These types are for future features and extensions.

---

## Type Usage Examples

### Type-Safe Queries

```typescript
interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

interface DataStore {
  users: User[];
}

const data: DataStore = {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com', active: true },
    { id: 2, name: 'Bob', email: 'bob@example.com', active: false }
  ]
};

// Type-safe query
const users = await JSONPath.query<User>('$.users[*]', data);
// users: User[]

const activeUsers = await JSONPath.query<User>(
  '$.users[?(@.active)]',
  data
);
// activeUsers: User[]

const names = await JSONPath.query<string>(
  '$.users[*].name',
  data
);
// names: string[]
```

### Builder with Types

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const products = await JSONPath.create<Product>(data)
  .query('$.products[*]')
  .filter(p => p.price < 100)        // p: Product
  .sort((a, b) => a.price - b.price) // a, b: Product
  .map(p => p.name)                   // returns string[]
  .execute();
// products: string[]
```

### Callback with Types

```typescript
interface Book {
  title: string;
  price: number;
}

const options: QueryOptions = {
  callback: (value: unknown, type: CallbackType, payload: CallbackPayload) => {
    const book = value as Book;
    console.log(`${book.title} at ${payload.path}`);

    // Transform with metadata
    return {
      ...book,
      _metadata: {
        path: payload.path,
        pointer: payload.pointer
      }
    };
  }
};

await JSONPath.query('$.store.book[*]', data, options);
```

### Sandbox with Types

```typescript
interface Item {
  value: number;
  category: string;
}

const sandbox: Sandbox = {
  isHighValue: (item: Item) => item.value > 1000,
  inCategory: (item: Item, category: string) => item.category === category,
  meetsThreshold: (item: Item, threshold: number) => item.value >= threshold
};

await JSONPath.query(
  '$.items[?(@.isHighValue())]',
  data,
  { sandbox }
);
```

---

## Type Guards

Utility type guards for runtime type checking.

```typescript
// Check if result is AllTypesResult
function isAllTypesResult(result: unknown): result is AllTypesResult {
  return (
    typeof result === 'object' &&
    result !== null &&
    'values' in result &&
    'paths' in result &&
    'entries' in result
  );
}

// Check if result is ParentChainResult array
function isParentChainResult(result: unknown): result is ParentChainResult[] {
  return (
    Array.isArray(result) &&
    result.length > 0 &&
    'chain' in result[0] &&
    'depth' in result[0]
  );
}

// Check if error is QueryError
function isQueryError(error: unknown): error is { error: QueryError } {
  return (
    typeof error === 'object' &&
    error !== null &&
    'error' in error &&
    typeof (error as any).error === 'object' &&
    'type' in (error as any).error &&
    'message' in (error as any).error
  );
}

// Usage
try {
  const result = await JSONPath.query('$.items[*]', data, {
    resultType: 'all'
  });

  if (isAllTypesResult(result)) {
    console.log('Values:', result.values);
    console.log('Paths:', result.paths);
  }
} catch (error) {
  if (isQueryError(error)) {
    console.error('Query failed:', error.error.message);
  }
}
```

---

## See Also

- [QueryBuilder API](./query-builder.md) - Fluent API reference
- [JSONPath Static Methods](./jsonpath.md) - Core API reference
- [Query Syntax](../guide/syntax.md) - JSONPath syntax guide
- [TypeScript Guide](../guide/typescript.md) - Advanced TypeScript usage
- [Error Handling](../guide/error-handling.md) - Error handling patterns
