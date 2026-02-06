# Examples

Practical examples showing how to use jsonpathx in real-world scenarios.

## Quick Start Examples

### Simple Property Access

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

const user = {
  name: 'John Doe',
  email: 'john@example.com',
  age: 30
};

const name = await JSONPath.query('$.name', user);
console.log(name); // ['John Doe']
```

### Array Operations

```typescript
const data = {
  items: [
    { id: 1, name: 'Item A', price: 10 },
    { id: 2, name: 'Item B', price: 20 },
    { id: 3, name: 'Item C', price: 30 }
  ]
};

// Get all items
const items = await JSONPath.query('$.items[*]', data);

// Get specific items
const firstTwo = await JSONPath.query('$.items[0:2]', data);

// Get all names
const names = await JSONPath.query('$.items[*].name', data);
```

### Filtering Data

```typescript
const products = {
  catalog: [
    { name: 'Laptop', price: 1200, inStock: true },
    { name: 'Mouse', price: 25, inStock: true },
    { name: 'Keyboard', price: 80, inStock: false }
  ]
};

// Products under $100
const affordable = await JSONPath.query(
  '$.catalog[?(@.price < 100)]',
  products
);

// In-stock items
const available = await JSONPath.query(
  '$.catalog[?(@.inStock == true)]',
  products
);
```

## Explore More Examples

### [Basic Examples](/examples/basic)

Learn fundamental JSONPath operations:
- Property access
- Array operations
- Wildcards
- Simple filters

### [Advanced Examples](/examples/advanced)

Master complex queries:
- Nested data traversal
- Complex filters
- QueryBuilder patterns
- Performance optimization

### [Filter Examples](/examples/filters)

Deep dive into filtering:
- Comparison operators
- Logical operators
- String operations
- Type checking

### [Real-World Examples](/examples/real-world)

See practical use cases:
- E-commerce product search
- Data transformation
- API response parsing
- Configuration management

### [Performance Examples](/examples/performance)

Optimize your queries:
- Caching strategies
- Query optimization
- Large dataset handling
- Benchmarking

## By Category

### Data Extraction

Extract specific data from complex structures:

```typescript
const response = {
  data: {
    users: [
      { id: 1, profile: { name: 'Alice', city: 'NYC' } },
      { id: 2, profile: { name: 'Bob', city: 'LA' } }
    ]
  }
};

const names = await JSONPath.query('$.data.users[*].profile.name', response);
// ['Alice', 'Bob']
```

### Data Filtering

Filter data based on conditions:

```typescript
const orders = {
  items: [
    { id: 1, total: 100, status: 'completed' },
    { id: 2, total: 200, status: 'pending' },
    { id: 3, total: 150, status: 'completed' }
  ]
};

const completed = await JSONPath.query(
  '$.items[?(@.status == "completed" && @.total > 100)]',
  orders
);
```

### Data Transformation

Transform data using QueryBuilder:

```typescript
const report = await JSONPath.create(data)
  .query('$.sales[*]')
  .filter(sale => sale.amount > 1000)
  .map(sale => ({
    id: sale.id,
    revenue: sale.amount * 0.9, // Apply discount
    date: new Date(sale.timestamp)
  }))
  .sort((a, b) => b.revenue - a.revenue)
  .take(10)
  .execute();
```

## Common Patterns

### Finding Specific Items

```typescript
// Find by ID
const user = await JSONPath.query('$.users[?(@.id == 123)]', data);

// Find by property
const admin = await JSONPath.query('$.users[?(@.role == "admin")]', data);
```

### Collecting Values

```typescript
// All prices
const prices = await JSONPath.query('$..price', data);

// All IDs
const ids = await JSONPath.query('$..id', data);
```

### Checking Existence

```typescript
const hasExpensive = await JSONPath.create(data)
  .query('$.products[?(@.price > 1000)]')
  .exists();

if (hasExpensive) {
  console.log('We have luxury items!');
}
```

### Aggregation

```typescript
const stats = await JSONPath.create(data)
  .query('$.products[*].price')
  .stats();

console.log(`Average price: ${stats.mean}`);
console.log(`Total: ${stats.sum}`);
```

## Interactive Examples

Try these examples in your own code:

1. **Basic Query**
   ```typescript
   const result = await JSONPath.query('$.store.book[0].title', bookstore);
   ```

2. **Filter Query**
   ```typescript
   const cheap = await JSONPath.query('$.store.book[?(@.price < 10)]', bookstore);
   ```

3. **Fluent API**
   ```typescript
   const result = await JSONPath.create(bookstore)
     .query('$.store.book[*]')
     .filter(book => book.price < 10)
     .execute();
   ```

## Need More Examples?

- Check out the [Guide](/guide/) for step-by-step tutorials
- Browse the [API Reference](/api/) for complete documentation
- See [GitHub Examples](https://github.com/jsonpathx/jsonpathx/tree/main/examples) for runnable code

## Contributing Examples

Have a great example? [Contribute it!](/contributing/)

We welcome:
- Real-world use cases
- Performance optimizations
- Creative solutions
- Domain-specific examples
