# Sandbox & Custom Functions Guide

Learn how to extend JSONPath with custom filter functions using the sandbox security model. Create powerful, reusable filter logic that integrates seamlessly with JSONPath queries.

## Table of Contents

- [Overview](#overview)
- [Creating Custom Functions](#creating-custom-functions)
- [Sandbox Security Model](#sandbox-security-model)
- [Function Signatures](#function-signatures)
- [Common Patterns](#common-patterns)
- [Advanced Functions](#advanced-functions)
- [Error Handling](#error-handling)
- [Type Safety](#type-safety)
- [Performance Considerations](#performance-considerations)
- [Best Practices](#best-practices)
- [Security Guidelines](#security-guidelines)

---

## Overview

Custom functions allow you to extend JSONPath filter expressions with JavaScript logic. Functions are provided through a **sandbox** - a secure, isolated environment that prevents unauthorized access to your application.

### Basic Example

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

const data = {
  products: [
    { name: 'Widget', price: 50 },
    { name: 'Gadget', price: 150 },
    { name: 'Doohickey', price: 25 }
  ]
};

// Define custom functions
const sandbox = {
  isExpensive: (item) => item.price > 100,
  inRange: (item, min, max) => item.price >= min && item.price <= max
};

// Use in query
const expensive = await JSONPath.query(
  '$.products[?(@.isExpensive())]',
  data,
  { sandbox }
);

const midRange = await JSONPath.query(
  '$.products[?(@.inRange(30, 100))]',
  data,
  { sandbox }
);
```

---

## Creating Custom Functions

### Simple Predicate Functions

Functions that return boolean values for filtering:

```typescript
const sandbox = {
  // Check if item is active
  isActive: (item) => item.active === true,

  // Check if price is below threshold
  isCheap: (item) => item.price < 50,

  // Check if string is not empty
  hasValue: (item) => item && item.length > 0,

  // Check if array has elements
  hasItems: (item) => Array.isArray(item) && item.length > 0
};
```

### Functions with Parameters

Pass additional arguments to your functions:

```typescript
const sandbox = {
  // Check if value is in range
  inRange: (item, min, max) => {
    return item.value >= min && item.value <= max;
  },

  // Check if string contains substring
  contains: (item, substring) => {
    return typeof item === 'string' && item.includes(substring);
  },

  // Check if date is after a specific date
  isAfter: (item, dateString) => {
    const itemDate = new Date(item.date);
    const compareDate = new Date(dateString);
    return itemDate > compareDate;
  },

  // Check if item matches any of the provided values
  isOneOf: (item, ...values) => {
    return values.includes(item);
  }
};

// Usage
await JSONPath.query(
  '$.items[?(@.inRange(10, 100))]',
  data,
  { sandbox }
);

await JSONPath.query(
  '$.users[?(@.name.contains("Smith"))]',
  data,
  { sandbox }
);

await JSONPath.query(
  '$.events[?(@.isAfter("2024-01-01"))]',
  data,
  { sandbox }
);

await JSONPath.query(
  '$.items[?(@.status.isOneOf("active", "pending", "approved"))]',
  data,
  { sandbox }
);
```

### Complex Validation Functions

Implement complex business logic:

```typescript
const sandbox = {
  // Validate email format
  isValidEmail: (item) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return typeof item === 'string' && emailRegex.test(item);
  },

  // Check if user meets age requirement
  meetsAgeRequirement: (item, minAge) => {
    if (!item.birthDate) return false;
    const birthDate = new Date(item.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    return age >= minAge;
  },

  // Complex validation
  isValidProduct: (item) => {
    return (
      item &&
      typeof item === 'object' &&
      typeof item.id === 'string' &&
      typeof item.name === 'string' &&
      typeof item.price === 'number' &&
      item.price > 0 &&
      typeof item.sku === 'string' &&
      item.sku.length > 0
    );
  }
};
```

---

## Sandbox Security Model

### Security Features

The sandbox provides multiple security layers:

1. **Function Validation** - Names must be valid JavaScript identifiers
2. **Reserved Names** - Prevents use of dangerous names
3. **No `this` Binding** - Functions execute with `null` context
4. **Error Isolation** - Errors are caught and wrapped
5. **No Global Access** - Functions can't access global scope

### Validation Rules

```typescript
// ✅ Valid function names
const valid = {
  myFunction: () => true,
  _private: () => true,
  $special: () => true,
  func123: () => true
};

// ❌ Invalid function names
const invalid = {
  'my-function': () => true,  // Contains hyphen
  '123func': () => true,      // Starts with number
  'my function': () => true,  // Contains space
};

// ❌ Reserved names (security)
const dangerous = {
  constructor: () => true,    // Reserved
  prototype: () => true,      // Reserved
  __proto__: () => true,      // Reserved
  eval: () => true,           // Reserved
  require: () => true,        // Reserved
};
```

### Safe Function Execution

Functions are wrapped to prevent `this` access:

```typescript
const sandbox = {
  // ✅ Safe: No 'this' access
  check: (item) => item.value > 10,

  // ❌ Unsafe: 'this' will be null
  unsafeCheck: function(item) {
    // this is null, will cause error
    return this.someProperty && item.value > 10;
  }
};
```

---

## Function Signatures

### Current Value (@)

The first parameter is always the current value being filtered:

```typescript
const sandbox = {
  // @param item - Current value from JSONPath context (@)
  checkPrice: (item) => {
    // item is the value at @ in the filter
    return item.price < 100;
  }
};

// In query: @ refers to each product
await JSONPath.query(
  '$.products[?(@.checkPrice())]',
  data,
  { sandbox }
);
```

### Additional Parameters

Additional parameters come from function arguments:

```typescript
const sandbox = {
  inRange: (item, min, max) => {
    // item: current value (@)
    // min: first argument
    // max: second argument
    return item >= min && item <= max;
  }
};

// Usage: @.value is current value, 10 and 100 are arguments
await JSONPath.query(
  '$.items[?(@.value.inRange(10, 100))]',
  data,
  { sandbox }
);
```

### Accessing Nested Properties

Access properties of the current item:

```typescript
const sandbox = {
  hasDiscount: (item) => {
    // Access nested properties
    return item.pricing && item.pricing.discount > 0;
  },

  inCategory: (item, category) => {
    // Safe nested access
    return item.category && item.category.name === category;
  }
};
```

---

## Common Patterns

### String Operations

```typescript
const sandbox = {
  // Case-insensitive comparison
  equalsIgnoreCase: (item, value) => {
    return typeof item === 'string' &&
           item.toLowerCase() === value.toLowerCase();
  },

  // Starts with prefix
  startsWith: (item, prefix) => {
    return typeof item === 'string' && item.startsWith(prefix);
  },

  // Ends with suffix
  endsWith: (item, suffix) => {
    return typeof item === 'string' && item.endsWith(suffix);
  },

  // Matches regex
  matches: (item, pattern) => {
    return typeof item === 'string' && new RegExp(pattern).test(item);
  },

  // Length check
  hasLength: (item, min, max) => {
    return typeof item === 'string' &&
           item.length >= min &&
           item.length <= max;
  }
};
```

### Number Operations

```typescript
const sandbox = {
  // Between (inclusive)
  between: (item, min, max) => {
    return typeof item === 'number' && item >= min && item <= max;
  },

  // Is even
  isEven: (item) => {
    return typeof item === 'number' && item % 2 === 0;
  },

  // Is multiple of
  isMultipleOf: (item, divisor) => {
    return typeof item === 'number' && item % divisor === 0;
  },

  // Within percentage
  withinPercent: (item, target, percent) => {
    const diff = Math.abs(item - target);
    const threshold = target * (percent / 100);
    return diff <= threshold;
  }
};
```

### Date Operations

```typescript
const sandbox = {
  // Is date after
  isAfter: (item, dateString) => {
    try {
      const itemDate = new Date(item);
      const compareDate = new Date(dateString);
      return itemDate > compareDate;
    } catch {
      return false;
    }
  },

  // Is date between
  dateBetween: (item, startDate, endDate) => {
    try {
      const date = new Date(item);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return date >= start && date <= end;
    } catch {
      return false;
    }
  },

  // Is within days
  withinDays: (item, days) => {
    try {
      const date = new Date(item);
      const now = new Date();
      const diff = Math.abs(now.getTime() - date.getTime());
      const daysDiff = diff / (1000 * 60 * 60 * 24);
      return daysDiff <= days;
    } catch {
      return false;
    }
  },

  // Is future date
  isFuture: (item) => {
    try {
      const date = new Date(item);
      return date > new Date();
    } catch {
      return false;
    }
  }
};
```

### Array Operations

```typescript
const sandbox = {
  // Array contains value
  arrayContains: (item, value) => {
    return Array.isArray(item) && item.includes(value);
  },

  // Array length in range
  arrayLengthBetween: (item, min, max) => {
    return Array.isArray(item) &&
           item.length >= min &&
           item.length <= max;
  },

  // Array has duplicates
  hasDuplicates: (item) => {
    if (!Array.isArray(item)) return false;
    return new Set(item).size !== item.length;
  },

  // All elements match
  allMatch: (item, predicate) => {
    return Array.isArray(item) && item.every(predicate);
  },

  // Any element matches
  anyMatch: (item, predicate) => {
    return Array.isArray(item) && item.some(predicate);
  }
};
```

---

## Advanced Functions

### External Data Access

Access data from outside the query:

```typescript
// External data
const allowedCategories = new Set(['electronics', 'computers', 'phones']);
const bannedUserIds = new Set([123, 456]);
const priceThreshold = 1000;

const sandbox = {
  // Check against external set
  isAllowedCategory: (item) => {
    return allowedCategories.has(item.category);
  },

  // Check if user is not banned
  isNotBanned: (item) => {
    return !bannedUserIds.has(item.userId);
  },

  // Use external config
  exceedsThreshold: (item) => {
    return item.price > priceThreshold;
  }
};
```

### Closures and State

Functions can use closures to maintain state:

```typescript
function createSandbox() {
  let callCount = 0;
  const cache = new Map();

  return {
    // Track call count
    isPopular: (item) => {
      callCount++;
      return item.views > 1000;
    },

    // Memoized function
    expensiveCheck: (item) => {
      const key = item.id;
      if (cache.has(key)) {
        return cache.get(key);
      }

      const result = performExpensiveCalculation(item);
      cache.set(key, result);
      return result;
    },

    // Get statistics
    getCallCount: () => callCount,
    clearCache: () => cache.clear()
  };
}

const sandbox = createSandbox();
```

### Async Functions

Functions must be synchronous, but you can prepare data beforehand:

```typescript
// ❌ Cannot use async functions
const bad = {
  async checkRemote: (item) => {
    const response = await fetch(`/api/check/${item.id}`);
    return response.ok;
  }
};

// ✅ Pre-fetch data before query
const approvedIds = await fetchApprovedIds();

const sandbox = {
  isApproved: (item) => {
    return approvedIds.has(item.id);
  }
};
```

---

## Error Handling

### Graceful Error Handling

Always handle errors in custom functions:

```typescript
const sandbox = {
  // ✅ Good: Handles errors
  safeCheck: (item) => {
    try {
      return item.value.toString().length > 5;
    } catch {
      return false;  // Default on error
    }
  },

  // ✅ Good: Validates input
  validatedCheck: (item) => {
    if (!item || typeof item !== 'object') {
      return false;
    }
    if (!('value' in item) || item.value === null) {
      return false;
    }
    return item.value > 100;
  },

  // ❌ Bad: No error handling
  unsafeCheck: (item) => {
    // Throws if item.value is undefined
    return item.value.toString().length > 5;
  }
};
```

### Error Suppression

Use `ignoreEvalErrors` to suppress function errors:

```typescript
const sandbox = {
  riskyFunction: (item) => {
    // May throw if property missing
    return item.nested.deep.property > 10;
  }
};

const results = await JSONPath.query(
  '$.items[?(@.riskyFunction())]',
  data,
  {
    sandbox,
    ignoreEvalErrors: true  // Treats errors as false
  }
);
```

### Detailed Error Messages

```typescript
const sandbox = {
  validateUser: (item) => {
    if (!item) {
      throw new Error('User object is required');
    }
    if (!item.email) {
      throw new Error('User email is required');
    }
    if (!item.age || typeof item.age !== 'number') {
      throw new Error('Valid user age is required');
    }
    return item.age >= 18;
  }
};

try {
  await JSONPath.query(
    '$.users[?(@.validateUser())]',
    data,
    { sandbox }
  );
} catch (error) {
  console.error('Validation failed:', error.message);
}
```

---

## Type Safety

### TypeScript Type Definitions

Define types for your sandbox functions:

```typescript
import type { Sandbox } from '@jsonpathx/jsonpathx';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
}

const sandbox: Sandbox = {
  isExpensive: (item: Product) => item.price > 100,
  inCategory: (item: Product, category: string) => item.category === category
};
```

### Generic Sandbox Creator

```typescript
function createTypedSandbox<T>(): {
  sandbox: Sandbox;
  addFunction: (name: string, fn: (item: T, ...args: any[]) => boolean) => void;
} {
  const sandbox: Sandbox = {};

  return {
    sandbox,
    addFunction: (name, fn) => {
      sandbox[name] = fn;
    }
  };
}

// Usage
interface User {
  id: number;
  name: string;
  age: number;
}

const { sandbox, addFunction } = createTypedSandbox<User>();

addFunction('isAdult', (user) => user.age >= 18);
addFunction('hasName', (user, name) => user.name === name);

await JSONPath.query('$.users[?(@.isAdult())]', data, { sandbox });
```

---

## Performance Considerations

### Optimize Hot Paths

```typescript
const sandbox = {
  // ❌ Slow: Creates regex every call
  slowCheck: (item) => {
    return /^\d{3}-\d{3}-\d{4}$/.test(item.phone);
  },

  // ✅ Fast: Regex created once
  fastCheck: (() => {
    const regex = /^\d{3}-\d{3}-\d{4}$/;
    return (item) => regex.test(item.phone);
  })()
};
```

### Memoization

```typescript
function createMemoized<T extends (...args: any[]) => any>(fn: T): T {
  const cache = new Map();

  return ((...args: any[]) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

const sandbox = {
  expensiveCheck: createMemoized((item) => {
    // Expensive calculation
    return performComplexValidation(item);
  })
};
```

### Early Returns

```typescript
const sandbox = {
  // ✅ Fast: Early returns
  efficientCheck: (item) => {
    if (!item) return false;
    if (!item.active) return false;
    if (!item.verified) return false;
    return item.score > 100;
  },

  // ❌ Slower: Evaluates all conditions
  inefficientCheck: (item) => {
    return item &&
           item.active &&
           item.verified &&
           item.score > 100;
  }
};
```

---

## Best Practices

### 1. Keep Functions Pure

```typescript
// ✅ Good: Pure function
const sandbox = {
  isValid: (item) => item.value > 10
};

// ❌ Bad: Modifies external state
let count = 0;
const bad = {
  track: (item) => {
    count++;  // Side effect!
    return item.value > 10;
  }
};
```

### 2. Handle Edge Cases

```typescript
const sandbox = {
  safeLength: (item) => {
    // Check type
    if (typeof item !== 'string' && !Array.isArray(item)) {
      return false;
    }
    // Check null/undefined
    if (item === null || item === undefined) {
      return false;
    }
    return item.length > 0;
  }
};
```

### 3. Use Descriptive Names

```typescript
// ✅ Good: Clear names
const sandbox = {
  isActiveUser: (item) => item.active,
  hasValidEmail: (item) => /\S+@\S+\.\S+/.test(item.email),
  meetsAgeRequirement: (item, minAge) => item.age >= minAge
};

// ❌ Bad: Unclear names
const bad = {
  check: (item) => item.active,
  validate: (item) => /\S+@\S+\.\S+/.test(item.email),
  ok: (item, x) => item.age >= x
};
```

### 4. Document Functions

```typescript
const sandbox = {
  /**
   * Check if product is eligible for free shipping
   * @param item - Product object
   * @param threshold - Minimum price for free shipping (default: 50)
   * @returns true if eligible, false otherwise
   */
  eligibleForFreeShipping: (item, threshold = 50) => {
    return item.price >= threshold && item.inStock;
  }
};
```

### 5. Validate Inputs

```typescript
const sandbox = {
  inRange: (item, min, max) => {
    // Validate item
    if (typeof item !== 'number') return false;

    // Validate parameters
    if (typeof min !== 'number' || typeof max !== 'number') {
      return false;
    }

    if (min > max) return false;

    return item >= min && item <= max;
  }
};
```

---

## Security Guidelines

### Never Trust User Input

```typescript
// ❌ DANGEROUS: User input in function name
const userFunctionName = getUserInput();
const sandbox = {
  [userFunctionName]: (item) => true  // Security risk!
};

// ✅ Safe: Predefined functions only
const allowedFunctions = {
  check1: (item) => item.value > 10,
  check2: (item) => item.status === 'active'
};

const userFunction = getUserInput();
if (userFunction in allowedFunctions) {
  const sandbox = {
    check: allowedFunctions[userFunction]
  };
}
```

### Avoid Dynamic Code Execution

```typescript
// ❌ NEVER DO THIS
const sandbox = {
  dangerous: (item, code) => {
    return eval(code);  // Extremely dangerous!
  }
};

// ✅ Use predefined logic
const sandbox = {
  safe: (item, operation) => {
    const operations = {
      isPositive: () => item.value > 0,
      isEven: () => item.value % 2 === 0
    };
    return operations[operation]?.() || false;
  }
};
```

### Limit External Access

```typescript
// ✅ Good: Limited scope
const allowedIds = new Set([1, 2, 3]);

const sandbox = {
  isAllowed: (item) => allowedIds.has(item.id)
};

// ❌ Bad: Too much access
const sandbox = {
  hasAccess: (item) => {
    // Don't give functions access to sensitive data
    return checkAgainstDatabase(item);  // Potential security issue
  }
};
```

---

## See Also

- [Custom Functions Examples](../examples/custom-functions.md) - Practical examples
- [Error Handling Guide](./error-handling.md) - Error handling strategies
- [Type Reference](../api/types.md#sandbox) - Sandbox type definitions
- [Advanced Patterns](./advanced-patterns.md) - Advanced usage patterns
