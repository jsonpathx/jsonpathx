# Type Selectors

Learn how to use RFC 9535 type selectors to filter JSON values by their data types. Type selectors provide a powerful way to query based on value types rather than structure.

## Overview

Type selectors allow you to filter elements based on their JavaScript/JSON type. This is particularly useful when working with heterogeneous data or when you need to ensure type safety in your queries.

## Syntax

Type selectors use bracket notation with type names:

```typescript
// Basic syntax
$[type]

// In filters
$.items[?(@.value[type])]

// With paths
$.data[string]
```

## Supported Types

### `[string]` - String Values

Select only string values:

```typescript
const data = {
  items: ['hello', 42, 'world', true, 'test']
};

const result = await JSONPath.query('$.items[string]', data);
// Result: ['hello', 'world', 'test']
```

**Use Cases**:
- Filter text fields
- Validate string inputs
- Extract labels and names

### `[number]` - Numeric Values

Select numeric values (integers and floats):

```typescript
const data = {
  values: [1, '2', 3.14, 'text', 42, null]
};

const result = await JSONPath.query('$.values[number]', data);
// Result: [1, 3.14, 42]
```

**Use Cases**:
- Extract numeric metrics
- Calculate statistics
- Filter prices and quantities

### `[boolean]` - Boolean Values

Select true/false values:

```typescript
const data = {
  flags: [true, 1, false, 'true', null, false]
};

const result = await JSONPath.query('$.flags[boolean]', data);
// Result: [true, false, false]
```

**Use Cases**:
- Extract feature flags
- Filter active/inactive states
- Validate boolean fields

### `[null]` - Null Values

Select null values:

```typescript
const data = {
  items: [1, null, 'text', null, undefined, 0]
};

const result = await JSONPath.query('$.items[null]', data);
// Result: [null, null]
```

**Note**: `undefined` is not selected as it's not a valid JSON value.

**Use Cases**:
- Detect missing data
- Find unset fields
- Data validation

### `[array]` - Array Values

Select array values:

```typescript
const data = {
  mixed: [
    [1, 2, 3],
    'string',
    { key: 'value' },
    [4, 5],
    42
  ]
};

const result = await JSONPath.query('$.mixed[array]', data);
// Result: [[1, 2, 3], [4, 5]]
```

**Use Cases**:
- Extract nested arrays
- Filter collection fields
- Find list properties

### `[object]` - Object Values

Select object values (excluding arrays and null):

```typescript
const data = {
  items: [
    { id: 1, name: 'A' },
    'string',
    [1, 2, 3],
    { id: 2, name: 'B' },
    null
  ]
};

const result = await JSONPath.query('$.items[object]', data);
// Result: [{ id: 1, name: 'A' }, { id: 2, name: 'B' }]
```

**Use Cases**:
- Extract nested objects
- Filter by structure
- Find complex types

## Using Type Selectors in Filters

Combine type selectors with filter expressions:

### Check Property Type

```typescript
const data = {
  items: [
    { id: 1, value: 'text' },
    { id: 2, value: 42 },
    { id: 3, value: true }
  ]
};

// Get items with numeric values
const result = await JSONPath.query(
  '$.items[?(@.value[number])]',
  data
);
// Result: [{ id: 2, value: 42 }]
```

### Multiple Type Checks

```typescript
// Items with string OR number values
const result = await JSONPath.query(
  '$.items[?(@.value[string] || @.value[number])]',
  data
);
```

### Nested Type Checks

```typescript
const data = {
  users: [
    { name: 'Alice', metadata: { age: 30 } },
    { name: 'Bob', metadata: [1, 2, 3] },
    { name: 'Charlie', metadata: 'text' }
  ]
};

// Users with object metadata
const result = await JSONPath.query(
  '$.users[?(@.metadata[object])]',
  data
);
// Result: [{ name: 'Alice', metadata: { age: 30 } }]
```

## Practical Examples

### Data Validation

```typescript
// Validate that all prices are numbers
const data = {
  products: [
    { name: 'A', price: 10.99 },
    { name: 'B', price: '15.99' },  // Invalid: string
    { name: 'C', price: 20 }
  ]
};

const validProducts = await JSONPath.query(
  '$.products[?(@.price[number])]',
  data
);
// Result: Products A and C (valid prices)

const invalidProducts = await JSONPath.query(
  '$.products[?(!@.price[number])]',
  data
);
// Result: Product B (invalid price)
```

### Extract by Type

```typescript
// Extract all numeric values from mixed data
const data = {
  stats: {
    count: 100,
    label: 'Total',
    ratio: 0.85,
    active: true,
    items: [1, 2, 3]
  }
};

const numbers = await JSONPath.query('$.stats.*[number]', data);
// Result: [100, 0.85]
```

### Type-Safe Aggregations

```typescript
// Sum only numeric values
const data = {
  values: [10, '20', 30, null, 40, 'text']
};

const numbers = await JSONPath.query('$.values[number]', data);
const sum = numbers.reduce((a, b) => a + b, 0);
// Result: 80
```

## Type Selectors vs Filters

### Type Selector Approach

```typescript
// Direct type selection
const result = await JSONPath.query('$.items[number]', data);
```

### Filter Approach

```typescript
// Equivalent using filter
const result = await JSONPath.query(
  '$.items[?(@[number])]',
  data
);
```

**Recommendation**: Use type selectors directly when filtering by type is the primary goal. They're more concise and expressive.

## Combining Multiple Types

### Union of Types

```typescript
// Get strings or numbers
const data = { values: [1, 'text', true, 42, 'hello', null] };

const stringOrNumber = await JSONPath.query(
  '$.values[?(@ [string] || @[number])]',
  data
);
// Result: [1, 'text', 42, 'hello']
```

### Excluding Types

```typescript
// Get everything except strings
const result = await JSONPath.query(
  '$.values[?(!@[string])]',
  data
);
// Result: [1, true, 42, null]
```

## Type Coercion Considerations

Type selectors check JavaScript types, not JSON representations:

```typescript
const data = {
  values: [
    1,          // number
    '1',        // string (not selected as number)
    true,       // boolean (not coerced to 1)
    null        // null
  ]
};

const numbers = await JSONPath.query('$.values[number]', data);
// Result: [1] (only actual numbers)
```

## RFC 9535 Compliance

Type selectors are part of RFC 9535 (JSONPath standard). jsonpathx implements all required type selectors:

- ✅ `[string]` - String type
- ✅ `[number]` - Number type
- ✅ `[boolean]` - Boolean type
- ✅ `[null]` - Null type
- ✅ `[array]` - Array type
- ✅ `[object]` - Object type

## Performance Tips

### 1. Use Early Filtering

```typescript
// ❌ Slower: Select all then filter in JS
const all = await JSONPath.query('$.items[*]', data);
const numbers = all.filter(x => typeof x === 'number');

// ✅ Faster: Filter in JSONPath
const numbers = await JSONPath.query('$.items[number]', data);
```

### 2. Combine with Other Selectors

```typescript
// Efficient: Type check + value filter
const result = await JSONPath.query(
  '$.items[?(@.value[number] && @.value > 100)]',
  data
);
```

## Common Patterns

### Validate Data Structure

```typescript
// Ensure all users have object metadata
const data = {
  users: [
    { name: 'Alice', meta: { age: 30 } },
    { name: 'Bob', meta: 'invalid' }
  ]
};

const valid = await JSONPath.query(
  '$.users[?(@.meta[object])]',
  data
);
```

### Extract Typed Fields

```typescript
// Get all numeric metrics from mixed data
const metrics = await JSONPath.query(
  '$..metrics.*[number]',
  complexData
);
```

### Type-Based Routing

```typescript
// Process different types differently
const data = { items: [1, 'text', true, { key: 'val' }] };

const numbers = await JSONPath.query('$.items[number]', data);
const strings = await JSONPath.query('$.items[string]', data);
const objects = await JSONPath.query('$.items[object]', data);

// Process each type appropriately
```

## Error Handling

Type selectors don't throw errors for missing types:

```typescript
// No strings in array - returns empty array
const result = await JSONPath.query('$.numbers[string]', {
  numbers: [1, 2, 3]
});
// Result: []
```

## See Also

- [Selectors Guide](./selectors.md) - All selector types
- [Filter Expressions](./filters.md) - Advanced filtering
- [RFC 9535 Compliance](../rfc9535-compliance.md) - Standard compliance
- [Type Reference](../api/types.md) - TypeScript types
