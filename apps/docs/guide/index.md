# Getting Started

Welcome to jsonpathx, a modern, high-performance JSONPath library built with TypeScript and a fast JS engine.

## What is JSONPath?

JSONPath is a query language for JSON, similar to XPath for XML. It allows you to select and extract data from JSON documents using expressive path expressions.

Think of JSON as a tree structure. JSONPath provides a way to navigate and query this tree:

```json
{
  "store": {
    "book": [
      { "title": "Book 1", "price": 8.95 },
      { "title": "Book 2", "price": 12.99 }
    ],
    "bicycle": { "price": 19.95 }
  }
}
```

With JSONPath, you can:
- Get all book titles: `$.store.book[*].title`
- Find books under $10: `$.store.book[?(@.price < 10)]`
- Get all prices: `$..price`

## Why jsonpathx?

### Performance

jsonpathx uses a performance-focused JS engine and benchmarking against jsonpath-plus/jsonpath to track wins on real workloads. This makes it ideal for:

- Processing large JSON datasets
- Real-time data queries
- High-throughput applications
- Performance-critical paths

### TypeScript First

Unlike other libraries that add types as an afterthought, jsonpathx is built with TypeScript from the ground up:

```typescript
// Full type inference
const titles = await JSONPath.query<string>('$.store.book[*].title', data);
// titles: string[]

// Type-safe options
const result = await JSONPath.query(path, data, {
  resultType: 'path',  // TypeScript knows valid options
  enableCache: true
});
```

### Modern API Design

jsonpathx offers both a simple functional API and a powerful fluent API:

```typescript
// Simple functional API
const result = await JSONPath.query(path, data);

// Fluent QueryBuilder API
const result = await JSONPath.create(data)
  .query('$.store.book[*]')
  .filter(book => book.price < 10)
  .sort((a, b) => a.price - b.price)
  .map(book => book.title)
  .execute();
```

### Extended Features

jsonpathx includes everything from jsonpath-plus, plus:

- **Type Selectors**: `$..[@number]` - select by type
- **Parent Navigation**: `$.book[0]^` - navigate to parent
- **Multiple Result Types**: values, paths, pointers, parents, parent properties
- **Built-in Caching**: cache query results for better performance
- **Path Utilities**: convert between formats (JSONPath, JSON Pointer)

## Feature Support

jsonpathx supports the full RFC 9535 JSONPath specification plus useful extensions:

| Feature | Support | Example |
|---------|---------|---------|
| Root selector | ✅ | `$` |
| Child selector | ✅ | `$.store.book` |
| Wildcard selector | ✅ | `$.store.*` |
| Array index | ✅ | `$.book[0]` |
| Array slice | ✅ | `$.book[0:2]` |
| Array wildcard | ✅ | `$.book[*]` |
| Recursive descent | ✅ | `$..price` |
| Filter expressions | ✅ | `$[?(@.price < 10)]` |
| Script expressions | ✅ (with sandbox) | `$[?(@.price * 0.9 < 10)]` |
| Union | ✅ | `$[0,1,3]` |
| Type selectors | ✅ | `$..[@number]` |
| Parent selector | ✅ | `$.book[0]^` |

## Next Steps

Ready to start using jsonpathx? Here's what to do next:

1. **[Installation](/guide/installation)** - Install jsonpathx in your project
2. **[Quick Start](/guide/quick-start)** - Complete step-by-step tutorial
3. **[JSONPath Syntax](/guide/syntax)** - Learn the query language
4. **[API Reference](/api/)** - Explore the full API

## Need Help?

- Check the [Examples](/examples/) section for common use cases
- Read the [Migration Guide](/migration/) if you're coming from jsonpath-plus
- Review the [API documentation](/api/) for detailed reference
- Open an [issue on GitHub](https://github.com/jsonpathx/jsonpathx/issues) for bugs or questions

## Community

- GitHub: [github.com/jsonpathx/jsonpathx](https://github.com/jsonpathx/jsonpathx)
- Issues: [Report bugs or request features](https://github.com/jsonpathx/jsonpathx/issues)
- Discussions: [Ask questions and share ideas](https://github.com/jsonpathx/jsonpathx/discussions)
