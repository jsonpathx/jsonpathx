# Advanced Patterns Guide

Master advanced JSONPath patterns, optimization techniques, and complex query strategies for building high-performance applications with jsonpathx.

## Table of Contents

- [Complex Query Composition](#complex-query-composition)
- [Performance Optimization](#performance-optimization)
- [Caching Strategies](#caching-strategies)
- [Query Reuse Patterns](#query-reuse-patterns)
- [Streaming for Large Datasets](#streaming-for-large-datasets)
- [Parent Chain Tracking](#parent-chain-tracking)
- [Advanced Filtering](#advanced-filtering)
- [Recursive Patterns](#recursive-patterns)
- [Union and Grouping](#union-and-grouping)
- [Custom Type Checking](#custom-type-checking)
- [Real-World Scenarios](#real-world-scenarios)

---

## Complex Query Composition

### Multi-Stage Queries

Break complex queries into stages for better readability and maintainability:

```typescript
// Instead of one complex query
const result = await JSONPath.query(
  '$.store.book[?(@.price < 10 && @.category === "fiction")].author',
  data
);

// Use QueryBuilder for multi-stage approach
const result = await JSONPath.create(data)
  .query('$.store.book[*]')
  .filter(book => book.price < 10)
  .filter(book => book.category === 'fiction')
  .map(book => book.author)
  .deduplicate()
  .execute();
```

### Combining Multiple Queries

Merge results from different queries:

```typescript
async function getRelevantProducts(data: any, category: string, maxPrice: number) {
  // Get products by category
  const byCategory = await JSONPath.query(
    `$.products[?(@.category === "${category}")]`,
    data
  );

  // Get on-sale products
  const onSale = await JSONPath.query(
    '$.products[?(@.onSale === true)]',
    data
  );

  // Get products under price
  const affordable = await JSONPath.query(
    `$.products[?(@.price < ${maxPrice})]`,
    data
  );

  // Merge and deduplicate
  const allProducts = [...byCategory, ...onSale, ...affordable];
  const uniqueIds = new Set();
  return allProducts.filter(p => {
    if (uniqueIds.has(p.id)) return false;
    uniqueIds.add(p.id);
    return true;
  });
}
```

### Nested Query Patterns

Query results from previous queries:

```typescript
// First query: Get all categories
const categories = await JSONPath.query('$.categories[*].name', data);

// Second query: For each category, get products
const productsByCategory = await Promise.all(
  categories.map(async category => {
    const products = await JSONPath.query(
      `$.products[?(@.category === "${category}")]`,
      data
    );
    return { category, products };
  })
);
```

### Dynamic Path Construction

Build paths dynamically based on data:

```typescript
async function getNestedValue(data: any, pathSegments: string[]) {
  // Build path: $.level1.level2.level3
  const path = '$.' + pathSegments.join('.');
  return await JSONPath.query(path, data);
}

// Usage
const value = await getNestedValue(data, ['user', 'profile', 'settings', 'theme']);
```

---

## Performance Optimization

### 1. Use Specific Selectors

Avoid recursive descent when possible:

```typescript
// ❌ Slow: Recursive descent
await JSONPath.query('$..items[*]', data);

// ✅ Fast: Specific path
await JSONPath.query('$.categories[*].items[*]', data);
```

### 2. Filter Early

Apply filters as early as possible:

```typescript
// ❌ Less efficient: Query all, then filter in JS
const all = await JSONPath.query('$.products[*]', data);
const filtered = all.filter(p => p.price < 100);

// ✅ More efficient: Filter in JSONPath
const filtered = await JSONPath.query(
  '$.products[?(@.price < 100)]',
  data
);
```

### 3. Limit Result Size

Use `.take()` to limit results:

```typescript
// Get only what you need
const top10 = await JSONPath.create(data)
  .query('$.products[*]')
  .sort((a, b) => b.rating - a.rating)
  .take(10)  // Stop after 10 results
  .execute();
```

### 4. Batch Operations

Combine multiple queries when possible:

```typescript
// ❌ Slow: Multiple queries
const names = await JSONPath.query('$.users[*].name', data);
const emails = await JSONPath.query('$.users[*].email', data);
const ages = await JSONPath.query('$.users[*].age', data);

// ✅ Fast: Single query with transformation
const users = await JSONPath.create(data)
  .query('$.users[*]')
  .map(user => ({
    name: user.name,
    email: user.email,
    age: user.age
  }))
  .execute();
```

### 5. Avoid Deep Cloning

Use mutable operations when appropriate:

```typescript
// For temporary transformations that don't need persistence
await Mutation.set(localData, '$.temp', value, {
  immutable: false  // Avoid clone overhead
});
```

### 6. Optimize Filter Functions

Keep filter functions simple and fast:

```typescript
// ❌ Slow: Complex operations in filter
.filter(item => {
  const computed = expensiveCalculation(item);
  return computed > threshold;
})

// ✅ Fast: Pre-compute if possible
const threshold = computeThreshold();
.filter(item => item.value > threshold)
```

---

## Caching Strategies

### Global Query Caching

Enable caching for frequently-used queries:

```typescript
import { JSONPath } from 'jsonpathx';

// Enable global cache
JSONPath.enableCache({
  maxSize: 200,    // Cache up to 200 queries
  ttl: 300000,     // 5 minutes
  persistence: false
});

// Queries will be cached automatically
const result = await JSONPath.query('$.expensive.query[*]', data, {
  enableCache: true
});
```

### Query-Specific Caching

Cache individual queries:

```typescript
// Cache this specific query
const result = await JSONPath.create(data)
  .query('$.products[*]')
  .cached(true)
  .execute();
```

### Cache Statistics

Monitor cache performance:

```typescript
const stats = JSONPath.getCacheStats();
console.log('Cache size:', stats.size);
console.log('Max size:', stats.maxSize);
console.log('Total accesses:', stats.totalAccesses);
console.log('Hit rate:', stats.totalAccesses / stats.size);
```

### Manual Cache Management

```typescript
// Clear cache when data changes
JSONPath.clearCache();

// Disable caching temporarily
JSONPath.disableCache();

// Re-enable
JSONPath.enableCache();
```

### Smart Caching Pattern

```typescript
class DataStore {
  private data: any;
  private dataVersion = 0;

  async query(path: string) {
    // Enable caching with version-based invalidation
    const result = await JSONPath.query(path, this.data, {
      enableCache: true
    });
    return result;
  }

  updateData(newData: any) {
    this.data = newData;
    this.dataVersion++;
    // Invalidate cache on data change
    JSONPath.clearCache();
  }
}
```

---

## Query Reuse Patterns

### Reusable Query Instances

Create queries once, evaluate multiple times:

```typescript
// Create reusable query
const activeUsersQuery = JSONPath.create(null)
  .query('$.users[?(@.active === true)]')
  .sort((a, b) => a.name.localeCompare(b.name))
  .build();

// Reuse with different datasets
const users1 = await activeUsersQuery.evaluate(dataset1);
const users2 = await activeUsersQuery.evaluate(dataset2);
const users3 = await activeUsersQuery.evaluate(dataset3);
```

### Query Factory Pattern

```typescript
class QueryFactory {
  static createUserQuery(filters: {
    active?: boolean;
    role?: string;
    minAge?: number;
  }) {
    let builder = JSONPath.create(null).query('$.users[*]');

    if (filters.active !== undefined) {
      builder = builder.filter(u => u.active === filters.active);
    }

    if (filters.role) {
      builder = builder.filter(u => u.role === filters.role);
    }

    if (filters.minAge) {
      builder = builder.filter(u => u.age >= filters.minAge);
    }

    return builder.build();
  }
}

// Usage
const adminQuery = QueryFactory.createUserQuery({ role: 'admin', active: true });
const admins = await adminQuery.evaluate(data);
```

### Query Composition

```typescript
class QueryBuilder {
  private queries: Array<(data: any) => Promise<any>> = [];

  addQuery(fn: (data: any) => Promise<any>) {
    this.queries.push(fn);
    return this;
  }

  async execute(data: any) {
    let result = data;
    for (const query of this.queries) {
      result = await query(result);
    }
    return result;
  }
}

// Usage
const pipeline = new QueryBuilder()
  .addQuery(d => JSONPath.query('$.users[*]', d))
  .addQuery(users => users.filter(u => u.active))
  .addQuery(users => users.sort((a, b) => a.name.localeCompare(b.name)));

const result = await pipeline.execute(data);
```

---

## Streaming for Large Datasets

### Stream Processing

Process large arrays without loading everything into memory:

```typescript
import { streamArray } from 'jsonpathx';

// Stream large array
for await (const item of streamArray(largeData, '$.items[*]')) {
  console.log('Processing:', item.value);

  // Process each item individually
  await processItem(item.value);
}
```

### Batch Streaming

Process in batches for better performance:

```typescript
import { streamArrayBatched } from 'jsonpathx';

for await (const batch of streamArrayBatched(largeData, '$.items[*]', {
  batchSize: 100
})) {
  console.log(`Processing batch of ${batch.length} items`);
  await processBatch(batch);
}
```

### File Streaming (Node.js)

Stream large JSON files:

```typescript
import { streamArrayFile } from 'jsonpathx';

// Stream from file
for await (const item of streamArrayFile('./large-file.json', '$.items[*]')) {
  await processItem(item.value);
}
```

### Streaming with Transformations

```typescript
import { transformArray, filterArray } from 'jsonpathx';

// Transform large arrays efficiently
const transformed = await transformArray(
  largeData,
  '$.items[*]',
  item => ({ id: item.id, name: item.name })
);

// Filter large arrays efficiently
const filtered = await filterArray(
  largeData,
  '$.items[*]',
  item => item.active === true
);
```

---

## Parent Chain Tracking

### Full Parent Chain

Track the complete path from root to value:

```typescript
const results = await JSONPath.query(
  '$.store.book[*].title',
  data,
  { resultType: 'parentChain' }
);

results.forEach(result => {
  console.log('Value:', result.value);
  console.log('Depth:', result.depth);
  console.log('Full path:', result.rootPath);

  // Navigate up the chain
  result.chain.forEach((entry, i) => {
    console.log(`Level ${i}:`, entry.property);
  });
});
```

### Parent Context Queries

Execute queries with parent context:

```typescript
const parent = {
  metadata: { version: '1.0' },
  items: [{ id: 1 }, { id: 2 }]
};

const results = await JSONPath.create(parent.items)
  .withParent(parent, 'items')
  .query('$[*].id')
  .execute();
```

### Navigating Hierarchies

```typescript
async function getPathHierarchy(data: any, path: string) {
  const results = await JSONPath.query(path, data, {
    resultType: 'all'
  });

  return results.entries.map(entry => ({
    value: entry.value,
    path: entry.path,
    parent: entry.parent,
    property: entry.parentProperty
  }));
}

// Find all parents of a specific value
const hierarchy = await getPathHierarchy(data, '$..targetValue');
```

---

## Advanced Filtering

### Complex Filter Logic

Combine multiple conditions:

```typescript
// Complex AND/OR logic
await JSONPath.query(
  '$.products[?(@.price < 100 && (@.category === "electronics" || @.category === "computers"))]',
  data
);

// Nested property checks
await JSONPath.query(
  '$.users[?(@.profile.settings.notifications.email === true)]',
  data,
  { ignoreEvalErrors: true }  // Handle missing nested properties
);
```

### Custom Filter Functions

```typescript
const sandbox = {
  // Complex validation
  isValid: (item) => {
    return item &&
           typeof item === 'object' &&
           'id' in item &&
           'name' in item &&
           item.name.length > 0;
  },

  // Range check
  inRange: (item, min, max) => {
    return item.value >= min && item.value <= max;
  },

  // Date comparison
  isRecent: (item, days) => {
    const date = new Date(item.createdAt);
    const now = new Date();
    const diff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    return diff <= days;
  },

  // External data check
  isPopular: (item) => {
    return popularItemIds.has(item.id);
  }
};

const result = await JSONPath.query(
  '$.items[?(@.isValid() && @.inRange(10, 100) && @.isRecent(7))]',
  data,
  { sandbox }
);
```

### XPath-Style Filters

Use XPath-style filters for constraining without selecting:

```typescript
// JSONPath style: Filter selects items
await JSONPath.query('$..book[?(@.price < 10)]', data);
// Returns books

// XPath style: Filter constrains without selecting
await JSONPath.query('$..book[?~@.price < 10].title', data, {
  filterMode: 'xpath'
});
// Returns titles of books where price < 10
```

---

## Recursive Patterns

### Deep Traversal

Find values at any depth:

```typescript
// Find all "id" properties anywhere
const ids = await JSONPath.query('$..id', data);

// Find all arrays anywhere
const arrays = await JSONPath.query('$..[?(@array())]', data);

// Find specific values deeply nested
const settings = await JSONPath.query('$..settings', data);
```

### Controlled Recursion

Limit recursion depth with parent chain:

```typescript
const results = await JSONPath.query('$..items', data, {
  resultType: 'parentChain',
  maxParentChainDepth: 5  // Limit tracking depth
});

// Filter by depth
const shallow = results.filter(r => r.depth <= 3);
```

### Recursive Search with Conditions

```typescript
// Find all objects with specific structure
const matches = await JSONPath.query(
  '$..[?(@object() && @.type === "user" && @.active)]',
  data
);

// Find nested arrays with elements
const nonEmptyArrays = await JSONPath.query(
  '$..[?(@array() && @.length > 0)]',
  data
);
```

---

## Union and Grouping

### Union Operator

Combine multiple path expressions:

```typescript
// Get both books and magazines
const items = await JSONPath.query(
  '$.store.book | $.store.magazine',
  data
);

// Get multiple specific paths
const values = await JSONPath.query(
  '$.user.name | $.user.email | $.user.phone',
  data
);
```

### Grouping Syntax

Select multiple properties:

```typescript
// Get multiple properties from each item
const results = await JSONPath.query(
  '$.items[*].(name, price, category)',
  data
);
```

### Combining Union and Grouping

```typescript
// Complex selection
const data = await JSONPath.query(
  '($.books[*] | $.magazines[*]).(title, price, author)',
  data
);
```

---

## Custom Type Checking

### Custom Type Selectors

Define custom type checking:

```typescript
class MyCustomClass {
  constructor(public value: number) {}
}

const data = {
  items: [
    new MyCustomClass(10),
    { value: 20 },
    new MyCustomClass(30),
    { value: 40 }
  ]
};

const customItems = await JSONPath.query(
  '$.items[?(@other())]',
  data,
  {
    otherTypeCallback: (value) => value instanceof MyCustomClass
  }
);
// Returns only MyCustomClass instances
```

### Type-Based Filtering

```typescript
// Filter by multiple types
const sandbox = {
  isStringOrNumber: (item) => {
    return typeof item === 'string' || typeof item === 'number';
  },
  isValidDate: (item) => {
    return item instanceof Date && !isNaN(item.getTime());
  }
};

const results = await JSONPath.query(
  '$.items[?(@.isStringOrNumber() || @.isValidDate())]',
  data,
  { sandbox }
);
```

---

## Real-World Scenarios

### E-commerce Product Filtering

```typescript
async function searchProducts(
  catalog: any,
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
    minRating?: number;
  }
) {
  let builder = JSONPath.create(catalog).query('$.products[*]');

  if (filters.category) {
    builder = builder.filter(p => p.category === filters.category);
  }

  if (filters.minPrice !== undefined) {
    builder = builder.filter(p => p.price >= filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    builder = builder.filter(p => p.price <= filters.maxPrice);
  }

  if (filters.inStock) {
    builder = builder.filter(p => p.inStock);
  }

  if (filters.minRating !== undefined) {
    builder = builder.filter(p => p.rating >= filters.minRating);
  }

  return builder
    .sort((a, b) => b.rating - a.rating)
    .execute();
}
```

### API Response Transformation

```typescript
async function transformAPIResponse(response: any) {
  // Extract and flatten nested data
  const users = await JSONPath.create(response)
    .query('$.data.users[*]')
    .map(user => ({
      id: user.id,
      name: user.profile.name,
      email: user.contact.email,
      phone: user.contact.phone,
      city: user.address?.city || 'Unknown'
    }))
    .execute();

  return users;
}
```

### Configuration Merging

```typescript
async function mergeConfigurations(
  baseConfig: any,
  userConfig: any
): Promise<any> {
  let result = baseConfig;

  // Find all user overrides
  const overrides = await JSONPath.query('$..override', userConfig);

  // Apply each override
  for (const override of overrides) {
    const path = override.path;
    const value = override.value;

    const mutated = await Mutation.set(result, path, value, {
      createPath: true
    });
    result = mutated.data;
  }

  return result;
}
```

### Data Validation

```typescript
async function validateData(data: any): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Check required fields
  const requiredFields = ['id', 'name', 'email'];
  for (const field of requiredFields) {
    const values = await JSONPath.query(`$.users[*].${field}`, data);
    if (values.some(v => v === undefined || v === null)) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Check email format
  const emails = await JSONPath.query('$.users[*].email', data);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emails.some(email => !emailRegex.test(email))) {
    errors.push('Invalid email format');
  }

  // Check for duplicates
  const ids = await JSONPath.query('$.users[*].id', data);
  const uniqueIds = new Set(ids);
  if (ids.length !== uniqueIds.size) {
    errors.push('Duplicate user IDs found');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
```

### Aggregation and Reporting

```typescript
async function generateReport(salesData: any) {
  // Group by region
  const byRegion = await JSONPath.create(salesData)
    .query('$.sales[*]')
    .groupBy(sale => sale.region);

  // Calculate statistics for each region
  const report = Array.from(byRegion.entries()).map(([region, sales]) => {
    const total = sales.reduce((sum, s) => sum + s.amount, 0);
    const avg = total / sales.length;
    const max = Math.max(...sales.map(s => s.amount));
    const min = Math.min(...sales.map(s => s.amount));

    return { region, total, avg, max, min, count: sales.length };
  });

  return report.sort((a, b) => b.total - a.total);
}
```

---

## See Also

- [Performance Guide](../performance.md) - Detailed performance optimization
- [Caching Guide](../features/caching.md) - Advanced caching strategies
- [QueryBuilder API](../api/query-builder.md) - Complete builder reference
- [Streaming Guide](../features/streaming.md) - Streaming documentation
- [Parent Options](../parent-options.md) - Parent chain tracking
