# Sandbox/Eval Configuration for Custom Functions

## Overview

The sandbox feature allows you to define custom functions that can be used in JSONPath filter expressions. This provides a safe, controlled way to extend filter capabilities without arbitrary code execution.

## Security Model

### Safe by Default

- **No eval()**: Custom functions are never executed via `eval()` or `Function()` constructor
- **Sandboxed execution**: Functions run with `null` context (no `this` binding)
- **Name validation**: Function names must be valid JavaScript identifiers
- **Reserved names blocked**: Cannot use names like `constructor`, `prototype`, `eval`, etc.
- **Error isolation**: Function errors are caught and re-thrown with context

### Validation Rules

Function names must:
- Start with a letter, underscore, or dollar sign
- Contain only letters, numbers, underscores, or dollar signs
- Not be JavaScript reserved words or security-sensitive names

## Usage

### Basic Example

```typescript
import { JSONPath } from 'jsonpathx';

const data = {
  items: [
    { x: 5, name: 'item1' },
    { x: 15, name: 'item2' },
    { x: 25, name: 'item3' }
  ]
};

// Define custom functions
const sandbox = {
  isLow: (item: any) => item.x < 10,
  isHigh: (item: any) => item.x > 20
};

// Use in query
const results = await JSONPath.query(
  '$.items[?(@.isLow())]',
  data,
  { sandbox }
);

console.log(results); // [{ x: 5, name: 'item1' }]
```

### With Arguments

```typescript
const sandbox = {
  inRange: (item: any, min: number, max: number) => {
    return item.x >= min && item.x <= max;
  }
};

const results = await JSONPath.query(
  '$.items[?(@.inRange(10, 20))]',
  data,
  { sandbox }
);

console.log(results); // [{ x: 15, name: 'item2' }]
```

### Multiple Functions

```typescript
const sandbox = {
  isLow: (item: any) => item.x < 10,
  isHigh: (item: any) => item.x > 20,
  inRange: (item: any, min: number, max: number) => {
    return item.x >= min && item.x <= max;
  },
  matchesPattern: (item: any, pattern: string) => {
    return new RegExp(pattern).test(item.name);
  }
};

// Use multiple functions
const results = await JSONPath.query(
  '$.items[?(@.inRange(0, 20) && @.matchesPattern("item[12]"))]',
  data,
  { sandbox }
);
```

## Options

### `sandbox`

Map of function names to implementations.

```typescript
interface Sandbox {
  [functionName: string]: (...args: any[]) => any;
}
```

### `eval`

Alternative way to specify eval mode:
- `false`: Disable function evaluation (default)
- `'safe'`: Enable safe mode with provided sandbox
- `Sandbox`: Directly provide sandbox object

```typescript
// These are equivalent:
await JSONPath.query(path, data, { sandbox: myFunctions });
await JSONPath.query(path, data, { eval: myFunctions });

// Disable explicitly:
await JSONPath.query(path, data, { eval: false });
```

### `ignoreEvalErrors`

Control error handling during function execution:
- `false`: Throw errors (default)
- `true`: Treat errors as `false` (filter out item)

```typescript
const sandbox = {
  mayFail: (item: any) => {
    if (!item.data) {
      throw new Error('Missing data');
    }
    return item.data > 10;
  }
};

// Will throw on error
await JSONPath.query(
  '$.items[?(@.mayFail())]',
  data,
  { sandbox }
);

// Will silently filter out items that cause errors
await JSONPath.query(
  '$.items[?(@.mayFail())]',
  data,
  { sandbox, ignoreEvalErrors: true }
);
```

## Function Signatures

### Basic Filter Function

```typescript
type FilterFunction = (currentItem: any, ...args: any[]) => boolean;
```

The first parameter is always the current item being evaluated (`@` in the filter expression). Additional parameters are passed from the function call in the JSONPath expression.

### Examples

```typescript
// No arguments
isValid: (item: any) => item.valid === true

// One argument
greaterThan: (item: any, threshold: number) => item.value > threshold

// Multiple arguments
between: (item: any, min: number, max: number) => {
  return item.value >= min && item.value <= max;
}

// Complex logic
matchesCondition: (item: any, type: string, value: any) => {
  switch (type) {
    case 'gt': return item.value > value;
    case 'lt': return item.value < value;
    case 'eq': return item.value === value;
    default: return false;
  }
}
```

## Error Handling

### Function Errors

When a function throws an error:

```typescript
const sandbox = {
  failing: () => {
    throw new Error('Something went wrong');
  }
};

// Default behavior: throw
try {
  await JSONPath.query('$.items[?(@.failing())]', data, { sandbox });
} catch (error) {
  console.error(error); // Function 'failing' failed: Something went wrong
}

// With ignoreEvalErrors: filter out
const results = await JSONPath.query(
  '$.items[?(@.failing())]',
  data,
  { sandbox, ignoreEvalErrors: true }
);
console.log(results); // []
```

### Validation Errors

Sandbox validation happens before query execution:

```typescript
// Invalid function name
const sandbox = {
  'invalid-name': () => true  // Hyphens not allowed
};

await JSONPath.query(path, data, { sandbox });
// Throws: Invalid function name 'invalid-name'

// Reserved name
const sandbox = {
  constructor: () => true
};

await JSONPath.query(path, data, { sandbox });
// Throws: Function name 'constructor' is reserved

// Non-function value
const sandbox = {
  notAFunction: 'string'
};

await JSONPath.query(path, data, { sandbox });
// Throws: Sandbox entry 'notAFunction' must be a function
```

## Best Practices

### 1. Keep Functions Pure

```typescript
// Good: Pure function
isExpensive: (item: any) => item.price > 100

// Avoid: Side effects
let count = 0;
countItems: (item: any) => {
  count++; // Side effect!
  return true;
}
```

### 2. Use Type Guards

```typescript
hasValidPrice: (item: any) => {
  return typeof item.price === 'number' && item.price > 0;
}
```

### 3. Handle Missing Data

```typescript
checkProperty: (item: any, prop: string) => {
  return item != null && prop in item && item[prop] != null;
}
```

### 4. Descriptive Names

```typescript
// Good
isActiveUser: (user: any) => user.status === 'active'
hasPremiumFeatures: (account: any) => account.tier === 'premium'

// Avoid
check: (item: any) => item.x > 10  // Too generic
f: (item: any) => item.valid        // Unclear
```

### 5. Document Complex Logic

```typescript
const sandbox = {
  /**
   * Checks if item is eligible for discount
   * - Must be in stock
   * - Price must be over $50
   * - Must be in eligible category
   */
  isEligibleForDiscount: (item: any) => {
    return item.inStock &&
           item.price > 50 &&
           ['electronics', 'books'].includes(item.category);
  }
};
```

## Limitations

### Current Implementation Status

⚠️ **Important**: The current implementation includes:
- ✅ TypeScript-side validation and sandbox creation
- ✅ Safe function wrapping and error handling
- ✅ Function name validation and security checks
- ✅ Options parsing and resolution
- ⚠️ engine integration is prepared but not fully functional

### What Works

- All sandbox validation and safety checks
- Function wrapping and error handling
- Options handling (sandbox, eval, ignoreEvalErrors)
- Integration with the query API

### What's Pending

Full function execution requires:
1. engine parser recognizing function call syntax in filters
2. engine evaluator collecting function calls during evaluation
3. Two-pass evaluation: collect calls, execute in JS, re-evaluate with results

### Workarounds

Until full implementation:
1. Use standard JSONPath filters where possible
2. Filter results in JavaScript after query execution
3. Contribute to the engine integration (see CONTRIBUTING.md)

## Performance Considerations

### Function Call Overhead

Each function call adds overhead:
- Function wrapping
- Error handling
- Context null-binding

For performance-critical queries:
1. Minimize function calls in filters
2. Use standard operators when possible
3. Consider post-query filtering for complex logic

### Caching Implications

When using `enableCache: true`:
- Cache keys don't include function implementations
- Changing function logic won't invalidate cache
- Disable caching when testing function changes

```typescript
// Development: disable cache
await JSONPath.query(path, data, {
  sandbox,
  enableCache: false
});

// Production: enable cache (after functions are stable)
await JSONPath.query(path, data, {
  sandbox,
  enableCache: true
});
```

## TypeScript Support

### Typed Sandbox

```typescript
import type { Sandbox } from 'jsonpathx';

interface Item {
  x: number;
  name: string;
  valid: boolean;
}

const sandbox: Sandbox = {
  isValid: (item: Item) => item.valid,
  isLow: (item: Item) => item.x < 10,
  nameMatches: (item: Item, pattern: string) => {
    return new RegExp(pattern).test(item.name);
  }
};
```

### Generic Query Results

```typescript
interface Result {
  x: number;
  name: string;
}

const results = await JSONPath.query<Result>(
  '$.items[?(@.isValid())]',
  data,
  { sandbox }
);

// results is Result[]
```

## Examples

### E-commerce Filtering

```typescript
const products = {
  items: [
    { name: 'Laptop', price: 999, category: 'electronics', inStock: true },
    { name: 'Mouse', price: 29, category: 'electronics', inStock: false },
    { name: 'Book', price: 15, category: 'books', inStock: true }
  ]
};

const sandbox = {
  isAffordable: (item: any, budget: number) => {
    return item.price <= budget && item.inStock;
  },
  inCategories: (item: any, ...categories: string[]) => {
    return categories.includes(item.category);
  }
};

// Find affordable electronics and books under $100
const results = await JSONPath.query(
  '$.items[?(@.isAffordable(100) && @.inCategories("electronics", "books"))]',
  products,
  { sandbox }
);
```

### User Filtering

```typescript
const users = {
  members: [
    { name: 'Alice', age: 30, status: 'active', role: 'admin' },
    { name: 'Bob', age: 25, status: 'inactive', role: 'user' },
    { name: 'Charlie', age: 35, status: 'active', role: 'user' }
  ]
};

const sandbox = {
  isActiveAdmin: (user: any) => {
    return user.status === 'active' && user.role === 'admin';
  },
  ageInRange: (user: any, min: number, max: number) => {
    return user.age >= min && user.age <= max;
  }
};

// Find active admins
const admins = await JSONPath.query(
  '$.members[?(@.isActiveAdmin())]',
  users,
  { sandbox }
);

// Find active users aged 25-35
const activeUsers = await JSONPath.query(
  '$.members[?(@.ageInRange(25, 35) && @.status == "active")]',
  users,
  { sandbox }
);
```

## Security Considerations

### Don't Trust User Input

Never create sandbox functions from untrusted input:

```typescript
// UNSAFE - Don't do this!
const userFunction = new Function('item', userProvidedCode);
const sandbox = { userFunc: userFunction };

// Safe - Define functions in your code
const sandbox = {
  safePredicate: (item: any) => {
    // Your controlled logic
    return item.value > 10;
  }
};
```

### Validate Function Arguments

```typescript
const sandbox = {
  checkValue: (item: any, threshold: any) => {
    // Validate argument types
    if (typeof threshold !== 'number') {
      throw new Error('threshold must be a number');
    }
    return item.value > threshold;
  }
};
```

### Limit Function Complexity

Avoid functions that:
- Access global state
- Make network requests
- Perform I/O operations
- Have unbounded loops

```typescript
// Good: Simple, bounded logic
isValid: (item: any) => item.status === 'active'

// Avoid: Complex, potentially slow operations
fetchAndCheck: async (item: any) => {
  const data = await fetch(item.url); // Don't do this!
  return data.valid;
}
```

## Contributing

The sandbox feature is under active development. Contributions welcome:

1. engine parser function call recognition
2. engine evaluator function call collection
3. Two-pass evaluation implementation
4. Additional test cases
5. Documentation improvements

See the main CONTRIBUTING.md for guidelines.
