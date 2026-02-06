# Quick Start

This tutorial will guide you through the basics of using jsonpathx. By the end, you'll be able to query JSON data with confidence.

## Your First Query

Let's start with a simple example:

```typescript
import { JSONPath } from 'jsonpathx';

const data = {
  name: 'John Doe',
  age: 30,
  city: 'New York'
};

// Query a single property
const name = await JSONPath.query('$.name', data);
console.log(name); // ['John Doe']
```

Notice that:
- Queries are async and return a Promise
- Results are always returned as an array
- The `$` represents the root of the JSON document

## Working with Arrays

JSONPath excels at working with arrays:

```typescript
const data = {
  users: [
    { name: 'Alice', age: 25 },
    { name: 'Bob', age: 30 },
    { name: 'Charlie', age: 35 }
  ]
};

// Get all users
const users = await JSONPath.query('$.users[*]', data);
console.log(users); // [{ name: 'Alice', age: 25 }, ...]

// Get specific user
const firstUser = await JSONPath.query('$.users[0]', data);
console.log(firstUser); // [{ name: 'Alice', age: 25 }]

// Get all names
const names = await JSONPath.query('$.users[*].name', data);
console.log(names); // ['Alice', 'Bob', 'Charlie']

// Get multiple indices
const someUsers = await JSONPath.query('$.users[0,2]', data);
console.log(someUsers); // [{ name: 'Alice', ... }, { name: 'Charlie', ... }]
```

## Array Slicing

Use array slice notation to get ranges:

```typescript
const data = {
  numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
};

// First 3 items
const first3 = await JSONPath.query('$.numbers[0:3]', data);
console.log(first3); // [0, 1, 2]

// Last 3 items
const last3 = await JSONPath.query('$.numbers[-3:]', data);
console.log(last3); // [7, 8, 9]

// Every other item
const everyOther = await JSONPath.query('$.numbers[::2]', data);
console.log(everyOther); // [0, 2, 4, 6, 8]
```

## Filtering Data

Filter expressions let you select items based on conditions:

```typescript
const data = {
  products: [
    { name: 'Laptop', price: 1200, inStock: true },
    { name: 'Mouse', price: 25, inStock: true },
    { name: 'Keyboard', price: 80, inStock: false },
    { name: 'Monitor', price: 300, inStock: true }
  ]
};

// Products under $100
const affordable = await JSONPath.query(
  '$.products[?(@.price < 100)]',
  data
);
console.log(affordable); // [{ name: 'Mouse', ... }, { name: 'Keyboard', ... }]

// In-stock products
const available = await JSONPath.query(
  '$.products[?(@.inStock == true)]',
  data
);
console.log(available); // 3 products

// In-stock AND affordable
const deals = await JSONPath.query(
  '$.products[?(@.price < 100 && @.inStock)]',
  data
);
console.log(deals); // [{ name: 'Mouse', ... }]
```

## Recursive Descent

Use `..` to search at any depth:

```typescript
const data = {
  company: {
    departments: [
      {
        name: 'Engineering',
        employees: [
          { name: 'Alice', salary: 100000 },
          { name: 'Bob', salary: 120000 }
        ]
      },
      {
        name: 'Sales',
        employees: [
          { name: 'Charlie', salary: 80000 }
        ]
      }
    ]
  }
};

// Get all employee names at any level
const names = await JSONPath.query('$..employees[*].name', data);
console.log(names); // ['Alice', 'Bob', 'Charlie']

// Get all salary values anywhere in the document
const salaries = await JSONPath.query('$..salary', data);
console.log(salaries); // [100000, 120000, 80000]
```

## Using the Fluent API

For complex queries, use the QueryBuilder:

```typescript
import { JSONPath } from 'jsonpathx';

const data = {
  products: [
    { name: 'Laptop', price: 1200, category: 'electronics', rating: 4.5 },
    { name: 'Mouse', price: 25, category: 'electronics', rating: 4.0 },
    { name: 'Desk', price: 300, category: 'furniture', rating: 4.8 },
    { name: 'Chair', price: 200, category: 'furniture', rating: 4.6 }
  ]
};

// Find top-rated affordable electronics
const result = await JSONPath.create(data)
  .query('$.products[*]')
  .filter(p => p.category === 'electronics')
  .filter(p => p.price < 100)
  .sort((a, b) => b.rating - a.rating)
  .map(p => ({ name: p.name, price: p.price }))
  .execute();

console.log(result);
// [{ name: 'Mouse', price: 25 }]
```

The fluent API offers powerful chainable methods:

```typescript
const builder = JSONPath.create(data);

// Chaining methods
const result = await builder
  .query('$.products[*]')
  .filter(p => p.price > 100)      // Filter results
  .sort((a, b) => a.price - b.price) // Sort by price
  .take(5)                          // Take first 5
  .map(p => p.name)                 // Extract names
  .execute();

// Helper methods
const first = await builder.query('$.products[*]').first();
const last = await builder.query('$.products[*]').last();
const count = await builder.query('$.products[*]').count();
const exists = await builder.query('$.products[?(@.price > 1000)]').exists();
```

## Result Types

jsonpathx can return different types of results:

```typescript
const data = {
  store: {
    book: [
      { title: 'Book 1', price: 8.95 },
      { title: 'Book 2', price: 12.99 }
    ]
  }
};

// Values (default)
const values = await JSONPath.query('$.store.book[*].title', data);
console.log(values); // ['Book 1', 'Book 2']

// Paths
const paths = await JSONPath.query('$.store.book[*].title', data, {
  resultType: 'path'
});
console.log(paths);
// ['$.store.book[0].title', '$.store.book[1].title']

// JSON Pointers
const pointers = await JSONPath.query('$.store.book[*].title', data, {
  resultType: 'pointer'
});
console.log(pointers);
// ['/store/book/0/title', '/store/book/1/title']

// Parent objects
const parents = await JSONPath.query('$.store.book[*].title', data, {
  resultType: 'parent'
});
console.log(parents);
// [{ title: 'Book 1', price: 8.95 }, { title: 'Book 2', price: 12.99 }]
```

## Enabling Caching

For repeated queries, enable caching for better performance:

```typescript
// Enable caching globally
JSONPath.enableCache({ maxSize: 100, ttl: 60000 });

// Now queries are cached
const result1 = await JSONPath.query('$.items[*]', data); // Cache miss
const result2 = await JSONPath.query('$.items[*]', data); // Cache hit (faster)

// Check cache stats
const stats = JSONPath.getCacheStats();
console.log(stats); // { hits: 1, misses: 1, size: 1 }

// Clear cache
JSONPath.clearCache();

// Disable caching
JSONPath.disableCache();
```

Or enable caching per-query:

```typescript
const result = await JSONPath.query('$.items[*]', data, {
  enableCache: true
});
```

## Path Utilities

jsonpathx includes utilities for working with paths:

```typescript
import { JSONPath } from 'jsonpathx';

// Convert path string to array
const array = JSONPath.toPathArray('$.store.book[0].title');
console.log(array); // ['$', 'store', 'book', 0, 'title']

// Convert array to path string
const path = JSONPath.toPathString(['$', 'store', 'book', 0, 'title']);
console.log(path); // "$['store']['book'][0]['title']"

// Convert to JSON Pointer
const pointer = JSONPath.toPointer('$.store.book[0].title');
console.log(pointer); // "/store/book/0/title"

// Parse JSON Pointer to path string
const fromPointer = JSONPath.fromPointer('/store/book/0/title');
console.log(fromPointer); // "$['store']['book'][0]['title']"

// Or get the array form
const fromPointerArray = JSONPath.fromPointerArray('/store/book/0/title');
console.log(fromPointerArray); // ['$', 'store', 'book', 0, 'title']

// Validate path
const isValid = JSONPath.isValidPath('$.store.book[*]');
console.log(isValid); // true
```

## Error Handling

Always handle errors in production:

```typescript
try {
  const result = await JSONPath.query('$.invalid..syntax', data);
  console.log(result);
} catch (error) {
  console.error('Query failed:', error.message);
  // Handle error appropriately
}
```

## Next Steps

Now that you understand the basics:

1. **[JSONPath Syntax](/guide/syntax)** - Learn all selector types
2. **[Filter Expressions](/guide/filters)** - Master filtering
3. **[QueryBuilder API](/guide/builder-api)** - Explore advanced features
4. **[Examples](/examples/)** - See real-world use cases

## Common Patterns

Here are some patterns you'll use frequently:

```typescript
// Get all values at a specific depth
const level2 = await JSONPath.query('$.*.*', data);

// Find items matching multiple conditions
const matches = await JSONPath.query(
  '$.items[?(@.price < 100 && @.rating > 4)]',
  data
);

// Get unique values
const unique = await JSONPath.create(data)
  .query('$..category')
  .deduplicate()
  .execute();

// Calculate statistics
const stats = await JSONPath.create(data)
  .query('$..price')
  .stats();
console.log(stats); // { count, sum, mean, min, max }

// Group by property
const groups = await JSONPath.create(data)
  .query('$.products[*]')
  .groupBy(p => p.category);
console.log(groups); // Map { 'electronics' => [...], 'furniture' => [...] }
```
