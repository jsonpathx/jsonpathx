# Performance Examples

Practical examples demonstrating performance optimization techniques in jsonpathx. Learn how to write efficient queries and avoid common performance pitfalls.

## Query Optimization

### Use Specific Paths

```typescript
const data = {
  store: {
    books: {
      items: [/* ... */]
    }
  }
};

// ❌ Slow: Recursive descent
console.time('recursive');
await JSONPath.query('$..items[*]', data);
console.timeEnd('recursive');
// recursive: 15.2ms

// ✅ Fast: Specific path
console.time('specific');
await JSONPath.query('$.store.books.items[*]', data);
console.timeEnd('specific');
// specific: 2.1ms (7x faster)
```

### Limit Array Traversal

```typescript
const data = { items: Array.from({ length: 10000 }, (_, i) => ({ id: i })) };

// ❌ Slow: Get all then filter in JS
const all = await JSONPath.query('$.items[*]', data);
const filtered = all.filter(item => item.id < 10);
// Total: 45ms + 12ms = 57ms

// ✅ Fast: Use array slice
const result = await JSONPath.query('$.items[0:10]', data);
// Total: 3ms (19x faster)
```

## Filter Optimization

### Filter Early

```typescript
const largeDataset = {
  users: [/* 10000 users */]
};

// ❌ Slow: Get all then filter in JS
const allUsers = await JSONPath.query('$.users[*]', largeDataset);
const active = allUsers.filter(u => u.active);
// Query: 40ms, Filter: 15ms = 55ms

// ✅ Fast: Filter in JSONPath
const activeUsers = await JSONPath.query(
  '$.users[?(@.active === true)]',
  largeDataset
);
// Query: 18ms (3x faster)
```

### Optimize Filter Conditions

```typescript
const sandbox = {
  expensiveCheck: (item) => {
    // Complex calculation
    return performComplexValidation(item);
  }
};

// ❌ Slow: Expensive check first
'$.items[?(@.expensiveCheck() && @.price < 100)]'

// ✅ Fast: Cheap check first
'$.items[?(@.price < 100 && @.expensiveCheck())]'
// Skips expensive check for items over $100
```

### Avoid Redundant Operations

```typescript
// ❌ Slow: Multiple property accesses
'$.items[?(@.category.name === "Electronics" && @.category.active === true)]'

// ✅ Fast: Query category once, filter there
'$.items[*].category[?(@.name === "Electronics" && @.active === true)]'
```

## Caching Strategies

### Cache Expensive Queries

```typescript
// Enable global cache
JSONPath.enableCache({ maxSize: 200, ttl: 120000 });

// First execution - cache miss
console.time('first');
await JSONPath.query(
  '$..books[?(@.price > 20)]',
  largeData,
  { enableCache: true }
);
console.timeEnd('first');
// first: 42ms

// Second execution - cache hit
console.time('cached');
await JSONPath.query(
  '$..books[?(@.price > 20)]',
  largeData,
  { enableCache: true }
);
console.timeEnd('cached');
// cached: 0.4ms (100x faster!)
```

### Selective Caching

```typescript
async function smartQuery(path: string, data: any) {
  // Only cache expensive queries
  const isExpensive = path.includes('..') ||
                     path.includes('[?(') ||
                     path.length > 50;

  return JSONPath.query(path, data, {
    enableCache: isExpensive
  });
}
```

### Cache Warming

```typescript
// Prewarm cache during app initialization
async function prewarmCache(data: any) {
  const commonQueries = [
    '$.users[?(@.active)]',
    '$.products[?(@.featured)]',
    '$..categories[*].items[0:5]'
  ];

  await Promise.all(
    commonQueries.map(path =>
      JSONPath.query(path, data, { enableCache: true })
    )
  );

  console.log('Cache warmed with common queries');
}
```

## Memory Optimization

### Use Streaming for Large Datasets

```typescript
const hugeDataset = { items: Array.from({ length: 1000000 }, createItem) };

// ❌ Memory intensive: Load all results
const all = await JSONPath.query('$.items[*]', hugeDataset);
await processAll(all);
// Peak memory: ~500MB

// ✅ Memory efficient: Stream results
for await (const item of streamArray(hugeDataset, '$.items[*]')) {
  await processItem(item);
}
// Peak memory: ~50MB (10x less)
```

### Process in Batches

```typescript
// Process 1000 items at a time
const batchSize = 1000;
const totalItems = 100000;

for (let i = 0; i < totalItems; i += batchSize) {
  const batch = await JSONPath.query(
    `$.items[${i}:${i + batchSize}]`,
    data
  );

  await processBatch(batch);

  // Allow garbage collection
  await new Promise(resolve => setImmediate(resolve));
}
```

### Avoid Unnecessary Wrapping

```typescript
// When you need just one result
const result = await JSONPath.query('$.config.setting', data, {
  wrap: false  // Don't wrap in array
});
// Returns: 'value' instead of ['value']
```

## Parallel Processing

### Concurrent Queries

```typescript
// Process multiple independent queries in parallel
const [users, products, orders] = await Promise.all([
  JSONPath.query('$.users[?(@.active)]', data),
  JSONPath.query('$.products[?(@.inStock)]', data),
  JSONPath.query('$.orders[?(@.pending)]', data)
]);

console.log('All queries completed in parallel');
```

### Query Reuse

```typescript
// ❌ Slow: Create query instance each time
for (let i = 0; i < 1000; i++) {
  await JSONPath.query('$.items[*].price', datasets[i]);
}
// Total: 1200ms

// ✅ Fast: Reuse query instance
const query = JSONPath.create(null)
  .query('$.items[*].price')
  .build();

for (let i = 0; i < 1000; i++) {
  await query.evaluate(datasets[i]);
}
// Total: 450ms (2.7x faster)
```

## Data Structure Optimization

### Flatten Nested Structures

```typescript
const nestedData = {
  level1: {
    level2: {
      level3: {
        items: [/* ... */]
      }
    }
  }
};

// ❌ Slow: Deep nesting requires traversal
'$.level1.level2.level3.items[*]'

// ✅ Fast: Flatten structure when possible
const flatData = {
  items: [/* ... */]
};
'$.items[*]'
```

### Index Frequently Queried Paths

```typescript
// If you frequently query by ID, create an index
const indexed = {
  byId: Object.fromEntries(
    items.map(item => [item.id, item])
  ),
  all: items
};

// Fast lookup by ID
'$.byId[123]'  // O(1)

// vs searching array
'$.all[?(@.id === 123)]'  // O(n)
```

## Benchmarking Examples

### Measure Query Performance

```typescript
async function benchmarkQuery(path: string, data: any, iterations = 100) {
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await JSONPath.query(path, data);
    times.push(performance.now() - start);
  }

  return {
    avg: times.reduce((a, b) => a + b) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    p95: times.sort()[Math.floor(times.length * 0.95)]
  };
}

// Usage
const stats = await benchmarkQuery('$..items[*]', data);
console.log(`Avg: ${stats.avg.toFixed(2)}ms`);
console.log(`P95: ${stats.p95.toFixed(2)}ms`);
```

### Compare Approaches

```typescript
async function compareApproaches() {
  const data = generateLargeDataset();

  // Approach 1: Recursive descent
  console.time('recursive');
  await JSONPath.query('$..items[*]', data);
  console.timeEnd('recursive');

  // Approach 2: Specific path
  console.time('specific');
  await JSONPath.query('$.store.items[*]', data);
  console.timeEnd('specific');

  // Approach 3: With caching
  JSONPath.enableCache();
  console.time('cached-first');
  await JSONPath.query('$.store.items[*]', data, { enableCache: true });
  console.timeEnd('cached-first');

  console.time('cached-second');
  await JSONPath.query('$.store.items[*]', data, { enableCache: true });
  console.timeEnd('cached-second');
}
```

## Real-World Scenarios

### E-Commerce Product Filtering

```typescript
// Optimize product search
const catalog = {
  products: [/* 100000 products */]
};

// ❌ Slow: Multiple passes
const step1 = await JSONPath.query('$.products[*]', catalog);
const step2 = step1.filter(p => p.category === 'Electronics');
const step3 = step2.filter(p => p.price < 1000);
const step4 = step3.filter(p => p.inStock);
// Total: 120ms

// ✅ Fast: Single pass with combined filter
const sandbox = {
  matchesCriteria: (p) => {
    return p.category === 'Electronics' &&
           p.price < 1000 &&
           p.inStock;
  }
};

const result = await JSONPath.query(
  '$.products[?(@.matchesCriteria())]',
  catalog,
  { sandbox }
);
// Total: 28ms (4.3x faster)
```

### Log Analysis

```typescript
// Process large log files efficiently
const logs = { entries: [/* millions of entries */] };

// ❌ Slow: Load all error logs
const errors = await JSONPath.query(
  '$.entries[?(@.level === "ERROR")]',
  logs
);
// Memory: 500MB, Time: 2.5s

// ✅ Fast: Stream and process
let errorCount = 0;
for await (const entry of streamArray(logs, '$.entries[*]')) {
  if (entry.level === 'ERROR') {
    await processError(entry);
    errorCount++;
  }
}
// Memory: 50MB, Time: 1.2s
```

### API Response Transformation

```typescript
// Transform large API response efficiently
const apiResponse = {
  data: {
    users: [/* 50000 users */]
  }
};

// ❌ Slow: Multiple queries
const names = await JSONPath.query('$.data.users[*].name', apiResponse);
const emails = await JSONPath.query('$.data.users[*].email', apiResponse);
const combined = names.map((name, i) => ({ name, email: emails[i] }));
// Total: 85ms

// ✅ Fast: Single query with transform
const result = await JSONPath.create(apiResponse)
  .query('$.data.users[*]')
  .map(user => ({ name: user.name, email: user.email }))
  .execute();
// Total: 32ms (2.7x faster)
```

## Performance Checklist

### Before Optimization

```typescript
// Profile your queries
console.time('query');
const result = await JSONPath.query(path, data);
console.timeEnd('query');

// Check memory usage
const memBefore = process.memoryUsage().heapUsed;
await JSONPath.query(path, largeData);
const memAfter = process.memoryUsage().heapUsed;
console.log(`Memory used: ${(memAfter - memBefore) / 1024 / 1024} MB`);
```

### Optimization Priorities

1. **Use specific paths** instead of recursive descent
2. **Filter in JSONPath** instead of JavaScript
3. **Enable caching** for repeated queries
4. **Use streaming** for large datasets
5. **Reuse query instances** when possible
6. **Batch operations** to allow GC
7. **Profile and measure** actual impact

## See Also

- [Performance Guide](../performance.md) - General optimization strategies
- [Caching Guide](../guide/caching.md) - Cache configuration
- [Advanced Patterns](../guide/advanced-patterns.md) - Complex optimizations
- [Streaming API](../guide/streaming.md) - Memory-efficient processing
