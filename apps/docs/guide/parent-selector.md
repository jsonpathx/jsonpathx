# Parent Selector

Learn how to access parent nodes and traverse up the JSON tree using jsonpathx's parent tracking features. Understand parent chains, context, and advanced navigation patterns.

## Overview

jsonpathx provides powerful parent tracking capabilities that allow you to:
- Access parent nodes of matched values
- Navigate up the JSON tree
- Build complete parent chains
- Reference parent context in filters

## Basic Parent Access

### Enable Parent Tracking

```typescript
const data = {
  store: {
    books: [
      { title: 'Book 1', price: 10 },
      { title: 'Book 2', price: 20 }
    ]
  }
};

const result = await JSONPath.query('$.store.books[*].title', data, {
  resultType: 'all'
});

console.log(result.parents);
// Returns parent objects for each matched value
```

### Result with Parents

```typescript
interface AllTypesResult {
  values: unknown[];      // Matched values
  paths: string[];        // JSONPath strings
  pointers: string[];     // JSON Pointers
  parents: unknown[];     // Parent objects
  parentProperties: string[];  // Property names in parent
}
```

## Parent Chain Tracking

### Build Complete Parent Chain

```typescript
import { buildParentChain } from '@jsonpathx/jsonpathx';

const data = {
  level1: {
    level2: {
      level3: {
        value: 'target'
      }
    }
  }
};

const result = await JSONPath.query('$..value', data, {
  resultType: 'all'
});

// Build parent chain for first result
const chain = buildParentChain(result, 0);

console.log(chain);
// [
//   { level1: { level2: { level3: { value: 'target' } } } },  // Root
//   { level2: { level3: { value: 'target' } } },              // level1
//   { level3: { value: 'target' } },                          // level2
//   { value: 'target' }                                       // level3
// ]
```

### Navigate Up Parent Chain

```typescript
import { navigateUp } from '@jsonpathx/jsonpathx';

// Get parent at specific level
const immediateParent = navigateUp(chain, 1);  // Direct parent
const grandparent = navigateUp(chain, 2);       // Two levels up
const root = navigateUp(chain, chain.length);   // Root
```

## Using Parent Context in Filters

### Access Parent Properties

While JSONPath doesn't have a standard `^` parent operator, you can use custom functions with parent tracking:

```typescript
const data = {
  categories: [
    {
      name: 'Electronics',
      products: [
        { name: 'Laptop', price: 1000 },
        { name: 'Phone', price: 500 }
      ]
    },
    {
      name: 'Books',
      products: [
        { name: 'Novel', price: 15 }
      ]
    }
  ]
};

// Query with parent tracking
const result = await JSONPath.query(
  '$.categories[*].products[*]',
  data,
  { resultType: 'all' }
);

// Access parent category for each product
result.values.forEach((product, index) => {
  const parent = result.parents[index];
  console.log(`${product.name} is in ${parent.name}`);
});
// Output:
// Laptop is in Electronics
// Phone is in Electronics
// Novel is in Books
```

## Parent Tracking Options

### Query Options

```typescript
interface QueryOptions {
  // Get parents in result
  resultType?: 'all';  // Must use 'all' to get parents

  // Include parent chain (experimental)
  includeParentChain?: boolean;
}
```

### Example with All Options

```typescript
const result = await JSONPath.query('$..price', data, {
  resultType: 'all',
  includeParentChain: true
});

console.log(result.values);           // [10, 20, 15]
console.log(result.paths);            // JSONPath strings
console.log(result.parents);          // Parent objects
console.log(result.parentProperties); // Property names
```

## Practical Examples

### Find Siblings

```typescript
const data = {
  users: [
    { id: 1, name: 'Alice', role: 'admin' },
    { id: 2, name: 'Bob', role: 'user' },
    { id: 3, name: 'Charlie', role: 'admin' }
  ]
};

// Find all users in same array as user with id: 2
const result = await JSONPath.query('$.users[?(@.id === 2)]', data, {
  resultType: 'all'
});

// Parent is the array containing all users
const allUsers = result.parents[0];  // The users array
console.log(allUsers);  // All 3 users
```

### Context-Aware Filtering

```typescript
// Track which category each expensive product belongs to
const expensiveProducts = await JSONPath.query(
  '$.categories[*].products[?(@.price > 100)]',
  data,
  { resultType: 'all' }
);

expensiveProducts.values.forEach((product, index) => {
  const category = expensiveProducts.parents[index];
  console.log(`${product.name} ($${product.price}) in ${category.name}`);
});
```

### Build Breadcrumb Navigation

```typescript
const data = {
  site: {
    section: {
      page: {
        content: 'Hello World'
      }
    }
  }
};

const result = await JSONPath.query('$..content', data, {
  resultType: 'all'
});

// Build breadcrumb from path
const pathParts = result.paths[0].split('.');
console.log(pathParts.join(' > '));
// Output: $ > site > section > page > content
```

## Advanced Patterns

### Parent-Based Aggregation

```typescript
// Calculate category totals from product prices
const products = await JSONPath.query(
  '$.categories[*].products[*].price',
  data,
  { resultType: 'all' }
);

const categoryTotals = new Map();

products.values.forEach((price, index) => {
  const parent = products.parents[index];  // products array
  const grandparent = products.parents[index - 1];  // category

  if (!categoryTotals.has(grandparent.name)) {
    categoryTotals.set(grandparent.name, 0);
  }
  categoryTotals.set(
    grandparent.name,
    categoryTotals.get(grandparent.name) + price
  );
});
```

### Validate Parent-Child Relationships

```typescript
const data = {
  orders: [
    {
      id: 1,
      customerId: 100,
      items: [
        { productId: 1, quantity: 2 }
      ]
    }
  ]
};

// Ensure items belong to valid orders
const items = await JSONPath.query('$..items[*]', data, {
  resultType: 'all'
});

items.values.forEach((item, index) => {
  const order = items.parents[index];
  console.log(`Item ${item.productId} belongs to order ${order.id}`);
});
```

### Deep Parent Access

```typescript
import { ParentChainTracker } from '@jsonpathx/jsonpathx';

const tracker = new ParentChainTracker();

// Track as you query
const result = await JSONPath.query('$..value', deeplyNestedData, {
  resultType: 'all'
});

// Get full parent chain for analysis
result.values.forEach((value, index) => {
  const chain = buildParentChain(result, index);
  const depth = chain.length;
  console.log(`Value at depth ${depth}:`, value);
});
```

## Performance Considerations

### Parent Tracking Overhead

Parent tracking adds minimal overhead:

```typescript
// Without parents (faster)
const result = await JSONPath.query('$.items[*]', data);

// With parents (slight overhead)
const result = await JSONPath.query('$.items[*]', data, {
  resultType: 'all'
});
```

**Impact**: ~5-10% slower for large datasets

**Recommendation**: Only use parent tracking when needed.

### Optimize Parent Access

```typescript
// ❌ Inefficient: Track parents for all, use few
const all = await JSONPath.query('$..items[*]', data, {
  resultType: 'all'
});
// Process only first few with parents

// ✅ Efficient: Query specific items only
const specific = await JSONPath.query('$.category.items[0:10]', data, {
  resultType: 'all'
});
```

## Limitations

### No Standard Parent Operator

JSONPath RFC 9535 doesn't define a parent operator like `^` or `..^`. Use parent tracking features instead:

```typescript
// ❌ Not standard JSONPath
'$.items[*].price^'  // Go to parent

// ✅ Use parent tracking
const result = await JSONPath.query('$.items[*].price', data, {
  resultType: 'all'
});
const parents = result.parents;
```

### Parent Mutations

Parents are read-only snapshots:

```typescript
const result = await JSONPath.query('$.items[*]', data, {
  resultType: 'all'
});

// ❌ This won't modify original data
result.parents[0].newProperty = 'value';

// ✅ Use Mutation API instead
await Mutation.set(data, '$.items[0].newProperty', 'value');
```

## TypeScript Support

```typescript
interface ParentChainResult<T = unknown> {
  value: T;
  parent: unknown;
  property: string;
  path: string;
  pointer: string;
  chain: unknown[];
}

// Typed parent access
const result = await JSONPath.query<Product>(
  '$.products[*]',
  data,
  { resultType: 'all' }
);

result.parents.forEach((parent: Category) => {
  // Parent is typed as Category
  console.log(parent.name);
});
```

## Common Use Cases

### 1. Breadcrumb Navigation

```typescript
const result = await JSONPath.query('$..currentPage', siteData, {
  resultType: 'all'
});

const breadcrumbs = result.paths[0]
  .split('.')
  .slice(1)  // Remove $
  .map(segment => segment.replace(/\[.*\]/, ''));
```

### 2. Category Filtering

```typescript
// Find all products under "Electronics"
const products = await JSONPath.query(
  '$..products[*]',
  data,
  { resultType: 'all' }
);

const electronics = products.values.filter((product, index) => {
  return products.parents[index].name === 'Electronics';
});
```

### 3. Hierarchical Reports

```typescript
// Generate report with category context
const items = await JSONPath.query('$..items[*]', data, {
  resultType: 'all'
});

const report = items.values.map((item, index) => ({
  item: item.name,
  category: items.parents[index].category,
  path: items.paths[index]
}));
```

## See Also

- [Query Options](./options.md) - All query configuration options
- [Result Types](./result-types.md) - Understanding result formats
- [Advanced Patterns](./advanced-patterns.md) - Complex query techniques
- [API Reference](../api/jsonpath.md) - Complete API documentation
