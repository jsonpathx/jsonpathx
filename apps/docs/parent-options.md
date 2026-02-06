# Parent Options

The `parent` and `parentProperty` options allow you to specify parent context when executing JSONPath queries. This is particularly useful for nested query scenarios where you need to maintain a reference to the containing object or array.

## Table of Contents

- [Overview](#overview)
- [Options](#options)
- [Usage](#usage)
  - [Basic Usage](#basic-usage)
  - [QueryBuilder API](#querybuilder-api)
  - [Array Parent with Index](#array-parent-with-index)
- [Use Cases](#use-cases)
- [Integration with Other Features](#integration-with-other-features)
- [API Reference](#api-reference)

## Overview

When working with nested data structures, you often need to query a subset of data while maintaining context about where that data lives in the larger structure. The parent options enable this by allowing you to pass:

1. **parent**: The parent object or array containing the data being queried
2. **parentProperty**: The property name (string) or array index (number) in the parent that contains this data

This information can be used by:
- Filter expressions that need to reference parent data (e.g., using the `^` parent selector)
- Debugging tools to understand data relationships
- Custom result processors that need context

## Options

### `parent`

**Type**: `unknown`

The parent object or array that contains the data being queried.

```typescript
interface QueryOptions {
  parent?: unknown;
}
```

### `parentProperty`

**Type**: `string | number`

The property name (for objects) or array index (for arrays) in the parent that contains the queried data.

```typescript
interface QueryOptions {
  parentProperty?: string | number;
}
```

## Usage

### Basic Usage

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

const parent = {
  items: [
    { id: 1, name: 'Item 1', price: 10 },
    { id: 2, name: 'Item 2', price: 20 },
  ],
  metadata: {
    currency: 'USD',
    total: 2,
  },
};

// Query items with parent context
const prices = await JSONPath.query(
  '$[*].price',
  parent.items,
  {
    parent,
    parentProperty: 'items',
  }
);

console.log(prices); // [10, 20]
```

### QueryBuilder API

The `QueryBuilder` provides a fluent `withParent()` method for setting parent context:

```typescript
const results = await JSONPath.create(parent.items)
  .withParent(parent, 'items')
  .query('$[*].price')
  .filter((price) => price >= 15)
  .execute();

console.log(results); // [20]
```

#### `withParent()` Method

```typescript
withParent(parent: unknown, property?: string | number): this
```

**Parameters**:
- `parent`: The parent object or array
- `property` (optional): The property name or array index

**Returns**: The builder instance for chaining

**Example without property**:
```typescript
const results = await JSONPath.create(data)
  .withParent(parentObject)
  .query('$[*].id')
  .execute();
```

### Array Parent with Index

When the parent is an array, use a numeric index as the `parentProperty`:

```typescript
const categories = [
  {
    id: 'electronics',
    products: [
      { name: 'TV', price: 500 },
      { name: 'Radio', price: 50 },
    ],
  },
];

const firstCategory = categories[0];

const products = await JSONPath.query(
  '$[*].name',
  firstCategory.products,
  {
    parent: categories,
    parentProperty: 0, // Array index
  }
);

console.log(products); // ['TV', 'Radio']
```

## Use Cases

### 1. API Responses with Metadata

When working with paginated API responses:

```typescript
const apiResponse = {
  data: [
    { id: 1, name: 'User 1' },
    { id: 2, name: 'User 2' },
  ],
  pagination: {
    page: 1,
    total: 100,
  },
};

const userNames = await JSONPath.query(
  '$[*].name',
  apiResponse.data,
  {
    parent: apiResponse,
    parentProperty: 'data',
  }
);

// Parent context maintained for reference
console.log('Page:', apiResponse.pagination.page);
```

### 2. Nested Configurations

Querying configuration hierarchies:

```typescript
const config = {
  database: {
    connections: [
      { host: 'localhost', port: 5432 },
      { host: 'replica1', port: 5432 },
    ],
    poolSize: 10,
  },
};

const hosts = await JSONPath.create(config.database.connections)
  .withParent(config.database, 'connections')
  .query('$[*].host')
  .execute();
```

### 3. E-commerce Product Catalogs

Managing product categories:

```typescript
const catalog = {
  categories: [
    {
      id: 'laptops',
      products: [
        { name: 'Pro Laptop', price: 1299, inStock: true },
        { name: 'Gaming Laptop', price: 1899, inStock: false },
      ],
    },
  ],
};

const laptopCategory = catalog.categories[0];

const inStockPrices = await JSONPath.create(laptopCategory.products)
  .withParent(laptopCategory, 'products')
  .query('$[*]')
  .filter((product) => product.inStock)
  .map((product) => product.price)
  .execute();
```

### 4. Multi-level Nested Structures

Complex hierarchies like warehouses:

```typescript
const warehouse = {
  location: 'New York',
  departments: [
    {
      name: 'Electronics',
      shelves: [
        {
          id: 'A1',
          items: [
            { sku: '001', quantity: 10 },
            { sku: '002', quantity: 5 },
          ],
        },
      ],
    },
  ],
};

const department = warehouse.departments[0];
const shelf = department.shelves[0];

const skus = await JSONPath.create(shelf.items)
  .withParent(shelf, 'items')
  .query('$[*].sku')
  .execute();
```

## Integration with Other Features

### With Result Types

Parent options work seamlessly with different result types:

```typescript
const data = {
  items: [{ id: 1 }, { id: 2 }],
};

// Get paths
const paths = await JSONPath.query('$[*].id', data.items, {
  parent: data,
  parentProperty: 'items',
  resultType: 'path',
});
// ['$[0].id', '$[1].id']

// Get pointers
const pointers = await JSONPath.query('$[*].id', data.items, {
  parent: data,
  parentProperty: 'items',
  resultType: 'pointer',
});
// ['/0/id', '/1/id']
```

### With Flatten Option

Combine with array flattening:

```typescript
const data = {
  items: [
    { tags: ['a', 'b'] },
    { tags: ['c', 'd'] },
  ],
};

const allTags = await JSONPath.query('$[*].tags', data.items, {
  parent: data,
  parentProperty: 'items',
  flatten: true,
});
// ['a', 'b', 'c', 'd']
```

### With Caching

Parent options are included in cache key generation:

```typescript
JSONPath.enableCache();

const result1 = await JSONPath.query('$[*].id', data.items, {
  parent: data,
  parentProperty: 'items',
  enableCache: true,
});

// Subsequent queries with same parameters use cache
const result2 = await JSONPath.query('$[*].id', data.items, {
  parent: data,
  parentProperty: 'items',
  enableCache: true,
});
```

### With Callbacks

Access parent context in callbacks:

```typescript
await JSONPath.query('$[*].price', data.items, {
  parent: data,
  parentProperty: 'items',
  callback: (value, type, path) => {
    console.log(`Found ${value} at ${path}`);
    // Parent context available in closure
    console.log(`Parent has ${data.items.length} items`);
  },
});
```

## API Reference

### QueryOptions Interface

```typescript
interface QueryOptions {
  /**
   * Optional parent object context
   * Used when query is executed in a nested context
   */
  parent?: unknown;

  /**
   * Optional parent property name/index
   * The property name or array index in the parent that contains this data
   */
  parentProperty?: string | number;

  // ... other options
}
```

### JSONPath.query()

```typescript
static async query<T = unknown>(
  path: string,
  data: unknown,
  options?: QueryOptions
): Promise<T[]>
```

**Parameters**:
- `path`: JSONPath expression to evaluate
- `data`: The data to query
- `options`: Query options including `parent` and `parentProperty`

**Returns**: Array of query results

**Example**:
```typescript
const results = await JSONPath.query('$[*].id', data, {
  parent: parentObject,
  parentProperty: 'items',
});
```

### QueryBuilder.withParent()

```typescript
withParent(parent: unknown, property?: string | number): this
```

**Parameters**:
- `parent`: The parent object or array containing the queried data
- `property` (optional): Property name or array index in the parent

**Returns**: The builder instance for method chaining

**Example**:
```typescript
const builder = JSONPath.create(data)
  .withParent(parent, 'items')
  .query('$[*].id');

const results = await builder.execute();
```

## Edge Cases

### Null Parent

You can pass `null` as the parent if needed:

```typescript
const results = await JSONPath.query('$[*].id', data, {
  parent: null,
  parentProperty: 'items',
});
```

### Zero as Index

Zero is a valid array index:

```typescript
const parent = [data];
const results = await JSONPath.query('$.id', data, {
  parent,
  parentProperty: 0,
});
```

### Empty String Property

Empty strings are valid property names in JavaScript:

```typescript
const parent = { '': data };
const results = await JSONPath.query('$[*].id', data, {
  parent,
  parentProperty: '',
});
```

### Parent Without Property

You can specify just the parent without the property:

```typescript
const results = await JSONPath.query('$[*].id', data, {
  parent: parentObject,
});
```

### Property Without Parent

You can specify just the property name without the parent:

```typescript
const results = await JSONPath.query('$[*].id', data, {
  parentProperty: 'items',
});
```

## Best Practices

1. **Use with QueryBuilder**: The fluent API makes parent context more readable
   ```typescript
   // Good
   const results = await JSONPath.create(data)
     .withParent(parent, 'items')
     .query('$[*].id')
     .execute();
   ```

2. **Document Context**: When using parent options, add comments explaining the hierarchy
   ```typescript
   // Query products within the laptop category
   const prices = await JSONPath.query('$[*].price', laptopCategory.products, {
     parent: laptopCategory,
     parentProperty: 'products',
   });
   ```

3. **Consistent Naming**: Use consistent variable names for parent relationships
   ```typescript
   const category = catalog.categories[0];
   const products = category.products;

   const results = await JSONPath.query('$[*]', products, {
     parent: category,
     parentProperty: 'products',
   });
   ```

4. **Type Safety**: Use TypeScript to ensure correct parent/property relationships
   ```typescript
   interface Category {
     products: Product[];
   }

   const category: Category = ...;
   const results = await JSONPath.query('$[*]', category.products, {
     parent: category,
     parentProperty: 'products', // Type-safe property name
   });
   ```

## See Also

- [Query Options](./query-options.md)
- [Query Builder](./query-builder.md)
- [Result Types](./result-types.md)
- [Filter Expressions](./filter-expressions.md)
