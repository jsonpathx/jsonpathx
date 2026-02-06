# Parent Options - Quick Reference

## Quick Start

```typescript
import { JSONPath } from 'jsonpathx';

// Basic usage
const parent = { items: [...], metadata: {...} };
const results = await JSONPath.query('$[*].price', parent.items, {
  parent,
  parentProperty: 'items'
});

// With QueryBuilder
const results = await JSONPath.create(parent.items)
  .withParent(parent, 'items')
  .query('$[*].price')
  .execute();
```

## API Reference

### QueryOptions

```typescript
interface QueryOptions {
  parent?: unknown;              // Parent object/array
  parentProperty?: string | number;  // Property name or array index
}
```

### JSONPath.query()

```typescript
JSONPath.query<T>(path: string, data: unknown, options?: QueryOptions): Promise<T[]>
```

### QueryBuilder.withParent()

```typescript
withParent(parent: unknown, property?: string | number): this
```

## Common Patterns

### Object Parent (Property Name)

```typescript
const parent = { items: [...] };
await JSONPath.query('$[*]', parent.items, {
  parent,
  parentProperty: 'items'  // String property name
});
```

### Array Parent (Numeric Index)

```typescript
const parent = [data1, data2];
await JSONPath.query('$', data1, {
  parent,
  parentProperty: 0  // Numeric index
});
```

### Chaining with Builder

```typescript
await JSONPath.create(data)
  .withParent(parent, 'items')
  .query('$[*].price')
  .filter(p => p > 10)
  .sort((a, b) => a - b)
  .execute();
```

### With Different Result Types

```typescript
// Get paths
const paths = await JSONPath.query('$[*]', data, {
  parent,
  parentProperty: 'items',
  resultType: 'path'
});

// Get pointers
const pointers = await JSONPath.query('$[*]', data, {
  parent,
  parentProperty: 'items',
  resultType: 'pointer'
});
```

### With Flatten

```typescript
const allTags = await JSONPath.query('$[*].tags', data, {
  parent,
  parentProperty: 'items',
  flatten: true
});
```

## Real-World Examples

### API Response

```typescript
const response = {
  data: [...],
  pagination: { page: 1, total: 100 }
};

const results = await JSONPath.query('$[*].id', response.data, {
  parent: response,
  parentProperty: 'data'
});
```

### Configuration

```typescript
const config = {
  database: { connections: [...] }
};

const hosts = await JSONPath.create(config.database.connections)
  .withParent(config.database, 'connections')
  .query('$[*].host')
  .execute();
```

### E-commerce Catalog

```typescript
const catalog = {
  categories: [
    { id: 'laptops', products: [...] }
  ]
};

const category = catalog.categories[0];
const prices = await JSONPath.query('$[*].price', category.products, {
  parent: category,
  parentProperty: 'products'
});
```

### Nested Structures

```typescript
const warehouse = {
  departments: [
    { shelves: [{ items: [...] }] }
  ]
};

const shelf = warehouse.departments[0].shelves[0];
const skus = await JSONPath.create(shelf.items)
  .withParent(shelf, 'items')
  .query('$[*].sku')
  .execute();
```

## Edge Cases

```typescript
// Null parent
await JSONPath.query('$[*]', data, {
  parent: null,
  parentProperty: 'items'
});

// Zero index
await JSONPath.query('$', array[0], {
  parent: array,
  parentProperty: 0
});

// Empty string property
const obj = { '': data };
await JSONPath.query('$[*]', data, {
  parent: obj,
  parentProperty: ''
});

// Parent without property
await JSONPath.query('$[*]', data, {
  parent: parentObj
});

// Property without parent
await JSONPath.query('$[*]', data, {
  parentProperty: 'items'
});
```

## Tips

1. Use QueryBuilder for cleaner code:
   ```typescript
   // Instead of:
   JSONPath.query(path, data, { parent, parentProperty: 'items' })

   // Use:
   JSONPath.create(data).withParent(parent, 'items').query(path).execute()
   ```

2. Parent options work with all features:
   - Caching
   - Callbacks
   - Result types
   - Flatten
   - Wrap

3. Performance is optimized:
   - Options only passed when provided
   - No data copying (references only)
   - Minimal overhead

4. Always maintain type safety:
   ```typescript
   interface MyParent {
     items: MyItem[];
   }

   const parent: MyParent = {...};
   await JSONPath.query('$[*]', parent.items, {
     parent,
     parentProperty: 'items'  // Type-safe
   });
   ```

## See Also

- [Full Documentation](./parent-options.md)
- [Examples](../examples/parent-options-example.ts)
- [Tests](../tests/core/tests/unit/parent-options.test.ts)
