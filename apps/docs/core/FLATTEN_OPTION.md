# Flatten Option

The `flatten` option allows you to flatten nested arrays in JSONPath query results, making it easier to work with deeply nested data structures.

## Syntax

```typescript
JSONPath.query(path, data, { flatten: boolean | number })
```

## Parameters

- `flatten: true` - Flatten one level of nesting (equivalent to `flatten: 1`)
- `flatten: number` - Flatten N levels of nesting
- `flatten: false` or `undefined` - No flattening (default behavior)

## Examples

### Basic Flattening

```typescript
const data = {
  categories: [
    { products: [{ name: 'A' }, { name: 'B' }] },
    { products: [{ name: 'C' }, { name: 'D' }] }
  ]
};

// Without flatten
const nested = await JSONPath.query('$.categories[*].products', data);
// Result: [[{name: 'A'}, {name: 'B'}], [{name: 'C'}, {name: 'D'}]]

// With flatten: true (one level)
const flat = await JSONPath.query('$.categories[*].products', data, { flatten: true });
// Result: [{name: 'A'}, {name: 'B'}, {name: 'C'}, {name: 'D'}]
```

### Multiple Levels of Flattening

```typescript
const data = {
  items: [
    [[1, 2], [3, 4]],
    [[5, 6], [7, 8]]
  ]
};

// Flatten 1 level
const flat1 = await JSONPath.query('$.items[*]', data, { flatten: 1 });
// Result: [[1, 2], [3, 4], [5, 6], [7, 8]]

// Flatten 2 levels
const flat2 = await JSONPath.query('$.items[*]', data, { flatten: 2 });
// Result: [1, 2, 3, 4, 5, 6, 7, 8]
```

### Practical Use Case: Extracting Tags

```typescript
const posts = {
  posts: [
    { title: 'Post 1', tags: ['javascript', 'typescript'] },
    { title: 'Post 2', tags: ['react', 'vue'] },
    { title: 'Post 3', tags: ['nodejs', 'express'] }
  ]
};

// Get all tags flattened into a single array
const allTags = await JSONPath.query('$.posts[*].tags', posts, { flatten: true });
// Result: ['javascript', 'typescript', 'react', 'vue', 'nodejs', 'express']
```

### Mixed Depth Arrays

```typescript
const data = {
  items: [
    [1, 2],
    [[3, 4], 5],
    [[[6]], 7, 8]
  ]
};

// Flatten 1 level
const flat1 = await JSONPath.query('$.items[*]', data, { flatten: 1 });
// Result: [1, 2, [3, 4], 5, [[6]], 7, 8]

// Flatten 3 levels
const flat3 = await JSONPath.query('$.items[*]', data, { flatten: 3 });
// Result: [1, 2, 3, 4, 5, 6, 7, 8]
```

## Behavior Details

### Edge Cases

- **Empty arrays**: Preserved during flattening
- **Null/undefined**: Preserved as regular values
- **Objects**: Preserved as-is (only arrays are flattened)
- **Depth 0 or negative**: No flattening occurs

### Depth Examples

```typescript
// depth: 0 - No flattening
[1, [2, [3]]]  →  [1, [2, [3]]]

// depth: 1 - Flatten one level
[1, [2, [3]]]  →  [1, 2, [3]]

// depth: 2 - Flatten two levels
[1, [2, [3]]]  →  [1, 2, 3]
```

### Integration with Result Types

The flatten option works with different result types:

```typescript
// Works with 'value' result type (default)
const values = await JSONPath.query(path, data, { flatten: true });

// Works with 'path' result type
const paths = await JSONPath.query(path, data, {
  resultType: 'path',
  flatten: true
});

// Works with 'pointer' result type
const pointers = await JSONPath.query(path, data, {
  resultType: 'pointer',
  flatten: true
});

// Does NOT flatten 'all' result type (returns object)
const all = await JSONPath.query(path, data, {
  resultType: 'all',
  flatten: true // Ignored for 'all' type
});
```

## Performance Considerations

- Efficient for typical use cases
- Performance scales with array size and nesting depth
- Tested with:
  - 10,000 flat elements: < 100ms
  - 100 arrays of 10 elements each: efficient
  - Deep nesting (10+ levels): handles correctly

## Comparison with jsonpath-plus

This implementation is compatible with jsonpath-plus flatten behavior:

```typescript
// jsonpath-plus
jp.query(obj, path, { flatten: true });

// jsonpathx
JSONPath.query(path, obj, { flatten: true });
```

## API Reference

### ResultFormatter.formatValues()

Static method available for manual array flattening:

```typescript
import { ResultFormatter } from '@jsonpathx/jsonpathx';

const nested = [[1, 2], [3, 4]];
const flat = ResultFormatter.formatValues(nested, { flatten: 1 });
// Result: [1, 2, 3, 4]
```

**Parameters:**
- `array: unknown[]` - Array to flatten
- `depth: number` - Depth to flatten (default: 1)

**Returns:** `unknown[]` - Flattened array

## See Also

- [Query Options](./QUERY_OPTIONS.md)
- [Result Types](./RESULT_TYPES.md)
- [Builder API](./BUILDER_API.md)
