# Result Types

jsonpathx can return different types of results beyond just values. This gives you flexibility in how you work with query results.

## Available Result Types

### value (default)

Returns the matched values:

```typescript
const data = {
  store: {
    book: [
      { title: 'Book 1', price: 8.95 },
      { title: 'Book 2', price: 12.99 }
    ]
  }
};

const titles = await JSONPath.query('$.store.book[*].title', data);
console.log(titles);
// ['Book 1', 'Book 2']

// Equivalent to:
const titles2 = await JSONPath.query('$.store.book[*].title', data, {
  resultType: 'value'
});
```

### path

Returns JSONPath expressions to each result:

```typescript
const paths = await JSONPath.query('$.store.book[*].title', data, {
  resultType: 'path'
});
console.log(paths);
// ['$.store.book[0].title', '$.store.book[1].title']

// Helper method
const paths2 = await JSONPath.paths('$.store.book[*].title', data);
```

Use cases:
- Debugging queries
- Building dynamic queries
- Logging matched paths
- Tracking data locations

### pointer

Returns JSON Pointers (RFC 6901) to each result:

```typescript
const pointers = await JSONPath.query('$.store.book[*].title', data, {
  resultType: 'pointer'
});
console.log(pointers);
// ['/store/book/0/title', '/store/book/1/title']

// Helper method
const pointers2 = await JSONPath.pointers('$.store.book[*].title', data);
```

JSON Pointers are:
- Standardized (RFC 6901)
- Web-friendly
- Used in JSON Patch and JSON Schema

### parent

Returns the immediate parent object/array of each result:

```typescript
const parents = await JSONPath.query('$.store.book[*].title', data, {
  resultType: 'parent'
});
console.log(parents);
// [
//   { title: 'Book 1', price: 8.95 },
//   { title: 'Book 2', price: 12.99 }
// ]

// Helper method
const parents2 = await JSONPath.parents('$.store.book[*].title', data);
```

Use cases:
- Modifying parent objects
- Context-aware operations
- Validation checks
- Related data access

### parentProperty

Returns the property name or array index in the parent:

```typescript
const props = await JSONPath.query('$.store.book[*].title', data, {
  resultType: 'parentProperty'
});
console.log(props);
// ['title', 'title']

// For array elements
const indices = await JSONPath.query('$.store.book[*]', data, {
  resultType: 'parentProperty'
});
console.log(indices);
// [0, 1]

// Helper method
const props2 = await JSONPath.parentProperties('$.store.book[*]', data);
```

Use cases:
- Dynamic property access
- Key-value operations
- Array index tracking
- Property enumeration

### parentChain

Returns the full chain from root to each result (jsonpathx extension):

```typescript
const chains = await JSONPath.query('$.store.book[0].title', data, {
  resultType: 'parentChain'
});
console.log(chains);
// [{
//   value: 'Book 1',
//   chain: [
//     { property: 'store', parent: <root> },
//     { property: 'book', parent: <store> },
//     { property: 0, parent: <book array> },
//     { property: 'title', parent: <book object> }
//   ],
//   rootPath: '$.store.book[0].title',
//   depth: 4
// }]
```

Use cases:
- Deep navigation
- Breadcrumb generation
- Hierarchical operations
- Complex traversals

### all

Returns all result types in one object:

```typescript
const all = await JSONPath.query('$.store.book[*].title', data, {
  resultType: 'all'
});
console.log(all);
// {
//   values: ['Book 1', 'Book 2'],
//   paths: ['$.store.book[0].title', '$.store.book[1].title'],
//   pointers: ['/store/book/0/title', '/store/book/1/title'],
//   parents: [<book1>, <book2>],
//   parentProperties: ['title', 'title'],
//   entries: [
//     {
//       value: 'Book 1',
//       path: '$.store.book[0].title',
//       pointer: '/store/book/0/title',
//       parent: <book1>,
//       parentProperty: 'title'
//     },
//     // ...
//   ]
// }
```

Use cases:
- Complete result information
- Debugging
- Advanced processing
- Comprehensive logging

## Practical Examples

### Updating Values

Use parent results to update values:

```typescript
const parents = await JSONPath.query('$.products[?(@.price < 100)].price', data, {
  resultType: 'parent'
});

// Update each parent
parents.forEach(product => {
  product.price *= 1.1; // 10% increase
});
```

### Building UI Breadcrumbs

Use parent chains for navigation:

```typescript
const chains = await JSONPath.query('$.deeply.nested.value', data, {
  resultType: 'parentChain'
});

const breadcrumbs = chains[0].chain.map(entry => entry.property);
console.log(breadcrumbs.join(' > '));
// 'deeply > nested > value'
```

### Dynamic Property Access

Use paths for dynamic queries:

```typescript
const paths = await JSONPath.paths('$.users[*].email', data);

// Build update queries
const updates = paths.map(path => ({
  path,
  value: 'updated@example.com'
}));
```

### Debugging Queries

Use all types for comprehensive debugging:

```typescript
const debug = await JSONPath.query('$..price', data, {
  resultType: 'all'
});

console.log('Found', debug.values.length, 'prices');
console.log('At paths:', debug.paths);
console.log('Values:', debug.values);
```

## Combining with QueryBuilder

Result types work with QueryBuilder:

```typescript
// Get paths of filtered results
const paths = await JSONPath.create(data)
  .query('$.products[*]')
  .filter(p => p.price < 100)
  .resultType('path')
  .execute();

// Get parents
const parents = await JSONPath.create(data)
  .query('$.items[*].value')
  .resultType('parent')
  .execute();
```

## Type Safety

Result types are fully typed in TypeScript:

```typescript
// Values
const values = await JSONPath.query<string>('$.items[*].name', data);
// values: string[]

// Paths
const paths = await JSONPath.query<string>('$.items[*]', data, {
  resultType: 'path'
});
// paths: string[]

// Pointers
const pointers = await JSONPath.pointers('$.items[*]', data);
// pointers: string[]

// Parents (type depends on data structure)
const parents = await JSONPath.parents('$.items[*].name', data);
// parents: unknown[]
```

## Performance Considerations

Different result types have different performance characteristics:

| Type | Overhead | Use When |
|------|----------|----------|
| `value` | None | You only need values |
| `path` | Low | Building dynamic queries |
| `pointer` | Low | Using JSON Pointer APIs |
| `parent` | Low | Modifying parent objects |
| `parentProperty` | Low | Property/index tracking |
| `parentChain` | Medium | Need full context |
| `all` | High | Debugging/comprehensive info |

### Optimization Tips

1. **Use specific types**: Request only what you need
   ```typescript
   // Better
   const values = await JSONPath.query('$..price', data);

   // Slower
   const all = await JSONPath.query('$..price', data, { resultType: 'all' });
   ```

2. **Cache results**: Enable caching for repeated queries
   ```typescript
   JSONPath.enableCache();
   const result = await JSONPath.query(path, data, {
     resultType: 'path',
     enableCache: true
   });
   ```

3. **Limit depth**: For parent chains, limit depth if possible
   ```typescript
   const chains = await JSONPath.query(path, data, {
     resultType: 'parentChain',
     maxParentChainDepth: 5
   });
   ```

## Comparison with jsonpath-plus

jsonpathx supports all jsonpath-plus result types plus extensions:

| Type | jsonpath-plus | jsonpathx |
|------|---------------|-----------|
| value | ✅ | ✅ |
| path | ✅ | ✅ |
| pointer | ✅ | ✅ |
| parent | ✅ | ✅ |
| parentProperty | ✅ | ✅ |
| parentChain | ❌ | ✅ (new!) |
| all | ✅ | ✅ |

## Next Steps

- [Query Options](/guide/options) - Learn about other options
- [QueryBuilder API](/guide/builder-api) - Use the fluent API
- [Examples](/examples/) - See result types in action
