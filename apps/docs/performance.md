# Performance Guide

jsonpathx ships with a performance-focused JS engine and a benchmark suite that compares against `jsonpath-plus` and `jsonpath`.

## Benchmarks

Run the suite from `benchmarks/`:

```bash
cd benchmarks
npm install
npm run bench
```

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
