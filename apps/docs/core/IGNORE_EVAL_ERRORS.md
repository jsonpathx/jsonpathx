# ignoreEvalErrors - Error Suppression in Filters

## Overview

The `ignoreEvalErrors` option provides robust error handling for filter expression evaluation in JSONPath queries. When enabled, errors that occur during filter evaluation are silently caught and treated as `false`, allowing queries to continue processing remaining items.

This feature is particularly useful when:
- Working with data that may have null or undefined values
- Dealing with inconsistent data structures
- Using custom sandbox functions that might fail for some items
- Handling mixed-type data where type mismatches could occur

## Usage

### Basic Syntax

```typescript
await JSONPath.query('$[?(@.property)]', data, {
  ignoreEvalErrors: true
});
```

### Using Query Builder

```typescript
const result = await JSONPath.create(data)
  .query('$[?(@.user.profile.name)]')
  .ignoreEvalErrors()
  .execute();
```

## Default Behavior

By default, `ignoreEvalErrors` is `false`, meaning errors will propagate to the caller:

```typescript
// Default: errors throw
await JSONPath.query('$[?(@.check())]', data, {
  sandbox: {
    check: () => { throw new Error('Failed'); }
  }
  // ignoreEvalErrors: false (default)
});
// Throws: "Function 'check' failed: Failed"
```

## When to Use

### 1. Handling Nullable Data

When your data may contain null or undefined values, `ignoreEvalErrors` prevents errors from null property access:

```typescript
const data = [
  { user: { name: 'John' } },
  { user: null },
  { user: { name: 'Jane' } }
];

const result = await JSONPath.query(
  '$[?(@.user.name)]',
  data,
  { ignoreEvalErrors: true }
);
// Returns: [{ user: { name: 'John' } }, { user: { name: 'Jane' } }]
// Silently skips the null user
```

### 2. Mixed Type Data

Handle data where property types may vary:

```typescript
const data = [
  { price: 10 },
  { price: 'N/A' },
  { price: 20 },
  { price: null }
];

const result = await JSONPath.query(
  '$[?(@.price > 15)]',
  data,
  { ignoreEvalErrors: true }
);
// Returns: [{ price: 20 }]
// Skips string 'N/A' and null comparisons
```

### 3. Sandbox Function Errors

Allow sandbox functions to fail for specific items without stopping the entire query:

```typescript
const data = [
  { id: 1, status: 'active' },
  { id: 2, status: 'invalid' },
  { id: 3, status: 'active' }
];

const result = await JSONPath.query('$[?(@.validate())]', data, {
  sandbox: {
    validate: (item) => {
      if (item.status === 'invalid') {
        throw new Error('Invalid status');
      }
      return item.status === 'active';
    }
  },
  ignoreEvalErrors: true
});
// Returns: [{ id: 1, ... }, { id: 3, ... }]
// Skips item with id: 2
```

### 4. @other() Type Selector Errors

Handle custom type checking that might fail:

```typescript
const data = [
  { type: 'valid' },
  { type: 'invalid' },
  { type: 'valid' }
];

const result = await JSONPath.query('$[?(@other())]', data, {
  otherTypeCallback: (value) => {
    if (value.type === 'invalid') {
      throw new Error('Invalid type');
    }
    return value.type === 'valid';
  },
  ignoreEvalErrors: true
});
// Returns: [{ type: 'valid' }, { type: 'valid' }]
```

### 5. Missing Properties

Gracefully handle objects with missing properties:

```typescript
const data = [
  { name: 'John', age: 30 },
  { name: 'Jane' },  // Missing age
  { age: 25 }        // Missing name
];

const result = await JSONPath.query(
  '$[?(@.age > 20)]',
  data,
  { ignoreEvalErrors: true }
);
// Returns: [{ name: 'John', age: 30 }, { age: 25 }]
```

## Behavior Details

### What Gets Ignored

When `ignoreEvalErrors: true`:
- Errors in sandbox function execution
- Errors in @other() callback execution
- Type mismatch errors in comparisons
- Property access on null/undefined
- Any runtime error during filter evaluation

### What Doesn't Get Ignored

The following errors will still throw even with `ignoreEvalErrors: true`:
- JSONPath syntax errors
- Parse errors
- Invalid query structure
- engine initialization errors
- Non-filter related errors

```typescript
// This will still throw
await JSONPath.query('$[invalid syntax', data, {
  ignoreEvalErrors: true
});
// Throws: Parse error
```

### Treatment of Errors

When an error is caught:
1. The error is silently suppressed
2. The filter evaluation returns `false` for that item
3. The item is excluded from the results
4. Processing continues with the next item

## Examples

### Example 1: Deeply Nested Navigation

```typescript
const data = [
  { user: { profile: { settings: { theme: 'dark' } } } },
  { user: { profile: null } },
  { user: null },
  { user: { profile: { settings: { theme: 'light' } } } }
];

const result = await JSONPath.query(
  '$[?(@.user.profile.settings.theme)]',
  data,
  { ignoreEvalErrors: true }
);
// Returns: 2 items with valid theme settings
```

### Example 2: Complex Filter with Multiple Conditions

```typescript
const data = [
  { a: 1, b: 2 },
  { a: null, b: 3 },
  { a: 4, b: null },
  { a: 5, b: 6 }
];

const result = await JSONPath.query(
  '$[?(@.a > 0 && @.b > 0)]',
  data,
  { ignoreEvalErrors: true }
);
// Returns: [{ a: 1, b: 2 }, { a: 5, b: 6 }]
```

### Example 3: Sandbox Function with Arguments

```typescript
const data = [
  { value: 5 },
  { value: 10 },
  { value: 15 },
  { value: 'invalid' }
];

const result = await JSONPath.query(
  '$[?(@.inRange(10, 20))]',
  data,
  {
    sandbox: {
      inRange: (item, min, max) => {
        if (typeof item.value !== 'number') {
          throw new Error('Value must be a number');
        }
        return item.value >= min && item.value <= max;
      }
    },
    ignoreEvalErrors: true
  }
);
// Returns: [{ value: 10 }, { value: 15 }]
```

### Example 4: All Items Fail

```typescript
const data = [null, null, null];

const result = await JSONPath.query(
  '$[?(@.value > 5)]',
  data,
  { ignoreEvalErrors: true }
);
// Returns: []
```

### Example 5: Recursive Descent

```typescript
const data = {
  items: [
    { user: { name: 'John' } },
    { user: null },
    { user: { name: 'Jane' } }
  ]
};

const result = await JSONPath.query(
  '$..user[?(@.name)]',
  data,
  { ignoreEvalErrors: true }
);
// Returns: user objects with valid name property
```

## Integration with Other Options

### With resultType

```typescript
const result = await JSONPath.query('$[?(@.check())]', data, {
  sandbox: {
    check: (item) => {
      if (item.id === 2) throw new Error('Failed');
      return true;
    }
  },
  ignoreEvalErrors: true,
  resultType: 'path'
});
// Returns: ['$[0]', '$[2]']
```

### With Callback

```typescript
const callbackValues = [];

const result = await JSONPath.query('$[?(@.check())]', data, {
  sandbox: {
    check: (item) => {
      if (item.id === 2) throw new Error('Failed');
      return true;
    }
  },
  ignoreEvalErrors: true,
  callback: (value) => {
    callbackValues.push(value);
    return value;
  }
});
// Callback is only invoked for items that pass the filter
```

### With Query Builder

```typescript
const result = await JSONPath.create(data)
  .query('$[?(@.validate())]')
  .ignoreEvalErrors()
  .resultType('path')
  .filter((path) => path.includes('valid'))
  .execute();
```

## Debug Mode

While errors are suppressed with `ignoreEvalErrors: true`, you can still track them in development:

```typescript
// In development, errors are logged to console in debug builds
// Check your browser console or Node.js output for warning messages
```

## Performance Considerations

- `ignoreEvalErrors` has minimal performance impact
- Error catching is lightweight and only activates when errors occur
- For large datasets, the performance impact is negligible
- First query execution may be slower due to engine initialization

## Best Practices

1. **Use for Data Quality Issues**: Enable when dealing with real-world data that may have inconsistencies

2. **Don't Overuse**: For clean, well-structured data, leave it disabled to catch unexpected errors

3. **Validate Upstream**: While useful, it's better to fix data quality issues at the source

4. **Test Both Modes**: Test your queries with both `true` and `false` to understand which items are being filtered out

5. **Document Usage**: When using in production code, document why errors are being suppressed

## Comparison with jsonpath-plus

This implementation matches the behavior of jsonpath-plus's `ignoreEvalErrors` option:

```javascript
// jsonpath-plus
JSONPath({
  path: '$[?(@.invalid.access)]',
  json: data,
  ignoreEvalErrors: true
});

// jsonpathx (equivalent)
await JSONPath.query('$[?(@.invalid.access)]', data, {
  ignoreEvalErrors: true
});
```

## API Reference

### QueryOptions

```typescript
interface QueryOptions {
  /**
   * Ignore errors during filter evaluation
   * When true, function errors will be treated as false (filter out item)
   * When false, function errors will throw
   * @default false
   */
  ignoreEvalErrors?: boolean;
}
```

### QueryBuilder

```typescript
class QueryBuilder {
  /**
   * Enable or disable error suppression for filter expression evaluation
   * @param value - Whether to ignore evaluation errors (default: true)
   * @returns This builder for chaining
   */
  ignoreEvalErrors(value?: boolean): this;
}
```

## Related Documentation

- [Sandbox Functions](./SANDBOX.md)
- [Filter Expressions](./FILTERS.md)
- [@other() Type Selector](./OTHER_TYPE.md)
- [Error Handling](./ERROR_HANDLING.md)
