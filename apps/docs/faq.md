# Frequently Asked Questions

Common questions about jsonpathx, its features, and how to use it effectively.

## General

### What is jsonpathx?

jsonpathx is a high-performance JSONPath implementation built in TypeScript with a performance-focused JS engine. It provides fast query execution with advanced features like streaming, mutations, and a fluent builder API.

### How is it different from jsonpath-plus?

Key differences:
- **Performance**: Engine optimized for real-world workloads and benchmarked against jsonpath-plus/jsonpath
- **RFC 9535 Compliant**: Implements the official JSONPath standard
- **Advanced Features**: Streaming API, mutations, fluent builder
- **Single Package**: Everything ships from `jsonpathx`
- **TypeScript-First**: Full type safety and autocomplete

See [Comparison Documentation](./comparison.md) for details.

### Is it production-ready?

Yes. jsonpathx is stable and used in production. It has:
- Comprehensive test suite
- RFC 9535 compliance
- Backward compatibility with jsonpath-plus
- Active maintenance

---

## Installation & Setup

### Which package should I use?

- **Browser**: `jsonpathx`
- **Node.js**: `jsonpathx`
- **Migration from jsonpath-plus**: `jsonpathx`

### Do I need to install Rust?

No. The JS engine is bundled and runs anywhere Node or modern browsers run.

### What Node.js version is required?

Node.js 18+ is required.

---

## Usage

### Why are my queries async?

The API is async-first for consistency and to support large-data workflows. Use `await`:

```typescript
// ✅ Correct
const result = await JSONPath.query(path, data);

// ❌ Won't work
const result = JSONPath.query(path, data);
```

For synchronous queries, use `querySync` directly:

### Can I use it synchronously?

Yes:

```typescript
const result = JSONPath.querySync(path, data);
```

### How do I query nested data?

```typescript
// Use dot notation
'$.user.profile.email'

// Or bracket notation
'$["user"]["profile"]["email"]'

// Recursive descent (any depth)
'$..email'
```

### How do I filter results?

```typescript
// Simple filter
'$.users[?(@.active === true)]'

// Multiple conditions
'$.products[?(@.price < 100 && @.inStock)]'

// With custom functions
const sandbox = {
  isValid: (item) => item.verified && item.age >= 18
};

await JSONPath.query('$.users[?(@.isValid())]', data, { sandbox });
```

---

## Performance

### Is it really faster?

Performance varies by query. See the benchmarks page and performance guide for current results.

### When should I enable caching?

Enable caching when:
- Running the same query multiple times
- Query is expensive (recursive descent, complex filters)
- Data doesn't change frequently

```typescript
JSONPath.enableCache({ maxSize: 200, ttl: 120000 });

await JSONPath.query(path, data, { enableCache: true });
```

### How can I optimize my queries?

1. Use specific paths over recursive descent
2. Filter in JSONPath, not in JavaScript
3. Enable caching for repeated queries
4. Use query instances for reuse
5. Stream large datasets

See [Advanced Patterns](./guide/advanced-patterns.md) for more.

---

## Features

### Does it support mutations?

Yes! jsonpathx includes a powerful mutation API:

```typescript
import { Mutation } from 'jsonpathx';

// Set values
await Mutation.set(data, '$.user.name', 'Alice');

// Update with transform
await Mutation.update(data, '$.prices[*]', p => p * 1.1);

// Delete
await Mutation.delete(data, '$.temp');
```

See [Mutations Guide](./guide/mutations.md).

### Can I use custom functions?

Yes, through the sandbox:

```typescript
const sandbox = {
  isExpensive: (item) => item.price > 1000,
  inRange: (item, min, max) => item.value >= min && item.value <= max
};

await JSONPath.query('$.items[?(@.isExpensive())]', data, { sandbox });
```

See [Custom Functions Guide](./guide/custom-functions.md).

### Does it support streaming?

Yes, for processing large arrays without loading everything into memory:

```typescript
import { streamArray } from 'jsonpathx';

for await (const item of streamArray(data, '$.items[*]')) {
  await processItem(item);
}
```

### What's the QueryBuilder?

A fluent API for building complex queries:

```typescript
const result = await JSONPath.create(data)
  .query('$.products[*]')
  .filter(p => p.price < 100)
  .sort((a, b) => a.price - b.price)
  .take(10)
  .execute();
```

See [QueryBuilder API](./api/query-builder.md).

---

## Compatibility

### Is it compatible with jsonpath-plus?

Yes. The main package is compatible:

```typescript
import { JSONPath } from 'jsonpathx';

// Same API, just add await
const result = await JSONPath({ path: '$.items[*]', json: data });
```

### What browsers are supported?

All modern browsers:
- Chrome 57+
- Firefox 52+
- Safari 11+
- Edge 79+

### Can I use it in React/Vue/Angular?

Yes! jsonpathx works with all frameworks. See integration guides:
- [React Integration](./integrations/react.md)
- [Vue Integration](./integrations/vue.md)
- [Angular Integration](./integrations/angular.md)

---

## TypeScript

### How do I add types?

Use generic type parameters:

```typescript
interface User {
  id: number;
  name: string;
}

const users = await JSONPath.query<User>('$.users[*]', data);
// users: User[]
```

### Does QueryBuilder support types?

Yes:

```typescript
const users = await JSONPath.create<User>(data)
  .query('$.users[*]')
  .filter(u => u.active)  // u is typed as User
  .execute();
```

See [TypeScript Guide](./guide/typescript.md).

---

## Troubleshooting

### Why am I getting "unknown[]" type?

Add a type parameter:

```typescript
// ❌ Returns unknown[]
const items = await JSONPath.query('$.items[*]', data);

// ✅ Returns Item[]
const items = await JSONPath.query<Item>('$.items[*]', data);
```

### Query returns empty array?

Check:
1. Data structure matches path
2. Filter conditions are correct
3. Property names are exact (case-sensitive)

Debug incrementally:
```typescript
// Start simple
await JSONPath.query('$', data);
await JSONPath.query('$.items', data);
await JSONPath.query('$.items[*]', data);
```

### Memory usage is high?

Solutions:
1. Use streaming for large datasets
2. Reduce cache size
3. Clear cache periodically
4. Use `immutable: false` for mutations

See [Troubleshooting Guide](./troubleshooting.md).

---

## Advanced

### Can I create reusable queries?

Yes:

```typescript
const query = JSONPath.create(null)
  .query('$.items[*]')
  .filter(i => i.active)
  .build();

// Reuse with different data
const r1 = await query.evaluate(data1);
const r2 = await query.evaluate(data2);
```

### How do I handle errors?

```typescript
try {
  const result = await JSONPath.query(path, data);
} catch (error) {
  if (error.error?.type === 'parse') {
    console.error('Invalid JSONPath syntax');
  } else if (error.error?.type === 'evaluation') {
    console.error('Query evaluation failed');
  }
}
```

Or use `ignoreEvalErrors`:

```typescript
await JSONPath.query(path, data, {
  ignoreEvalErrors: true  // Treats errors as false
});
```

### Can I process data in parallel?

Yes:

```typescript
const queries = [
  JSONPath.query('$.users[*]', data),
  JSONPath.query('$.products[*]', data),
  JSONPath.query('$.orders[*]', data)
];

const [users, products, orders] = await Promise.all(queries);
```

---

## Community

### Where can I get help?

- [GitHub Issues](https://github.com/jsonpathx/jsonpathx/issues)
- [GitHub Discussions](https://github.com/jsonpathx/jsonpathx/discussions)
- Stack Overflow (tag: `jsonpathx`)

### How do I report a bug?

Open an issue on GitHub with:
- jsonpathx version
- Node.js/browser version
- Minimal reproduction
- Expected vs actual behavior

### Can I contribute?

Yes! See [Contributing Guide](./contributing/index.md).

---

## See Also

- [Troubleshooting Guide](./troubleshooting.md)
- [Examples](./examples/index.md)
- [API Reference](./api/index.md)
- [Migration Guide](./migration/index.md)
