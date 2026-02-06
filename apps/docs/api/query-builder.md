# QueryBuilder API Reference

The QueryBuilder class provides a fluent, chainable API for building and executing JSONPath queries with powerful JavaScript-based transformations. It combines the performance of the engine-powered JSONPath evaluator with the flexibility of JavaScript data manipulation.

## Table of Contents

- [Overview](#overview)
- [Creating a QueryBuilder](#creating-a-querybuilder)
- [Method Categories](#method-categories)
  - [Basic Methods](#basic-methods)
  - [Transformation Methods](#transformation-methods)
  - [Terminal Methods](#terminal-methods)
  - [Aggregation Methods](#aggregation-methods)
  - [Advanced Methods](#advanced-methods)
  - [Context Methods](#context-methods)
- [Method Chaining](#method-chaining)
- [Type Safety](#type-safety)
- [Complete Examples](#complete-examples)
- [Best Practices](#best-practices)

## Overview

The QueryBuilder enables you to:

- **Chain operations** - Build complex data transformations step by step
- **Type-safe queries** - Leverage TypeScript generics for type safety
- **Reusable queries** - Create query instances that can be evaluated multiple times
- **Performance** - Combine engine-powered JSONPath with efficient JavaScript transformations
- **Flexibility** - Mix JSONPath selectors with JavaScript functions

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

const result = await JSONPath.create(data)
  .query('$.store.book[*]')
  .filter(book => book.price < 10)
  .sort((a, b) => a.price - b.price)
  .take(5)
  .map(book => book.title)
  .execute();
```

## Creating a QueryBuilder

### `JSONPath.create(data)`

Creates a new QueryBuilder instance with the provided data.

**Signature:**
```typescript
static create<T = unknown>(data: unknown): QueryBuilder<T>
```

**Parameters:**
- `data` - The JSON data to query against

**Returns:** A new QueryBuilder instance

**Example:**
```typescript
const data = {
  store: {
    book: [
      { title: "Book 1", price: 8.99 },
      { title: "Book 2", price: 12.99 },
      { title: "Book 3", price: 5.99 }
    ]
  }
};

const builder = JSONPath.create(data);
```

## Method Categories

### Basic Methods

These methods configure the query and its options.

#### `.query(path: string): this`

Set the JSONPath query expression.

**Parameters:**
- `path` - A JSONPath expression string

**Returns:** `this` for chaining

**Example:**
```typescript
builder.query('$.store.book[*]')
```

#### `.withOptions(options: QueryOptions): this`

Merge additional query options.

**Parameters:**
- `options` - [QueryOptions](./types.md#queryoptions) object

**Returns:** `this` for chaining

**Example:**
```typescript
builder.withOptions({
  resultType: 'path',
  flatten: true,
  sandbox: { myFunc: (x) => x * 2 }
})
```

#### `.resultType(type: ResultType): this`

Set the result type for the query.

**Parameters:**
- `type` - One of: `'value'` | `'path'` | `'pointer'` | `'parent'` | `'parentProperty'` | `'parentChain'` | `'all'`

**Returns:** `this` for chaining

**Example:**
```typescript
builder.resultType('path')  // Returns JSONPath expressions
builder.resultType('value') // Returns matched values (default)
```

#### `.cached(enabled: boolean = true): this`

Enable or disable caching for this query.

**Parameters:**
- `enabled` - Whether to enable caching (default: `true`)

**Returns:** `this` for chaining

**Example:**
```typescript
builder
  .query('$.expensive.computation[*]')
  .cached(true)
```

**See also:** [Caching Guide](../features/caching.md)

#### `.wrapped(enabled: boolean = true): this`

Wrap results in an array, even if there's only one result.

**Parameters:**
- `enabled` - Whether to wrap results (default: `true`)

**Returns:** `this` for chaining

**Example:**
```typescript
// Without wrap: returns single value or array
// With wrap: always returns array
builder.wrapped(true)
```

---

### Transformation Methods

These methods transform the query results using JavaScript functions.

#### `.filter(fn: (value: T) => boolean): this`

Filter results using a predicate function. Multiple filters can be chained (AND logic).

**Parameters:**
- `fn` - Predicate function that returns `true` to keep the item

**Returns:** `this` for chaining

**Example:**
```typescript
await JSONPath.create(data)
  .query('$.products[*]')
  .filter(product => product.price < 100)
  .filter(product => product.inStock)
  .filter(product => product.rating >= 4.0)
  .execute();
```

#### `.map(fn: (value: T) => U): this`

Transform each result using a mapping function.

**Parameters:**
- `fn` - Function to transform each result

**Returns:** `this` for chaining

**Example:**
```typescript
// Extract specific properties
const names = await JSONPath.create(data)
  .query('$.users[*]')
  .map(user => user.name)
  .execute();

// Transform to new structure
const summaries = await JSONPath.create(data)
  .query('$.products[*]')
  .map(product => ({
    id: product.id,
    name: product.name,
    displayPrice: `$${product.price.toFixed(2)}`
  }))
  .execute();
```

#### `.sort(fn: (a: T, b: T) => number): this`

Sort results using a comparator function.

**Parameters:**
- `fn` - Comparator function (same as `Array.prototype.sort()`)

**Returns:** `this` for chaining

**Example:**
```typescript
// Sort by price ascending
builder.sort((a, b) => a.price - b.price)

// Sort by rating descending
builder.sort((a, b) => b.rating - a.rating)

// Sort by string property
builder.sort((a, b) => a.name.localeCompare(b.name))
```

#### `.take(count: number): this`

Take only the first N results.

**Parameters:**
- `count` - Number of results to take

**Returns:** `this` for chaining

**Example:**
```typescript
// Get top 10 products
await JSONPath.create(data)
  .query('$.products[*]')
  .sort((a, b) => b.rating - a.rating)
  .take(10)
  .execute();
```

#### `.skip(count: number): this`

Skip the first N results.

**Parameters:**
- `count` - Number of results to skip

**Returns:** `this` for chaining

**Example:**
```typescript
// Pagination: page 2 (items 11-20)
await JSONPath.create(data)
  .query('$.products[*]')
  .skip(10)
  .take(10)
  .execute();
```

#### `.deduplicate(): this`

Remove duplicate results based on JSON serialization.

**Returns:** `this` for chaining

**Example:**
```typescript
// Get unique categories
const categories = await JSONPath.create(data)
  .query('$..category')
  .deduplicate()
  .execute();
```

**Note:** Uses `JSON.stringify()` for comparison. `.unique()` is an alias that also accepts a key function.

---

### Terminal Methods

These methods execute the query and return a result. Once called, the chain terminates.

#### `.execute(): Promise<T[]>`

Execute the query and return all results.

**Returns:** Promise resolving to an array of results

**Example:**
```typescript
const results = await builder
  .query('$.items[*]')
  .filter(item => item.active)
  .execute();
```

#### `.executeSync(): T[]`

Execute the query synchronously and return all results.

**Returns:** Array of results

**Example:**
```typescript
const results = builder
  .query('$.items[*]')
  .executeSync();
```

#### `.first(): Promise<T | undefined>`

Execute the query and return only the first result.

**Returns:** Promise resolving to the first result or `undefined`

**Example:**
```typescript
const mostExpensive = await JSONPath.create(data)
  .query('$.products[*]')
  .sort((a, b) => b.price - a.price)
  .first();
```

#### `.last(): Promise<T | undefined>`

Execute the query and return only the last result.

**Returns:** Promise resolving to the last result or `undefined`

**Example:**
```typescript
const lastItem = await JSONPath.create(data)
  .query('$.items[*]')
  .last();
```

#### `.count(): Promise<number>`

Execute the query and return the count of results.

**Returns:** Promise resolving to the number of results

**Example:**
```typescript
const inStockCount = await JSONPath.create(data)
  .query('$.products[?(@.inStock)]')
  .count();

console.log(`${inStockCount} products in stock`);
```

#### `.exists(): Promise<boolean>`

Check if any results exist (more efficient than `count() > 0`).

**Returns:** Promise resolving to `true` if results exist, `false` otherwise

**Example:**
```typescript
const hasExpensive = await JSONPath.create(data)
  .query('$.products[?(@.price > 1000)]')
  .exists();

if (hasExpensive) {
  console.log('We have luxury items!');
}
```

---

### Aggregation Methods

These methods execute the query and perform aggregation operations.

#### `.every(predicate: (value: T) => boolean): Promise<boolean>`

Check if all results match a predicate.

**Parameters:**
- `predicate` - Function to test each result

**Returns:** Promise resolving to `true` if all results match

**Example:**
```typescript
const allInStock = await JSONPath.create(data)
  .query('$.products[*]')
  .every(product => product.inStock);
```

#### `.some(predicate: (value: T) => boolean): Promise<boolean>`

Check if any result matches a predicate.

**Parameters:**
- `predicate` - Function to test each result

**Returns:** Promise resolving to `true` if any result matches

**Example:**
```typescript
const hasDiscount = await JSONPath.create(data)
  .query('$.products[*]')
  .some(product => product.discount > 0);
```

#### `.find(predicate: (value: T) => boolean): Promise<T | undefined>`

Find the first result matching a predicate.

**Parameters:**
- `predicate` - Function to test each result

**Returns:** Promise resolving to the first matching result or `undefined`

**Example:**
```typescript
const firstAffordable = await JSONPath.create(data)
  .query('$.products[*]')
  .find(product => product.price < 50);
```

#### `.reduce<R>(reducer: (acc: R, current: T) => R, initialValue: R): Promise<R>`

Reduce results to a single value.

**Parameters:**
- `reducer` - Reducer function
- `initialValue` - Initial accumulator value

**Returns:** Promise resolving to the reduced value

**Example:**
```typescript
// Sum all prices
const total = await JSONPath.create(data)
  .query('$.cart.items[*].price')
  .reduce((sum, price) => sum + price, 0);

// Build a lookup map
const userMap = await JSONPath.create(data)
  .query('$.users[*]')
  .reduce((map, user) => {
    map[user.id] = user;
    return map;
  }, {} as Record<string, User>);
```

#### `.groupBy(keyFn: (value: T) => string | number): Promise<Record<string, T[]>>`

Group results by a key function.

**Parameters:**
- `keyFn` - Function to extract the grouping key from each result

**Returns:** Promise resolving to an object of groups

**Example:**
```typescript
// Group products by category
const productsByCategory = await JSONPath.create(data)
  .query('$.products[*]')
  .groupBy(product => product.category);

// Iterate over groups
for (const [category, products] of Object.entries(productsByCategory)) {
  console.log(`${category}: ${products.length} products`);
}

// Group by price range
const byPriceRange = await JSONPath.create(data)
  .query('$.products[*]')
  .groupBy(p => Math.floor(p.price / 100) * 100);
```

#### `.partition(predicate: (value: T) => boolean): Promise<[T[], T[]]>`

Partition results into two arrays based on a predicate.

**Parameters:**
- `predicate` - Function to test each result

**Returns:** Promise resolving to a tuple `[matching, notMatching]`

**Example:**
```typescript
const [inStock, outOfStock] = await JSONPath.create(data)
  .query('$.products[*]')
  .partition(product => product.inStock);

console.log(`${inStock.length} in stock, ${outOfStock.length} out of stock`);

// Separate expensive from affordable
const [expensive, affordable] = await JSONPath.create(data)
  .query('$.products[*]')
  .partition(p => p.price > 100);
```

---

### Advanced Methods

These methods provide advanced data manipulation capabilities.

#### `.unique(keyFn?: (value: T) => unknown): this`

Alias for `.deduplicate()`, with optional key function.

**Returns:** `this` for chaining

**Example:**
```typescript
// Unique by default (JSON serialization)
const uniqueItems = await JSONPath.create(data)
  .query('$..items[*]')
  .unique()
  .execute();

// Alias of deduplicate
const uniqueItems = await JSONPath.create(data)
  .query('$..items[*]')
  .unique()
  .execute();

// Unique by specific property
const uniqueByName = await JSONPath.create(data)
  .query('$.products[*]')
  .unique(product => product.name)
  .execute();

// Unique by computed key
const uniqueByPriceRange = await JSONPath.create(data)
  .query('$.products[*]')
  .unique(p => Math.floor(p.price / 10) * 10)
  .execute();
```

#### `.flatten(depth: number = 1): this`

Flatten nested arrays up to the specified depth.

**Parameters:**
- `depth` - How many levels to flatten (default: `1`)

**Returns:** `this` for chaining

**Example:**
```typescript
// Flatten one level
const flattened = await JSONPath.create(data)
  .query('$.categories[*].products')
  .flatten(1)
  .execute();

// Flatten deeply nested arrays
const deepFlattened = await JSONPath.create(data)
  .query('$..items')
  .flatten(Infinity)
  .execute();
```

#### `.stats(): Promise<Statistics>`

Calculate statistics for numeric results.

**Returns:** Promise resolving to statistics object

**Return Type:**
```typescript
interface Statistics {
  count: number; // Count of numeric values
  sum: number;   // Sum of all values
  avg?: number;  // Average (if any values)
  min?: number;  // Minimum value (if any values)
  max?: number;  // Maximum value (if any values)
}
```

**Example:**
```typescript
const priceStats = await JSONPath.create(data)
  .query('$.products[*].price')
  .stats();

if (priceStats.avg !== undefined) {
  console.log(`Average price: $${priceStats.avg.toFixed(2)}`);
}
if (priceStats.min !== undefined && priceStats.max !== undefined) {
  console.log(`Range: $${priceStats.min} - $${priceStats.max}`);
}
console.log(`Total value: $${priceStats.sum}`);
```

**Note:** Non-numeric values are filtered out before calculation.

---

### Context Methods

These methods configure the query execution context.

#### `.withParent(parent: unknown, property?: string | number): this`

Set parent context for nested queries.

**Parameters:**
- `parent` - The parent object containing the data being queried
- `property` - Optional property name or array index in the parent

**Returns:** `this` for chaining

**Example:**
```typescript
const parent = {
  items: [{ id: 1 }, { id: 2 }],
  metadata: { count: 2 }
};

const results = await JSONPath.create(parent.items)
  .withParent(parent, 'items')
  .query('$[*].id')
  .execute();
```

**Use Cases:**
- Maintaining context in nested queries
- Parent chain tracking
- Debugging complex queries

**See also:** [Parent Options Guide](../parent-options.md)

#### `.autostart(value: boolean): this`

Control lazy evaluation behavior.

**Parameters:**
- `value` - `false` to return a query instance instead of executing immediately

**Returns:** `this` for chaining

**Example:**
```typescript
// Create a reusable query instance (preferred method: use .build())
const queryInstance = JSONPath.create(data)
  .query('$.items[*]')
  .autostart(false)
  .build();
```

**Note:** Prefer using `.build()` for creating reusable queries.

#### `.ignoreEvalErrors(value: boolean = true): this`

Enable or disable error suppression for filter expression evaluation.

**Parameters:**
- `value` - Whether to ignore evaluation errors (default: `true`)

**Returns:** `this` for chaining

**Example:**
```typescript
// Safely query potentially missing nested properties
const results = await JSONPath.create(data)
  .query('$[?(@.user.profile.name)]')
  .ignoreEvalErrors(true)
  .execute();

// This won't throw if user or profile is undefined
```

**Use Cases:**
- Querying data with inconsistent structure
- Graceful handling of missing properties
- Defensive programming

**See also:** [Error Handling Guide](../guide/error-handling.md)

---

### Build Method

#### `.build(): JSONPathQuery`

Create a reusable query instance without executing.

**Returns:** [JSONPathQuery](./jsonpath.md#jsonpathquery) instance

**Example:**
```typescript
// Create query once
const priceQuery = JSONPath.create(null)
  .query('$.items[*].price')
  .resultType('value')
  .build();

// Reuse with different data
const prices1 = await priceQuery.evaluate(data1);
const prices2 = await priceQuery.evaluate(data2);
const prices3 = await priceQuery.evaluate(data3);
```

**Use Cases:**
- Creating queries once and reusing them
- Performance optimization
- Query libraries and utilities

**See also:** [JSONPathQuery API](./jsonpath.md#jsonpathquery)

---

## Method Chaining

All non-terminal methods return `this`, enabling fluent method chaining:

```typescript
const result = await JSONPath.create(data)
  // Set query
  .query('$.products[*]')

  // Configure options
  .withOptions({ flatten: true })
  .cached(true)

  // Filter
  .filter(p => p.category === 'electronics')
  .filter(p => p.price < 500)

  // Transform
  .map(p => ({ ...p, displayPrice: `$${p.price}` }))

  // Sort and limit
  .sort((a, b) => b.rating - a.rating)
  .take(10)

  // Execute (terminal)
  .execute();
```

### Execution Order

Transformations are applied in this order:

1. **JSONPath query** (engine-powered)
2. **Filter** (all `.filter()` calls in order)
3. **Map** (`.map()` transformation)
4. **Sort** (`.sort()` comparison)
5. **Skip** (`.skip()` offset)
6. **Take** (`.take()` limit)
7. **Deduplicate** (`.deduplicate()` if called)

---

## Type Safety

The QueryBuilder supports TypeScript generics for type-safe operations:

```typescript
interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  inStock: boolean;
}

// Type the builder
const products = await JSONPath.create<Product>(data)
  .query('$.products[*]')
  .filter(p => p.price < 100)  // p is Product
  .sort((a, b) => a.price - b.price)  // a, b are Product
  .map(p => p.name)  // p is Product, returns string
  .execute();  // string[]

// Type inference through the chain
const result = await JSONPath.create(data)
  .query('$.items[*]')
  .map((item: Item) => item.price)  // Now typed as number
  .filter(price => price > 50)  // price is number
  .execute();  // number[]
```

### Generic Type Parameter

```typescript
class QueryBuilder<T = unknown> {
  // T represents the type of values being queried
}
```

---

## Complete Examples

### Example 1: E-commerce Product Search

```typescript
interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  rating: number;
  inStock: boolean;
  tags: string[];
}

const topAffordableElectronics = await JSONPath.create<Product>(catalog)
  .query('$.products[*]')
  .filter(p => p.category === 'electronics')
  .filter(p => p.price >= 50 && p.price <= 500)
  .filter(p => p.rating >= 4.0)
  .filter(p => p.inStock)
  .sort((a, b) => b.rating - a.rating)
  .take(10)
  .map(p => ({
    name: p.name,
    price: `$${p.price.toFixed(2)}`,
    rating: `${p.rating}/5`
  }))
  .execute();
```

### Example 2: Data Analysis

```typescript
const data = {
  sales: [
    { region: 'North', amount: 1000, month: 'Jan' },
    { region: 'South', amount: 1500, month: 'Jan' },
    // ... more sales
  ]
};

// Group sales by region
const salesByRegion = await JSONPath.create(data)
  .query('$.sales[*]')
  .groupBy(sale => sale.region);

// Calculate stats for each region
for (const [region, sales] of salesByRegion) {
  const total = sales.reduce((sum, sale) => sum + sale.amount, 0);
  console.log(`${region}: $${total}`);
}

// Get top performing month
const topMonth = await JSONPath.create(data)
  .query('$.sales[*]')
  .groupBy(sale => sale.month)
  .then(groups => {
    return Array.from(groups.entries())
      .map(([month, sales]) => ({
        month,
        total: sales.reduce((sum, s) => sum + s.amount, 0)
      }))
      .sort((a, b) => b.total - a.total)[0];
  });
```

### Example 3: Pagination

```typescript
async function getPage(data: unknown, pageNum: number, pageSize: number) {
  return JSONPath.create(data)
    .query('$.items[*]')
    .skip((pageNum - 1) * pageSize)
    .take(pageSize)
    .execute();
}

// Usage
const page1 = await getPage(data, 1, 20);  // Items 1-20
const page2 = await getPage(data, 2, 20);  // Items 21-40
```

### Example 4: Reusable Queries

```typescript
// Define reusable query
const activeUsersQuery = JSONPath.create(null)
  .query('$.users[*]')
  .filter(u => u.active)
  .filter(u => u.emailVerified)
  .sort((a, b) => a.name.localeCompare(b.name))
  .build();

// Use with different datasets
const users1 = await activeUsersQuery.evaluate(dataset1);
const users2 = await activeUsersQuery.evaluate(dataset2);
const users3 = await activeUsersQuery.evaluate(dataset3);
```

### Example 5: Complex Data Transformation

```typescript
interface Order {
  id: string;
  items: Array<{ productId: string; quantity: number; price: number }>;
  customer: { id: string; name: string };
  date: string;
}

// Extract and transform order data
const orderSummary = await JSONPath.create<Order>(data)
  .query('$.orders[*]')
  .filter(order => {
    const total = order.items.reduce((sum, item) =>
      sum + (item.price * item.quantity), 0
    );
    return total > 100;
  })
  .map(order => ({
    orderId: order.id,
    customer: order.customer.name,
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    total: order.items.reduce((sum, item) =>
      sum + (item.price * item.quantity), 0
    ),
    date: new Date(order.date)
  }))
  .sort((a, b) => b.total - a.total)
  .take(100)
  .execute();
```

---

## Best Practices

### 1. Type Your Queries

Always provide type parameters for better IDE support and type safety:

```typescript
// Good
const products = await JSONPath.create<Product>(data)
  .query('$.products[*]')
  .execute();

// Less ideal
const products = await JSONPath.create(data)
  .query('$.products[*]')
  .execute();
```

### 2. Use JSONPath for Structural Selection

Let JSONPath handle structural selection, then use JavaScript for complex logic:

```typescript
// Good: JSONPath for structure, filter for logic
await JSONPath.create(data)
  .query('$.store.products[*]')
  .filter(p => p.price < 100 && p.rating >= 4 && p.inStock)
  .execute();

// Less efficient: complex JSONPath filter
await JSONPath.create(data)
  .query('$.store.products[?(@.price < 100 && @.rating >= 4 && @.inStock)]')
  .execute();
```

### 3. Chain Filters for Readability

Multiple filter calls are easier to read and maintain:

```typescript
// Good
.filter(p => p.category === 'electronics')
.filter(p => p.price < 500)
.filter(p => p.inStock)

// Less readable
.filter(p => p.category === 'electronics' && p.price < 500 && p.inStock)
```

### 4. Use Reusable Queries for Repeated Operations

If you're running the same query multiple times, build it once:

```typescript
// Create once
const query = JSONPath.create(null)
  .query('$.active[*]')
  .filter(item => item.verified)
  .build();

// Reuse many times
const results = await Promise.all(
  datasets.map(data => query.evaluate(data))
);
```

### 5. Consider Caching for Expensive Queries

Enable caching for queries that are executed frequently:

```typescript
await JSONPath.create(data)
  .query('$..expensive.nested.path[*]')
  .cached(true)  // Cache this query
  .execute();
```

### 6. Use Terminal Methods Appropriately

Choose the right terminal method for your use case:

```typescript
// Just need count
const count = await builder.count();  // ✓ Efficient

// Don't do this
const count = (await builder.execute()).length;  // ✗ Wasteful

// Check existence
const exists = await builder.exists();  // ✓ Efficient

// Don't do this
const exists = (await builder.count()) > 0;  // ✗ Less efficient
```

### 7. Handle Errors Gracefully

Use `ignoreEvalErrors` for data with inconsistent structure:

```typescript
await JSONPath.create(data)
  .query('$[?(@.optional.nested.property)]')
  .ignoreEvalErrors(true)  // Won't throw on missing properties
  .execute();
```

### 8. Leverage Aggregation Methods

Use built-in aggregation methods instead of manual implementation:

```typescript
// Good
const groups = await builder.groupBy(item => item.category);

// Less efficient
const results = await builder.execute();
const groups = new Map();
for (const item of results) {
  // manual grouping...
}
```

---

## See Also

- [JSONPath Static Methods](./jsonpath.md) - Core JSONPath API
- [Type Definitions](./types.md) - TypeScript types reference
- [Query Syntax](../guide/syntax.md) - JSONPath syntax guide
- [Advanced Patterns](../guide/advanced-patterns.md) - Advanced usage patterns
- [Performance Guide](../performance.md) - Optimization techniques
