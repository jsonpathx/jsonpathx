# Selectors

Complete reference for all JSONPath selector types supported by jsonpathx.

## Overview

Selectors are the building blocks of JSONPath expressions. They specify which parts of the JSON data to select.

## Root Selector

`$` - The root of the JSON document

```typescript
const data = { name: 'John', age: 30 };

await JSONPath.query('$', data);
// [{ name: 'John', age: 30 }]
```

The root selector is always required as the starting point of a JSONPath expression.

## Child Selectors

### Dot Notation

Access properties using dot notation:

```typescript
const data = {
  store: {
    name: 'Bookstore',
    location: 'Downtown'
  }
};

await JSONPath.query('$.store.name', data);
// ['Bookstore']
```

**Rules:**
- Property names must start with a letter or underscore
- Can contain letters, numbers, and underscores
- No spaces or special characters

### Bracket Notation

Access properties using brackets:

```typescript
await JSONPath.query("$['store']['name']", data);
// ['Bookstore']

// Properties with special characters
const data2 = { 'property-name': 'value' };
await JSONPath.query("$['property-name']", data2);
// ['value']
```

**When to use bracket notation:**
- Property names with spaces or special characters
- Property names starting with numbers
- Dynamic property access
- Union selection

## Array Selectors

### Index Selector

Access array elements by index:

```typescript
const data = { items: [10, 20, 30, 40, 50] };

// Positive index (0-based)
await JSONPath.query('$.items[0]', data);  // [10]
await JSONPath.query('$.items[2]', data);  // [30]

// Negative index (from end)
await JSONPath.query('$.items[-1]', data); // [50]
await JSONPath.query('$.items[-2]', data); // [40]
```

### Array Slice

Select a range of array elements:

```typescript
const data = { numbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9] };

// [start:end] - Elements from start to end (exclusive)
await JSONPath.query('$.numbers[2:5]', data);
// [2, 3, 4]

// [:end] - From beginning to end
await JSONPath.query('$.numbers[:3]', data);
// [0, 1, 2]

// [start:] - From start to end
await JSONPath.query('$.numbers[7:]', data);
// [7, 8, 9]

// Negative indices
await JSONPath.query('$.numbers[-3:-1]', data);
// [7, 8]

// [start:end:step] - With step
await JSONPath.query('$.numbers[0:9:2]', data);
// [0, 2, 4, 6, 8]

// Reverse with negative step
await JSONPath.query('$.numbers[::-1]', data);
// [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
```

**Slice notation:**
- `[start:end]` - From start (inclusive) to end (exclusive)
- `[start:end:step]` - With step value
- Omit start: begin from 0
- Omit end: go to array end
- Negative indices: count from end
- Negative step: reverse direction

## Wildcard Selectors

### Array Wildcard

`[*]` - Select all array elements

```typescript
const data = {
  scores: [85, 92, 78, 95, 88]
};

await JSONPath.query('$.scores[*]', data);
// [85, 92, 78, 95, 88]
```

### Object Wildcard

`.*` - Select all object properties

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

## Recursive Descent

`..` - Search for descendants at any depth

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
  },
  other: {
    price: 40
  }
};

await JSONPath.query('$..price', data);
// [10, 20, 30, 40]
```

**Use cases:**
- Find all occurrences of a property
- Search nested structures
- Extract values from unknown depths

**Performance note:** Recursive descent can be slow on large documents. Use specific paths when possible.

## Union Operator

`,` - Combine multiple selections

### Property Union

```typescript
const data = {
  name: 'John',
  age: 30,
  city: 'New York',
  country: 'USA'
};

await JSONPath.query("$['name','age','city']", data);
// ['John', 30, 'New York']
```

### Index Union

```typescript
const data = { items: ['a', 'b', 'c', 'd', 'e'] };

await JSONPath.query('$.items[0,2,4]', data);
// ['a', 'c', 'e']
```

### Mixed Union

```typescript
const data = {
  products: [
    { id: 1, name: 'A' },
    { id: 2, name: 'B' },
    { id: 3, name: 'C' }
  ]
};

await JSONPath.query("$.products[0,2]['name','id']", data);
// Combines index and property selection
```

## Filter Selector

`[?(...)]` - Filter elements by condition

```typescript
const data = {
  products: [
    { name: 'Laptop', price: 1200 },
    { name: 'Mouse', price: 25 },
    { name: 'Keyboard', price: 80 }
  ]
};

// Simple filter
await JSONPath.query('$.products[?(@.price < 100)]', data);
// [{ name: 'Mouse', ... }, { name: 'Keyboard', ... }]

// Complex filter
await JSONPath.query('$.products[?(@.price > 50 && @.name != "Laptop")]', data);
// [{ name: 'Keyboard', price: 80 }]
```

See [Filter Expressions](/guide/filters) for detailed filter syntax.

## Script Expression

`(...)` - Evaluate expression and use result

```typescript
const data = {
  products: [
    { price: 100, quantity: 5 },
    { price: 50, quantity: 10 }
  ]
};

// Calculate total
await JSONPath.query('$.products[*].(price * quantity)', data);
// [500, 500]
```

## Parent Selector

`^` - Navigate to parent (jsonpathx extension)

```typescript
const data = {
  store: {
    book: [
      { title: 'Book 1', price: 8.95 }
    ]
  }
};

// Get parent of title (the book object)
await JSONPath.query('$.store.book[0].title^', data);
// [{ title: 'Book 1', price: 8.95 }]

// Multiple levels up
await JSONPath.query('$.store.book[0].title^^', data);
// [[{ title: 'Book 1', price: 8.95 }]] (the array)
```

## Type Selectors

`[@type]` - Select by JSON type (jsonpathx extension)

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

**Available types:**
- `@number` - Numbers
- `@string` - Strings
- `@boolean` - Booleans
- `@null` - Null values
- `@object` - Objects (not arrays)
- `@array` - Arrays

## Combining Selectors

Selectors can be combined for powerful queries:

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
        { name: 'Charlie', salary: 80000, active: true }
      ]
    }
  ]
};

// Combine recursive descent, wildcard, and filter
await JSONPath.query(
  '$..employees[*][?(@.active && @.salary > 80000)].name',
  data
);
// ['Alice']

// Combine multiple selector types
await JSONPath.query(
  "$.departments[0,1].employees[0:2]['name','salary']",
  data
);
// Multiple departments, first 2 employees, specific fields
```

## Selector Precedence

When combining selectors, they are evaluated in this order:

1. Root selector (`$`)
2. Child selector (`.property` or `['property']`)
3. Recursive descent (`..`)
4. Wildcard (`*` or `[*]`)
5. Array operations (`[n]`, `[n:m]`, `[n,m]`)
6. Filter (`[?(...)]`)
7. Script expression (`(...)`)
8. Parent (`^`)

## Best Practices

### Be Specific

More specific selectors are faster:

```typescript
// Good
'$.store.books[0].title'

// Slower
'$..title'
```

### Use Bracket Notation for Special Characters

```typescript
// Required for special characters
"$['property-with-dash']"
"$['property.with.dots']"
"$['property with spaces']"
```

### Combine Filters Efficiently

```typescript
// Better - single filter
'$.items[?(@.price < 100 && @.inStock)]'

// Less efficient - multiple selections
'$.items[?(@.price < 100)][?(@.inStock)]'
```

### Avoid Deep Recursion

```typescript
// Preferred
'$.store.products[*].price'

// Avoid if possible
'$..price'
```

## Selector Summary

| Selector | Type | Example | Description |
|----------|------|---------|-------------|
| `$` | Root | `$` | Root element |
| `.prop` | Child | `$.store` | Property access (dot) |
| `['prop']` | Child | `$['store']` | Property access (bracket) |
| `[n]` | Index | `$[0]` | Array index |
| `[-n]` | Index | `$[-1]` | Negative index |
| `[start:end]` | Slice | `$[0:3]` | Array slice |
| `[*]` | Wildcard | `$[*]` | All array elements |
| `.*` | Wildcard | `$.*` | All object properties |
| `..` | Recursive | `$..price` | Descendant search |
| `[i,j,k]` | Union | `$[0,2,4]` | Multiple selections |
| `[?(...)]` | Filter | `$[?(@.x > 5)]` | Filter expression |
| `(...)` | Script | `$.(x * 2)` | Script expression |
| `^` | Parent | `$.x^` | Parent navigation |
| `[@type]` | Type | `$[@number]` | Type selector |

## Next Steps

- [Filter Expressions](/guide/filters) - Learn filtering in detail
- [Type Selectors](/guide/type-selectors) - Master type selection
- [Examples](/examples/) - See selectors in action
