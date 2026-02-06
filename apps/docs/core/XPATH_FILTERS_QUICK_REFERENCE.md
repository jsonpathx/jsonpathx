# XPath-style Filters - Quick Reference

## TL;DR

Filters now automatically switch between two modes:

- **Terminal filter** (last in path) → **Returns filtered items**
- **Non-terminal filter** (more selectors follow) → **Filters then continues**

No syntax changes. Fully backward compatible.

## Basic Examples

### Selecting Filter (Terminal)
```javascript
$.store.book[?(@.price < 10)]
// Returns: book objects
```

### Constraining Filter (Non-Terminal)
```javascript
$.store.book[?(@.price < 10)].title
// Returns: titles (strings)
```

## Quick Comparison

| Query | Filter Type | Returns |
|-------|-------------|---------|
| `$.book[?(@.price<10)]` | Selecting | Book objects |
| `$.book[?(@.price<10)].title` | Constraining | Title strings |
| `$.book[?(@.price<10)].author.name` | Constraining | Author names |

## Common Patterns

### Get Property from Filtered Items
```javascript
// Old way (two steps)
const books = await JSONPath.query('$.store.book[?(@.price < 10)]', data);
const titles = books.map(b => b.title);

// New way (one query)
const titles = await JSONPath.query('$.store.book[?(@.price < 10)].title', data);
```

### Chain Multiple Filters
```javascript
// Both filters constrain, final selector picks result
$.store.book[?(@.price < 15)][?(@.author.country == "US")].title
// Returns: ['Book 1']
```

### Complex Property Path
```javascript
// Filter, then navigate nested properties
$.orders[?(@.status == "shipped")].customer.address.city
// Returns: cities of customers with shipped orders
```

## With Other Features

### Recursive Descent
```javascript
$..[?(@.price < 10)].title
// Find all objects with price < 10, get their titles
```

### Wildcards
```javascript
$.store.*[?(@.price < 100)].brand
// Get brands where price < 100, any store category
```

### Property Groups
```javascript
$.book[?(@.price < 15)].(title, author)
// Get multiple properties from filtered books
```

### Union Operator
```javascript
$.book[?(@.price < 10)].title | $.magazine[?(@.price < 5)].title
// Combine results from different filtered paths
```

### Parent Selector
```javascript
$.book[?(@.price < 10)].author^
// Get parent (book) of authors whose books are cheap
```

## Logical Operators

### AND
```javascript
$.book[?(@.price < 15 && @.author.country == "US")].title
```

### OR
```javascript
$.book[?(@.price < 10 || @.price > 18)].title
```

### NOT
```javascript
$.book[?(!(@.author.country == "UK"))].title
```

## Result Types

### Default (Value)
```javascript
$.book[?(@.price < 10)].title
// Returns: ['Book 1', 'Book 2']
```

### Path
```javascript
await JSONPath.query('$.book[?(@.price < 10)].title', data, { resultType: 'path' })
// Returns: ["$.book[0].title", "$.book[1].title"]
```

### All (Complete Info)
```javascript
await JSONPath.query('$.book[?(@.price < 10)].title', data, { resultType: 'all' })
// Returns: { entries: [{ value, path, parent, ... }] }
```

## Real-World Examples

### E-commerce: Get Product Names by Category
```javascript
$.products[?(@.category == "electronics" && @.inStock)].name
```

### HR: Get Salaries of Senior Engineers
```javascript
$.departments.engineering[?(@.senior)].salary
```

### Orders: Get Customer Emails for High-Value Orders
```javascript
$.orders[?(@.total > 1000)].customer.email
```

### Inventory: Get Low-Stock Item Names
```javascript
$.inventory[?(@.quantity < 10)].item.name
```

## Migration Guide

### No Changes Needed

All existing queries work identically:

```javascript
// These still work exactly as before
$.store.book[?(@.price < 10)]  // Still returns book objects
$..[?(@.price)]                 // Still returns all objects with price
$[?(@.active)]                  // Still returns active items
```

### New Capabilities

You can now do this naturally:

```javascript
// Before: required post-processing
// After: single elegant query
$.store.book[?(@.price < 10)].author.name
```

## Edge Cases

### Empty Results
```javascript
$.book[?(@.price < 0)].title  // Returns: []
```

### Filter on Non-Array
```javascript
$.bicycle[?(@.price > 100)].brand  // Tests bicycle object directly
```

### Index After Filter
```javascript
$.book[?(@.price < 20)][0].title  // Get first filtered book's title
```

### Wildcard After Filter
```javascript
$.book[?(@.price < 15)].*  // Get all properties of filtered books
```

## Debugging Tips

### Check Filter Behavior

Use `resultType: 'all'` to see what's happening:

```javascript
const result = await JSONPath.query(
  '$.book[?(@.price < 15)].title',
  data,
  { resultType: 'all' }
);

console.log(result.entries);
// See exactly what was filtered and selected
```

### Verify Terminal vs Constraining

```javascript
// Terminal (selecting)
const books = await JSONPath.query('$.book[?(@.price < 15)]', data);
console.log(books[0]); // Full book object

// Constraining (non-terminal)
const titles = await JSONPath.query('$.book[?(@.price < 15)].title', data);
console.log(titles[0]); // Just the title string
```

## Performance Tips

1. **Use single filter with AND/OR** instead of multiple filters when possible:
   ```javascript
   // Better
   $.book[?(@.price < 15 && @.available)]

   // Works but less efficient
   $.book[?(@.price < 15)][?(@.available)]
   ```

2. **Filter early, select later** for better performance:
   ```javascript
   // Good - filters first, then selects
   $.items[?(@.active)].details.value
   ```

3. **Avoid redundant wildcards** before filters:
   ```javascript
   // Redundant
   $.book[*][?(@.price < 10)].title

   // Better
   $.book[?(@.price < 10)].title
   ```

## Common Mistakes

### ❌ Expecting Objects from Constraining Filter
```javascript
const result = await JSONPath.query('$.book[?(@.price < 10)].title', data);
// result[0] is a string, not { title: 'Book 1' }
```

### ✅ Correct Expectation
```javascript
const titles = await JSONPath.query('$.book[?(@.price < 10)].title', data);
// titles = ['Book 1', 'Book 2']

const books = await JSONPath.query('$.book[?(@.price < 10)]', data);
// books = [{ title: 'Book 1', ... }, { title: 'Book 2', ... }]
```

## Cheat Sheet

| Want to... | Use |
|-----------|-----|
| Get filtered items | `$..items[?(@.active)]` |
| Get property from filtered items | `$..items[?(@.active)].name` |
| Get nested property | `$..items[?(@.active)].user.email` |
| Multiple filters | `$..items[?(@.active)][?(@.type=="x")].id` |
| Filter with AND | `$..items[?(@.active && @.price<10)]` |
| Filter with OR | `$..items[?(@.active \|\| @.featured)]` |
| Get multiple properties | `$..items[?(@.active)].(id, name)` |
| All matching properties | `$..items[?(@.active)].*` |

## Support

- Full documentation: `/docs/XPATH_STYLE_FILTERS.md`
- Examples: `/tests/unit/xpath-style-filters.test.ts`
- Issues: GitHub Issues

## Summary

**Key Points**:
- ✅ Automatic behavior - no syntax changes
- ✅ Fully backward compatible
- ✅ Works with all JSONPath features
- ✅ More expressive queries
- ✅ Better performance for common patterns

**Remember**:
- Filter at end → selects items
- Filter + more selectors → constrains then continues
