---
layout: home

hero:
  name: jsonpathx
  text: Modern JSONPath with a JS engine
  tagline: Benchmark-tracked JSONPath with TypeScript-first DX
  actions:
    - theme: brand
      text: Get Started
      link: /guide/
    - theme: alt
      text: View on GitHub
      link: https://github.com/jsonpathx/jsonpathx
  image:
    src: /logo.svg
    alt: jsonpathx

features:
  - icon: ⚡
    title: Performance-Focused JS
    details: Optimized JS engine with benchmarks to track real-world performance
  - icon: 🎯
    title: TypeScript First
    details: Full type safety with excellent DX, autocomplete, and inline documentation
  - icon: 🔧
    title: Fluent API
    details: Powerful QueryBuilder with chainable methods for elegant query composition
  - icon: 📦
    title: Feature Complete
    details: Broad jsonpath-plus compatibility plus extensions like type selectors and parent navigation
  - icon: 🧪
    title: Well Tested
    details: Dozens of tests covering core features and edge cases
  - icon: 📚
    title: Great Documentation
    details: Comprehensive guides, examples, and API reference to get you started quickly
  - icon: 🌐
    title: Cross-Platform
    details: Works in Node.js, browsers, and edge runtimes with ESM-first builds
  - icon: 🔒
    title: Type Safe
    details: Generic types throughout the API for complete type inference
---

## Quick Example

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

const data = {
  store: {
    book: [
      { title: 'Sayings of the Century', price: 8.95 },
      { title: 'Moby Dick', price: 8.99 },
      { title: 'The Lord of the Rings', price: 22.99 }
    ]
  }
};

// Simple query
const titles = await JSONPath.query('$.store.book[*].title', data);
// ['Sayings of the Century', 'Moby Dick', 'The Lord of the Rings']

// Filter by condition
const cheapBooks = await JSONPath.query('$.store.book[?(@.price < 10)]', data);
// [{ title: 'Sayings of the Century', price: 8.95 }, { title: 'Moby Dick', price: 8.99 }]

// Fluent API
const result = await JSONPath.create(data)
  .query('$.store.book[*]')
  .filter(book => book.price < 10)
  .map(book => book.title)
  .execute();
// ['Sayings of the Century', 'Moby Dick']
```

## Installation

```bash
npm install @jsonpathx/jsonpathx
```

## Why jsonpathx?

### Performance

jsonpathx tracks performance against jsonpath-plus and jsonpath across real workloads. Results vary by query; see the benchmarks page for current numbers.

### Modern TypeScript

Built from the ground up with TypeScript, providing full type safety, excellent IDE support, and a delightful developer experience.

### Feature Rich

- All RFC 9535 JSONPath features
- Extended selectors (type selectors, parent navigation)
- Multiple result types (values, paths, pointers, parents)
- Query caching for repeated queries
- Fluent QueryBuilder API
- Path utility functions

### Battle Tested

With a growing test suite covering edge cases, error handling, and performance scenarios, jsonpathx is production-ready.

## Comparison

| Feature | jsonpathx | jsonpath-plus | jsonpath |
|---------|-----------|---------------|----------|
| Performance | Varies by query (see benchmarks) | Varies by query | Varies by query |
| TypeScript | Built-in typings | .d.ts only | No |
| Engine | JS | JS | JS |
| Fluent API | Yes | No | No |
| Type Selectors | Yes | No | No |
| Parent Navigation | Yes | Yes | No |
| Result Types | 7 types | 4 types | 1 type |
| Caching | Built-in (opt-in) | No | No |
| Tests | 40+ (current suite) | Unknown | Unknown |
| Bundle Size | Measured via `npm run size` | See upstream | See upstream |

## Next Steps

<div class="vp-doc">

- [Get Started](/guide/) - Learn the basics of jsonpathx
- [Quick Start](/guide/quick-start) - Complete step-by-step tutorial
- [API Reference](/api/) - Explore the full API
- [Examples](/examples/) - See real-world examples
- [Migration Guide](/migration/) - Migrate from jsonpath-plus

</div>
