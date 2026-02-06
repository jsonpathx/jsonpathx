# Caching

Learn how to use jsonpathx's built-in caching system to optimize query performance. Understand cache configuration, strategies, and best practices for different use cases.

## Overview

jsonpathx includes an LRU (Least Recently Used) cache with TTL (Time To Live) support. Caching can dramatically improve performance for repeated queries, especially with expensive operations like recursive descent and complex filters.

## Quick Start

### Enable Global Cache

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

// Enable cache with default settings
JSONPath.enableCache();

// Use cache in queries
const result = await JSONPath.query(path, data, {
  enableCache: true
});
```

### Configure Cache

```typescript
// Custom configuration
JSONPath.enableCache({
  maxSize: 200,      // Maximum 200 cached queries
  ttl: 120000       // 2 minutes TTL (in milliseconds)
});
```

## Cache Configuration

### CacheOptions

```typescript
interface CacheOptions {
  maxSize?: number;  // Maximum cache entries (default: 100)
  ttl?: number;      // Time to live in ms (default: 60000)
}
```

### Default Settings

```typescript
{
  maxSize: 100,      // Store up to 100 query results
  ttl: 60000        // Results expire after 1 minute
}
```

### Update Configuration

```typescript
// Change cache settings at runtime
JSONPath.enableCache({
  maxSize: 500,
  ttl: 300000  // 5 minutes
});
```

## Using the Cache

### Per-Query Caching

```typescript
// First execution - cache miss
const result1 = await JSONPath.query(
  '$.expensive.query[*]',
  data,
  { enableCache: true }
);
// Query executed: 45ms

// Second execution - cache hit
const result2 = await JSONPath.query(
  '$.expensive.query[*]',
  data,
  { enableCache: true }
);
// Cache hit: < 1ms (90%+ faster)
```

### Cache Keys

Cache keys are generated from:
1. JSONPath expression
2. Query options (excluding `enableCache`)

```typescript
// Different cache entries
await JSONPath.query('$.items[*]', data, { enableCache: true });
await JSONPath.query('$.items[*]', data, { enableCache: true, flatten: true });
// ^ Different options = different cache keys

// Same cache entry
await JSONPath.query('$.items[*]', data, { enableCache: true });
await JSONPath.query('$.items[*]', data, { enableCache: true });
// ^ Identical query = cache hit
```

## Cache Management

### Clear Cache

```typescript
// Clear all cached entries
JSONPath.clearCache();

// Clear specific entry (by path)
JSONPath.clearCache('$.specific.path[*]');
```

### Disable Cache

```typescript
// Disable caching globally
JSONPath.disableCache();

// Cache is now inactive
await JSONPath.query(path, data, { enableCache: true });
// Still executes, but caching is disabled
```

### Check Cache Stats

```typescript
const stats = JSONPath.getCacheStats();

console.log(stats);
// {
//   size: 45,          // Current entries
//   hits: 234,         // Cache hits
//   misses: 89,        // Cache misses
//   hitRate: 0.724,    // Hit rate (72.4%)
//   maxSize: 100,      // Configured max size
//   ttl: 60000        // Configured TTL
// }
```

## Cache Strategies

### Strategy 1: Always Cache

Best for: Static data, configuration, reference data

```typescript
// Cache everything
JSONPath.enableCache({ maxSize: 500, ttl: 600000 });

// All queries use cache
async function query(path: string, data: any) {
  return JSONPath.query(path, data, { enableCache: true });
}
```

### Strategy 2: Selective Caching

Best for: Mixed workloads

```typescript
// Cache expensive queries only
async function query(path: string, data: any) {
  const isExpensive = path.includes('..') || path.includes('[?(');

  return JSONPath.query(path, data, {
    enableCache: isExpensive
  });
}
```

### Strategy 3: TTL-Based

Best for: Frequently changing data

```typescript
// Short TTL for dynamic data
JSONPath.enableCache({
  maxSize: 200,
  ttl: 5000  // 5 seconds
});

// Long TTL for static data
JSONPath.enableCache({
  maxSize: 100,
  ttl: 3600000  // 1 hour
});
```

### Strategy 4: Manual Invalidation

Best for: Event-driven updates

```typescript
// Cache results
await JSONPath.query(path, data, { enableCache: true });

// Data changed - clear cache
function onDataUpdate() {
  JSONPath.clearCache();
}

// Or clear specific paths
function onItemUpdate(itemPath: string) {
  JSONPath.clearCache(itemPath);
}
```

## Performance Impact

### Cache Hit Performance

```typescript
// Without cache
console.time('no-cache');
await JSONPath.query('$..items[?(@.price > 100)]', largeData);
console.timeEnd('no-cache');
// no-cache: 45.2ms

// With cache (first time)
console.time('cache-miss');
await JSONPath.query('$..items[?(@.price > 100)]', largeData, {
  enableCache: true
});
console.timeEnd('cache-miss');
// cache-miss: 45.8ms (slight overhead)

// With cache (subsequent)
console.time('cache-hit');
await JSONPath.query('$..items[?(@.price > 100)]', largeData, {
  enableCache: true
});
console.timeEnd('cache-hit');
// cache-hit: 0.3ms (150x faster!)
```

### Memory Usage

Cache memory usage depends on:
- Number of cached entries (`maxSize`)
- Size of query results
- Result complexity

**Estimate**:
```
Memory ≈ maxSize × avgResultSize × 2
```

**Example**:
- maxSize: 100
- avgResultSize: 10KB
- Memory: ~2MB

## Best Practices

### 1. Cache Expensive Queries

```typescript
// ✅ Good: Cache recursive descent
await JSONPath.query('$..users[*]', data, { enableCache: true });

// ✅ Good: Cache complex filters
await JSONPath.query('$.items[?(@.complex.logic)]', data, { enableCache: true });

// ❌ Bad: Cache simple queries
await JSONPath.query('$.simple', data, { enableCache: true });
// Not worth caching overhead
```

### 2. Set Appropriate TTL

```typescript
// Static data: Long TTL
JSONPath.enableCache({ ttl: 3600000 });  // 1 hour

// Dynamic data: Short TTL
JSONPath.enableCache({ ttl: 5000 });     // 5 seconds

// Real-time data: Don't cache
// enableCache: false
```

### 3. Monitor Cache Performance

```typescript
// Periodically check cache effectiveness
setInterval(() => {
  const stats = JSONPath.getCacheStats();

  if (stats.hitRate < 0.5) {
    console.warn('Low cache hit rate:', stats.hitRate);
    // Consider adjusting strategy
  }

  console.log(`Cache: ${stats.hits} hits, ${stats.misses} misses`);
}, 60000);
```

### 4. Clear Cache on Data Changes

```typescript
// Clear cache when data updates
async function updateData(newData: any) {
  // Update data source
  await saveData(newData);

  // Invalidate cache
  JSONPath.clearCache();
}
```

### 5. Tune Cache Size

```typescript
// Development: Small cache
if (process.env.NODE_ENV === 'development') {
  JSONPath.enableCache({ maxSize: 50 });
}

// Production: Larger cache
if (process.env.NODE_ENV === 'production') {
  JSONPath.enableCache({ maxSize: 500 });
}
```

## Advanced Patterns

### Custom Cache Keys

```typescript
// Include data version in cache key
let dataVersion = 1;

async function query(path: string, data: any) {
  const versionedPath = `${path}:v${dataVersion}`;

  return JSONPath.query(versionedPath, data, {
    enableCache: true
  });
}

// Invalidate by bumping version
function onDataUpdate() {
  dataVersion++;
  // Old cache entries become unreachable
}
```

### Layered Caching

```typescript
// L1: Memory cache (fast, small)
JSONPath.enableCache({ maxSize: 50, ttl: 10000 });

// L2: Redis cache (slower, larger)
async function queryWithRedis(path: string, data: any) {
  // Try L1 cache
  const l1Result = await JSONPath.query(path, data, {
    enableCache: true
  });

  if (l1Result) return l1Result;

  // Try L2 cache (Redis)
  const l2Result = await redis.get(path);
  if (l2Result) {
    return JSON.parse(l2Result);
  }

  // Execute query and cache in both layers
  const result = await JSONPath.query(path, data);
  await redis.set(path, JSON.stringify(result), 'EX', 60);

  return result;
}
```

### Prewarming Cache

```typescript
// Prewarm cache with common queries
async function prewarmCache(data: any) {
  const commonQueries = [
    '$.users[*]',
    '$.products[?(@.featured)]',
    '$.categories[*].items[*]'
  ];

  for (const path of commonQueries) {
    await JSONPath.query(path, data, { enableCache: true });
  }

  console.log('Cache prewarmed');
}
```

## Debugging Cache Issues

### Enable Cache Logging

```typescript
// Custom cache implementation with logging
import { QueryCache } from '@jsonpathx/jsonpathx';

class LoggingCache extends QueryCache {
  get(key: string) {
    const result = super.get(key);
    console.log(`Cache ${result ? 'HIT' : 'MISS'}: ${key}`);
    return result;
  }
}

// Use custom cache
const cache = new LoggingCache({ maxSize: 100 });
```

### Monitor Cache Stats

```typescript
// Log cache stats periodically
setInterval(() => {
  const stats = JSONPath.getCacheStats();
  console.log('Cache Stats:', {
    size: `${stats.size}/${stats.maxSize}`,
    hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
    hits: stats.hits,
    misses: stats.misses
  });
}, 10000);
```

## Common Issues

### Issue 1: Low Hit Rate

**Problem**: Cache hit rate < 50%

**Solutions**:
- Increase cache size
- Increase TTL
- Use more consistent query patterns
- Check if data changes frequently

### Issue 2: High Memory Usage

**Problem**: Cache uses too much memory

**Solutions**:
- Reduce `maxSize`
- Reduce TTL
- Don't cache large result sets
- Clear cache more frequently

### Issue 3: Stale Data

**Problem**: Cache returns outdated results

**Solutions**:
- Reduce TTL
- Clear cache on data updates
- Use event-driven invalidation

## See Also

- [Performance Guide](../performance.md) - General optimization
- [Query Options](./options.md) - All query configuration
- [Advanced Patterns](./advanced-patterns.md) - Complex query techniques
- [API Reference](../api/cache.md) - Cache API documentation
