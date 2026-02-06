# Grouping Syntax - Select Multiple Properties

## Overview

The grouping syntax allows you to select multiple properties at the same level using parentheses and commas. This provides a more concise and efficient way to select multiple properties from the same parent object compared to using the union operator.

## Syntax

```
$.path.(property1, property2, property3)
```

The grouping syntax:
- Uses parentheses `()` to enclose property names
- Separates properties with commas `,`
- Can use quoted strings for property names with special characters
- Preserves the order of properties as specified

## Basic Usage

### Select Multiple Properties from an Object

```typescript
const data = {
  store: {
    book: [...],
    bicycle: [...],
    magazine: [...]
  }
};

const result = await JSONPath.query(
  '$.store.(book, bicycle, magazine)',
  data
);
// Returns: [books_array, bicycles_array, magazines_array]
```

### At Root Level

```typescript
const data = {
  users: [...],
  posts: [...],
  comments: [...]
};

const result = await JSONPath.query(
  '$.(users, posts, comments)',
  data
);
// Returns: [users_array, posts_array, comments_array]
```

### Order Preservation

The grouping syntax preserves the order in which properties are specified:

```typescript
const result = await JSONPath.query(
  '$.store.(magazine, bicycle, book)',
  data
);
// Returns properties in the specified order: magazine, bicycle, book
```

## Advanced Usage

### With Array Operations

#### Wildcard Array Selection

```typescript
const data = {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com' },
    { id: 2, name: 'Bob', email: 'bob@example.com' }
  ]
};

// Get multiple properties from each array element
const result = await JSONPath.query(
  '$.users[*].(name, email)',
  data
);
// Returns: ['Alice', 'alice@example.com', 'Bob', 'bob@example.com']
```

#### Array Index Selection

```typescript
// Get properties from a specific array element
const result = await JSONPath.query(
  '$.users[0].(name, email)',
  data
);
// Returns: ['Alice', 'alice@example.com']
```

#### Array Slice Selection

```typescript
// Get properties from sliced array elements
const result = await JSONPath.query(
  '$.items[0:2].(name, price)',
  data
);
// Returns: name and price for items at indices 0 and 1
```

### With Filters

#### Basic Filter

```typescript
const data = {
  store: {
    book: [
      { title: 'Book 1', author: 'Author 1', price: 10 },
      { title: 'Book 2', author: 'Author 2', price: 20 }
    ]
  }
};

const result = await JSONPath.query(
  '$.store.book[?(@.price < 15)].(title, author)',
  data
);
// Returns: ['Book 1', 'Author 1']
```

#### Complex Filter Conditions

```typescript
const result = await JSONPath.query(
  '$.store.book[?(@.price > 5 && @.price < 15)].(title, price)',
  data
);
// Returns: properties from books matching the filter
```

### With Recursive Descent

```typescript
const data = {
  store: {
    book: [
      { title: 'Book 1', brand: 'Publisher 1' },
      { title: 'Book 2', brand: 'Publisher 2' }
    ],
    bicycle: [
      { title: 'Bike 1', brand: 'Trek' }
    ]
  }
};

const result = await JSONPath.query(
  '$.store..(title, brand)',
  data
);
// Returns: all title and brand values found recursively
```

### Nested Grouping

```typescript
const data = {
  a: { x: 1, y: 2 },
  b: { x: 3, y: 4 }
};

const result = await JSONPath.query(
  '$.(a, b).(x, y)',
  data
);
// First grouping gets a and b objects
// Second grouping gets x and y from each
// Returns: [1, 2, 3, 4]
```

## Special Features

### Quoted Property Names

For properties with special characters or spaces:

```typescript
const data = {
  'first-name': 'John',
  'last-name': 'Doe',
  'age': 30
};

const result = await JSONPath.query(
  '$.("first-name", "last-name")',
  data
);
// Returns: ['John', 'Doe']
```

### Missing Properties

The grouping syntax gracefully handles missing properties by skipping them:

```typescript
const result = await JSONPath.query(
  '$.store.(book, nonexistent, bicycle)',
  data
);
// Returns only book and bicycle, skipping nonexistent
// No error is thrown
```

### Non-Object Values

When used on non-object values, grouping returns empty results:

```typescript
const data = { items: [1, 2, 3] };

const result = await JSONPath.query(
  '$.items[*].(name, value)',
  data
);
// Returns: [] (numbers don't have properties)
```

### Mixed Arrays

In arrays with mixed types, grouping only extracts from objects:

```typescript
const data = {
  items: [
    { name: 'Item 1', value: 10 },
    'string value',
    { name: 'Item 2', value: 20 },
    42
  ]
};

const result = await JSONPath.query(
  '$.items[*].(name, value)',
  data
);
// Returns: ['Item 1', 10, 'Item 2', 20]
// Skips string and number values
```

## Comparison with Union Operator

### Grouping (More Efficient)

```typescript
$.store.(book, bicycle)
// Evaluates $.store once, then selects both properties
```

### Union (More Flexible)

```typescript
$.store.book | $.store.bicycle
// Evaluates two separate paths
```

### When to Use Grouping

Use grouping when:
- Selecting multiple properties from the same parent object
- You want better performance (single parent evaluation)
- Properties are at the same level
- You want more concise syntax

### When to Use Union

Use union when:
- Paths are completely different (e.g., `$.users | $.posts`)
- Need different filters per path (e.g., `$.items[?(@.active)] | $.archived[?(@.recent)]`)
- Paths have different depths
- Combining results from different parts of the document

### Equivalence Example

These two queries produce the same results:

```typescript
// With grouping
const result1 = await JSONPath.query(
  '$.store.(book, bicycle, magazine)',
  data
);

// With union
const result2 = await JSONPath.query(
  '$.store.book | $.store.bicycle | $.store.magazine',
  data
);

// result1 === result2
```

## Integration with Other Features

### With Result Types

#### Get Paths

```typescript
const result = await JSONPath.query(
  '$.store.(book, bicycle)',
  data,
  { resultType: 'path' }
);
// Returns: ['$.store.book', '$.store.bicycle']
```

#### Get Pointers

```typescript
const result = await JSONPath.query(
  '$.store.(book, bicycle)',
  data,
  { resultType: 'pointer' }
);
// Returns: ['/store/book', '/store/bicycle']
```

#### Get All Metadata

```typescript
const result = await JSONPath.query(
  '$.store.(book, bicycle)',
  data,
  { resultType: 'all' }
);
// Returns object with values, paths, pointers, parents, parentProperties
```

### With Flatten Option

```typescript
const result = await JSONPath.query(
  '$.users[*].(name, email)',
  data,
  { flatten: true }
);
// Returns flattened array of all names and emails
```

### With Callbacks

```typescript
await JSONPath.query(
  '$.store.(book, bicycle)',
  data,
  {
    callback: (value, type, payload) => {
      console.log('Path:', payload.path);
      console.log('Value:', value);
    }
  }
);
// Callback invoked for each selected property
```

### With Parent Selector

```typescript
const result = await JSONPath.query(
  '$.store.book[0].(title, author)^',
  data
);
// Selects title and author, then gets parent for each
// Returns: [book_object, book_object]
```

## Performance Characteristics

### Efficiency

Grouping is more efficient than union for same-parent selections:

```typescript
// Efficient - evaluates parent once
$.store.(book, bicycle, magazine)

// Less efficient - evaluates parent three times
$.store.book | $.store.bicycle | $.store.magazine
```

### Large Property Groups

The implementation handles large property groups efficiently:

```typescript
// Efficiently handles 100 properties
$.obj.(prop0, prop1, prop2, ..., prop99)
```

## Error Handling

### Empty Group

```typescript
// Throws error
$.store.()
// Error: Property group cannot be empty
```

### Unclosed Group

```typescript
// Throws error
$.store.(book, bicycle
// Error: Expected ')' in property group
```

### Invalid Syntax

```typescript
// Throws error
$.store.(book bicycle)
// Error: Expected ',' or ')' in property group
```

## Examples Collection

### Example 1: E-commerce Product Data

```typescript
const products = {
  electronics: {
    laptop: { price: 999, brand: 'Dell' },
    phone: { price: 699, brand: 'Apple' },
    tablet: { price: 499, brand: 'Samsung' }
  }
};

// Get all product objects
const result = await JSONPath.query(
  '$.electronics.(laptop, phone, tablet)',
  products
);
```

### Example 2: User Profile Fields

```typescript
const user = {
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '555-1234',
    address: '123 Main St'
  }
};

// Get contact information
const contact = await JSONPath.query(
  '$.profile.(email, phone, address)',
  user
);
```

### Example 3: Multi-Level Selection

```typescript
const data = {
  regions: [
    {
      name: 'North',
      sales: { q1: 100, q2: 150, q3: 200, q4: 250 }
    },
    {
      name: 'South',
      sales: { q1: 120, q2: 140, q3: 180, q4: 220 }
    }
  ]
};

// Get specific quarters for all regions
const result = await JSONPath.query(
  '$.regions[*].sales.(q1, q4)',
  data
);
// Returns: [100, 250, 120, 220]
```

### Example 4: Configuration Selection

```typescript
const config = {
  settings: {
    debug: true,
    verbose: false,
    timeout: 5000,
    retries: 3,
    cache: true
  }
};

// Get specific configuration values
const important = await JSONPath.query(
  '$.settings.(debug, timeout, retries)',
  config
);
```

### Example 5: Nested Object Properties

```typescript
const data = {
  level1: {
    level2: {
      level3: {
        a: 1,
        b: 2,
        c: 3
      }
    }
  }
};

const result = await JSONPath.query(
  '$.level1.level2.level3.(a, b, c)',
  data
);
// Returns: [1, 2, 3]
```

## Best Practices

### 1. Use Grouping for Same-Parent Properties

```typescript
// Good - concise and efficient
$.store.(book, bicycle, magazine)

// Avoid - verbose and less efficient
$.store.book | $.store.bicycle | $.store.magazine
```

### 2. Combine with Filters for Selective Extraction

```typescript
// Extract specific fields from filtered items
$.items[?(@.active)].(id, name, status)
```

### 3. Order Matters

```typescript
// Order your properties logically
$.user.(firstName, lastName, email)  // Natural order

// Rather than
$.user.(email, lastName, firstName)  // Random order
```

### 4. Use Quoted Names for Special Characters

```typescript
// For property names with special characters
$.data.("special-property", "another.property")
```

### 5. Leverage with Array Operations

```typescript
// Efficiently extract from array elements
$.users[*].(id, name, email)
```

## Limitations

1. **Object Properties Only**: Grouping only works on object properties, not array indices
   ```typescript
   // This works
   $.obj.(a, b, c)

   // Array indices use union syntax instead
   $.arr[0, 1, 2]
   ```

2. **Same Parent Required**: All properties must exist on the same parent object
   ```typescript
   // This works
   $.store.(book, bicycle)

   // Cannot mix levels like this (would need union)
   // $.store.book | $.users
   ```

3. **No Expressions**: Property names must be literals, not expressions
   ```typescript
   // Valid
   $.obj.(name, value)

   // Invalid - no dynamic names in grouping
   // $.obj.(@.prop1, @.prop2)
   ```

## See Also

- [Union Operator](./UNION_OPERATOR.md) - For combining different paths
- [Filter Expressions](./FILTERS.md) - For conditional selection
- [Recursive Descent](./RECURSIVE_DESCENT.md) - For deep searching
- [Parent Selector](./PARENT_SELECTOR.md) - For accessing parent values
