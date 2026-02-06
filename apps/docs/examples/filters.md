# Filter Examples

Comprehensive examples of filter expressions in jsonpathx. Learn how to write powerful filters for complex data querying.

## Basic Filters

### Equality

```typescript
const data = {
  users: [
    { id: 1, name: 'Alice', status: 'active' },
    { id: 2, name: 'Bob', status: 'inactive' },
    { id: 3, name: 'Charlie', status: 'active' }
  ]
};

// Find active users
const active = await JSONPath.query(
  '$.users[?(@.status === "active")]',
  data
);
// Result: Alice, Charlie
```

### Comparison

```typescript
const products = {
  items: [
    { name: 'Laptop', price: 1200 },
    { name: 'Mouse', price: 25 },
    { name: 'Keyboard', price: 75 }
  ]
};

// Items under $100
const affordable = await JSONPath.query(
  '$.items[?(@.price < 100)]',
  products
);
// Result: Mouse, Keyboard

// Items $100 or more
const expensive = await JSONPath.query(
  '$.items[?(@.price >= 100)]',
  products
);
// Result: Laptop
```

## Logical Operators

### AND Conditions

```typescript
const data = {
  products: [
    { name: 'A', price: 50, inStock: true },
    { name: 'B', price: 150, inStock: true },
    { name: 'C', price: 75, inStock: false }
  ]
};

// Affordable AND in stock
const result = await JSONPath.query(
  '$.products[?(@.price < 100 && @.inStock === true)]',
  data
);
// Result: Product A
```

### OR Conditions

```typescript
// Expensive OR out of stock
const result = await JSONPath.query(
  '$.products[?(@.price > 100 || @.inStock === false)]',
  data
);
// Result: Products B, C
```

### NOT Operator

```typescript
// Not out of stock (in stock)
const result = await JSONPath.query(
  '$.products[?(!(@.inStock === false))]',
  data
);
// Result: Products A, B
```

## Complex Filters

### Multiple Conditions

```typescript
const data = {
  orders: [
    { id: 1, total: 150, status: 'pending', priority: 'high' },
    { id: 2, total: 50, status: 'complete', priority: 'low' },
    { id: 3, total: 200, status: 'pending', priority: 'high' }
  ]
};

// High priority pending orders over $100
const result = await JSONPath.query(
  '$.orders[?(@.status === "pending" && @.priority === "high" && @.total > 100)]',
  data
);
// Result: Orders 1, 3
```

### Nested Property Filters

```typescript
const data = {
  users: [
    { name: 'Alice', address: { city: 'NYC', zip: '10001' } },
    { name: 'Bob', address: { city: 'LA', zip: '90001' } },
    { name: 'Charlie', address: { city: 'NYC', zip: '10002' } }
  ]
};

// Users in NYC
const nycUsers = await JSONPath.query(
  '$.users[?(@.address.city === "NYC")]',
  data
);
// Result: Alice, Charlie
```

### Array Property Filters

```typescript
const data = {
  users: [
    { name: 'Alice', tags: ['admin', 'developer'] },
    { name: 'Bob', tags: ['user'] },
    { name: 'Charlie', tags: ['developer', 'designer'] }
  ]
};

// Users with 'developer' tag (requires custom function)
const sandbox = {
  hasDeveloperTag: (user) => user.tags.includes('developer')
};

const developers = await JSONPath.query(
  '$.users[?(@.hasDeveloperTag())]',
  data,
  { sandbox }
);
// Result: Alice, Charlie
```

## Custom Function Filters

### Simple Custom Functions

```typescript
const sandbox = {
  isExpensive: (item) => item.price > 1000,
  isNew: (item) => {
    const daysOld = (Date.now() - item.createdAt) / (1000 * 60 * 60 * 24);
    return daysOld < 30;
  }
};

const result = await JSONPath.query(
  '$.items[?(@.isExpensive() && @.isNew())]',
  data,
  { sandbox }
);
```

### Functions with Parameters

```typescript
const sandbox = {
  inPriceRange: (item, min, max) => {
    return item.price >= min && item.price <= max;
  }
};

// Items between $50 and $150
const result = await JSONPath.query(
  '$.items[?(@.inPriceRange(50, 150))]',
  data,
  { sandbox }
);
```

### Regular Expression Filters

```typescript
const sandbox = {
  matchesEmail: (user) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email);
  },
  containsKeyword: (item, keyword) => {
    return new RegExp(keyword, 'i').test(item.description);
  }
};

// Valid emails
const validUsers = await JSONPath.query(
  '$.users[?(@.matchesEmail())]',
  data,
  { sandbox }
);

// Items containing "laptop"
const laptops = await JSONPath.query(
  '$.items[?(@.containsKeyword("laptop"))]',
  data,
  { sandbox }
);
```

## Existence Checks

### Property Exists

```typescript
const data = {
  users: [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob' },  // No email
    { name: 'Charlie', email: 'charlie@example.com' }
  ]
};

// Users with email
const withEmail = await JSONPath.query(
  '$.users[?(@.email)]',
  data
);
// Result: Alice, Charlie

// Users without email
const withoutEmail = await JSONPath.query(
  '$.users[?(!@.email)]',
  data
);
// Result: Bob
```

### Null/Undefined Checks

```typescript
const data = {
  items: [
    { name: 'A', value: 10 },
    { name: 'B', value: null },
    { name: 'C' }  // value is undefined
  ]
};

// Items with non-null value
const withValue = await JSONPath.query(
  '$.items[?(@.value != null)]',
  data
);
// Result: Item A
```

## Type-Based Filters

### Filter by Type

```typescript
const data = {
  mixed: [
    { id: 1, value: 'text' },
    { id: 2, value: 42 },
    { id: 3, value: true },
    { id: 4, value: [1, 2, 3] }
  ]
};

// Only string values
const strings = await JSONPath.query(
  '$.mixed[?(@.value[string])]',
  data
);

// Only numeric values
const numbers = await JSONPath.query(
  '$.mixed[?(@.value[number])]',
  data
);

// Only arrays
const arrays = await JSONPath.query(
  '$.mixed[?(@.value[array])]',
  data
);
```

## Range Filters

### Numeric Ranges

```typescript
const data = {
  products: [
    { name: 'A', price: 25 },
    { name: 'B', price: 75 },
    { name: 'C', price: 125 }
  ]
};

// Price between 50 and 100
const midRange = await JSONPath.query(
  '$.products[?(@.price >= 50 && @.price <= 100)]',
  data
);
// Result: Product B
```

### Date Ranges

```typescript
const sandbox = {
  inDateRange: (item, startDate, endDate) => {
    const date = new Date(item.date);
    return date >= new Date(startDate) && date <= new Date(endDate);
  }
};

const result = await JSONPath.query(
  '$.events[?(@.inDateRange("2024-01-01", "2024-12-31"))]',
  data,
  { sandbox }
);
```

## String Filters

### String Matching

```typescript
const sandbox = {
  startsWith: (item, prefix) => item.name.startsWith(prefix),
  endsWith: (item, suffix) => item.name.endsWith(suffix),
  contains: (item, substring) => item.name.includes(substring)
};

// Names starting with 'A'
const aNames = await JSONPath.query(
  '$.users[?(@.startsWith("A"))]',
  data,
  { sandbox }
);
```

### Case-Insensitive Matching

```typescript
const sandbox = {
  matchesIgnoreCase: (item, term) => {
    return item.name.toLowerCase() === term.toLowerCase();
  }
};

const result = await JSONPath.query(
  '$.users[?(@.matchesIgnoreCase("alice"))]',
  data,
  { sandbox }
);
// Matches "Alice", "ALICE", "alice"
```

## Collection Filters

### Array Length

```typescript
const sandbox = {
  hasMinItems: (item, min) => item.items.length >= min,
  hasMaxItems: (item, max) => item.items.length <= max
};

// Orders with at least 3 items
const largeOrders = await JSONPath.query(
  '$.orders[?(@.hasMinItems(3))]',
  data,
  { sandbox }
);
```

### Array Contains

```typescript
const sandbox = {
  hasTag: (item, tag) => item.tags.includes(tag),
  hasAnyTag: (item, tags) => {
    return tags.some(tag => item.tags.includes(tag));
  }
};

// Items with 'featured' tag
const featured = await JSONPath.query(
  '$.items[?(@.hasTag("featured"))]',
  data,
  { sandbox }
);

// Items with any of multiple tags
const result = await JSONPath.query(
  '$.items[?(@.hasAnyTag(["sale", "clearance"]))]',
  data,
  { sandbox }
);
```

## Performance Optimization

### Early Exit Filters

```typescript
// ❌ Inefficient: Check expensive condition first
'$.items[?(@.expensiveCheck() && @.price < 100)]'

// ✅ Efficient: Check cheap condition first
'$.items[?(@.price < 100 && @.expensiveCheck())]'
```

### Avoid Redundant Checks

```typescript
// ❌ Inefficient: Multiple checks
'$.items[?(@.active && @.active === true)]'

// ✅ Efficient: Single check
'$.items[?(@.active === true)]'
```

## Error Handling

### Graceful Failures

```typescript
// Without ignoreEvalErrors (throws on missing properties)
try {
  const result = await JSONPath.query(
    '$.items[?(@.optional.nested.property > 10)]',
    data
  );
} catch (error) {
  console.error('Filter failed');
}

// With ignoreEvalErrors (treats errors as false)
const result = await JSONPath.query(
  '$.items[?(@.optional.nested.property > 10)]',
  data,
  { ignoreEvalErrors: true }
);
```

### Safe Property Access

```typescript
const sandbox = {
  safeGet: (item, path) => {
    try {
      return path.split('.').reduce((obj, key) => obj[key], item);
    } catch {
      return undefined;
    }
  }
};

const result = await JSONPath.query(
  '$.items[?(@.safeGet("nested.deep.property") > 10)]',
  data,
  { sandbox }
);
```

## Real-World Examples

### E-Commerce Product Search

```typescript
const sandbox = {
  matchesSearch: (product, term) => {
    const searchText = `${product.name} ${product.description}`.toLowerCase();
    return searchText.includes(term.toLowerCase());
  },
  inCategory: (product, category) => {
    return product.categories.includes(category);
  }
};

// Search for "laptop" in Electronics under $1000, in stock
const result = await JSONPath.query(
  '$.products[?(@.matchesSearch("laptop") && @.inCategory("Electronics") && @.price < 1000 && @.inStock)]',
  catalog,
  { sandbox }
);
```

### User Permissions

```typescript
const sandbox = {
  hasPermission: (user, permission) => {
    return user.permissions.includes(permission);
  },
  hasRole: (user, role) => {
    return user.roles.includes(role);
  }
};

// Admins or users with 'write' permission
const result = await JSONPath.query(
  '$.users[?(@.hasRole("admin") || @.hasPermission("write"))]',
  data,
  { sandbox }
);
```

### Data Validation

```typescript
const sandbox = {
  isValidEmail: (item) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email),
  isValidAge: (item) => item.age >= 18 && item.age <= 120,
  isComplete: (item) => {
    return item.name && item.email && item.phone;
  }
};

// Find invalid records
const invalid = await JSONPath.query(
  '$.users[?(!@.isValidEmail() || !@.isValidAge() || !@.isComplete())]',
  data,
  { sandbox }
);
```

## See Also

- [Filter Guide](../guide/filters.md) - Filter expression syntax
- [Custom Functions](../guide/custom-functions.md) - Writing custom functions
- [Advanced Patterns](../guide/advanced-patterns.md) - Complex query patterns
