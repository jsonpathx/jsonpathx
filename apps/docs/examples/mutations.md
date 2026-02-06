# Mutation Examples

Practical examples of JSON mutations using jsonpathx. Learn how to set, update, delete, and transform data with JSONPath queries.

## Table of Contents

- [Basic Operations](#basic-operations)
- [Array Manipulations](#array-manipulations)
- [Object Transformations](#object-transformations)
- [Batch Updates](#batch-updates)
- [Conditional Mutations](#conditional-mutations)
- [Complex Scenarios](#complex-scenarios)

---

## Basic Operations

### Example 1: Setting Values

```typescript
import { Mutation } from 'jsonpathx';

const data = {
  users: [
    { id: 1, name: 'Alice', status: 'pending' },
    { id: 2, name: 'Bob', status: 'pending' },
    { id: 3, name: 'Charlie', status: 'pending' }
  ]
};

// Set all users to active
const result = await Mutation.set(data, '$.users[*].status', 'active');

console.log(result.modified);  // 3
console.log(result.data.users[0].status);  // 'active'
```

### Example 2: Deleting Properties

```typescript
const data = {
  products: [
    { id: 1, name: 'Widget', temp: true, draft: true },
    { id: 2, name: 'Gadget', temp: false },
    { id: 3, name: 'Tool', temp: true }
  ]
};

// Remove temp property from all products
await Mutation.delete(data, '$.products[*].temp');

// Remove draft property where it exists
await Mutation.delete(data, '$.products[*].draft');
```

### Example 3: Updating with Transform

```typescript
const products = {
  items: [
    { name: 'Item A', price: 100 },
    { name: 'Item B', price: 200 },
    { name: 'Item C', price: 50 }
  ]
};

// Apply 10% discount
const result = await Mutation.update(
  products,
  '$.items[*].price',
  price => price * 0.9
);

console.log(result.data.items);
// [
//   { name: 'Item A', price: 90 },
//   { name: 'Item B', price: 180 },
//   { name: 'Item C', price: 45 }
// ]
```

---

## Array Manipulations

### Example 4: Adding Items to Arrays

```typescript
const data = {
  cart: {
    items: [
      { id: 1, product: 'Widget', qty: 2 }
    ]
  }
};

// Add item to cart
await Mutation.push(
  data,
  '$.cart.items',
  { id: 2, product: 'Gadget', qty: 1 }
);

// Add item at beginning
await Mutation.unshift(
  data,
  '$.cart.items',
  { id: 0, product: 'Special Offer', qty: 1 }
);

// Insert at specific position
await Mutation.insert(
  data,
  '$.cart.items',
  { id: 1.5, product: 'Bonus Item', qty: 1 },
  { position: 2 }
);
```

### Example 5: Removing Array Elements

```typescript
const data = {
  tasks: [
    { id: 1, title: 'Task 1', done: true },
    { id: 2, title: 'Task 2', done: false },
    { id: 3, title: 'Task 3', done: true },
    { id: 4, title: 'Task 4', done: false }
  ]
};

// Remove completed tasks
const result = await Mutation.delete(
  data,
  '$.tasks[?(@.done === true)]'
);

console.log(result.modified);  // 2
console.log(result.data.tasks);
// [
//   { id: 2, title: 'Task 2', done: false },
//   { id: 4, title: 'Task 4', done: false }
// ]
```

### Example 6: Manipulating Multiple Arrays

```typescript
const data = {
  categories: [
    { name: 'Electronics', items: ['Phone', 'Laptop'] },
    { name: 'Clothing', items: ['Shirt', 'Pants'] },
    { name: 'Books', items: ['Novel', 'Magazine'] }
  ]
};

// Add 'Sale Item' to all categories
await Mutation.push(data, '$.categories[*].items', 'Sale Item');

console.log(data.categories[0].items);
// ['Phone', 'Laptop', 'Sale Item']
```

---

## Object Transformations

### Example 7: Merging Properties

```typescript
const users = {
  list: [
    { id: 1, name: 'Alice' },
    { id: 2, name: 'Bob' },
    { id: 3, name: 'Charlie' }
  ]
};

// Add default properties to all users
const result = await Mutation.merge(
  users,
  '$.list[*]',
  {
    active: true,
    role: 'user',
    permissions: ['read'],
    createdAt: new Date().toISOString()
  }
);

console.log(result.data.list[0]);
// {
//   id: 1,
//   name: 'Alice',
//   active: true,
//   role: 'user',
//   permissions: ['read'],
//   createdAt: '2024-01-15T...'
// }
```

### Example 8: Numeric Operations

```typescript
const analytics = {
  counters: [
    { page: 'home', views: 100, clicks: 50 },
    { page: 'about', views: 75, clicks: 30 },
    { page: 'contact', views: 50, clicks: 20 }
  ]
};

// Increment all view counts by 1
await Mutation.increment(analytics, '$.counters[*].views', 1);

// Increment clicks by 5
await Mutation.increment(analytics, '$.counters[*].clicks', 5);

// Decrement views for home page
await Mutation.decrement(
  analytics,
  '$.counters[?(@.page === "home")].views',
  10
);
```

### Example 9: Boolean Toggles

```typescript
const settings = {
  features: [
    { name: 'darkMode', enabled: false },
    { name: 'notifications', enabled: true },
    { name: 'autoSave', enabled: false }
  ]
};

// Toggle all features
await Mutation.toggle(settings, '$.features[*].enabled');

console.log(settings.features);
// [
//   { name: 'darkMode', enabled: true },
//   { name: 'notifications', enabled: false },
//   { name: 'autoSave', enabled: true }
// ]

// Toggle specific feature
await Mutation.toggle(
  settings,
  '$.features[?(@.name === "darkMode")].enabled'
);
```

---

## Batch Updates

### Example 10: Mass Update with Filters

```typescript
const inventory = {
  products: [
    { id: 1, name: 'Widget', stock: 100, price: 50, category: 'A' },
    { id: 2, name: 'Gadget', stock: 0, price: 75, category: 'B' },
    { id: 3, name: 'Tool', stock: 50, price: 25, category: 'A' },
    { id: 4, name: 'Device', stock: 0, price: 100, category: 'C' }
  ]
};

// Mark out-of-stock items
await Mutation.merge(
  inventory,
  '$.products[?(@.stock === 0)]',
  { outOfStock: true, availableDate: '2024-02-01' }
);

// Increase prices for category A by 20%
await Mutation.update(
  inventory,
  '$.products[?(@.category === "A")].price',
  price => Math.round(price * 1.2)
);
```

### Example 11: Chained Mutations

```typescript
const data = {
  orders: [
    { id: 1, status: 'pending', amount: 100 },
    { id: 2, status: 'pending', amount: 200 },
    { id: 3, status: 'shipped', amount: 150 }
  ]
};

// Chain multiple mutations
let result = await Mutation.set(
  data,
  '$.orders[?(@.status === "pending")].status',
  'processing'
);

result = await Mutation.merge(
  result.data,
  '$.orders[*]',
  { processedAt: new Date().toISOString() }
);

result = await Mutation.update(
  result.data,
  '$.orders[*].amount',
  amount => amount * 1.1  // Add 10% processing fee
);

const finalData = result.data;
```

---

## Conditional Mutations

### Example 12: Conditional Updates

```typescript
const products = {
  items: [
    { id: 1, price: 150, premium: true },
    { id: 2, price: 50, premium: false },
    { id: 3, price: 200, premium: true },
    { id: 4, price: 25, premium: false }
  ]
};

// Update only premium products over $100
await Mutation.update(
  products,
  '$.items[?(@.premium === true && @.price > 100)].price',
  price => price * 0.85  // 15% discount
);
```

### Example 13: Conditional Merges

```typescript
const users = {
  list: [
    { id: 1, name: 'Alice', email: 'alice@example.com', verified: true },
    { id: 2, name: 'Bob', email: 'bob@example.com', verified: false },
    { id: 3, name: 'Charlie', verified: true }
  ]
};

// Add lastLogin only to verified users
await Mutation.merge(
  users,
  '$.list[?(@.verified === true)]',
  { lastLogin: Date.now(), accessLevel: 'full' }
);

// Add verification prompt to unverified users
await Mutation.merge(
  users,
  '$.list[?(@.verified === false)]',
  { needsVerification: true, accessLevel: 'limited' }
);
```

---

## Complex Scenarios

### Example 14: E-commerce Cart Update

```typescript
const cart = {
  id: 'cart-123',
  items: [
    { productId: 1, name: 'Widget', price: 50, quantity: 2 },
    { productId: 2, name: 'Gadget', price: 75, quantity: 1 },
    { productId: 3, name: 'Tool', price: 25, quantity: 3 }
  ],
  total: 0,
  tax: 0,
  shipping: 0
};

// Update quantities
await Mutation.set(cart, '$.items[0].quantity', 3);

// Calculate subtotals for each item
await Mutation.update(
  cart,
  '$.items[*]',
  item => ({
    ...item,
    subtotal: item.price * item.quantity
  })
);

// Calculate totals
const items = cart.items;
const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

await Mutation.set(cart, '$.total', subtotal);
await Mutation.set(cart, '$.tax', subtotal * 0.1);
await Mutation.set(cart, '$.shipping', subtotal > 50 ? 0 : 10);
```

### Example 15: User Profile Update

```typescript
const userData = {
  profile: {
    name: 'Alice',
    email: 'alice@old-email.com',
    settings: {
      notifications: true,
      theme: 'light',
      language: 'en'
    },
    metadata: {
      lastUpdated: '2024-01-01',
      version: 1
    }
  }
};

// Update email
await Mutation.set(userData, '$.profile.email', 'alice@new-email.com');

// Update settings
await Mutation.merge(userData, '$.profile.settings', {
  notifications: false,
  theme: 'dark'
});

// Update metadata
await Mutation.set(
  userData,
  '$.profile.metadata.lastUpdated',
  new Date().toISOString()
);
await Mutation.increment(userData, '$.profile.metadata.version');
```

### Example 16: Data Migration

```typescript
const oldFormat = {
  users: [
    { id: 1, userName: 'alice', userEmail: 'alice@example.com' },
    { id: 2, userName: 'bob', userEmail: 'bob@example.com' }
  ]
};

// Transform to new format
const result = await Mutation.update(
  oldFormat,
  '$.users[*]',
  user => ({
    id: user.id,
    profile: {
      username: user.userName,
      email: user.userEmail,
      displayName: user.userName.charAt(0).toUpperCase() + user.userName.slice(1)
    },
    settings: {
      notifications: true,
      theme: 'system'
    },
    migrated: true,
    migratedAt: new Date().toISOString()
  })
);
```

### Example 17: Immutable vs Mutable

```typescript
const original = {
  counters: [
    { name: 'a', value: 10 },
    { name: 'b', value: 20 }
  ]
};

// Immutable (default) - creates new copy
const result1 = await Mutation.increment(
  original,
  '$.counters[*].value',
  5
);

console.log(original.counters[0].value);  // 10 (unchanged)
console.log(result1.data.counters[0].value);  // 15 (new copy)

// Mutable - modifies in place
const result2 = await Mutation.increment(
  original,
  '$.counters[*].value',
  5,
  { immutable: false }
);

console.log(original.counters[0].value);  // 15 (modified)
console.log(original === result2.data);  // true (same reference)
```

### Example 18: Creating Nested Paths

```typescript
const data = {};

// Create nested structure with createPath
const result = await Mutation.set(
  data,
  '$.application.settings.ui.theme.colors.primary',
  '#007bff',
  { createPath: true }
);

console.log(result.data);
// {
//   application: {
//     settings: {
//       ui: {
//         theme: {
//           colors: {
//             primary: '#007bff'
//           }
//         }
//       }
//     }
//   }
// }
```

### Example 19: Error Handling

```typescript
import { Mutation } from 'jsonpathx';

const data = {
  items: [
    { name: 'Item 1', value: 100 },
    { name: 'Item 2', value: 'not a number' },
    { name: 'Item 3', value: 200 }
  ]
};

try {
  // This will fail on second item
  await Mutation.increment(data, '$.items[*].value', 10);
} catch (error) {
  console.error('Cannot increment non-number value');
}

// Better: Update only numbers
const result = await Mutation.update(
  data,
  '$.items[*].value',
  (value) => {
    if (typeof value === 'number') {
      return value + 10;
    }
    return value;  // Leave non-numbers unchanged
  }
);
```

### Example 20: Performance with Large Datasets

```typescript
const largeData = {
  records: Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    value: i * 10,
    active: i % 2 === 0
  }))
};

// Efficient batch update
const result = await Mutation.update(
  largeData,
  '$.records[?(@.active === true)].value',
  value => value * 1.1
);

console.log(`Updated ${result.modified} records`);

// For very large datasets, consider mutable for performance
const fastResult = await Mutation.update(
  largeData,
  '$.records[*].value',
  value => value * 1.05,
  { immutable: false }  // Faster for large data
);
```

---

## See Also

- [Mutations Guide](../guide/mutations.md) - Complete mutation documentation
- [Advanced Patterns](../guide/advanced-patterns.md) - Advanced usage patterns
- [Error Handling](../guide/error-handling.md) - Error handling strategies
