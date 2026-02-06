# Basic Examples

Simple JSONPath queries for common use cases.

## Accessing Properties

### Single Property

```typescript
import { JSONPath } from 'jsonpathx';

const data = {
  name: 'John Doe',
  age: 30,
  email: 'john@example.com'
};

// Access a single property
const name = await JSONPath.query('$.name', data);
console.log(name); // ['John Doe']

// Access multiple properties
const info = await JSONPath.query("$['name','age']", data);
console.log(info); // ['John Doe', 30]
```

### Nested Properties

```typescript
const data = {
  user: {
    profile: {
      name: 'John Doe',
      location: {
        city: 'New York',
        country: 'USA'
      }
    }
  }
};

// Dot notation
const city = await JSONPath.query('$.user.profile.location.city', data);
console.log(city); // ['New York']

// Bracket notation
const country = await JSONPath.query("$['user']['profile']['location']['country']", data);
console.log(country); // ['USA']
```

## Working with Arrays

### Array Access

```typescript
const data = {
  items: [10, 20, 30, 40, 50]
};

// First element
const first = await JSONPath.query('$.items[0]', data);
console.log(first); // [10]

// Last element
const last = await JSONPath.query('$.items[-1]', data);
console.log(last); // [50]

// All elements
const all = await JSONPath.query('$.items[*]', data);
console.log(all); // [10, 20, 30, 40, 50]

// Specific indices
const some = await JSONPath.query('$.items[1,3]', data);
console.log(some); // [20, 40]
```

### Array Slicing

```typescript
const data = {
  numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
};

// First 3
const first3 = await JSONPath.query('$.numbers[0:3]', data);
console.log(first3); // [0, 1, 2]

// Last 3
const last3 = await JSONPath.query('$.numbers[-3:]', data);
console.log(last3); // [7, 8, 9]

// Middle range
const middle = await JSONPath.query('$.numbers[3:7]', data);
console.log(middle); // [3, 4, 5, 6]

// Every 2nd element
const everyOther = await JSONPath.query('$.numbers[::2]', data);
console.log(everyOther); // [0, 2, 4, 6, 8]

// Reverse
const reversed = await JSONPath.query('$.numbers[::-1]', data);
console.log(reversed); // [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
```

## Object Wildcards

```typescript
const data = {
  users: {
    alice: { age: 25, active: true },
    bob: { age: 30, active: false },
    charlie: { age: 35, active: true }
  }
};

// All user objects
const users = await JSONPath.query('$.users.*', data);
console.log(users);
// [
//   { age: 25, active: true },
//   { age: 30, active: false },
//   { age: 35, active: true }
// ]

// All ages
const ages = await JSONPath.query('$.users.*.age', data);
console.log(ages); // [25, 30, 35]
```

## Recursive Descent

Find properties at any depth:

```typescript
const data = {
  company: {
    name: 'Acme Corp',
    departments: [
      {
        name: 'Engineering',
        budget: 1000000,
        teams: [
          { name: 'Backend', budget: 500000 },
          { name: 'Frontend', budget: 400000 }
        ]
      },
      {
        name: 'Sales',
        budget: 500000
      }
    ]
  }
};

// All 'name' properties at any level
const names = await JSONPath.query('$..name', data);
console.log(names);
// ['Acme Corp', 'Engineering', 'Backend', 'Frontend', 'Sales']

// All 'budget' properties
const budgets = await JSONPath.query('$..budget', data);
console.log(budgets);
// [1000000, 500000, 400000, 500000]
```

## Simple Filters

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
console.log(affordable.map(p => p.name));
// ['Mouse', 'Keyboard']

// In-stock products
const available = await JSONPath.query(
  '$.products[?(@.inStock)]',
  data
);
console.log(available.map(p => p.name));
// ['Laptop', 'Mouse', 'Monitor']

// Expensive items
const expensive = await JSONPath.query(
  '$.products[?(@.price > 200)]',
  data
);
console.log(expensive.map(p => p.name));
// ['Laptop', 'Monitor']
```

## Result Types

Get different types of results:

```typescript
const data = {
  store: {
    book: [
      { title: 'Book 1' },
      { title: 'Book 2' }
    ]
  }
};

// Values (default)
const values = await JSONPath.query('$.store.book[*].title', data);
console.log(values);
// ['Book 1', 'Book 2']

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

// Parents
const parents = await JSONPath.query('$.store.book[*].title', data, {
  resultType: 'parent'
});
console.log(parents);
// [{ title: 'Book 1' }, { title: 'Book 2' }]
```

## Using Helper Methods

```typescript
const data = {
  store: {
    book: [
      { title: 'Book 1', price: 8.95 },
      { title: 'Book 2', price: 12.99 },
      { title: 'Book 3', price: 22.99 }
    ]
  }
};

// Get paths
const paths = await JSONPath.paths('$.store.book[*]', data);
console.log(paths);
// ['$.store.book[0]', '$.store.book[1]', '$.store.book[2]']

// Get pointers
const pointers = await JSONPath.pointers('$.store.book[*]', data);
console.log(pointers);
// ['/store/book/0', '/store/book/1', '/store/book/2']

// Get parents
const parents = await JSONPath.parents('$.store.book[*].title', data);
console.log(parents);
// [book1, book2, book3]

// Get parent properties
const props = await JSONPath.parentProperties('$.store.book[*]', data);
console.log(props);
// [0, 1, 2]
```

## Fluent API Basics

```typescript
const data = {
  products: [
    { name: 'Laptop', price: 1200 },
    { name: 'Mouse', price: 25 },
    { name: 'Keyboard', price: 80 }
  ]
};

// Basic fluent query
const result = await JSONPath.create(data)
  .query('$.products[*]')
  .execute();

// With filter
const cheap = await JSONPath.create(data)
  .query('$.products[*]')
  .filter(p => p.price < 100)
  .execute();
console.log(cheap);
// [{ name: 'Mouse', ... }, { name: 'Keyboard', ... }]

// Get first result
const first = await JSONPath.create(data)
  .query('$.products[*]')
  .first();
console.log(first);
// { name: 'Laptop', price: 1200 }

// Count results
const count = await JSONPath.create(data)
  .query('$.products[*]')
  .count();
console.log(count); // 3
```

## Path Utilities

```typescript
// Convert path string to array
const array = JSONPath.toPathArray('$.store.book[0].title');
console.log(array);
// ['$', 'store', 'book', 0, 'title']

// Convert array to path string
const path = JSONPath.toPathString(['$', 'store', 'book', 0, 'title']);
console.log(path);
// "$['store']['book'][0]['title']"

// Convert to JSON Pointer
const pointer = JSONPath.toPointer('$.store.book[0].title');
console.log(pointer);
// "/store/book/0/title"

// Parse JSON Pointer to path string
const fromPtr = JSONPath.fromPointer('/store/book/0/title');
console.log(fromPtr);
// "$['store']['book'][0]['title']"

// Or get array form
const fromPtrArray = JSONPath.fromPointerArray('/store/book/0/title');
console.log(fromPtrArray);
// ['$', 'store', 'book', 0, 'title']

// Validate path
const valid = JSONPath.isValidPath('$.store.book[*]');
console.log(valid); // true

const invalid = JSONPath.isValidPath('$.store..book[*');
console.log(invalid); // false
```

## Common Patterns

### Find Specific Item

```typescript
const data = {
  users: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' }
  ]
};

// Find user by ID
const user = await JSONPath.query('$.users[?(@.id == 2)]', data);
console.log(user); // [{ id: 2, name: 'Bob' }]

// Using fluent API
const userFluent = await JSONPath.create(data)
  .query('$.users[*]')
  .find(u => u.id === 2);
console.log(userFluent); // { id: 2, name: 'Bob' }
```

### Extract Property from All Items

```typescript
const data = {
  products: [
    { id: 1, name: 'Product A', price: 100 },
    { id: 2, name: 'Product B', price: 200 },
    { id: 3, name: 'Product C', price: 300 }
  ]
};

// Get all names
const names = await JSONPath.query('$.products[*].name', data);
console.log(names); // ['Product A', 'Product B', 'Product C']

// Using fluent API
const namesFluent = await JSONPath.create(data)
  .query('$.products[*]')
  .map(p => p.name)
  .execute();
console.log(namesFluent); // ['Product A', 'Product B', 'Product C']
```

### Count Items

```typescript
const data = {
  items: [1, 2, 3, 4, 5]
};

// Count using length
const all = await JSONPath.query('$.items[*]', data);
console.log(all.length); // 5

// Count with fluent API
const count = await JSONPath.create(data)
  .query('$.items[*]')
  .count();
console.log(count); // 5
```

### Check Existence

```typescript
const data = {
  products: [
    { name: 'Laptop', price: 1200 },
    { name: 'Mouse', price: 25 }
  ]
};

// Check if any expensive products exist
const hasExpensive = await JSONPath.create(data)
  .query('$.products[?(@.price > 1000)]')
  .exists();
console.log(hasExpensive); // true

// Check result length
const expensive = await JSONPath.query('$.products[?(@.price > 1000)]', data);
console.log(expensive.length > 0); // true
```

## Next Steps

- [Advanced Examples](/examples/advanced) - Complex queries and transformations
- [Filter Examples](/examples/filters) - More filtering techniques
- [Real-World Examples](/examples/real-world) - Practical use cases
