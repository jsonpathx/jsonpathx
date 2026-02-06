# XPath-style Filters - Constraining vs Selecting

## Overview

Filters in JSONPath can behave in two distinct ways:

- **Selecting** (JSONPath default): Filter matches become the result
- **Constraining** (XPath-style): Filter refines context, next selector picks result

This implementation automatically determines the appropriate behavior based on the query structure, making it intuitive and backward compatible.

## Automatic Behavior

The library intelligently determines filter behavior based on context:

### Selecting Filter (Terminal)

When a filter is the **last selector** in a path expression, it acts as a selecting filter - the matched items themselves are returned:

```javascript
$.store.book[?(@.price < 10)]
// Returns: The book objects with price < 10
// Result: [{ title: 'Book 1', author: {...}, price: 8.95 }]
```

### Constraining Filter (Non-Terminal)

When a filter is **followed by more selectors**, it acts as a constraining filter - it narrows down the dataset without selecting, allowing subsequent selectors to pick the actual results:

```javascript
$.store.book[?(@.price < 10)].author
// Returns: Authors of books with price < 10 (not the books themselves)
// Result: [{ name: 'Author 1', country: 'US' }]
```

## Key Differences

| Aspect | Selecting Filter | Constraining Filter |
|--------|------------------|---------------------|
| Position | Last selector in path | Followed by more selectors |
| Behavior | Returns filtered items | Filters items, continues evaluation |
| Result | Matched objects/values | Properties selected from matched items |
| XPath Equivalent | Similar to XPath predicate at end | Like XPath predicate mid-path |

## Examples

### Basic Usage

**Filter and select nested property:**
```javascript
// Get titles of cheap books
$.store.book[?(@.price < 10)].title
// Returns: ['Book 1']

// Get author names of books by US authors
$.store.book[?(@.author.country == "US")].author.name
// Returns: ['Author 1', 'Author 3']

// Get nested properties after filtering
$.items[?(@.active)].details.description
// Returns: descriptions of active items
```

**Compare selecting vs constraining:**
```javascript
// Selecting (terminal filter)
$.store.book[?(@.price < 15)]
// Returns: [
//   { title: 'Book 1', author: {...}, price: 8.95 },
//   { title: 'Book 2', author: {...}, price: 12.99 }
// ]

// Constraining (non-terminal filter)
$.store.book[?(@.price < 15)].title
// Returns: ['Book 1', 'Book 2']
```

### Multiple Filters

Chain multiple filters together. Each filter constrains until the last one:

```javascript
// Both filters constrain, final selector picks result
$.store.book[?(@.price < 15)][?(@.author.country == "US")].title
// Returns: ['Book 1']

// Last filter selects if terminal
$.store.book[?(@.price < 15)][?(@.author.country == "US")]
// Returns: [{ title: 'Book 1', author: {...}, price: 8.95 }]

// Multiple consecutive filters with final property selector
$.store.book[?(@.price > 0)][?(@.price < 20)].author.country
// Returns: ['US', 'UK']
```

### With Other Features

**Recursive Descent:**
```javascript
// Find all nodes with price < 10, get their titles
$..[?(@.price < 10)].title
// Returns: titles of any object with price < 10
```

**Wildcards:**
```javascript
// Select all store items, filter, get property
$.store.*[?(@.price < 100)].brand
// Returns: brands where price < 100

// Array wildcard with filter
$.store.book[*][?(@.available)].title
// Returns: titles of available books
```

**Property Groups:**
```javascript
// Filter and select multiple properties
$.store.book[?(@.price < 15)].(title, author)
// Returns: [
//   'Book 1',
//   { name: 'Author 1', country: 'US' },
//   'Book 2',
//   { name: 'Author 2', country: 'UK' }
// ]
```

**Union Operator:**
```javascript
// Combine results from multiple filtered paths
$.book[?(@.price < 10)].title | $.magazine[?(@.price < 5)].title
// Returns: titles from both cheap books and cheap magazines
```

**Parent Selector:**
```javascript
// Filter, get property, then go back to parent
$.store.book[?(@.price < 10)].author^
// Returns: parent book object of authors whose books cost < 10
```

## Complex Examples

### Nested Filters with Deep Property Access

```javascript
const data = {
  departments: {
    engineering: [
      {
        name: 'Alice',
        projects: [
          { id: 1, status: 'active', budget: 50000 },
          { id: 2, status: 'completed', budget: 30000 }
        ]
      },
      {
        name: 'Bob',
        projects: [
          { id: 3, status: 'active', budget: 75000 }
        ]
      }
    ]
  }
};

// Filter employees, then filter their projects, get budgets
$.departments.engineering[?(@.projects)].projects[?(@.status == 'active')].budget
// Returns: [50000, 75000]
```

### Logical Operators in Constraining Filters

```javascript
// AND operator
$.store.book[?(@.price < 15 && @.author.country == "US")].title
// Returns: titles of cheap books by US authors

// OR operator
$.store.book[?(@.price < 10 || @.price > 18)].title
// Returns: titles of very cheap or expensive books

// NOT operator
$.store.book[?(!(@.author.country == "UK"))].author.country
// Returns: countries of non-UK authors
```

### Real-World Use Cases

**E-commerce - Filter products and get prices:**
```javascript
const products = {
  products: [
    { name: 'Laptop', category: 'electronics', price: 999, inStock: true },
    { name: 'Desk', category: 'furniture', price: 299, inStock: false },
    { name: 'Phone', category: 'electronics', price: 599, inStock: true }
  ]
};

// Get prices of in-stock electronics
$.products[?(@.category == "electronics" && @.inStock)].price
// Returns: [999, 599]
```

**Employee Management - Filter and extract information:**
```javascript
const company = {
  departments: {
    engineering: [
      { name: 'Alice', salary: 120000, senior: true },
      { name: 'Bob', salary: 90000, senior: false }
    ],
    sales: [
      { name: 'Charlie', salary: 80000, senior: true }
    ]
  }
};

// Get salaries of senior engineers
$.departments.engineering[?(@.senior)].salary
// Returns: [120000]
```

**Order Processing - Complex filtering:**
```javascript
const orders = {
  orders: [
    { id: 1, total: 100, status: 'shipped', customer: { vip: true } },
    { id: 2, total: 50, status: 'pending', customer: { vip: false } },
    { id: 3, total: 200, status: 'shipped', customer: { vip: true } }
  ]
};

// Get IDs of shipped orders for VIP customers
$.orders[?(@.status == "shipped" && @.customer.vip)].id
// Returns: [1, 3]
```

## Behavior Rules

1. **Terminal Filter:** If no selectors follow → **Selecting** (returns filtered items)
2. **Non-Terminal Filter:** If selectors follow → **Constraining** (filters, continues with next selector)
3. **Nested Filters:** Inner filters are always context-dependent (terminal in their own context)
4. **Backward Compatible:** All existing queries work identically - terminal filters still select

## Performance Considerations

Constraining filters are optimized to:

- **Filter once**: Items are filtered at the filter stage, not re-evaluated
- **Continue efficiently**: Only filtered items are processed by subsequent selectors
- **Memory efficient**: Intermediate results are managed efficiently
- **Lazy evaluation**: Results are generated as needed

Example performance test:
```javascript
// Efficient: filters 1000 items down to 10, then selects nested property
$.items[?(@.value < 100)].data.nested
// Processing: 1000 items filtered → 10 items → nested property access
```

## Integration with Result Types

Works seamlessly with all result types:

**Value (default):**
```javascript
$.store.book[?(@.price < 10)].title
// Returns: ['Book 1']
```

**Path:**
```javascript
JSONPath.query('$.store.book[?(@.price < 10)].author', data, { resultType: 'path' })
// Returns: ["$['store']['book'][0]['author']"]
```

**All:**
```javascript
JSONPath.query('$.store.book[?(@.price < 15)].title', data, { resultType: 'all' })
// Returns: {
//   entries: [
//     { value: 'Book 1', path: "$.store.book[0].title", parent: {...}, ... },
//     { value: 'Book 2', path: "$.store.book[1].title", parent: {...}, ... }
//   ]
// }
```

## Comparison with Other Libraries

### JSONPath (Original Goessner)
- Only supports selecting filters
- `$.book[?(@.price<10)]` returns books, cannot easily get nested properties

### JSONPath Plus
- Supports both but requires explicit syntax
- This implementation makes it automatic and intuitive

### XPath
- Uses predicates that always constrain
- This implementation matches XPath behavior for non-terminal filters

## Migration Guide

### Existing Code

All existing queries continue to work identically:

```javascript
// Terminal filters still select (backward compatible)
$.store.book[?(@.price < 10)]
// Still returns book objects

$..[?(@.price)]
// Still returns all objects with price property
```

### New Capabilities

You can now chain filters with selectors naturally:

```javascript
// Before: Had to use complex workarounds
// After: Simple and intuitive
$.store.book[?(@.price < 10)].author.name
```

## Edge Cases

### Empty Results
```javascript
// No matches returns empty array
$.store.book[?(@.price < 1)].title
// Returns: []
```

### Non-Array Filters
```javascript
// Filter on object tests the object itself
$.store.bicycle[?(@.price > 100)].brand
// Returns: ['Trek'] (if bicycle.price > 100)
```

### Array Index After Filter
```javascript
// Get first filtered result's property
$.store.book[?(@.price < 20)][0].title
// Returns: ['Book 1']
```

## Debugging

Use `resultType: 'all'` to understand how filters behave:

```javascript
const result = await JSONPath.query(
  '$.store.book[?(@.price < 15)].title',
  data,
  { resultType: 'all' }
);

console.log(result.entries);
// Shows: filtered books, then selected titles with full context
```

## Best Practices

1. **Use constraining filters for nested data access**: More readable than alternatives
2. **Chain filters when you need multiple conditions**: Each filter narrows results
3. **Prefer single filter with logical operators** when possible: More efficient
4. **Test terminal behavior**: Verify whether your filter is selecting or constraining
5. **Use with wildcards** for flexible queries across varying structures

## Summary

XPath-style filters provide:

- ✅ **Intuitive behavior**: Filters constrain when followed by selectors
- ✅ **Backward compatible**: Terminal filters still select as before
- ✅ **No syntax changes**: Works automatically based on query structure
- ✅ **XPath-like semantics**: Matches user expectations from XPath
- ✅ **Performance optimized**: Efficient filtering and selection
- ✅ **Widely applicable**: Works with all JSONPath features

This makes JSONPath queries more powerful and expressive while maintaining full backward compatibility.
