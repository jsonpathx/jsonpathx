# Filter Expression Shortcuts

## Overview

Filter expression shortcuts are special keywords that provide access to metadata about the current item being evaluated in a filter expression. These are extensions from jsonpath-plus that enhance filter capabilities.

## Supported Shortcuts

### 1. `@path`
Returns the JSONPath expression to the current item.

**Example:**
```javascript
const data = {
  store: {
    book: [
      { title: 'Book 1' },
      { title: 'Book 2' }
    ]
  }
};

// Get items and access their paths
const result = await JSONPath.query('$.store.book[?(@path)]', data, {
  resultType: 'all'
});
// result.entries[0].path === '$.store.book[0]'
```

**Use Cases:**
- Filtering by path patterns
- Debugging queries
- Conditional logic based on location in document

### 2. `@parent`
Returns the parent object or array of the current item.

**Example:**
```javascript
const data = {
  items: [
    { name: 'item1', active: true },
    { name: 'item2', active: false }
  ]
};

// Get item names where parent exists
const result = await JSONPath.query('$.items[*].name[?(@parent)]', data, {
  resultType: 'all'
});
// result.entries[0].parent === { name: 'item1', active: true }
```

**Use Cases:**
- Accessing sibling properties
- Cross-field validation
- Checking parent object structure

### 3. `@property`
Returns the property name (for objects) or array index (for arrays) of the current item as a string.

**Example:**
```javascript
const data = {
  user: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com'
  }
};

// Get value where property name is 'firstName'
const result = await JSONPath.query('$.user.*[?(@property == "firstName")]', data);
// result === ['John']
```

**Note:** For array elements, `@property` returns the index as a string (e.g., "0", "1", "2").

**Use Cases:**
- Dynamic property selection
- Filtering by key names
- Property name pattern matching

### 4. `@parentProperty`
Returns the property name or array index of the current item's parent.

**Example:**
```javascript
const data = {
  store: {
    book: [{ title: 'Book 1' }],
    movie: [{ title: 'Movie 1' }]
  }
};

// Get titles where parent property is 'book'
const result = await JSONPath.query(
  '$.store.book[*].title[?(@parentProperty == "book")]',
  data
);
// result === ['Book 1']
```

**Use Cases:**
- Filtering based on grandparent context
- Multi-level conditional logic
- Category-based filtering

### 5. `@root`
Returns the root document.

**Example:**
```javascript
const data = {
  maxValue: 100,
  items: [
    { value: 50 },
    { value: 150 }
  ]
};

// Get all items (checking root exists)
const result = await JSONPath.query('$.items[*][?(@root)]', data);
// result === [{ value: 50 }, { value: 150 }]
```

**Use Cases:**
- Cross-referencing with root-level data
- Global configuration checks
- Document-wide validation

## Usage Patterns

### Boolean Context
Shortcuts can be used as boolean values in filters:
```javascript
// Select items where @path exists (always true for matched items)
$.items[?(@path)]

// Select items where @parent exists
$.items[*].name[?(@parent)]
```

### Comparison Context
Shortcuts can be compared with literals or other expressions:
```javascript
// Compare @property with string
$.user.*[?(@property == "name")]

// Compare @path with pattern
$.items[*][?(@path == "$.items[0]")]

// Compare @parentProperty
$.store.*.items[?(@parentProperty == "books")]
```

### Logical Operators
Shortcuts work with AND (&&), OR (||), and NOT (!):
```javascript
// Multiple conditions
$.items[*][?(@path && @property)]

// Either condition
$.user.*[?(@property == "name" || @property == "email")]

// Negation
$.items[*][?(!(@property == "internal"))]
```

## Current Limitations

### 1. Wildcard + Filter Combinations
The current implementation has limitations when applying filters after wildcard selectors in certain contexts:

```javascript
// ❌ Not fully supported yet
$.user.*[?(@property == "name")]

// ✅ Supported alternative
// Use recursive descent or direct property access instead
```

### 2. String Methods on Shortcuts
Unlike jsonpath-plus, string methods on shortcuts are not yet supported:

```javascript
// ❌ Not supported yet
$[?(@path.includes('book'))]

// ✅ Workaround: Use exact string comparison
$[?(@path == "$.store.book")]
```

### 3. Property Access on Shortcuts
Accessing properties of shortcuts (except @parent) is limited:

```javascript
// ❌ Not supported
$[?(@parent.someProperty == "value")]

// ✅ Workaround: Use nested queries or restructure logic
```

## Implementation Notes

- All shortcuts are only available within filter expressions `[?(...)]`
- Shortcuts evaluate to their respective values when used in comparisons
- Shortcuts evaluate to `true` when used as boolean conditions
- The `@property` shortcut always returns a string, even for array indices
- The `@root` shortcut is functionally equivalent to `$` within filters

## Examples

### Example 1: Filter by Path
```javascript
const data = {
  books: [{ title: 'A' }, { title: 'B' }],
  movies: [{ title: 'C' }]
};

const result = await JSONPath.query(
  '$..*[?(@path == "$.books[0]")]',
  data
);
// result === [{ title: 'A' }]
```

### Example 2: Access Parent Data
```javascript
const data = {
  orders: [
    { id: 1, items: [{ name: 'Item A' }] },
    { id: 2, items: [{ name: 'Item B' }] }
  ]
};

const result = await JSONPath.query(
  '$.orders[*].items[*].name[?(@parent)]',
  data,
  { resultType: 'all' }
);
// Each result includes parent item object
```

### Example 3: Property Name Matching
```javascript
const data = {
  config: {
    debug: true,
    debugMode: false,
    production: true
  }
};

const result = await JSONPath.query(
  '$.config.*[?(@property == "debug")]',
  data
);
// result === [true]
```

### Example 4: Grandparent Context
```javascript
const data = {
  departments: {
    sales: { employees: [{ name: 'Alice' }] },
    engineering: { employees: [{ name: 'Bob' }] }
  }
};

const result = await JSONPath.query(
  '$.departments.sales.employees[*].name[?(@parentProperty == "sales")]',
  data
);
// result === ['Alice']
```

### Example 5: Root Reference
```javascript
const data = {
  threshold: 50,
  values: [30, 60, 40]
};

// Get all values (demonstrating @root access)
const result = await JSONPath.query('$.values[*][?(@root)]', data);
// result === [30, 60, 40]
```

## Best Practices

1. **Use `resultType: 'all'`** when you need to access metadata like paths and parents:
   ```javascript
   const result = await JSONPath.query('$..items[?(@path)]', data, {
     resultType: 'all'
   });
   ```

2. **Prefer specific paths** over wildcards when possible for better performance:
   ```javascript
   // Better
   $.user.name[?(@property == "name")]

   // Less optimal
   $..*[?(@property == "name")]
   ```

3. **Combine with other filter conditions** for complex queries:
   ```javascript
   $.items[*][?(@.value > 10 && @path)]
   ```

4. **Use @parentProperty** for multi-level filtering:
   ```javascript
   $.store.*.items[*][?(@parentProperty == "books")]
   ```

## See Also

- [JSONPath Specification](../README.md)
- [Filter Expressions](./FILTERS.md)
- [Query API](./API.md)
