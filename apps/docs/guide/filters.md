# Filter Expressions

Filter expressions allow you to select array elements based on conditions. They're one of the most powerful features of JSONPath.

## Basic Syntax

Filters use the `[?(...)]` syntax where `@` represents the current item:

```typescript
const data = {
  products: [
    { name: 'Laptop', price: 1200, inStock: true },
    { name: 'Mouse', price: 25, inStock: true },
    { name: 'Keyboard', price: 80, inStock: false }
  ]
};

// Filter by price
const cheap = await JSONPath.query('$.products[?(@.price < 100)]', data);
// [{ name: 'Mouse', ... }, { name: 'Keyboard', ... }]
```

## Comparison Operators

### Equality

```typescript
// Equal (==)
await JSONPath.query('$.products[?(@.price == 25)]', data);

// Not equal (!=)
await JSONPath.query('$.products[?(@.name != "Mouse")]', data);

// Strict equality
await JSONPath.query('$.items[?(@.value === "text")]', data);
```

### Numeric Comparisons

```typescript
const data = {
  items: [
    { id: 1, value: 10 },
    { id: 2, value: 25 },
    { id: 3, value: 50 },
    { id: 4, value: 100 }
  ]
};

// Greater than
await JSONPath.query('$.items[?(@.value > 25)]', data);
// [{ id: 3, value: 50 }, { id: 4, value: 100 }]

// Less than
await JSONPath.query('$.items[?(@.value < 25)]', data);
// [{ id: 1, value: 10 }]

// Greater or equal
await JSONPath.query('$.items[?(@.value >= 25)]', data);
// [{ id: 2, value: 25 }, { id: 3, value: 50 }, { id: 4, value: 100 }]

// Less or equal
await JSONPath.query('$.items[?(@.value <= 25)]', data);
// [{ id: 1, value: 10 }, { id: 2, value: 25 }]
```

### String Comparisons

```typescript
const data = {
  users: [
    { name: 'Alice', role: 'admin' },
    { name: 'Bob', role: 'user' },
    { name: 'Charlie', role: 'admin' }
  ]
};

// String equality
await JSONPath.query('$.users[?(@.role == "admin")]', data);
// [{ name: 'Alice', ... }, { name: 'Charlie', ... }]

// Case-sensitive comparison
await JSONPath.query('$.users[?(@.name == "alice")]', data);
// [] (no match - case sensitive)
```

## Logical Operators

### AND Operator

Combine conditions with `&&`:

```typescript
const data = {
  products: [
    { name: 'Laptop', price: 1200, category: 'electronics', inStock: true },
    { name: 'Mouse', price: 25, category: 'electronics', inStock: true },
    { name: 'Desk', price: 300, category: 'furniture', inStock: false }
  ]
};

// Multiple conditions
await JSONPath.query(
  '$.products[?(@.category == "electronics" && @.price < 100)]',
  data
);
// [{ name: 'Mouse', ... }]

// Three conditions
await JSONPath.query(
  '$.products[?(@.price > 20 && @.price < 500 && @.inStock)]',
  data
);
// [{ name: 'Mouse', ... }]
```

### OR Operator

Combine alternatives with `||`:

```typescript
// Either condition
await JSONPath.query(
  '$.products[?(@.price < 30 || @.price > 1000)]',
  data
);
// [{ name: 'Laptop', ... }, { name: 'Mouse', ... }]

// Complex OR conditions
await JSONPath.query(
  '$.products[?(@.category == "electronics" || @.category == "furniture")]',
  data
);
// All products
```

### NOT Operator

Negate conditions with `!`:

```typescript
// Not equal (alternative syntax)
await JSONPath.query('$.products[?(!(@.inStock))]', data);
// [{ name: 'Desk', ... }]

// Not in category
await JSONPath.query('$.products[?(!(@.category == "electronics"))]', data);
// [{ name: 'Desk', ... }]
```

### Complex Logic

Combine multiple operators with parentheses:

```typescript
// (A AND B) OR C
await JSONPath.query(
  '$.products[?((@.price < 100 && @.inStock) || @.category == "furniture")]',
  data
);

// A AND (B OR C)
await JSONPath.query(
  '$.products[?(@.inStock && (@.price < 50 || @.price > 1000))]',
  data
);
```

## Existence Tests

### Property Existence

Check if a property exists:

```typescript
const data = {
  items: [
    { name: 'Item 1', optional: 'value' },
    { name: 'Item 2' },
    { name: 'Item 3', optional: null },
    { name: 'Item 4', optional: undefined }
  ]
};

// Has truthy value
await JSONPath.query('$.items[?(@.optional)]', data);
// [{ name: 'Item 1', optional: 'value' }]

// Property exists (including null)
await JSONPath.query('$.items[?("optional" in @)]', data);
// Items 1, 3 (not 4, undefined is not enumerable)

// Property doesn't exist
await JSONPath.query('$.items[?(!("optional" in @))]', data);
// [{ name: 'Item 2' }, { name: 'Item 4', optional: undefined }]
```

### Null and Undefined

```typescript
// Is null
await JSONPath.query('$.items[?(@.optional == null)]', data);

// Is not null
await JSONPath.query('$.items[?(@.optional != null)]', data);

// Has any value (not null/undefined)
await JSONPath.query('$.items[?(@.optional)]', data);
```

## Type Checks

Check value types in filters:

```typescript
const data = {
  mixed: [
    { value: 'string' },
    { value: 123 },
    { value: true },
    { value: null },
    { value: { nested: 'object' } },
    { value: [1, 2, 3] }
  ]
};

// Type checks with typeof
await JSONPath.query('$.mixed[?(typeof @.value == "string")]', data);
// [{ value: 'string' }]

await JSONPath.query('$.mixed[?(typeof @.value == "number")]', data);
// [{ value: 123 }]

await JSONPath.query('$.mixed[?(typeof @.value == "boolean")]', data);
// [{ value: true }]

await JSONPath.query('$.mixed[?(typeof @.value == "object")]', data);
// [{ value: null }, { value: { nested: 'object' } }, { value: [1, 2, 3] }]

// Array check
await JSONPath.query('$.mixed[?(Array.isArray(@.value))]', data);
// [{ value: [1, 2, 3] }]
```

## Array Operations

Filter based on array properties:

```typescript
const data = {
  collections: [
    { name: 'Collection 1', items: [1, 2, 3] },
    { name: 'Collection 2', items: [] },
    { name: 'Collection 3', items: [1, 2, 3, 4, 5] }
  ]
};

// Array length
await JSONPath.query('$.collections[?(@.items.length > 3)]', data);
// [{ name: 'Collection 3', ... }]

// Empty arrays
await JSONPath.query('$.collections[?(@.items.length == 0)]', data);
// [{ name: 'Collection 2', items: [] }]

// Non-empty arrays
await JSONPath.query('$.collections[?(@.items.length > 0)]', data);
// Collections 1 and 3
```

## String Operations

### String Methods

```typescript
const data = {
  users: [
    { name: 'Alice Smith', email: 'alice@example.com' },
    { name: 'Bob Jones', email: 'bob@test.org' },
    { name: 'Charlie Brown', email: 'charlie@example.com' }
  ]
};

// Starts with
await JSONPath.query('$.users[?(@.name.startsWith("A"))]', data);
// [{ name: 'Alice Smith', ... }]

// Ends with
await JSONPath.query('$.users[?(@.email.endsWith("example.com"))]', data);
// [{ name: 'Alice Smith', ... }, { name: 'Charlie Brown', ... }]

// Contains
await JSONPath.query('$.users[?(@.name.includes("Smith"))]', data);
// [{ name: 'Alice Smith', ... }]

// String length
await JSONPath.query('$.users[?(@.name.length > 10)]', data);
// [{ name: 'Alice Smith', ... }, { name: 'Charlie Brown', ... }]
```

### Regular Expressions

```typescript
// Regex match
await JSONPath.query('$.users[?(@.email =~ /^[a-z]+@example\\.com$/)]', data);

// Case-insensitive regex
await JSONPath.query('$.users[?(@.name =~ /smith/i)]', data);

// Complex patterns
await JSONPath.query('$.users[?(@.email =~ /^[a-z]{3,}@/)]', data);
```

## Mathematical Operations

Perform calculations in filters:

```typescript
const data = {
  products: [
    { name: 'Product A', price: 100, discount: 0.1 },
    { name: 'Product B', price: 50, discount: 0.2 },
    { name: 'Product C', price: 200, discount: 0.15 }
  ]
};

// Calculate final price
await JSONPath.query(
  '$.products[?(@.price * (1 - @.discount) < 50)]',
  data
);
// [{ name: 'Product B', ... }] (final price: 40)

// Modulo operation
const numbers = { values: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] };
await JSONPath.query('$.values[?(@ % 3 == 0)]', numbers);
// [3, 6, 9]

// Division
await JSONPath.query('$.products[?(@.price / 100 > 1)]', data);
// [{ name: 'Product A', ... }, { name: 'Product C', ... }]
```

## Nested Property Access

Access nested properties in filters:

```typescript
const data = {
  users: [
    { name: 'Alice', address: { city: 'New York', country: 'USA' } },
    { name: 'Bob', address: { city: 'London', country: 'UK' } },
    { name: 'Charlie', address: { city: 'Paris', country: 'France' } }
  ]
};

// Nested property filter
await JSONPath.query('$.users[?(@.address.country == "USA")]', data);
// [{ name: 'Alice', ... }]

// Multiple nested levels
const deepData = {
  items: [
    { meta: { tags: { primary: 'important' } } },
    { meta: { tags: { primary: 'normal' } } }
  ]
};

await JSONPath.query('$.items[?(@.meta.tags.primary == "important")]', deepData);
```

## Filter with Current Root

Use `$` to reference the root document:

```typescript
const data = {
  threshold: 100,
  items: [
    { value: 50 },
    { value: 150 },
    { value: 75 }
  ]
};

// Compare with root property
await JSONPath.query('$.items[?(@.value > $.threshold)]', data);
// [{ value: 150 }]
```

## Filter Mode

jsonpathx supports two filter modes:

### JSONPath Mode (Default)

Filters select matching items:

```typescript
const data = { items: [1, 2, 3, 4, 5] };

await JSONPath.query('$.items[?(@ > 2)]', data);
// [3, 4, 5]
```

### XPath Mode

Filters apply to the current node. Use `[*]` to filter array items explicitly:

```typescript
await JSONPath.query('$.items[*][?(@ > 2)]', data, {
  filterMode: 'xpath'
});
// [3, 4, 5]
```

## Common Patterns

### Range Filters

```typescript
// Between two values
await JSONPath.query('$.items[?(@.value >= 10 && @.value <= 20)]', data);

// Outside a range
await JSONPath.query('$.items[?(@.value < 10 || @.value > 20)]', data);
```

### Multi-Value Checks

```typescript
// One of several values
await JSONPath.query(
  '$.items[?(@.status == "active" || @.status == "pending" || @.status == "review")]',
  data
);

// None of several values
await JSONPath.query(
  '$.items[?(@.status != "deleted" && @.status != "archived")]',
  data
);
```

### Complex Conditions

```typescript
const data = {
  products: [
    { name: 'A', price: 100, rating: 4.5, reviews: 50 },
    { name: 'B', price: 50, rating: 3.5, reviews: 200 },
    { name: 'C', price: 150, rating: 4.8, reviews: 30 }
  ]
};

// High quality products
await JSONPath.query(
  '$.products[?(@.rating >= 4.5 && @.reviews >= 30)]',
  data
);

// Good value products
await JSONPath.query(
  '$.products[?(@.price < 100 && @.rating > 4.0 || @.reviews > 100)]',
  data
);
```

## Performance Tips

1. **Be specific**: More specific filters are faster
   ```typescript
   // Faster
   '$.products[?(@.category == "electronics")]'

   // Slower
   '$..products[?(@.category == "electronics")]'
   ```

2. **Limit recursion**: Avoid `..` when possible
   ```typescript
   // Faster
   '$.store.products[*]'

   // Slower
   '$..products[*]'
   ```

3. **Use simple comparisons**: Complex expressions are slower
   ```typescript
   // Faster
   '$.items[?(@.price < 100)]'

   // Slower
   '$.items[?(@.price * 0.9 < 90)]'
   ```

4. **Filter early**: Filter before selecting properties
   ```typescript
   // Better
   '$.products[?(@.price < 100)].name'

   // Less efficient
   '$.products[*].name' // then filter in code
   ```

## Error Handling

Filters fail gracefully:

```typescript
const data = {
  items: [
    { value: 10 },
    { value: null },
    { other: 'no value property' }
  ]
};

// Missing properties are treated as undefined
await JSONPath.query('$.items[?(@.value > 5)]', data);
// [{ value: 10 }] - null and undefined are skipped

// Use existence check to be explicit
await JSONPath.query('$.items[?(@.value && @.value > 5)]', data);
```

## Next Steps

- [Type Selectors](/guide/type-selectors) - Filter by JSON type
- [QueryBuilder API](/guide/builder-api) - JavaScript-based filtering
- [Examples](/examples/filters) - More filter examples
