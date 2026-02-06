# Cache API Reference

Complete API reference for jsonpathx's caching system. Learn about cache configuration, management, and monitoring.

## QueryCache Class

LRU (Least Recently Used) cache with TTL (Time To Live) support.

### Constructor

```typescript
new QueryCache(options?: CacheOptions)
```

**Parameters**:

```typescript
interface CacheOptions {
  maxSize?: number;  // Maximum cache entries (default: 100)
  ttl?: number;      // Time to live in milliseconds (default: 60000)
}
```

**Example**:

```typescript
import { QueryCache } from 'jsonpathx';

const cache = new QueryCache({
  maxSize: 200,
  ttl: 120000  // 2 minutes
});
```

---

## Instance Methods

### `get(key: string): T | undefined`

Retrieve cached value.

**Parameters**:
- `key` - Cache key (typically the query path)

**Returns**: Cached value or `undefined` if not found or expired

**Example**:

```typescript
const result = cache.get('$.items[*]');

if (result) {
  console.log('Cache hit!');
  return result;
}

console.log('Cache miss');
```

---

### `set(key: string, value: T): void`

Store value in cache.

**Parameters**:
- `key` - Cache key
- `value` - Value to cache

**Example**:

```typescript
const result = await JSONPath.query('$.items[*]', data);
cache.set('$.items[*]', result);
```

---

### `has(key: string): boolean`

Check if key exists in cache (and not expired).

**Parameters**:
- `key` - Cache key

**Returns**: `true` if cached and valid

**Example**:

```typescript
if (cache.has('$.items[*]')) {
  console.log('Key is cached');
}
```

---

### `delete(key: string): boolean`

Remove specific key from cache.

**Parameters**:
- `key` - Cache key to remove

**Returns**: `true` if key was found and removed

**Example**:

```typescript
cache.delete('$.old.query[*]');
```

---

### `clear(): void`

Clear all cache entries.

**Example**:

```typescript
cache.clear();
console.log('Cache cleared');
```

---

### `getStats(): CacheStats`

Get cache statistics.

**Returns**:

```typescript
interface CacheStats {
  size: number;       // Current number of entries
  hits: number;       // Total cache hits
  misses: number;     // Total cache misses
  hitRate: number;    // Hit rate (0-1)
  maxSize: number;    // Configured maximum size
  ttl: number;        // Configured TTL in milliseconds
  evictions: number;  // Number of evicted entries
}
```

**Example**:

```typescript
const stats = cache.getStats();

console.log(`Cache: ${stats.size}/${stats.maxSize} entries`);
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`);
```

---

### `resize(newSize: number): void`

Change cache maximum size.

**Parameters**:
- `newSize` - New maximum number of entries

**Example**:

```typescript
// Increase cache size
cache.resize(500);

// Decrease (will evict oldest entries)
cache.resize(50);
```

---

### `setTTL(ttl: number): void`

Change TTL for future entries.

**Parameters**:
- `ttl` - Time to live in milliseconds

**Example**:

```typescript
// Extend TTL to 5 minutes
cache.setTTL(300000);
```

---

## Global Cache Functions

### `getGlobalCache(): QueryCache`

Get the global cache instance used by JSONPath.

**Returns**: Global `QueryCache` instance

**Example**:

```typescript
import { getGlobalCache } from 'jsonpathx';

const cache = getGlobalCache();
const stats = cache.getStats();
console.log('Global cache stats:', stats);
```

---

### `resetGlobalCache(): void`

Reset global cache to default configuration.

**Example**:

```typescript
import { resetGlobalCache } from 'jsonpathx';

resetGlobalCache();
// Global cache now has default settings (maxSize: 100, ttl: 60000)
```

---

## JSONPath Integration

### Enable Cache

```typescript
import { JSONPath } from 'jsonpathx';

// Enable with defaults
JSONPath.enableCache();

// Enable with custom settings
JSONPath.enableCache({
  maxSize: 200,
  ttl: 120000
});
```

---

### Disable Cache

```typescript
JSONPath.disableCache();
```

---

### Clear Cache

```typescript
// Clear all
JSONPath.clearCache();

// Clear specific key
JSONPath.clearCache('$.specific.path[*]');
```

---

### Get Cache Stats

```typescript
const stats = JSONPath.getCacheStats();
console.log(`Cache hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);
```

---

## Cache Keys

Cache keys are automatically generated from:
1. JSONPath expression
2. Query options (excluding `enableCache`)

### Key Generation

```typescript
// Different cache keys
await JSONPath.query('$.items[*]', data, { enableCache: true });
await JSONPath.query('$.items[*]', data, { enableCache: true, flatten: true });
// ^ Different keys due to different options

// Same cache key
await JSONPath.query('$.items[*]', data, { enableCache: true });
await JSONPath.query('$.items[*]', data, { enableCache: true });
// ^ Same key = cache hit
```

---

## LRU Eviction

When cache is full, least recently used entries are evicted.

**Algorithm**:
1. New entry needed
2. Cache is at `maxSize`
3. Find least recently accessed entry
4. Remove it
5. Add new entry

**Example**:

```typescript
const cache = new QueryCache({ maxSize: 2 });

cache.set('key1', 'value1');
cache.set('key2', 'value2');
cache.get('key1');  // Access key1 (makes it recent)
cache.set('key3', 'value3');  // Evicts key2 (least recent)

cache.has('key1');  // true
cache.has('key2');  // false (evicted)
cache.has('key3');  // true
```

---

## TTL Expiration

Entries expire after TTL milliseconds.

**Example**:

```typescript
const cache = new QueryCache({ ttl: 1000 });  // 1 second

cache.set('key', 'value');
console.log(cache.has('key'));  // true

await new Promise(resolve => setTimeout(resolve, 1100));

console.log(cache.has('key'));  // false (expired)
```

---

## Monitoring

### Real-time Monitoring

```typescript
setInterval(() => {
  const stats = cache.getStats();

  console.log({
    size: stats.size,
    hitRate: `${(stats.hitRate * 100).toFixed(1)}%`,
    evictions: stats.evictions
  });
}, 10000);  // Every 10 seconds
```

### Performance Tracking

```typescript
const before = cache.getStats();

// Run queries...
await runQueries();

const after = cache.getStats();

console.log('Query results:', {
  hits: after.hits - before.hits,
  misses: after.misses - before.misses,
  effectiveness: after.hitRate - before.hitRate
});
```

---

## Advanced Usage

### Custom Cache Implementation

```typescript
class RedisCache extends QueryCache {
  private redis: RedisClient;

  async get(key: string) {
    // Try in-memory first
    const memResult = super.get(key);
    if (memResult) return memResult;

    // Fallback to Redis
    const redisResult = await this.redis.get(key);
    if (redisResult) {
      const parsed = JSON.parse(redisResult);
      super.set(key, parsed);  // Update in-memory
      return parsed;
    }
  }

  set(key: string, value: any) {
    // Store in both
    super.set(key, value);
    this.redis.set(key, JSON.stringify(value));
  }
}
```

### Cache Warming

```typescript
async function warmCache(data: any) {
  const commonQueries = [
    '$.users[*]',
    '$.products[?(@.featured)]',
    '$.categories[*].items[*]'
  ];

  console.log('Warming cache...');

  for (const path of commonQueries) {
    await JSONPath.query(path, data, { enableCache: true });
  }

  console.log('Cache warmed with', commonQueries.length, 'queries');
}
```

### Conditional Caching

```typescript
async function smartQuery(path: string, data: any) {
  // Only cache expensive queries
  const shouldCache =
    path.includes('..') ||        // Recursive descent
    path.includes('[?(') ||       // Filters
    path.length > 50;             // Complex queries

  return JSONPath.query(path, data, {
    enableCache: shouldCache
  });
}
```

---

## Best Practices

### 1. Choose Appropriate Size

```typescript
// Small app (< 10 queries)
JSONPath.enableCache({ maxSize: 50 });

// Medium app (10-50 queries)
JSONPath.enableCache({ maxSize: 100 });

// Large app (> 50 queries)
JSONPath.enableCache({ maxSize: 500 });
```

### 2. Set TTL Based on Data

```typescript
// Static data (long TTL)
JSONPath.enableCache({ ttl: 3600000 });  // 1 hour

// Dynamic data (short TTL)
JSONPath.enableCache({ ttl: 5000 });     // 5 seconds

// Real-time data (don't cache)
// Don't enable cache
```

### 3. Monitor Hit Rate

```typescript
setInterval(() => {
  const stats = JSONPath.getCacheStats();

  if (stats.hitRate < 0.5) {
    console.warn('Low cache hit rate:', stats.hitRate);
    // Consider: increase TTL, increase size, or review query patterns
  }
}, 60000);
```

---

## See Also

- [Caching Guide](../guide/caching.md) - Comprehensive caching guide
- [Performance Guide](../performance.md) - Optimization techniques
- [Query Options](../guide/options.md) - All query options
