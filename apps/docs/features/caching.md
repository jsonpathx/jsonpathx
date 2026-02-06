# Caching Deep Dive

Comprehensive guide to caching strategies, LRU eviction, TTL management, cache statistics, and performance optimization with jsonpathx.

## Overview

jsonpathx includes a sophisticated caching system with:
- **LRU (Least Recently Used) eviction** - Automatic removal of old entries
- **TTL (Time To Live)** - Automatic expiration of stale data
- **Cache statistics** - Monitor hit rates and performance
- **Per-query caching** - Fine-grained control

## Enabling Cache

### Global Cache

```typescript
import { JSONPath } from 'jsonpathx';

// Enable caching globally
JSONPath.enableCache({
  maxSize: 200,      // Cache up to 200 queries
  ttl: 120000,       // 2 minutes TTL
  persistence: false // No persistence (default)
});

// Queries will use cache automatically
const result = await JSONPath.query('$.items[*]', data, {
  enableCache: true
});
```

### Default Options

```typescript
const DEFAULT_CACHE_OPTIONS = {
  maxSize: 100,    // 100 queries
  ttl: 60000,      // 1 minute
  persistence: false
};
```

## Cache Configuration

### Max Size (LRU Eviction)

```typescript
// Small cache for memory-constrained environments
JSONPath.enableCache({ maxSize: 50 });

// Large cache for performance-critical applications
JSONPath.enableCache({ maxSize: 500 });

// Unlimited cache (use with caution)
JSONPath.enableCache({ maxSize: Infinity });
```

### TTL (Time To Live)

```typescript
// Short TTL for frequently changing data
JSONPath.enableCache({ ttl: 30000 }); // 30 seconds

// Long TTL for static data
JSONPath.enableCache({ ttl: 3600000 }); // 1 hour

// No expiration
JSONPath.enableCache({ ttl: Infinity });
```

## Per-Query Caching

### Enable for Specific Queries

```typescript
// Cache this expensive query
const expensive = await JSONPath.query(
  '$..[?(@.type === "complex")]',
  data,
  { enableCache: true }
);

// Don't cache this simple query
const simple = await JSONPath.query(
  '$.id',
  data,
  { enableCache: false }
);
```

### QueryBuilder Caching

```typescript
const result = await JSONPath.create(data)
  .query('$.products[*]')
  .filter(p => p.price > 100)
  .cached(true)  // Enable caching
  .execute();
```

## Cache Management

### Clear Cache

```typescript
// Clear all cached queries
JSONPath.clearCache();

// Clear after data updates
async function updateData(newData: any) {
  data = newData;
  JSONPath.clearCache(); // Invalidate cache
}
```

### Disable Cache

```typescript
// Temporarily disable caching
JSONPath.disableCache();

// Perform operations without cache
await performOperations();

// Re-enable caching
JSONPath.enableCache();
```

## Cache Statistics

### Get Statistics

```typescript
const stats = JSONPath.getCacheStats();

console.log('Cache size:', stats.size);
console.log('Max size:', stats.maxSize);
console.log('Total accesses:', stats.totalAccesses);
console.log('Average accesses per entry:', stats.averageAccesses);
console.log('Oldest entry timestamp:', stats.oldestEntry);
console.log('Newest entry timestamp:', stats.newestEntry);
```

### Monitor Hit Rate

```typescript
function monitorCachePerformance() {
  const before = JSONPath.getCacheStats();

  // Perform queries
  await runQueries();

  const after = JSONPath.getCacheStats();

  const hitRate = (after.totalAccesses - before.totalAccesses) /
                  (after.size - before.size);

  console.log('Hit rate:', hitRate);
}
```

## Cache Keys

Cache keys are generated from:
1. JSONPath expression
2. Query options (excluding data)

```typescript
// Same cache key (same path, same options)
await JSONPath.query('$.items[*]', data1, { enableCache: true });
await JSONPath.query('$.items[*]', data2, { enableCache: true });

// Different cache keys (different paths)
await JSONPath.query('$.items[*]', data, { enableCache: true });
await JSONPath.query('$.users[*]', data, { enableCache: true });

// Different cache keys (different options)
await JSONPath.query('$.items[*]', data, { resultType: 'value' });
await JSONPath.query('$.items[*]', data, { resultType: 'path' });
```

## Performance Strategies

### Strategy 1: Cache Expensive Queries

```typescript
// Complex recursive queries benefit most from caching
const deepResults = await JSONPath.query(
  '$..[?(@.type === "specific")]',
  largeData,
  { enableCache: true }
);

// Simple queries may not benefit
const simpleResults = await JSONPath.query(
  '$.id',
  data,
  { enableCache: false }
);
```

### Strategy 2: Tiered TTL

```typescript
// Different TTL for different data types
async function queryWithTTL(path: string, data: any, dataType: string) {
  const ttlMap = {
    static: 3600000,    // 1 hour for static data
    dynamic: 60000,     // 1 minute for dynamic data
    realtime: 5000      // 5 seconds for real-time data
  };

  JSONPath.enableCache({ ttl: ttlMap[dataType] });
  return JSONPath.query(path, data, { enableCache: true });
}
```

### Strategy 3: Selective Caching

```typescript
async function smartQuery(path: string, data: any) {
  // Determine if query should be cached
  const isComplex = path.includes('..') || path.includes('[?(');
  const isLargeData = JSON.stringify(data).length > 100000;

  return JSONPath.query(path, data, {
    enableCache: isComplex || isLargeData
  });
}
```

## Memory Management

### Monitor Memory Usage

```typescript
function estimateCacheSize() {
  const stats = JSONPath.getCacheStats();
  const estimatedBytes = stats.size * 1000; // Rough estimate
  const estimatedMB = estimatedBytes / (1024 * 1024);

  console.log(`Estimated cache size: ${estimatedMB.toFixed(2)} MB`);

  if (estimatedMB > 100) {
    console.warn('Cache size exceeding 100MB, consider reducing maxSize');
  }
}
```

### Adaptive Cache Size

```typescript
function adaptiveCacheSize() {
  const stats = JSONPath.getCacheStats();
  const hitRate = stats.totalAccesses / stats.size;

  if (hitRate > 10) {
    // High hit rate, increase cache size
    JSONPath.enableCache({ maxSize: stats.maxSize + 50 });
  } else if (hitRate < 2) {
    // Low hit rate, decrease cache size
    JSONPath.enableCache({ maxSize: Math.max(50, stats.maxSize - 50) });
  }
}
```

## Cache Invalidation Strategies

### Time-Based Invalidation

```typescript
// Clear cache periodically
setInterval(() => {
  JSONPath.clearCache();
}, 300000); // Every 5 minutes
```

### Event-Based Invalidation

```typescript
class DataStore {
  private data: any;

  async updateData(newData: any) {
    this.data = newData;
    JSONPath.clearCache(); // Invalidate on update
  }

  async query(path: string) {
    return JSONPath.query(path, this.data, {
      enableCache: true
    });
  }
}
```

### Selective Invalidation

```typescript
// Note: jsonpathx doesn't support selective invalidation by default
// You'll need to implement a wrapper

class SelectiveCache {
  private caches = new Map<string, any>();

  async query(category: string, path: string, data: any) {
    if (!this.caches.has(category)) {
      JSONPath.enableCache();
      this.caches.set(category, true);
    }

    return JSONPath.query(path, data, { enableCache: true });
  }

  invalidate(category: string) {
    // Clear specific category
    this.caches.delete(category);
    JSONPath.clearCache();
  }
}
```

## Best Practices

### 1. Enable for Repeated Queries

```typescript
// ✅ Good: Repeated query benefits from cache
for (let i = 0; i < 100; i++) {
  await JSONPath.query('$.items[*]', data, { enableCache: true });
}

// ❌ Bad: One-time query doesn't benefit
await JSONPath.query('$.items[*]', data, { enableCache: true });
```

### 2. Clear Cache on Data Changes

```typescript
// ✅ Good: Invalidate after update
async function updateUser(userId: string, updates: any) {
  await saveUser(userId, updates);
  JSONPath.clearCache();
}

// ❌ Bad: Stale data in cache
async function updateUser(userId: string, updates: any) {
  await saveUser(userId, updates);
  // Cache still contains old data
}
```

### 3. Monitor Cache Performance

```typescript
// ✅ Good: Regular monitoring
setInterval(() => {
  const stats = JSONPath.getCacheStats();
  logger.info('Cache stats', stats);
}, 60000);

// Set up alerts
if (stats.size / stats.maxSize > 0.9) {
  logger.warn('Cache nearly full');
}
```

### 4. Use Appropriate TTL

```typescript
// ✅ Good: Match TTL to data volatility
JSONPath.enableCache({
  ttl: isRealtime ? 5000 : isStatic ? 3600000 : 60000
});

// ❌ Bad: Same TTL for all data types
JSONPath.enableCache({ ttl: 60000 }); // Too long or too short?
```

### 5. Consider Memory Constraints

```typescript
// ✅ Good: Limit cache size based on environment
const maxSize = process.env.NODE_ENV === 'production' ? 200 : 50;
JSONPath.enableCache({ maxSize });

// ❌ Bad: Unlimited cache in production
JSONPath.enableCache({ maxSize: Infinity });
```

## Troubleshooting

### Cache Not Working

```typescript
// Check if cache is enabled
const stats = JSONPath.getCacheStats();
if (stats.maxSize === 0) {
  console.log('Cache is disabled');
}

// Verify enableCache option
await JSONPath.query(path, data, {
  enableCache: true  // Must be true
});
```

### High Memory Usage

```typescript
// Reduce cache size
JSONPath.enableCache({ maxSize: 50 });

// Reduce TTL
JSONPath.enableCache({ ttl: 30000 });

// Clear cache more frequently
setInterval(() => JSONPath.clearCache(), 60000);
```

### Low Hit Rate

```typescript
const stats = JSONPath.getCacheStats();
const hitRate = stats.totalAccesses / stats.size;

if (hitRate < 2) {
  console.log('Low hit rate - queries not being repeated');
  // Consider disabling cache or identifying cacheable queries
}
```

## See Also

- [Performance Guide](../performance.md) - Performance optimization
- [Advanced Patterns](../guide/advanced-patterns.md) - Advanced caching patterns
- [API Reference](../api/jsonpath.md) - Cache API methods
