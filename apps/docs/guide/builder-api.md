# QueryBuilder API

The QueryBuilder provides a fluent API for building and executing JSONPath queries with JavaScript-based transformations.

## Creating a Builder

Create a builder instance with your data:

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

const data = { /* your data */ };
const builder = JSONPath.create(data);
```

## Basic Query

Start with a JSONPath expression:

```typescript
const result = await builder
  .query('$.products[*]')
  .execute();
```

## Chainable Methods

All chainable methods return `this` for method chaining.

### query()

Set the JSONPath query expression.

```typescript
builder.query('$.store.book[*]')
```

### filter()

Filter results using a JavaScript function.

```typescript
const result = await JSONPath.create(data)
  .query('$.products[*]')
  .filter(product => product.price < 100)
  .filter(product => product.inStock)
  .execute();
```

Multiple filters are applied in sequence (AND logic).

### map()

Transform each result.

```typescript
const names = await JSONPath.create(data)
  .query('$.products[*]')
  .map(product => product.name)
  .execute();
```

### sort()

Sort results using a comparator function.

```typescript
const sorted = await JSONPath.create(data)
  .query('$.products[*]')
  .sort((a, b) => a.price - b.price)
  .execute();
```

### take()

Take the first N results.

```typescript
const top5 = await JSONPath.create(data)
  .query('$.products[*]')
  .sort((a, b) => b.rating - a.rating)
  .take(5)
  .execute();
```

### skip()

Skip the first N results.

```typescript
const page2 = await JSONPath.create(data)
  .query('$.products[*]')
  .skip(10)
  .take(10)
  .execute();
```

### deduplicate()

Remove duplicate results.

```typescript
const unique = await JSONPath.create(data)
  .query('$..category')
  .deduplicate()
  .execute();
```

## Terminal Methods

These methods execute the query and return a result.

### execute()

Execute the query and return all results.

```typescript
const results = await builder
  .query('$.items[*]')
  .execute();
```

### first()

Get the first result.

```typescript
const first = await JSONPath.create(data)
  .query('$.products[*]')
  .sort((a, b) => b.price - a.price)
  .first();
```

### last()

Get the last result.

```typescript
const last = await JSONPath.create(data)
  .query('$.products[*]')
  .last();
```

### count()

Count the results.

```typescript
const count = await JSONPath.create(data)
  .query('$.products[?(@.inStock)]')
  .count();
```

### exists()

Check if any results exist.

```typescript
const hasExpensive = await JSONPath.create(data)
  .query('$.products[?(@.price > 1000)]')
  .exists();
```

## Complete Example

```typescript
const products = await JSONPath.create(catalog)
  .query('$.products[*]')
  .filter(p => p.category === 'electronics')
  .filter(p => p.price >= 50 && p.price <= 500)
  .filter(p => p.rating >= 4.0)
  .filter(p => p.inStock)
  .sort((a, b) => b.rating - a.rating)
  .take(10)
  .map(p => ({
    name: p.name,
    price: p.price,
    rating: p.rating
  }))
  .execute();
```

## Next Steps

- [Examples](/examples/advanced) - Advanced QueryBuilder examples
- [Performance](/performance/optimization) - Optimization techniques
- [API Reference](/api/) - Complete API documentation
