# Path Utilities

Utility functions for working with JSONPath strings and JSON Pointers. Learn how to parse, convert, normalize, and manipulate path expressions programmatically.

## Overview

jsonpathx provides utility functions for path manipulation, conversion between path formats, and programmatic path construction.

```typescript
import { PathUtils } from '@jsonpathx/jsonpathx';
```

## Path Formats

### JSONPath Format

Standard JSONPath expression format:

```
$.store.books[0].title
```

### JSON Pointer Format

RFC 6901 JSON Pointer format:

```
/store/books/0/title
```

### Normalized Path Format

Canonical bracket notation:

```
$['store']['books'][0]['title']
```

## Core Functions

### `toPointer()`

Convert JSONPath expression to JSON Pointer.

```typescript
import { PathUtils } from '@jsonpathx/jsonpathx';

const path = '$.store.books[0].title';
const pointer = PathUtils.toPointer(path);
console.log(pointer);  // '/store/books/0/title'
```

**Edge Cases**:

```typescript
// Root
PathUtils.toPointer('$');  // ''

// Array indices
PathUtils.toPointer('$.items[5]');  // '/items/5'

// Special characters
PathUtils.toPointer('$.items["special/char"]');  // '/items/special~1char'

// Wildcard (not convertible)
PathUtils.toPointer('$.items[*]');  // Error: Wildcards not supported
```

### `fromPointer()`

Convert JSON Pointer to JSONPath expression.

```typescript
const pointer = '/store/books/0/title';
const path = PathUtils.fromPointer(pointer);
console.log(path);  // '$.store.books[0].title'
```

**Edge Cases**:

```typescript
// Root
PathUtils.fromPointer('');  // '$'

// Escaped characters
PathUtils.fromPointer('/items/special~1char');  // '$.items["special/char"]'
```

### `fromPointerArray()`

Convert JSON Pointer to a path array.

```typescript
const array = PathUtils.fromPointerArray('/store/books/0/title');
console.log(array);  // ['$', 'store', 'books', 0, 'title']
```

### `normalize()`

Convert JSONPath to normalized bracket notation.

```typescript
// Dot notation to bracket notation
const normalized = PathUtils.normalize('$.user.name');
console.log(normalized);  // "$['user']['name']"

// Mixed notation
const mixed = PathUtils.normalize('$.store.books[0].title');
console.log(mixed);  // "$['store']['books'][0]['title']"
```

**Benefits**:
- Consistent format
- Handles special characters
- Easier to parse programmatically

### `parse()`

Parse JSONPath expression into components.

```typescript
const components = PathUtils.parse('$.store.books[0].title');
console.log(components);
// [
//   { type: 'root', value: '$' },
//   { type: 'property', value: 'store' },
//   { type: 'property', value: 'books' },
//   { type: 'index', value: 0 },
//   { type: 'property', value: 'title' }
// ]
```

**Component Types**:
- `root` - Root identifier (`$`)
- `property` - Object property
- `index` - Array index
- `wildcard` - Wildcard selector (`*`)
- `slice` - Array slice
- `filter` - Filter expression
- `recursive` - Recursive descent (`..`)

### `stringify()`

Build JSONPath expression from components.

```typescript
const components = [
  { type: 'root', value: '$' },
  { type: 'property', value: 'store' },
  { type: 'index', value: 0 }
];

const path = PathUtils.stringify(components);
console.log(path);  // '$.store[0]'
```

## Path Construction

### `build()`

Programmatically build JSONPath expressions.

```typescript
// Simple path
const path1 = PathUtils.build(['store', 'books', 0, 'title']);
console.log(path1);  // '$.store.books[0].title'

// With special characters
const path2 = PathUtils.build(['users', 'first name', 'email']);
console.log(path2);  // '$["users"]["first name"]["email"]'

// With wildcards
const path3 = PathUtils.build(['items', '*', 'price']);
console.log(path3);  // '$.items[*].price'
```

### `append()`

Append segments to existing path.

```typescript
const base = '$.store.books';
const extended = PathUtils.append(base, '[0]', '.title');
console.log(extended);  // '$.store.books[0].title'
```

### `parent()`

Get parent path.

```typescript
const path = '$.store.books[0].title';
const parentPath = PathUtils.parent(path);
console.log(parentPath);  // '$.store.books[0]'

// Multiple levels
const grandparent = PathUtils.parent(parentPath);
console.log(grandparent);  // '$.store.books'

// Root has no parent
const rootParent = PathUtils.parent('$');
console.log(rootParent);  // null
```

## Path Validation

### `isValid()`

Check if path is valid JSONPath syntax.

```typescript
PathUtils.isValid('$.store.books');     // true
PathUtils.isValid('$.items[*]');        // true
PathUtils.isValid('$.users[0:10]');     // true

PathUtils.isValid('store.books');       // false (missing $)
PathUtils.isValid('$.invalid[');        // false (syntax error)
```

### `isPointer()`

Check if string is valid JSON Pointer.

```typescript
PathUtils.isPointer('/store/books');    // true
PathUtils.isPointer('');                // true (root)

PathUtils.isPointer('store/books');     // false (missing /)
PathUtils.isPointer('$.store');         // false (JSONPath, not pointer)
```

## Path Comparison

### `equals()`

Compare two paths for equality.

```typescript
PathUtils.equals('$.store.books', '$["store"]["books"]');  // true
PathUtils.equals('$.items[0]', '$.items[1]');              // false
```

### `startsWith()`

Check if path starts with prefix.

```typescript
const path = '$.store.books[0].title';

PathUtils.startsWith(path, '$.store');           // true
PathUtils.startsWith(path, '$.store.books');     // true
PathUtils.startsWith(path, '$.users');           // false
```

### `contains()`

Check if path contains segment.

```typescript
const path = '$.store.books[0].title';

PathUtils.contains(path, 'books');   // true
PathUtils.contains(path, 0);         // true
PathUtils.contains(path, 'users');   // false
```

## Path Manipulation

### `replace()`

Replace segment in path.

```typescript
const path = '$.store.books[0].title';

const replaced = PathUtils.replace(path, 'books', 'magazines');
console.log(replaced);  // '$.store.magazines[0].title'

// Replace index
const replaced2 = PathUtils.replace(path, 0, 5);
console.log(replaced2);  // '$.store.books[5].title'
```

### `remove()`

Remove segment from path.

```typescript
const path = '$.store.books[0].title';

const removed = PathUtils.remove(path, 'title');
console.log(removed);  // '$.store.books[0]'
```

## Escaping and Unescaping

### `escape()`

Escape special characters in property names.

```typescript
PathUtils.escape('user name');       // 'user name' (needs quotes)
PathUtils.escape('items[0]');        // 'items[0]' (needs quotes)
PathUtils.escape('simple');          // 'simple' (no quotes needed)
```

### `unescape()`

Unescape property names.

```typescript
PathUtils.unescape('"user name"');   // 'user name'
PathUtils.unescape("'items[0]'");    // 'items[0]'
```

## Pointer Utilities

### `splitPointer()`

Split JSON Pointer into segments.

```typescript
const pointer = '/store/books/0/title';
const segments = PathUtils.splitPointer(pointer);
console.log(segments);  // ['store', 'books', '0', 'title']
```

### `joinPointer()`

Join segments into JSON Pointer.

```typescript
const segments = ['store', 'books', '0', 'title'];
const pointer = PathUtils.joinPointer(segments);
console.log(pointer);  // '/store/books/0/title'
```

### `escapePointer()`

Escape special characters in JSON Pointer.

```typescript
// Escape ~ and /
PathUtils.escapePointer('path/with/slashes');  // 'path~1with~1slashes'
PathUtils.escapePointer('tilde~char');         // 'tilde~0char'
```

### `unescapePointer()`

Unescape JSON Pointer.

```typescript
PathUtils.unescapePointer('path~1with~1slashes');  // 'path/with/slashes'
PathUtils.unescapePointer('tilde~0char');          // 'tilde~char'
```

## Practical Examples

### Build Dynamic Paths

```typescript
// Build path from user input
function buildUserPath(category: string, index: number, field: string) {
  return PathUtils.build(['categories', category, 'items', index, field]);
}

const path = buildUserPath('electronics', 0, 'price');
console.log(path);  // '$.categories.electronics.items[0].price'
```

### Convert Between Formats

```typescript
// Accept both JSONPath and JSON Pointer
function queryByPath(path: string, data: any) {
  let jsonPath: string;

  if (PathUtils.isPointer(path)) {
    jsonPath = PathUtils.fromPointer(path);
  } else {
    jsonPath = path;
  }

  return JSONPath.query(jsonPath, data);
}

// Works with both formats
await queryByPath('$.items[0]', data);
await queryByPath('/items/0', data);
```

### Path Navigation

```typescript
// Navigate to parent and siblings
const currentPath = '$.store.books[2].title';

// Get parent
const bookPath = PathUtils.parent(currentPath);
// '$.store.books[2]'

// Get sibling properties
const authorPath = PathUtils.replace(currentPath, 'title', 'author');
// '$.store.books[2].author'

const pricePath = PathUtils.replace(currentPath, 'title', 'price');
// '$.store.books[2].price'
```

### Validate User Input

```typescript
function safeQuery(userPath: string, data: any) {
  // Validate path
  if (!PathUtils.isValid(userPath)) {
    throw new Error('Invalid JSONPath expression');
  }

  // Normalize for consistency
  const normalized = PathUtils.normalize(userPath);

  // Execute query
  return JSONPath.query(normalized, data);
}
```

### Generate Breadcrumbs

```typescript
function generateBreadcrumbs(path: string) {
  const components = PathUtils.parse(path);
  const breadcrumbs = [];

  let currentPath = '$';
  for (const component of components.slice(1)) {
    if (component.type === 'property') {
      currentPath = PathUtils.append(currentPath, `.${component.value}`);
      breadcrumbs.push({
        label: component.value,
        path: currentPath
      });
    }
  }

  return breadcrumbs;
}

const breadcrumbs = generateBreadcrumbs('$.store.books[0].title');
// [
//   { label: 'store', path: '$.store' },
//   { label: 'books', path: '$.store.books' },
//   { label: 'title', path: '$.store.books[0].title' }
// ]
```

## TypeScript Support

```typescript
// Type-safe path components
interface PathComponent {
  type: 'root' | 'property' | 'index' | 'wildcard' | 'slice' | 'filter' | 'recursive';
  value: string | number;
}

// Type-safe utilities
const components: PathComponent[] = PathUtils.parse(path);
const path: string = PathUtils.stringify(components);
const pointer: string = PathUtils.toPointer(path);
```

## Performance Notes

Path utilities are lightweight and fast:

```typescript
// Fast operations (< 1ms)
PathUtils.parse(path);
PathUtils.normalize(path);
PathUtils.toPointer(path);

// Very fast (< 0.1ms)
PathUtils.isValid(path);
PathUtils.equals(path1, path2);
```

No significant performance concerns for typical usage.

## See Also

- [JSONPath Syntax](./syntax.md) - Path syntax reference
- [Result Types](./result-types.md) - Working with results
- [API Reference](../api/utilities.md) - Complete utility API
- [RFC 6901](https://tools.ietf.org/html/rfc6901) - JSON Pointer specification
