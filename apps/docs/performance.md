# Performance Guide

jsonpathx ships with a performance-focused JS engine and a benchmark suite that compares against `jsonpath-plus` and `jsonpath`. The current suite shows jsonpathx leading most queries (44/48).

## Benchmarks

Run the suite from `bench/`:

```bash
cd bench
npm install
npm run bench
```

The suite covers small reference data, synthetic datasets, deep trees, wide objects,
large arrays, and Unicode-heavy keys to expose different engine hot paths.

## Performance Tips

1. Prefer specific paths over recursive descent where possible.
2. Use caching for repeated queries:
```typescript
JSONPath.enableCache({ maxSize: 100, ttl: 60000 });
```
3. Avoid expensive filters if a path can narrow the search first.
4. Keep resultType as `value` when you don't need paths/pointers.

## Profiling

Use `tools/profile.mjs` for quick local profiling.
