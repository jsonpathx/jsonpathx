# Migration Guides

Welcome to the jsonpathx migration guide. This section helps you migrate from other JSONPath libraries.

## Quick Navigation

### [From jsonpath-plus](/migration/from-jsonpath-plus)

Complete guide for migrating from jsonpath-plus:
- API changes
- Import updates
- Async vs sync
- New features
- Migration checklist

### [Breaking Changes](/migration/breaking-changes)

Overview of breaking changes between versions:
- Version 0.1.0 changes
- Upgrade guides
- Deprecation notices

## Why Migrate to jsonpathx?

### Performance

jsonpathx wins the majority of queries in the current benchmark suite (44/48), with results varying by query:

```typescript
// Same query, much faster
const result = await JSONPath.query('$.store.book[*]', data);
```

### Modern API

Fluent API for complex operations:

```typescript
const result = await JSONPath.create(data)
  .query('$.products[*]')
  .filter(p => p.price < 100)
  .sort((a, b) => a.price - b.price)
  .execute();
```

### TypeScript First

Full type safety:

```typescript
const products = await JSONPath.query<Product>('$.products[*]', data);
// products: Product[]
```

### Extended Features

- Type selectors: `$..[@number]`
- Parent navigation: `$.item^`
- Built-in caching
- 20+ QueryBuilder methods

## Migration Checklist

- [ ] Install jsonpathx: `npm install @jsonpathx/jsonpathx`
- [ ] Update imports: `import { JSONPath } from '@jsonpathx/jsonpathx'`
- [ ] Change API calls: `JSONPath.query(path, data, options)`
- [ ] Add `await` to queries (or use `querySync` if you prefer sync)
- [ ] Update result type options if needed
- [ ] Test all queries
- [ ] Update error handling
- [ ] Enable new features (caching, QueryBuilder)
- [ ] Run tests
- [ ] Update documentation

## Common Changes

### Import Statement

```typescript
// Before (jsonpath-plus)
import { JSONPath } from 'jsonpath-plus';

// After (jsonpathx) - same!
import { JSONPath } from '@jsonpathx/jsonpathx';
```

### Query Syntax

```typescript
// Before (jsonpath-plus)
const result = JSONPath({
  path: '$.items[*]',
  json: data
});

// After (jsonpathx)
const result = await JSONPath.query('$.items[*]', data);
```

### With Options

```typescript
// Before
const result = JSONPath({
  path: '$.items[*]',
  json: data,
  resultType: 'path'
});

// After
const result = await JSONPath.query('$.items[*]', data, {
  resultType: 'path'
});
```

## Migration Strategies

### Gradual Migration

Migrate incrementally:

1. Install jsonpathx alongside existing library
2. Create wrapper functions for compatibility
3. Migrate one module at a time
4. Test thoroughly
5. Remove old library

### Wrapper Example

```typescript
// compatibility.ts
import { JSONPath } from '@jsonpathx/jsonpathx';

export function jsonPathLegacy(options: any) {
  return JSONPath.query(options.path, options.json, {
    resultType: options.resultType,
    // ... map other options
  });
}
```

### Full Migration

Replace all at once:

1. Create a new branch
2. Update all imports
3. Update all API calls
4. Run full test suite
5. Fix any issues
6. Merge when ready

## Testing Your Migration

### Unit Tests

Update unit tests to use async:

```typescript
// Before
test('query returns values', () => {
  const result = JSONPath({ path: '$.items[*]', json: data });
  expect(result).toEqual([...]);
});

// After
test('query returns values', async () => {
  const result = await JSONPath.query('$.items[*]', data);
  expect(result).toEqual([...]);
});
```

### Integration Tests

Test with real data:

```typescript
describe('Migration tests', () => {
  it('should match jsonpath-plus results', async () => {
    const data = { /* test data */ };
    const path = '$.items[?(@.price < 100)]';

    const result = await JSONPath.query(path, data);
    // Verify results match expected output
  });
});
```

## Getting Help

If you encounter issues:

1. Check the [migration guide](/migration/from-jsonpath-plus)
2. Review the [API documentation](/api/)
3. Search [GitHub Issues](https://github.com/jsonpathx/jsonpathx/issues)
4. Ask in [Discussions](https://github.com/jsonpathx/jsonpathx/discussions)
5. Open a new issue if needed

## Success Stories

Share your migration experience:

- How long did it take?
- What challenges did you face?
- What benefits did you gain?
- Any tips for others?

[Share your story](https://github.com/jsonpathx/jsonpathx/discussions)

## Version Support

| Library | Version | Support |
|---------|---------|---------|
| jsonpathx | 0.1.x | Current |
| jsonpath-plus | 7.x | Compatible |
| jsonpath-plus | 6.x | Compatible |
| jsonpath | 1.x | Partially compatible |

## Next Steps

- Read the [jsonpath-plus migration guide](/migration/from-jsonpath-plus)
- Explore [new features](/guide/)
- Check out [examples](/examples/)
- Join the [community](https://github.com/jsonpathx/jsonpathx/discussions)
