---
outline: deep
---

# TypeScript Advanced Guide

Master TypeScript with jsonpathx. Learn about generic type parameters, type inference, custom type guards, and advanced patterns for building type-safe applications.

## Table of Contents

- [Overview](#overview)
- [Generic Type Parameters](#generic-type-parameters)
- [Type Inference](#type-inference)
- [QueryBuilder Type Safety](#querybuilder-type-safety)
- [Custom Type Guards](#custom-type-guards)
- [Type Narrowing](#type-narrowing)
- [Utility Types](#utility-types)
- [Strict Mode Compatibility](#strict-mode-compatibility)
- [Advanced Patterns](#advanced-patterns)
- [Type-Safe APIs](#type-safe-apis)
- [Troubleshooting](#troubleshooting)

---

## Overview

jsonpathx is built with TypeScript-first design, providing comprehensive type definitions and support for generic type parameters throughout the API.

### Type Safety Benefits

```typescript
import { JSONPath } from 'jsonpathx';

interface User {
  id: number;
  name: string;
  email: string;
  active: boolean;
}

// Type-safe query
const users = await JSONPath.query<User>('$.users[*]', data);
// users: User[]

// TypeScript knows the structure
users.forEach(user => {
  console.log(user.name);  // ✓ Type-safe
  // console.log(user.invalid);  // ✗ Compile error
});
```

---

## Generic Type Parameters

### JSONPath.query\<T>

Specify the type of values you expect to retrieve:

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
}

// Query returns Product[]
const products = await JSONPath.query<Product>(
  '$.products[*]',
  data
);

// Query returns string[]
const names = await JSONPath.query<string>(
  '$.products[*].name',
  data
);

// Query returns number[]
const prices = await JSONPath.query<number>(
  '$.products[*].price',
  data
);
```

### QueryBuilder\<T>

The QueryBuilder uses generics for type inference through the chain:

```typescript
interface Book {
  title: string;
  author: string;
  price: number;
  isbn: string;
}

const books = await JSONPath.create<Book>(data)
  .query('$.books[*]')
  .filter(book => book.price < 20)  // book: Book
  .sort((a, b) => a.price - b.price)  // a, b: Book
  .map(book => book.title)  // Returns string[]
  .execute();
// books: string[]
```

### Multiple Generic Parameters

Functions can use multiple type parameters:

```typescript
async function transformQuery<TInput, TOutput>(
  path: string,
  data: unknown,
  transform: (input: TInput) => TOutput
): Promise<TOutput[]> {
  const results = await JSONPath.query<TInput>(path, data);
  return results.map(transform);
}

// Usage
interface User { name: string; age: number; }
interface UserSummary { name: string; }

const summaries = await transformQuery<User, UserSummary>(
  '$.users[*]',
  data,
  user => ({ name: user.name })
);
```

---

## Type Inference

### Automatic Type Inference

TypeScript can infer types from context:

```typescript
interface Data {
  users: Array<{ id: number; name: string }>;
}

const data: Data = { users: [{ id: 1, name: 'Alice' }] };

// Type inferred from data structure
const users = await JSONPath.query('$.users[*]', data);
// users: unknown[] (no explicit type parameter)

// Better: Explicit type for safety
const users = await JSONPath.query<Data['users'][number]>(
  '$.users[*]',
  data
);
// users: { id: number; name: string }[]
```

### Type Inference in Chains

Types flow through method chains:

```typescript
interface Item {
  value: number;
  label: string;
}

const result = await JSONPath.create<Item>(data)
  .query('$.items[*]')
  .filter((item): item is Item => item.value > 10)
  // After filter, type is Item[]
  .map(item => item.label)
  // After map, type is string[]
  .execute();
// result: string[]
```

### Indexed Access Types

Access nested types safely:

```typescript
interface Store {
  books: Array<{
    title: string;
    author: string;
    price: number;
  }>;
}

// Extract book type
type Book = Store['books'][number];

const books = await JSONPath.query<Book>('$.books[*]', data);
```

---

## QueryBuilder Type Safety

### Typed Builder Creation

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

interface ProductData {
  products: Product[];
}

const data: ProductData = { /* ... */ };

// Create typed builder
const builder = JSONPath.create<Product>(data);
```

### Type Preservation Through Chains

```typescript
const result = await JSONPath.create<Product>(data)
  .query('$.products[*]')
  // Type: Product[]

  .filter((p): p is Product => p.price < 100)
  // Type: Product[]

  .map(p => ({
    id: p.id,
    name: p.name,
    displayPrice: `$${p.price.toFixed(2)}`
  }))
  // Type: { id: string; name: string; displayPrice: string }[]

  .execute();
// result: { id: string; name: string; displayPrice: string }[]
```

### Constraining Generic Types

```typescript
// Constrain to objects with specific properties
function queryWithId<T extends { id: string | number }>(
  path: string,
  data: unknown
): Promise<T[]> {
  return JSONPath.query<T>(path, data);
}

interface User {
  id: number;
  name: string;
}

const users = await queryWithId<User>('$.users[*]', data);
// ✓ Valid: User has id property

interface Invalid {
  name: string;
}

// ✗ Error: Invalid doesn't have id property
// const items = await queryWithId<Invalid>('$.items[*]', data);
```

---

## Custom Type Guards

### Creating Type Guards

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

interface Admin extends User {
  role: 'admin';
  permissions: string[];
}

// Type guard function
function isAdmin(user: User): user is Admin {
  return 'role' in user && user.role === 'admin';
}

// Usage
const users = await JSONPath.query<User>('$.users[*]', data);
const admins = users.filter(isAdmin);
// admins: Admin[]
```

### Type Guards with QueryBuilder

```typescript
const admins = await JSONPath.create<User>(data)
  .query('$.users[*]')
  .filter((user): user is Admin => {
    return 'role' in user && user.role === 'admin';
  })
  .execute();
// admins: Admin[]
```

### Generic Type Guards

```typescript
function hasProperty<T, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return obj !== null && typeof obj === 'object' && key in obj;
}

// Usage
const results = await JSONPath.query<unknown>('$.items[*]', data);

const withName = results.filter(item => hasProperty(item, 'name'));
// withName: (unknown & Record<'name', unknown>)[]
```

---

## Type Narrowing

### Narrowing with Filters

```typescript
type Item =
  | { type: 'product'; name: string; price: number }
  | { type: 'service'; name: string; duration: number };

const items = await JSONPath.query<Item>('$.items[*]', data);

// Narrow to products
const products = items.filter((item): item is Extract<Item, { type: 'product' }> => {
  return item.type === 'product';
});
// products: { type: 'product'; name: string; price: number }[]
```

### Narrowing with Type Guards in Callbacks

```typescript
interface Result {
  success: boolean;
  data?: string;
  error?: string;
}

const results = await JSONPath.query<Result>('$.results[*]', data);

results.forEach(result => {
  if (result.success && result.data) {
    // TypeScript narrows: result.data is string
    console.log(result.data.toUpperCase());
  }
});
```

### Discriminated Unions

```typescript
type Response =
  | { status: 'success'; data: unknown }
  | { status: 'error'; message: string }
  | { status: 'pending' };

const responses = await JSONPath.query<Response>('$.responses[*]', data);

responses.forEach(response => {
  switch (response.status) {
    case 'success':
      // response.data is available
      console.log(response.data);
      break;
    case 'error':
      // response.message is available
      console.error(response.message);
      break;
    case 'pending':
      // No additional properties
      console.log('Pending...');
      break;
  }
});
```

---

## Utility Types

### Extracting Types from Results

```typescript
import type {
  QueryResultEntry,
  AllTypesResult,
  ParentChainResult
} from 'jsonpathx';

// Use built-in utility types
type Entry = QueryResultEntry;
type AllResults = AllTypesResult;

// Extract value types
type ValueType = QueryResultEntry['value'];
type PathType = QueryResultEntry['path'];
```

### Creating Utility Types

```typescript
// Extract array element type
type ArrayElement<T> = T extends (infer U)[] ? U : never;

interface Data {
  items: Array<{ id: number; name: string }>;
}

type Item = ArrayElement<Data['items']>;
// { id: number; name: string }

// Make all properties optional
type PartialQuery<T> = {
  [K in keyof T]?: T[K];
};

// Deep partial
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
```

### Conditional Types

```typescript
// Conditional return type based on resultType
type QueryResult<T, R extends ResultType> =
  R extends 'value' ? T[] :
  R extends 'path' ? string[] :
  R extends 'pointer' ? string[] :
  R extends 'all' ? AllTypesResult :
  unknown[];

function typedQuery<T, R extends ResultType = 'value'>(
  path: string,
  data: unknown,
  resultType?: R
): Promise<QueryResult<T, R>> {
  return JSONPath.query(path, data, { resultType }) as any;
}

// Usage
const values = await typedQuery<User>('$.users[*]', data);
// values: User[]

const paths = await typedQuery<User, 'path'>('$.users[*]', data, 'path');
// paths: string[]
```

---

## Strict Mode Compatibility

### Enabling Strict Mode

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitAny": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

### Handling Nullable Values

```typescript
interface User {
  id: number;
  name: string;
  email?: string;  // Optional
}

const users = await JSONPath.query<User>('$.users[*]', data);

users.forEach(user => {
  // Strict null checks
  if (user.email) {
    // email is string (not string | undefined)
    console.log(user.email.toUpperCase());
  }
});
```

### Non-Null Assertions

```typescript
const user = await JSONPath.create<User>(data)
  .query('$.users[0]')
  .first();

// Use non-null assertion when you're certain
const name = user!.name;

// Better: Optional chaining
const name = user?.name;

// Best: Type guard
if (user) {
  const name = user.name;
}
```

---

## Advanced Patterns

### Builder Pattern with Types

```typescript
class TypedQueryBuilder<T> {
  private path?: string;

  query(path: string): this {
    this.path = path;
    return this;
  }

  async execute(data: unknown): Promise<T[]> {
    if (!this.path) throw new Error('No path set');
    return JSONPath.query<T>(this.path, data);
  }
}

// Usage
const builder = new TypedQueryBuilder<User>();
const users = await builder.query('$.users[*]').execute(data);
```

### Generic Repository Pattern

```typescript
interface Repository<T extends { id: string | number }> {
  findAll(): Promise<T[]>;
  findById(id: T['id']): Promise<T | undefined>;
  findWhere(predicate: (item: T) => boolean): Promise<T[]>;
}

class JSONPathRepository<T extends { id: string | number }>
  implements Repository<T> {
  constructor(
    private data: unknown,
    private basePath: string
  ) {}

  async findAll(): Promise<T[]> {
    return JSONPath.query<T>(this.basePath, this.data);
  }

  async findById(id: T['id']): Promise<T | undefined> {
    const results = await JSONPath.query<T>(
      `${this.basePath}[?(@.id === ${JSON.stringify(id)})]`,
      this.data
    );
    return results[0];
  }

  async findWhere(predicate: (item: T) => boolean): Promise<T[]> {
    const all = await this.findAll();
    return all.filter(predicate);
  }
}

// Usage
interface Product {
  id: string;
  name: string;
  price: number;
}

const repo = new JSONPathRepository<Product>(data, '$.products[*]');
const products = await repo.findAll();
const product = await repo.findById('123');
const cheap = await repo.findWhere(p => p.price < 100);
```

### Type-Safe Mutations

```typescript
import { Mutation, MutationResult } from 'jsonpathx';

async function typedSet<T, K extends keyof T>(
  data: { [key: string]: T[] },
  arrayKey: string,
  itemPath: string,
  prop: K,
  value: T[K]
): Promise<MutationResult> {
  return Mutation.set(
    data,
    `$.${arrayKey}[${itemPath}].${String(prop)}`,
    value
  );
}

// Usage
interface User {
  id: number;
  name: string;
  active: boolean;
}

await typedSet<User, 'name'>(
  data,
  'users',
  '?(@.id === 1)',
  'name',
  'New Name'
);
```

---

## Type-Safe APIs

### Wrapper Functions

```typescript
// Create type-safe wrapper
async function queryUsers(data: unknown): Promise<User[]> {
  return JSONPath.query<User>('$.users[*]', data);
}

async function queryActiveUsers(data: unknown): Promise<User[]> {
  return JSONPath.query<User>(
    '$.users[?(@.active === true)]',
    data
  );
}

async function getUserById(data: unknown, id: number): Promise<User | undefined> {
  const results = await JSONPath.query<User>(
    `$.users[?(@.id === ${id})]`,
    data
  );
  return results[0];
}
```

### Type-Safe Configuration

```typescript
interface QueryConfig<T> {
  path: string;
  transform?: (item: T) => T;
  filter?: (item: T) => boolean;
}

async function configuredQuery<T>(
  data: unknown,
  config: QueryConfig<T>
): Promise<T[]> {
  let results = await JSONPath.query<T>(config.path, data);

  if (config.filter) {
    results = results.filter(config.filter);
  }

  if (config.transform) {
    results = results.map(config.transform);
  }

  return results;
}

// Usage
const users = await configuredQuery<User>(data, {
  path: '$.users[*]',
  filter: u => u.active,
  transform: u => ({ ...u, name: u.name.toUpperCase() })
});
```

---

## Troubleshooting

### Type 'unknown' Error

```typescript
// ❌ Error: Property 'name' does not exist on type 'unknown'
const results = await JSONPath.query('$.items[*]', data);
results.forEach(item => console.log(item.name));

// ✅ Fix: Add type parameter
const results = await JSONPath.query<{ name: string }>('$.items[*]', data);
results.forEach(item => console.log(item.name));
```

### Type Assertion

```typescript
// When you know the type but TypeScript doesn't
const results = await JSONPath.query('$.items[*]', data);
const typed = results as Item[];

// Better: Use type parameter
const results = await JSONPath.query<Item>('$.items[*]', data);
```

### Handling Union Types

```typescript
type Value = string | number | boolean;

const values = await JSONPath.query<Value>('$.values[*]', data);

values.forEach(value => {
  if (typeof value === 'string') {
    console.log(value.toUpperCase());
  } else if (typeof value === 'number') {
    console.log(value.toFixed(2));
  } else {
    console.log(value ? 'true' : 'false');
  }
});
```

### Generic Constraints Not Met

```typescript
// ❌ Error: Type 'string' does not satisfy constraint
function queryWithId<T extends { id: number }>(path: string, data: unknown) {
  return JSONPath.query<T>(path, data);
}

interface Item {
  id: string;  // Wrong type!
  name: string;
}

// const items = await queryWithId<Item>('$.items[*]', data);

// ✅ Fix: Match the constraint
interface Item {
  id: number;  // Correct type
  name: string;
}

const items = await queryWithId<Item>('$.items[*]', data);
```

### Async/Await Types

```typescript
// Return type is Promise<T[]>
async function getUsers(data: unknown): Promise<User[]> {
  return JSONPath.query<User>('$.users[*]', data);
}

// Unwrap promise type
type UnwrappedUsers = Awaited<ReturnType<typeof getUsers>>;
// User[]
```

---

## Best Practices

### 1. Always Use Type Parameters

```typescript
// ❌ Avoid
const items = await JSONPath.query('$.items[*]', data);

// ✅ Prefer
const items = await JSONPath.query<Item>('$.items[*]', data);
```

### 2. Define Interfaces Early

```typescript
// Define data structures upfront
interface AppData {
  users: User[];
  products: Product[];
  orders: Order[];
}

interface User {
  id: number;
  name: string;
  email: string;
}

// Use throughout application
const users = await JSONPath.query<User>('$.users[*]', data);
```

### 3. Use Type Guards for Runtime Safety

```typescript
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'name' in value &&
    'email' in value
  );
}

const results = await JSONPath.query('$.items[*]', data);
const users = results.filter(isUser);
```

### 4. Leverage IDE Autocomplete

```typescript
// With proper types, IDE provides autocomplete
const users = await JSONPath.query<User>('$.users[*]', data);

users.forEach(user => {
  user.  // IDE suggests: id, name, email
});
```

### 5. Document Type Parameters

```typescript
/**
 * Query products with type safety
 * @template T - Product type with required properties
 * @param path - JSONPath expression
 * @param data - Source data
 * @returns Array of typed products
 */
async function queryProducts<T extends Product>(
  path: string,
  data: unknown
): Promise<T[]> {
  return JSONPath.query<T>(path, data);
}
```

---

## See Also

- [Type Reference](../api/types.md) - Complete type definitions
- [QueryBuilder API](../api/query-builder.md) - Builder API reference
- [Examples](../examples/advanced.md) - Advanced examples
- [Strict Mode Guide](../typescript-strict-mode.md) - Strict mode configuration
