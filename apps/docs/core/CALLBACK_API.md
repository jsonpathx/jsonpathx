# Callback API Guide

The JSONPath Callback API provides a powerful way to process query results with full metadata. This guide covers the complete callback functionality, including full payload structure and result transformation.

## Table of Contents

- [Overview](#overview)
- [Callback Function Signature](#callback-function-signature)
- [Callback Payload Structure](#callback-payload-structure)
- [Callback Types](#callback-types)
- [Basic Usage](#basic-usage)
- [Result Transformation](#result-transformation)
- [Advanced Examples](#advanced-examples)
- [jsonpath-plus Compatibility](#jsonpath-plus-compatibility)

## Overview

The callback option allows you to:
- Process each matched result with full metadata
- Transform result values
- Access parent context and paths
- Monitor query execution in real-time
- Build custom result processing pipelines

## Callback Function Signature

```typescript
type CallbackFunction = (
  value: unknown,
  type: CallbackType,
  payload: CallbackPayload
) => unknown | void;
```

### Parameters

- **value**: The matched value at the current path
- **type**: Either `'value'` (default) or `'property'` (when using parentProperty result type)
- **payload**: Full metadata object with all result information

### Return Value

- Return `undefined` or nothing to preserve the original value
- Return any value to transform the result
- The returned value replaces the original in the final result array

## Callback Payload Structure

The payload object contains complete metadata for each matched result:

```typescript
interface CallbackPayload {
  value: unknown;           // The matched value
  path: string;             // JSONPath expression to this value
  pointer: string;          // JSON Pointer (RFC 6901)
  parent: unknown;          // Parent object/array
  parentProperty: string | number;  // Property name or array index
}
```

### Field Details

#### `value`
The actual matched value at the current path.

```typescript
// Example: "Moby Dick"
```

#### `path`
The JSONPath expression to reach this value.

```typescript
// Example: "$.store.book[1].title"
```

#### `pointer`
The JSON Pointer (RFC 6901) to reach this value.

```typescript
// Example: "/store/book/1/title"
```

#### `parent`
The immediate parent object or array containing this value.

```typescript
// Example: { title: "Moby Dick", author: "Herman Melville", price: 8.99 }
```

#### `parentProperty`
The property name (for objects) or index (for arrays) in the parent.

```typescript
// Example: "title" or 1
```

## Callback Types

The `type` parameter indicates the context of the callback invocation:

### `'value'` (Default)
Used for all standard queries where you're matching values.

```typescript
JSONPath.query('$.store.book[*]', data, {
  callback: (value, type, payload) => {
    console.log(type); // "value"
  }
});
```

### `'property'`
Used when `resultType: 'parentProperty'` is specified.

```typescript
JSONPath.query('$.store.book[*]', data, {
  resultType: 'parentProperty',
  callback: (value, type, payload) => {
    console.log(type); // "property"
  }
});
```

## Basic Usage

### Simple Callback

Process each result without transformation:

```typescript
await JSONPath.query('$.store.book[*]', data, {
  callback: (value, type, payload) => {
    console.log('Found book:', value);
    console.log('At path:', payload.path);
  }
});
```

### Accessing Full Metadata

Access all metadata fields:

```typescript
await JSONPath.query('$.store.book[*].title', data, {
  callback: (value, type, payload) => {
    console.log('Title:', payload.value);
    console.log('Path:', payload.path);
    console.log('Pointer:', payload.pointer);
    console.log('Parent book:', payload.parent);
    console.log('Property:', payload.parentProperty);
  }
});
```

### Counting Results

Count matching results:

```typescript
let count = 0;
await JSONPath.query('$..price', data, {
  callback: () => {
    count++;
  }
});
console.log(`Found ${count} prices`);
```

## Result Transformation

### Apply Markup

Transform values by returning new values:

```typescript
const result = await JSONPath.query('$.store.book[*].price', data, {
  callback: (value) => {
    return value * 1.1; // Apply 10% markup
  }
});
// Result: [9.845, 9.889, 25.289]
```

### Format Strings

Convert values to formatted strings:

```typescript
const result = await JSONPath.query('$.store.book[*].price', data, {
  callback: (value) => {
    return `$${value.toFixed(2)}`;
  }
});
// Result: ["$8.95", "$8.99", "$22.99"]
```

### Enrich Objects

Add computed properties to objects:

```typescript
const result = await JSONPath.query('$.store.book[*]', data, {
  callback: (value, type, payload) => {
    return {
      ...value,
      path: payload.path,
      affordable: value.price < 10,
      discountPrice: value.price * 0.9
    };
  }
});
```

### Conditional Transformation

Transform based on conditions:

```typescript
const result = await JSONPath.query('$.store.book[*]', data, {
  callback: (value) => {
    if (value.price < 10) {
      return { ...value, label: 'Budget Pick' };
    }
    return value;
  }
});
```

## Advanced Examples

### Building Custom Result Objects

Create custom result structures:

```typescript
const customResults = [];
await JSONPath.query('$.store.book[*]', data, {
  callback: (value, type, payload) => {
    customResults.push({
      title: value.title,
      location: payload.path,
      jsonPointer: payload.pointer,
      parentArray: payload.parent,
      index: payload.parentProperty
    });
  }
});
```

### Filtering with Callback

Filter results by returning null:

```typescript
const result = await JSONPath.query('$.store.book[*]', data, {
  callback: (value) => {
    // Only include books under $10
    return value.price < 10 ? value : null;
  }
});
```

### Aggregating Data

Aggregate values using callback:

```typescript
let totalPrice = 0;
let count = 0;

await JSONPath.query('$.store.book[*].price', data, {
  callback: (value) => {
    totalPrice += value;
    count++;
  }
});

const averagePrice = totalPrice / count;
console.log(`Average price: $${averagePrice.toFixed(2)}`);
```

### Collecting Paths

Collect paths for all matches:

```typescript
const paths = [];
await JSONPath.query('$..price', data, {
  callback: (value, type, payload) => {
    paths.push({
      value: value,
      jsonpath: payload.path,
      jsonpointer: payload.pointer
    });
  }
});
```

### Parent Context Analysis

Analyze parent context:

```typescript
await JSONPath.query('$..title', data, {
  callback: (value, type, payload) => {
    console.log('Title:', value);
    console.log('Parent type:', Array.isArray(payload.parent) ? 'array' : 'object');
    console.log('Property/Index:', payload.parentProperty);
  }
});
```

### Deep Path Tracking

Track deep nested paths:

```typescript
const deepData = {
  level1: {
    level2: {
      level3: {
        value: 'deep'
      }
    }
  }
};

await JSONPath.query('$..value', deepData, {
  callback: (value, type, payload) => {
    const depth = payload.path.split('.').length - 1;
    console.log(`Found "${value}" at depth ${depth}`);
    console.log(`Full path: ${payload.path}`);
  }
});
```

### Type-based Processing

Process different types differently:

```typescript
await JSONPath.query('$.store.*', data, {
  callback: (value, type, payload) => {
    if (Array.isArray(value)) {
      console.log(`Array with ${value.length} items at ${payload.path}`);
    } else if (typeof value === 'object') {
      console.log(`Object with keys: ${Object.keys(value).join(', ')}`);
    } else {
      console.log(`Primitive value: ${value}`);
    }
  }
});
```

## jsonpath-plus Compatibility

The callback API is designed for compatibility with jsonpath-plus:

### Basic Compatibility

```javascript
// jsonpath-plus style
JSONPath({
  path: '$.store.book[*]',
  json: data,
  callback: (value, type, fullPayload) => {
    console.log('Value:', value);
    console.log('Type:', type);  // "value"
    console.log('Path:', fullPayload.path);
    console.log('Parent:', fullPayload.parent);
    console.log('Property:', fullPayload.parentProperty);
  }
});

// jsonpathx equivalent
await JSONPath.query('$.store.book[*]', data, {
  callback: (value, type, payload) => {
    console.log('Value:', value);
    console.log('Type:', type);  // "value"
    console.log('Path:', payload.path);
    console.log('Parent:', payload.parent);
    console.log('Property:', payload.parentProperty);
  }
});
```

### Result Transformation

```javascript
// jsonpath-plus style
JSONPath({
  path: '$.store.book[*]',
  json: data,
  callback: (value) => {
    return value.price * 1.1;  // Apply 10% markup
  }
});

// jsonpathx equivalent
await JSONPath.query('$.store.book[*]', data, {
  callback: (value) => {
    return value.price * 1.1;  // Apply 10% markup
  }
});
```

### Property Callback

```javascript
// jsonpath-plus style with property names
JSONPath({
  path: '$.store.book[*]~',  // ~ for property names
  json: data,
  callback: (value, type, fullPayload) => {
    console.log('Type:', type);  // "property"
    console.log('Property:', value);
  }
});

// jsonpathx equivalent
await JSONPath.query('$.store.book[*]', data, {
  resultType: 'parentProperty',
  callback: (value, type, payload) => {
    console.log('Type:', type);  // "property"
    console.log('Property:', value);
  }
});
```

## Performance Considerations

### Callback Overhead

Callbacks are invoked synchronously for each result:
- Minimal overhead for simple callbacks
- Complex transformations may impact performance
- Consider batch processing for large result sets

### Memory Usage

Callbacks operate on individual results:
- No memory overhead for read-only callbacks
- Transformation callbacks create new objects
- Aggregation callbacks can accumulate data

### Async Callbacks

Note: Callbacks are synchronous:
- Return values immediately
- Do not return Promises
- For async operations, collect data in callback and process later

## Best Practices

1. **Keep Callbacks Simple**: Perform minimal work in callbacks for best performance
2. **Use Transformations Wisely**: Only return values when transformation is needed
3. **Leverage Payload**: Use full payload information for context-aware processing
4. **Avoid Side Effects**: Prefer pure transformations over side effects
5. **Type Safety**: Use TypeScript for type-safe callback implementations
6. **Error Handling**: Wrap callback logic in try-catch if needed

## Examples Summary

```typescript
// 1. Simple logging
await JSONPath.query('$..price', data, {
  callback: (value) => console.log(value)
});

// 2. Value transformation
await JSONPath.query('$..price', data, {
  callback: (value) => value * 1.1
});

// 3. Full metadata access
await JSONPath.query('$..title', data, {
  callback: (value, type, payload) => {
    console.log(`${value} at ${payload.path}`);
  }
});

// 4. Conditional transformation
await JSONPath.query('$.items[*]', data, {
  callback: (value) => value.active ? value : null
});

// 5. Aggregation
let sum = 0;
await JSONPath.query('$..price', data, {
  callback: (value) => { sum += value; }
});
```

## See Also

- [Query Options](./QUERY_OPTIONS.md)
- [Result Types](./RESULT_TYPES.md)
- [Examples](../examples/callback-example.ts)
