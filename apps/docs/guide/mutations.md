# Mutations Guide

Learn how to modify JSON data using JSONPath queries with jsonpathx's powerful Mutation API. Mutations allow you to set, update, delete, insert, and transform values in your JSON data based on JSONPath expressions.

## Table of Contents

- [Overview](#overview)
- [Mutation Options](#mutation-options)
  - [Immutable vs Mutable](#immutable-vs-mutable)
  - [Path Creation](#path-creation)
- [Basic Mutations](#basic-mutations)
  - [Set Values](#set-values)
  - [Delete Values](#delete-values)
  - [Update Values](#update-values)
- [Array Mutations](#array-mutations)
  - [Insert](#insert)
  - [Push](#push)
  - [Unshift](#unshift)
- [Object Mutations](#object-mutations)
  - [Merge](#merge)
- [Numeric Mutations](#numeric-mutations)
  - [Increment](#increment)
  - [Decrement](#decrement)
- [Boolean Mutations](#boolean-mutations)
  - [Toggle](#toggle)
- [Advanced Patterns](#advanced-patterns)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)

## Overview

The Mutation API provides methods to modify JSON data based on JSONPath queries. All mutation operations:

- **Support JSONPath queries** - Use any valid JSONPath expression to target values
- **Return mutation results** - Get modified data, count, and paths
- **Are immutable by default** - Create copies instead of mutating in place
- **Support batch operations** - Modify multiple matches in one call

### Basic Usage

```typescript
import { Mutation } from 'jsonpathx';

const data = {
  users: [
    { id: 1, name: 'Alice', score: 100 },
    { id: 2, name: 'Bob', score: 150 }
  ]
};

// Set a value
const result = await Mutation.set(data, '$.users[0].name', 'Alicia');

console.log(result.data);      // Modified data
console.log(result.modified);  // Number of changes
console.log(result.paths);     // Modified paths
```

### Mutation Result

All mutation operations return a `MutationResult`:

```typescript
interface MutationResult {
  data: unknown;       // The mutated data
  modified: number;    // Number of values modified
  paths: string[];     // Paths that were modified
}
```

---

## Mutation Options

### Immutable vs Mutable

By default, mutations are **immutable** - they create a copy of your data before making changes.

```typescript
interface MutationOptions {
  immutable?: boolean;  // Default: true
  createPath?: boolean; // Default: false
  // ...plus all QueryOptions
}
```

#### Immutable Operations (Default)

```typescript
const data = { value: 10 };

const result = await Mutation.set(data, '$.value', 20, {
  immutable: true  // Default behavior
});

console.log(data.value);        // 10 (original unchanged)
console.log(result.data.value); // 20 (new copy)
```

**Use when:**
- You need to preserve the original data
- Working with React state or Redux
- Creating undo/redo functionality
- Avoiding side effects

#### Mutable Operations

```typescript
const data = { value: 10 };

const result = await Mutation.set(data, '$.value', 20, {
  immutable: false  // Mutate in place
});

console.log(data.value);        // 20 (original modified)
console.log(result.data.value); // 20 (same reference)
console.log(data === result.data); // true
```

**Use when:**
- Performance is critical
- Working with large datasets
- Data is already isolated (local scope)
- Creating temporary transformations

---

### Path Creation

Enable automatic creation of intermediate paths that don't exist.

```typescript
const data = { };

const result = await Mutation.set(data, '$.user.profile.name', 'Alice', {
  createPath: true  // Create user.profile if missing
});

console.log(result.data);
// { user: { profile: { name: 'Alice' } } }
```

**Without `createPath`:**
```typescript
// Will not modify anything if path doesn't exist
const result = await Mutation.set({}, '$.user.name', 'Alice');
console.log(result.modified); // 0
```

---

## Basic Mutations

### Set Values

Set values at a JSONPath to a specific value.

**Signature:**
```typescript
Mutation.set(
  data: unknown,
  path: string,
  value: unknown,
  options?: MutationOptions
): Promise<MutationResult>
```

**Examples:**

```typescript
const data = {
  users: [
    { id: 1, name: 'Alice', active: false },
    { id: 2, name: 'Bob', active: false }
  ]
};

// Set single value
await Mutation.set(data, '$.users[0].name', 'Alicia');

// Set multiple values (all matches)
await Mutation.set(data, '$.users[*].active', true);

// Set with filter
await Mutation.set(
  data,
  '$.users[?(@.id === 1)].active',
  true
);

// Create nested path
await Mutation.set(
  data,
  '$.users[0].profile.avatar',
  'avatar.png',
  { createPath: true }
);
```

---

### Delete Values

Delete values at a JSONPath.

**Signature:**
```typescript
Mutation.delete(
  data: unknown,
  path: string,
  options?: MutationOptions
): Promise<MutationResult>
```

**Examples:**

```typescript
const data = {
  users: [
    { id: 1, name: 'Alice', temp: true },
    { id: 2, name: 'Bob', temp: false }
  ]
};

// Delete property from objects
await Mutation.delete(data, '$.users[*].temp');

// Delete array element
await Mutation.delete(data, '$.users[0]');

// Delete with filter
await Mutation.delete(data, '$.users[?(@.temp === true)]');
```

**Array Deletion:**
```typescript
const data = { items: [1, 2, 3, 4, 5] };

// Remove specific elements
await Mutation.delete(data, '$.items[1]');
// Result: [1, 3, 4, 5]

// Remove multiple elements (deletes deepest first)
await Mutation.delete(data, '$.items[1,3]');
// Result: [1, 3, 5]
```

---

### Update Values

Update values using a transform function.

**Signature:**
```typescript
Mutation.update(
  data: unknown,
  path: string,
  transform: (value: unknown, index?: number) => unknown,
  options?: MutationOptions
): Promise<MutationResult>
```

**Examples:**

```typescript
const data = {
  products: [
    { name: 'Widget', price: 100 },
    { name: 'Gadget', price: 200 }
  ]
};

// Apply discount to all prices
await Mutation.update(
  data,
  '$.products[*].price',
  price => price * 0.9  // 10% off
);

// Update with index
await Mutation.update(
  data,
  '$.products[*].name',
  (name, index) => `${index + 1}. ${name}`
);

// Complex transformation
await Mutation.update(
  data,
  '$.products[*]',
  product => ({
    ...product,
    displayPrice: `$${product.price.toFixed(2)}`,
    onSale: product.price < 150
  })
);
```

---

## Array Mutations

### Insert

Insert a value into an array at a specific position.

**Signature:**
```typescript
Mutation.insert(
  data: unknown,
  path: string,
  value: unknown,
  options?: MutationOptions & { position?: 'start' | 'end' | number }
): Promise<MutationResult>
```

**Examples:**

```typescript
const data = { items: [1, 2, 3] };

// Insert at end (default)
await Mutation.insert(data, '$.items', 4);
// Result: [1, 2, 3, 4]

// Insert at start
await Mutation.insert(data, '$.items', 0, { position: 'start' });
// Result: [0, 1, 2, 3]

// Insert at specific index
await Mutation.insert(data, '$.items', 999, { position: 2 });
// Result: [1, 2, 999, 3]
```

**Multiple Arrays:**
```typescript
const data = {
  lists: [[1, 2], [3, 4], [5, 6]]
};

// Insert into all arrays
await Mutation.insert(data, '$.lists[*]', 999, { position: 'end' });
// Result: [[1, 2, 999], [3, 4, 999], [5, 6, 999]]
```

---

### Push

Append a value to the end of arrays.

**Signature:**
```typescript
Mutation.push(
  data: unknown,
  path: string,
  value: unknown,
  options?: MutationOptions
): Promise<MutationResult>
```

**Examples:**

```typescript
const data = {
  lists: [[1, 2], [3, 4]]
};

// Push to all arrays
await Mutation.push(data, '$.lists[*]', 999);
// Result: [[1, 2, 999], [3, 4, 999]]

// Push object to array
const data2 = { users: [] };
await Mutation.push(data2, '$.users', { id: 1, name: 'Alice' });
```

---

### Unshift

Prepend a value to the start of arrays.

**Signature:**
```typescript
Mutation.unshift(
  data: unknown,
  path: string,
  value: unknown,
  options?: MutationOptions
): Promise<MutationResult>
```

**Examples:**

```typescript
const data = {
  lists: [[1, 2], [3, 4]]
};

// Unshift to all arrays
await Mutation.unshift(data, '$.lists[*]', 0);
// Result: [[0, 1, 2], [0, 3, 4]]
```

---

## Object Mutations

### Merge

Merge an object into objects at a JSONPath.

**Signature:**
```typescript
Mutation.merge(
  data: unknown,
  path: string,
  mergeValue: Record<string, unknown>,
  options?: MutationOptions
): Promise<MutationResult>
```

**Examples:**

```typescript
const data = {
  users: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' }
  ]
};

// Add property to all users
await Mutation.merge(data, '$.users[*]', { active: true });
// Result: users have active: true

// Merge multiple properties
await Mutation.merge(data, '$.users[*]', {
  verified: true,
  role: 'user',
  createdAt: new Date().toISOString()
});

// Merge at root
await Mutation.merge(data, '$', { version: '1.0' });
```

**Overwriting Properties:**
```typescript
const data = {
  user: { name: 'Alice', age: 30 }
};

// Merge overwrites existing properties
await Mutation.merge(data, '$.user', { age: 31, city: 'NYC' });
// Result: { name: 'Alice', age: 31, city: 'NYC' }
```

---

## Numeric Mutations

### Increment

Increment numeric values by a specified amount.

**Signature:**
```typescript
Mutation.increment(
  data: unknown,
  path: string,
  amount?: number,  // Default: 1
  options?: MutationOptions
): Promise<MutationResult>
```

**Examples:**

```typescript
const data = {
  counters: [
    { count: 5, views: 100 },
    { count: 10, views: 200 }
  ]
};

// Increment by 1 (default)
await Mutation.increment(data, '$.counters[*].count');
// Counts: 6, 11

// Increment by custom amount
await Mutation.increment(data, '$.counters[*].views', 10);
// Views: 110, 210

// Increment with filter
await Mutation.increment(
  data,
  '$.counters[?(@.count < 10)].count',
  5
);
```

---

### Decrement

Decrement numeric values by a specified amount.

**Signature:**
```typescript
Mutation.decrement(
  data: unknown,
  path: string,
  amount?: number,  // Default: 1
  options?: MutationOptions
): Promise<MutationResult>
```

**Examples:**

```typescript
const data = {
  inventory: [
    { item: 'Widget', stock: 100 },
    { item: 'Gadget', stock: 50 }
  ]
};

// Decrement by 1
await Mutation.decrement(data, '$.inventory[*].stock');
// Stock: 99, 49

// Decrement by custom amount
await Mutation.decrement(data, '$.inventory[0].stock', 10);
// Stock: 90
```

---

## Boolean Mutations

### Toggle

Toggle boolean values (true ↔ false).

**Signature:**
```typescript
Mutation.toggle(
  data: unknown,
  path: string,
  options?: MutationOptions
): Promise<MutationResult>
```

**Examples:**

```typescript
const data = {
  flags: [
    { active: true, visible: false },
    { active: false, visible: true }
  ]
};

// Toggle all active flags
await Mutation.toggle(data, '$.flags[*].active');
// Active: false, true

// Toggle with filter
await Mutation.toggle(
  data,
  '$.flags[?(@.active === true)].visible'
);
```

---

## Advanced Patterns

### Chaining Mutations

Since mutations are immutable by default, you can chain them:

```typescript
let result = await Mutation.set(data, '$.users[*].active', false);

result = await Mutation.merge(result.data, '$.users[*]', {
  verified: false
});

result = await Mutation.update(result.data, '$.users[*].score', s => s * 2);

const finalData = result.data;
```

### Conditional Updates

Use filters for conditional mutations:

```typescript
// Update only items matching criteria
await Mutation.update(
  data,
  '$.products[?(@.price > 100)].price',
  price => price * 0.9  // Discount expensive items
);

// Merge only into active users
await Mutation.merge(
  data,
  '$.users[?(@.active === true)]',
  { lastLogin: Date.now() }
);
```

### Batch Operations

Mutations automatically handle multiple matches:

```typescript
const data = {
  categories: [
    { name: 'Electronics', items: [] },
    { name: 'Clothing', items: [] },
    { name: 'Books', items: [] }
  ]
};

// Push to all categories at once
await Mutation.push(
  data,
  '$.categories[*].items',
  { id: 1, name: 'New Item' }
);
```

### Complex Transformations

Combine mutations with QueryBuilder for complex workflows:

```typescript
import { JSONPath, Mutation } from 'jsonpathx';

// Get IDs of inactive users
const inactiveIds = await JSONPath.create(data)
  .query('$.users[?(@.active === false)]')
  .map(user => user.id)
  .execute();

// Delete inactive users
for (const id of inactiveIds) {
  await Mutation.delete(data, `$.users[?(@.id === ${id})]`);
}
```

### Nested Mutations

Create complex nested structures:

```typescript
const data = {};

// Create nested structure
let result = await Mutation.set(
  data,
  '$.app.settings.theme.colors.primary',
  '#007bff',
  { createPath: true }
);

result = await Mutation.set(
  result.data,
  '$.app.settings.theme.colors.secondary',
  '#6c757d',
  { createPath: true }
);
```

### Atomic Updates

For mutable operations, you can perform atomic updates:

```typescript
async function atomicIncrement(data: any, path: string) {
  // Mutate in place for atomicity
  return await Mutation.increment(data, path, 1, {
    immutable: false
  });
}

// Use in concurrent scenarios
await atomicIncrement(sharedData, '$.counter');
```

---

## Error Handling

### Type Errors

Operations validate types before mutation:

```typescript
try {
  // Cannot increment string
  await Mutation.increment(data, '$.name');
} catch (error) {
  // Error: Cannot increment non-number value
}

try {
  // Cannot toggle number
  await Mutation.toggle(data, '$.count');
} catch (error) {
  // Error: Cannot toggle non-boolean value
}

try {
  // Cannot insert into non-array
  await Mutation.insert(data, '$.user', 'value');
} catch (error) {
  // Error: Cannot insert into non-array
}
```

### Safe Mutations

Handle errors gracefully:

```typescript
async function safeMutation<T>(
  operation: () => Promise<MutationResult>,
  fallback: T
): Promise<T> {
  try {
    const result = await operation();
    return result.data as T;
  } catch (error) {
    console.error('Mutation failed:', error);
    return fallback;
  }
}

// Usage
const result = await safeMutation(
  () => Mutation.set(data, '$.invalid.path', 'value'),
  data  // Return original on error
);
```

### Validation Before Mutation

```typescript
async function validatedMutation(data: any, path: string, value: any) {
  // Check if path exists
  const matches = await JSONPath.query(path, data);

  if (matches.length === 0) {
    throw new Error(`Path ${path} not found`);
  }

  // Perform mutation
  return await Mutation.set(data, path, value);
}
```

---

## Best Practices

### 1. Use Immutable by Default

Always use immutable mutations unless you have a specific reason not to:

```typescript
// ✓ Good: Immutable (default)
const result = await Mutation.set(data, '$.value', 10);

// ✗ Avoid: Mutable (unless necessary)
const result = await Mutation.set(data, '$.value', 10, {
  immutable: false
});
```

### 2. Check Mutation Results

Always check how many items were modified:

```typescript
const result = await Mutation.set(data, '$.users[*].active', true);

if (result.modified === 0) {
  console.warn('No users were modified');
} else {
  console.log(`Updated ${result.modified} users`);
  console.log('Paths:', result.paths);
}
```

### 3. Use Specific Paths

Use specific JSONPath expressions to avoid unintended modifications:

```typescript
// ✓ Good: Specific
await Mutation.set(data, '$.users[0].name', 'Alice');

// ✗ Risky: Too broad
await Mutation.set(data, '$..*', 'value');
```

### 4. Validate Types

Validate data types before type-specific mutations:

```typescript
// Check before incrementing
const value = await JSONPath.query('$.count', data);
if (typeof value[0] === 'number') {
  await Mutation.increment(data, '$.count');
}
```

### 5. Use createPath Carefully

Only use `createPath` when you intend to create new structures:

```typescript
// ✓ Good: Intentional path creation
await Mutation.set(data, '$.new.nested.path', 'value', {
  createPath: true
});

// ✗ Risky: May mask typos
await Mutation.set(data, '$.usrs[0].name', 'Alice', {
  createPath: true  // Creates "usrs" instead of using "users"
});
```

### 6. Chain Related Mutations

Chain mutations that work on the same data:

```typescript
async function updateUser(data: any, userId: number) {
  const path = `$.users[?(@.id === ${userId})]`;

  let result = await Mutation.merge(data, path, {
    updatedAt: new Date().toISOString()
  });

  result = await Mutation.increment(result.data, `${path}.version`);

  return result.data;
}
```

### 7. Document Side Effects

When using mutable operations, document them clearly:

```typescript
/**
 * Updates user score IN PLACE (mutates data)
 * @param data - User data (will be modified)
 */
async function updateScore(data: any, score: number) {
  return await Mutation.set(data, '$.score', score, {
    immutable: false  // Documented side effect
  });
}
```

### 8. Use TypeScript

Leverage TypeScript for type safety:

```typescript
interface User {
  id: number;
  name: string;
  active: boolean;
}

interface AppData {
  users: User[];
}

async function activateUser(data: AppData, userId: number) {
  const result = await Mutation.set(
    data,
    `$.users[?(@.id === ${userId})].active`,
    true
  );

  return result.data as AppData;
}
```

---

## See Also

- [Query API](../api/jsonpath.md) - Core query methods
- [QueryBuilder](../api/query-builder.md) - Fluent query API
- [Mutation Examples](../examples/mutations.md) - Practical examples
- [Error Handling](./error-handling.md) - Error handling strategies
