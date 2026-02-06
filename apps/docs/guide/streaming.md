# Streaming API

Learn how to efficiently process large JSON datasets using jsonpathx's streaming capabilities. Stream data without loading everything into memory.

## Overview

The streaming API allows you to process JSON arrays incrementally, yielding one item at a time. This is essential for:
- Large datasets (millions of records)
- Memory-constrained environments
- Real-time processing
- Progressive data handling

## Basic Streaming

### `streamArray()`

Stream array elements one at a time:

```typescript
import { streamArray } from '@jsonpathx/jsonpathx';

const data = {
  items: [/* millions of items */]
};

// Process items one by one
for await (const item of streamArray(data, '$.items[*]')) {
  await processItem(item);
  // Memory is released after each iteration
}
```

**Benefits**:
- Constant memory usage
- No need to load entire result set
- Can start processing immediately

## Batched Streaming

### `streamArrayBatched()`

Process items in batches for better performance:

```typescript
import { streamArrayBatched } from '@jsonpathx/jsonpathx';

// Process 100 items at a time
for await (const batch of streamArrayBatched(data, '$.items[*]', { batchSize: 100 })) {
  await processBatch(batch);
  // batch is an array of 100 items
}
```

**Use Cases**:
- Bulk database inserts
- Batch API calls
- Parallel processing

## File Streaming

### `streamArrayFile()`

Stream directly from large JSON files:

```typescript
import { streamArrayFile } from '@jsonpathx/jsonpathx';

// Stream from 1GB+ JSON file
for await (const item of streamArrayFile('huge-data.json', '$.items[*]')) {
  await processItem(item);
}
```

**Benefits**:
- No need to load entire file into memory
- Works with files larger than available RAM
- Progressive parsing

## Streaming Options

```typescript
interface StreamingOptions {
  batchSize?: number;      // Items per batch (default: 1)
  highWaterMark?: number;  // Buffer size (default: 16)
  signal?: AbortSignal;    // Cancellation support
}
```

### Example with Options

```typescript
const controller = new AbortController();

for await (const item of streamArray(data, '$.items[*]', {
  batchSize: 50,
  highWaterMark: 32,
  signal: controller.signal
})) {
  if (shouldStop()) {
    controller.abort();
    break;
  }
  await processItem(item);
}
```

## Advanced Patterns

### Filter While Streaming

```typescript
import { filterArray } from '@jsonpathx/jsonpathx';

// Stream only matching items
for await (const item of filterArray(data, '$.items[*]', item => item.active)) {
  await processActiveItem(item);
}
```

### Transform While Streaming

```typescript
import { transformArray } from '@jsonpathx/jsonpathx';

// Transform items as they stream
for await (const transformed of transformArray(
  data,
  '$.items[*]',
  item => ({ id: item.id, name: item.name })
)) {
  await saveTransformed(transformed);
}
```

### Reduce While Streaming

```typescript
import { reduceArray } from '@jsonpathx/jsonpathx';

// Calculate aggregate without loading all data
const sum = await reduceArray(
  data,
  '$.items[*].price',
  (acc, price) => acc + price,
  0
);

console.log('Total:', sum);
```

## Practical Examples

### Process Large Log Files

```typescript
async function analyzeLogs(logFile: string) {
  let errorCount = 0;
  const errors: any[] = [];

  for await (const entry of streamArrayFile(logFile, '$.logs[*]')) {
    if (entry.level === 'ERROR') {
      errorCount++;
      errors.push({
        timestamp: entry.timestamp,
        message: entry.message
      });
    }
  }

  return { errorCount, errors: errors.slice(0, 100) };
}
```

### Batch Database Import

```typescript
async function importToDatabase(data: any) {
  let imported = 0;

  for await (const batch of streamArrayBatched(data, '$.users[*]', { batchSize: 1000 })) {
    await db.users.insertMany(batch);
    imported += batch.length;
    console.log(`Imported ${imported} users...`);
  }

  console.log(`Total imported: ${imported}`);
}
```

### Progressive API Processing

```typescript
async function syncWithAPI(data: any) {
  for await (const item of streamArray(data, '$.items[*]')) {
    try {
      await api.sync(item);
      await delay(100); // Rate limiting
    } catch (error) {
      console.error(`Failed to sync item ${item.id}:`, error);
    }
  }
}
```

## Performance Comparison

### Without Streaming

```typescript
// ❌ Loads everything into memory
const items = await JSONPath.query('$.items[*]', hugeData);
for (const item of items) {
  await processItem(item);
}
// Peak memory: 2GB for 1M items
```

### With Streaming

```typescript
// ✅ Constant memory usage
for await (const item of streamArray(hugeData, '$.items[*]')) {
  await processItem(item);
}
// Peak memory: 50MB regardless of dataset size
```

## Counting Matches

### `countMatches()`

Count matching items without loading them:

```typescript
import { countMatches } from '@jsonpathx/jsonpathx';

// Count without loading into memory
const count = await countMatches(data, '$.items[?(@.active === true)]');
console.log(`Found ${count} active items`);
```

## Finding First Match

### `findFirst()`

Stop at first matching item:

```typescript
import { findFirst } from '@jsonpathx/jsonpathx';

// Find first match and stop
const first = await findFirst(data, '$.items[?(@.id === 123)]');

if (first) {
  console.log('Found:', first);
} else {
  console.log('Not found');
}
```

## Error Handling

```typescript
try {
  for await (const item of streamArray(data, '$.items[*]')) {
    try {
      await processItem(item);
    } catch (itemError) {
      console.error('Item processing failed:', itemError);
      // Continue with next item
    }
  }
} catch (streamError) {
  console.error('Stream failed:', streamError);
}
```

## Cancellation

```typescript
const controller = new AbortController();

// Cancel after 10 seconds
setTimeout(() => controller.abort(), 10000);

try {
  for await (const item of streamArray(data, '$.items[*]', {
    signal: controller.signal
  })) {
    await processItem(item);
  }
} catch (error) {
  if (error.name === 'AbortError') {
    console.log('Stream cancelled');
  }
}
```

## Best Practices

### 1. Use Appropriate Batch Sizes

```typescript
// Small batches: Lower memory, more overhead
streamArrayBatched(data, path, { batchSize: 10 });

// Large batches: Higher memory, less overhead
streamArrayBatched(data, path, { batchSize: 1000 });

// Balance based on your needs
```

### 2. Handle Backpressure

```typescript
for await (const batch of streamArrayBatched(data, path, { batchSize: 100 })) {
  // Wait for processing before continuing
  await processBatch(batch);

  // Allow other tasks to run
  await new Promise(resolve => setImmediate(resolve));
}
```

### 3. Monitor Progress

```typescript
let processed = 0;
const total = await countMatches(data, '$.items[*]');

for await (const item of streamArray(data, '$.items[*]')) {
  await processItem(item);
  processed++;

  if (processed % 1000 === 0) {
    console.log(`Progress: ${processed}/${total} (${(processed/total*100).toFixed(1)}%)`);
  }
}
```

## TypeScript Support

```typescript
interface Item {
  id: number;
  name: string;
}

// Typed streaming
for await (const item of streamArray<Item>(data, '$.items[*]')) {
  // item is typed as Item
  console.log(item.name);
}
```

## When to Use Streaming

### Use Streaming When:
- Dataset > 100MB
- Processing items individually
- Memory is limited
- Need progressive processing
- Working with files

### Use Regular Queries When:
- Small datasets (< 10MB)
- Need all data at once
- Performing aggregations
- Data fits in memory

## See Also

- [Advanced Patterns](./advanced-patterns.md) - Complex query techniques
- [Performance Guide](../performance.md) - Optimization strategies
- [API Reference](../api/index.md) - Complete API documentation
