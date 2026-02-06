# JSONPath Syntax

This guide covers the complete JSONPath syntax supported by jsonpathx.

## Basic Syntax

JSONPath expressions start with `$` (the root) and use operators to navigate through the JSON structure.

```typescript
const data = {
  store: {
    book: [
      { title: 'Book 1', price: 8.95 },
      { title: 'Book 2', price: 12.99 }
    ]
  }
};
```

## Root Selector

`$` - The root element

```typescript
const root = await JSONPath.query('$', data);
// Returns: [{ store: { book: [...] } }]
```

## Child Selectors

### Dot Notation

Access object properties using dot notation:

```typescript
// Single property
await JSONPath.query('$.store', data);
// [{ book: [...] }]

// Nested properties
await JSONPath.query('$.store.book', data);
// [[{ title: 'Book 1', ... }, { title: 'Book 2', ... }]]

// Deep nesting
await JSONPath.query('$.store.book[0].title', data);
// ['Book 1']
```

### Bracket Notation

Access properties using bracket notation:

```typescript
// Single property
await JSONPath.query("$['store']", data);
await JSONPath.query('$["store"]', data);

// Multiple properties (union)
await JSONPath.query("$['store','warehouse']", data);

// Properties with special characters
await JSONPath.query("$['property-with-dash']", data);
await JSONPath.query("$['property with spaces']", data);
await JSONPath.query("$['property.with.dots']", data);
```

## Array Selectors

### Array Index

Access array elements by index:

```typescript
const data = { items: [10, 20, 30, 40, 50] };

// Single index (0-based)
await JSONPath.query('$.items[0]', data);  // [10]
await JSONPath.query('$.items[2]', data);  // [30]

// Negative indices (from end)
await JSONPath.query('$.items[-1]', data); // [50]
await JSONPath.query('$.items[-2]', data); // [40]
```

### Array Slice

Get a range of array elements:

```typescript
const data = { numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] };

// Basic slice [start:end]
await JSONPath.query('$.numbers[0:3]', data);   // [0, 1, 2]
await JSONPath.query('$.numbers[2:5]', data);   // [2, 3, 4]

// Omit start (from beginning)
await JSONPath.query('$.numbers[:3]', data);    // [0, 1, 2]

// Omit end (to end)
await JSONPath.query('$.numbers[5:]', data);    // [5, 6, 7, 8, 9]

// Negative indices
await JSONPath.query('$.numbers[-3:]', data);   // [7, 8, 9]
await JSONPath.query('$.numbers[:-2]', data);   // [0, 1, 2, 3, 4, 5, 6, 7]

// With step [start:end:step]
await JSONPath.query('$.numbers[::2]', data);   // [0, 2, 4, 6, 8] (every 2nd)
await JSONPath.query('$.numbers[1::2]', data);  // [1, 3, 5, 7, 9] (odd numbers)
await JSONPath.query('$.numbers[::-1]', data);  // [9, 8, 7, 6, 5, 4, 3, 2, 1, 0] (reverse)
```

### Array Union

Select multiple specific indices:

```typescript
const data = { items: ['a', 'b', 'c', 'd', 'e'] };

// Multiple indices
await JSONPath.query('$.items[0,2,4]', data);  // ['a', 'c', 'e']
await JSONPath.query('$.items[1,3]', data);    // ['b', 'd']

// Mix positive and negative
await JSONPath.query('$.items[0,-1]', data);   // ['a', 'e']
```

## Wildcard Selectors

### Object Wildcard

`*` - Select all properties of an object:

```typescript
const data = {
  users: {
    alice: { age: 25 },
    bob: { age: 30 },
    charlie: { age: 35 }
  }
};

await JSONPath.query('$.users.*', data);
// [{ age: 25 }, { age: 30 }, { age: 35 }]

await JSONPath.query('$.users.*.age', data);
// [25, 30, 35]
```

### Array Wildcard

`[*]` - Select all elements of an array:

```typescript
const data = {
  items: [
    { name: 'Item 1', value: 10 },
    { name: 'Item 2', value: 20 },
    { name: 'Item 3', value: 30 }
  ]
};

await JSONPath.query('$.items[*]', data);
// [{ name: 'Item 1', ... }, { name: 'Item 2', ... }, { name: 'Item 3', ... }]

await JSONPath.query('$.items[*].name', data);
// ['Item 1', 'Item 2', 'Item 3']
```

## Recursive Descent

`..` - Search for properties at any depth:

```typescript
const data = {
  level1: {
    price: 10,
    level2: {
      price: 20,
      level3: {
        price: 30
      }
    }
  }
};

// Find all 'price' properties at any level
await JSONPath.query('$..price', data);
// [10, 20, 30]

// Recursive descent with other selectors
await JSONPath.query('$..level2.price', data);
// [20]

await JSONPath.query('$..[*].price', data);
// [10, 20, 30]
```

## Filter Expressions

`[?(...)]` - Filter array elements based on conditions:

### Comparison Operators

```typescript
const data = {
  products: [
    { name: 'Laptop', price: 1200 },
    { name: 'Mouse', price: 25 },
    { name: 'Keyboard', price: 80 }
  ]
};

// Equal
await JSONPath.query('$.products[?(@.price == 25)]', data);

// Not equal
await JSONPath.query('$.products[?(@.price != 25)]', data);

// Greater than
await JSONPath.query('$.products[?(@.price > 100)]', data);

// Less than
await JSONPath.query('$.products[?(@.price < 100)]', data);

// Greater or equal
await JSONPath.query('$.products[?(@.price >= 80)]', data);

// Less or equal
await JSONPath.query('$.products[?(@.price <= 80)]', data);
```

### Logical Operators

```typescript
// AND
await JSONPath.query('$.products[?(@.price > 20 && @.price < 100)]', data);

// OR
await JSONPath.query('$.products[?(@.price < 30 || @.price > 1000)]', data);

// NOT
await JSONPath.query('$.products[?(!(@.price > 100))]', data);

// Complex combinations
await JSONPath.query(
  '$.products[?(@.price > 20 && (@.name == "Mouse" || @.name == "Keyboard"))]',
  data
);
```

### Existence Tests

```typescript
const data = {
  items: [
    { name: 'Item 1', optional: 'value' },
    { name: 'Item 2' },
    { name: 'Item 3', optional: null }
  ]
};

// Has property
await JSONPath.query('$.items[?(@.optional)]', data);
// [{ name: 'Item 1', optional: 'value' }]

// Property exists (including null)
await JSONPath.query('$.items[?("optional" in @)]', data);
// Items 1 and 3
```

### Regular Expressions

```typescript
const data = {
  users: [
    { email: 'alice@example.com' },
    { email: 'bob@test.org' },
    { email: 'charlie@example.com' }
  ]
};

// Regex match
await JSONPath.query('$.users[?(@.email =~ /example\\.com$/)]', data);
// [{ email: 'alice@example.com' }, { email: 'charlie@example.com' }]
```

### Current Object Reference

`@` - Refers to the current item being filtered:

```typescript
const data = {
  numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
};

// Even numbers
await JSONPath.query('$.numbers[?(@ % 2 == 0)]', data);
// [2, 4, 6, 8, 10]

// Numbers greater than 5
await JSONPath.query('$.numbers[?(@ > 5)]', data);
// [6, 7, 8, 9, 10]
```

## Script Expressions

`(...)` - Evaluate expressions:

```typescript
const data = {
  products: [
    { price: 100, quantity: 5 },
    { price: 50, quantity: 10 },
    { price: 200, quantity: 2 }
  ]
};

// Calculate total value
await JSONPath.query('$.products[*].(price * quantity)', data);
// [500, 500, 400]
```

## Union Operator

`,` - Combine multiple selections:

```typescript
const data = {
  name: 'John',
  age: 30,
  city: 'New York',
  country: 'USA'
};

// Select multiple properties
await JSONPath.query('$["name","age"]', data);
// ['John', 30]

// Mix different selectors
await JSONPath.query('$["name",age]', data);
// ['John', 30]

// Array union
const arrayData = { items: [10, 20, 30, 40, 50] };
await JSONPath.query('$.items[0,2,4]', data);
// [10, 30, 50]
```

## Parent Selector

`^` - Navigate to the parent of the current element (extension):

```typescript
const data = {
  store: {
    book: [
      { title: 'Book 1', price: 8.95 }
    ]
  }
};

// Get parent of title
await JSONPath.query('$.store.book[0].title^', data);
// [{ title: 'Book 1', price: 8.95 }]

// Multiple levels up
await JSONPath.query('$.store.book[0].title^^', data);
// [[{ title: 'Book 1', price: 8.95 }]]
```

## Type Selectors

Select by JSON type (extension):

```typescript
const data = {
  mixed: [
    'string',
    123,
    true,
    null,
    { key: 'value' },
    [1, 2, 3]
  ]
};

// Select only numbers
await JSONPath.query('$.mixed[@number]', data);
// [123]

// Select only strings
await JSONPath.query('$.mixed[@string]', data);
// ['string']

// Select only objects
await JSONPath.query('$.mixed[@object]', data);
// [{ key: 'value' }]

// Select only arrays
await JSONPath.query('$.mixed[@array]', data);
// [[1, 2, 3]]

// Select only booleans
await JSONPath.query('$.mixed[@boolean]', data);
// [true]

// Select only null
await JSONPath.query('$.mixed[@null]', data);
// [null]
```

## Combining Selectors

You can combine different selectors for powerful queries:

```typescript
const data = {
  departments: [
    {
      name: 'Engineering',
      employees: [
        { name: 'Alice', salary: 100000, active: true },
        { name: 'Bob', salary: 120000, active: false }
      ]
    },
    {
      name: 'Sales',
      employees: [
        { name: 'Charlie', salary: 80000, active: true },
        { name: 'Dave', salary: 90000, active: true }
      ]
    }
  ]
};

// All active employees with salary > 80000
await JSONPath.query(
  '$..employees[?(@.active && @.salary > 80000)].name',
  data
);
// ['Alice', 'Dave']

// First employee in each department
await JSONPath.query('$.departments[*].employees[0].name', data);
// ['Alice', 'Charlie']

// All salaries (any depth)
await JSONPath.query('$..salary', data);
// [100000, 120000, 80000, 90000]
```

## Syntax Cheat Sheet

| Operator | Description | Example |
|----------|-------------|---------|
| `$` | Root element | `$` |
| `.prop` | Child property (dot) | `$.store.book` |
| `['prop']` | Child property (bracket) | `$['store']['book']` |
| `[n]` | Array index | `$.items[0]` |
| `[-n]` | Negative array index | `$.items[-1]` |
| `[start:end]` | Array slice | `$.items[0:3]` |
| `[start:end:step]` | Array slice with step | `$.items[::2]` |
| `[*]` | Array wildcard | `$.items[*]` |
| `.*` | Object wildcard | `$.users.*` |
| `..` | Recursive descent | `$..price` |
| `[?(expr)]` | Filter expression | `$[?(@.price < 10)]` |
| `[i,j,k]` | Union | `$[0,2,4]` |
| `^` | Parent | `$.book[0]^` |
| `@` | Current item | `$[?(@ > 5)]` |
| `@type` | Type selector | `$[@number]` |

## Next Steps

- [Selectors](/guide/selectors) - Deep dive into each selector type
- [Filter Expressions](/guide/filters) - Master filtering
- [Examples](/examples/) - See real-world usage
