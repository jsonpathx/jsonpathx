# Advanced Query Examples

Complex JSONPath queries and advanced patterns for power users. Master recursive descent, complex filters, query composition, and performance optimization.

## Table of Contents

- [Recursive Descent](#recursive-descent)
- [Complex Filters](#complex-filters)
- [Query Composition](#query-composition)
- [Union and Grouping](#union-and-grouping)
- [Parent Chain Tracking](#parent-chain-tracking)
- [Performance Optimization](#performance-optimization)
- [Type Selectors](#type-selectors)
- [Advanced Transformations](#advanced-transformations)

---

## Recursive Descent

### Example 1: Finding Values at Any Depth

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

const data = {
  level1: {
    id: 1,
    level2: {
      id: 2,
      level3: {
        id: 3,
        target: 'Found me!'
      }
    }
  },
  other: {
    nested: {
      deep: {
        target: 'Found me too!'
      }
    }
  }
};

// Find all 'target' properties anywhere
const targets = await JSONPath.query('$..target', data);
// ['Found me!', 'Found me too!']

// Find all 'id' properties
const ids = await JSONPath.query('$..id', data);
// [1, 2, 3]
```

### Example 2: Finding Specific Structures

```typescript
const data = {
  company: {
    departments: [
      {
        name: 'Engineering',
        teams: [
          { name: 'Backend', members: [{ name: 'Alice' }, { name: 'Bob' }] },
          { name: 'Frontend', members: [{ name: 'Charlie' }] }
        ]
      },
      {
        name: 'Sales',
        teams: [
          { name: 'Enterprise', members: [{ name: 'David' }, { name: 'Eve' }] }
        ]
      }
    ]
  }
};

// Find all member names at any depth
const names = await JSONPath.query('$..members[*].name', data);
// ['Alice', 'Bob', 'Charlie', 'David', 'Eve']

// Find all teams anywhere
const teams = await JSONPath.query('$..teams[*].name', data);
// ['Backend', 'Frontend', 'Enterprise']
```

### Example 3: Conditional Recursive Descent

```typescript
const data = {
  root: {
    items: [
      { type: 'folder', name: 'Docs', items: [
        { type: 'file', name: 'readme.txt', size: 100 },
        { type: 'file', name: 'notes.txt', size: 200 }
      ]},
      { type: 'folder', name: 'Images', items: [
        { type: 'file', name: 'photo.jpg', size: 5000 },
        { type: 'folder', name: 'Thumbnails', items: [
          { type: 'file', name: 'thumb.jpg', size: 500 }
        ]}
      ]}
    ]
  }
};

// Find all files (not folders)
const files = await JSONPath.query(
  '$..[?(@.type === "file")]',
  data
);

// Find large files (> 1000 bytes) anywhere
const largeFiles = await JSONPath.query(
  '$..[?(@.type === "file" && @.size > 1000)]',
  data
);

// Get all file names
const fileNames = await JSONPath.query(
  '$..[?(@.type === "file")].name',
  data
);
```

---

## Complex Filters

### Example 4: Multi-Condition Filters

```typescript
const products = {
  items: [
    { id: 1, name: 'Phone', price: 699, stock: 50, rating: 4.5, onSale: true },
    { id: 2, name: 'Laptop', price: 1299, stock: 0, rating: 4.2, onSale: false },
    { id: 3, name: 'Tablet', price: 449, stock: 30, rating: 4.7, onSale: true },
    { id: 4, name: 'Watch', price: 299, stock: 100, rating: 4.1, onSale: false }
  ]
};

// Complex AND conditions
const available = await JSONPath.query(
  '$.items[?(@.stock > 0 && @.price < 1000 && @.rating >= 4.5)]',
  products
);

// Complex OR conditions
const deals = await JSONPath.query(
  '$.items[?(@.onSale === true || @.price < 400)]',
  products
);

// Nested conditions
const premium = await JSONPath.query(
  '$.items[?(@.stock > 0 && (@.price > 600 || @.rating > 4.6))]',
  products
);
```

### Example 5: Nested Property Filters

```typescript
const users = {
  list: [
    {
      id: 1,
      name: 'Alice',
      profile: {
        age: 30,
        settings: { notifications: true, theme: 'dark' },
        address: { city: 'NYC', country: 'USA' }
      }
    },
    {
      id: 2,
      name: 'Bob',
      profile: {
        age: 25,
        settings: { notifications: false, theme: 'light' },
        address: { city: 'LA', country: 'USA' }
      }
    }
  ]
};

// Filter by nested properties
const darkThemeUsers = await JSONPath.query(
  '$.list[?(@.profile.settings.theme === "dark")]',
  users
);

// Multiple nested conditions
const usaAdults = await JSONPath.query(
  '$.list[?(@.profile.age >= 30 && @.profile.address.country === "USA")]',
  users
);
```

---

## Query Composition

### Example 6: Multi-Stage Queries

```typescript
const store = {
  categories: [
    {
      name: 'Electronics',
      products: [
        { id: 1, name: 'Phone', price: 699, reviews: 120 },
        { id: 2, name: 'Laptop', price: 1299, reviews: 85 }
      ]
    },
    {
      name: 'Books',
      products: [
        { id: 3, name: 'Novel', price: 15, reviews: 450 },
        { id: 4, name: 'Cookbook', price: 25, reviews: 200 }
      ]
    }
  ]
};

// Stage 1: Get all products
const allProducts = await JSONPath.query(
  '$.categories[*].products[*]',
  store
);

// Stage 2: Filter with JavaScript
const popular = await JSONPath.create(store)
  .query('$.categories[*].products[*]')
  .filter(p => p.reviews > 100)
  .sort((a, b) => b.reviews - a.reviews)
  .take(3)
  .execute();
```

### Example 7: Combining Query Results

```typescript
const data = {
  featured: [
    { id: 1, name: 'Featured Item 1' }
  ],
  popular: [
    { id: 2, name: 'Popular Item 1' },
    { id: 3, name: 'Popular Item 2' }
  ],
  new: [
    { id: 4, name: 'New Item 1' }
  ]
};

// Get all items from different sections
const featured = await JSONPath.query('$.featured[*]', data);
const popular = await JSONPath.query('$.popular[*]', data);
const newItems = await JSONPath.query('$.new[*]', data);

// Combine results
const allItems = [...featured, ...popular, ...newItems];

// Or use union operator
const combined = await JSONPath.query(
  '$.featured[*] | $.popular[*] | $.new[*]',
  data
);
```

---

## Union and Grouping

### Example 8: Union Operator

```typescript
const library = {
  fiction: [
    { title: 'Novel 1', author: 'Author A' },
    { title: 'Novel 2', author: 'Author B' }
  ],
  nonFiction: [
    { title: 'History Book', author: 'Author C' },
    { title: 'Science Book', author: 'Author D' }
  ],
  reference: [
    { title: 'Dictionary', author: 'Editor E' }
  ]
};

// Get books from multiple sections
const selectedBooks = await JSONPath.query(
  '$.fiction[*] | $.nonFiction[*]',
  library
);

// Get specific items from different paths
const firstItems = await JSONPath.query(
  '$.fiction[0] | $.nonFiction[0] | $.reference[0]',
  library
);
```

### Example 9: Grouping Syntax

```typescript
const product = {
  info: {
    name: 'Gadget',
    sku: 'GAD-001',
    price: 99.99,
    category: 'Electronics',
    description: 'A useful gadget'
  }
};

// Select multiple properties
const summary = await JSONPath.query(
  '$.info.(name, price, category)',
  product
);
// Returns values of name, price, and category
```

---

## Parent Chain Tracking

### Example 10: Full Parent Chain

```typescript
const data = {
  company: {
    departments: [
      {
        name: 'Engineering',
        employees: [
          { name: 'Alice', role: 'Developer' }
        ]
      }
    ]
  }
};

const results = await JSONPath.query(
  '$.company.departments[*].employees[*].name',
  data,
  { resultType: 'parentChain' }
);

results.forEach(result => {
  console.log('Value:', result.value);
  console.log('Depth:', result.depth);
  console.log('Path:', result.rootPath);

  result.chain.forEach((entry, i) => {
    console.log(`Level ${i}:`, entry.property);
  });
});
```

### Example 11: Parent Context Queries

```typescript
const parent = {
  metadata: { version: '1.0', created: '2024-01-01' },
  data: [
    { id: 1, value: 'Item 1' },
    { id: 2, value: 'Item 2' }
  ]
};

// Query with parent context
const results = await JSONPath.create(parent.data)
  .withParent(parent, 'data')
  .query('$[*].value')
  .execute();
```

---

## Performance Optimization

### Example 12: Specific vs Recursive

```typescript
const largeData = {
  level1: {
    level2: {
      level3: {
        items: [/* many items */]
      }
    }
  }
};

// ❌ Slower: Recursive descent
const slow = await JSONPath.query('$..items[*]', largeData);

// ✅ Faster: Specific path
const fast = await JSONPath.query('$.level1.level2.level3.items[*]', largeData);
```

### Example 13: Early Filtering

```typescript
const data = {
  users: Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    active: i % 2 === 0,
    score: Math.random() * 100
  }))
};

// ❌ Less efficient: Get all, then filter
const all = await JSONPath.query('$.users[*]', data);
const filtered = all.filter(u => u.active && u.score > 50);

// ✅ More efficient: Filter in query
const efficient = await JSONPath.query(
  '$.users[?(@.active === true && @.score > 50)]',
  data
);
```

### Example 14: Query Reuse

```typescript
// Create reusable query
const activeUsersQuery = JSONPath.create(null)
  .query('$.users[?(@.active === true)]')
  .sort((a, b) => b.score - a.score)
  .build();

// Reuse with different datasets
const users1 = await activeUsersQuery.evaluate(dataset1);
const users2 = await activeUsersQuery.evaluate(dataset2);
const users3 = await activeUsersQuery.evaluate(dataset3);
```

---

## Type Selectors

### Example 15: Type-Based Filtering

```typescript
const mixed = {
  values: [
    'string1',
    42,
    true,
    null,
    { key: 'object' },
    ['array'],
    'string2',
    99,
    false
  ]
};

// Get only strings
const strings = await JSONPath.query(
  '$.values[?(@string())]',
  mixed
);

// Get only numbers
const numbers = await JSONPath.query(
  '$.values[?(@number())]',
  mixed
);

// Get only objects (not arrays or null)
const objects = await JSONPath.query(
  '$.values[?(@object())]',
  mixed
);

// Get only arrays
const arrays = await JSONPath.query(
  '$.values[?(@array())]',
  mixed
);
```

### Example 16: Complex Type Queries

```typescript
const data = {
  items: [
    { value: 10, meta: { flag: true } },
    { value: 'text', meta: null },
    { value: [1, 2, 3], meta: { flag: false } },
    { value: null, meta: { flag: true } }
  ]
};

// Find items where value is number and meta.flag is true
const result = await JSONPath.query(
  '$.items[?(@.value@number() && @.meta.flag === true)]',
  data
);

// Find items where value is array or object
const complex = await JSONPath.query(
  '$.items[?(@.value@array() || @.value@object())]',
  data
);
```

---

## Advanced Transformations

### Example 17: Complex Data Transformation

```typescript
const apiResponse = {
  data: {
    users: [
      {
        user_id: 1,
        user_name: 'alice',
        contact_info: { email: 'alice@example.com' },
        account_status: 'active',
        created_date: '2023-01-15'
      },
      {
        user_id: 2,
        user_name: 'bob',
        contact_info: { email: 'bob@example.com' },
        account_status: 'pending',
        created_date: '2024-01-10'
      }
    ]
  }
};

// Transform to cleaner structure
const transformed = await JSONPath.create(apiResponse)
  .query('$.data.users[*]')
  .map(user => ({
    id: user.user_id,
    username: user.user_name,
    email: user.contact_info.email,
    status: user.account_status,
    createdAt: new Date(user.created_date).toISOString()
  }))
  .execute();
```

### Example 18: Aggregation

```typescript
const sales = {
  transactions: [
    { id: 1, amount: 100, region: 'North' },
    { id: 2, amount: 150, region: 'South' },
    { id: 3, amount: 200, region: 'North' },
    { id: 4, amount: 120, region: 'South' }
  ]
};

// Group by region and sum
const byRegion = await JSONPath.create(sales)
  .query('$.transactions[*]')
  .groupBy(t => t.region);

const summary = Array.from(byRegion.entries()).map(([region, transactions]) => ({
  region,
  total: transactions.reduce((sum, t) => sum + t.amount, 0),
  count: transactions.length,
  average: transactions.reduce((sum, t) => sum + t.amount, 0) / transactions.length
}));
```

### Example 19: Pagination

```typescript
const data = {
  items: Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`
  }))
};

// Get page 1 (items 1-20)
const page1 = await JSONPath.create(data)
  .query('$.items[*]')
  .skip(0)
  .take(20)
  .execute();

// Get page 2 (items 21-40)
const page2 = await JSONPath.create(data)
  .query('$.items[*]')
  .skip(20)
  .take(20)
  .execute();

// Pagination helper
async function getPage(data: any, pageNum: number, pageSize: number) {
  return JSONPath.create(data)
    .query('$.items[*]')
    .skip((pageNum - 1) * pageSize)
    .take(pageSize)
    .execute();
}
```

### Example 20: Statistical Analysis

```typescript
const metrics = {
  values: [
    { metric: 'views', value: 1250 },
    { metric: 'clicks', value: 85 },
    { metric: 'conversions', value: 12 },
    { metric: 'revenue', value: 450.50 }
  ]
};

// Get statistics
const stats = await JSONPath.create(metrics)
  .query('$.values[*].value')
  .stats();

console.log('Count:', stats.count);
console.log('Sum:', stats.sum);
console.log('Mean:', stats.mean);
console.log('Min:', stats.min);
console.log('Max:', stats.max);

// Custom aggregation
const total = await JSONPath.create(metrics)
  .query('$.values[*].value')
  .reduce((sum, val) => sum + val, 0);
```

---

## See Also

- [Query Syntax](../guide/syntax.md) - Complete syntax reference
- [Advanced Patterns](../guide/advanced-patterns.md) - Advanced patterns guide
- [QueryBuilder API](../api/query-builder.md) - Builder API reference
- [Performance Guide](../performance.md) - Performance optimization
