# React Integration Guide

Integrate jsonpathx with React applications. Learn about hooks, state management, performance optimization, and best practices for using JSONPath in React.

## Installation

```bash
npm install jsonpathx
```

## Basic Usage in Components

```typescript
import React, { useState, useEffect } from 'react';
import { JSONPath } from 'jsonpathx';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      const data = await fetch('/api/products').then(r => r.json());
      const items = await JSONPath.query('$.products[*]', data);
      setProducts(items);
      setLoading(false);
    }
    loadProducts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## Custom Hooks

### useJSONPath Hook

```typescript
import { useState, useEffect, useCallback } from 'react';
import { JSONPath } from 'jsonpathx';

function useJSONPath<T = unknown>(
  data: unknown,
  path: string,
  deps: any[] = []
) {
  const [result, setResult] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function query() {
      try {
        setLoading(true);
        setError(null);
        const items = await JSONPath.query<T>(path, data);
        if (!cancelled) {
          setResult(items);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    query();

    return () => {
      cancelled = true;
    };
  }, [data, path, ...deps]);

  return { data: result, loading, error };
}

// Usage
function UserList({ data }) {
  const { data: users, loading, error } = useJSONPath(
    data,
    '$.users[?(@.active === true)]'
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### useQueryBuilder Hook

```typescript
import { useState, useMemo } from 'react';
import { JSONPath } from 'jsonpathx';

function useQueryBuilder<T>(data: unknown, initialPath: string) {
  const [filters, setFilters] = useState<Array<(item: T) => boolean>>([]);
  const [sortFn, setSortFn] = useState<((a: T, b: T) => number) | null>(null);
  const [limit, setLimit] = useState<number | null>(null);

  const result = useMemo(() => {
    let builder = JSONPath.create<T>(data).query(initialPath);

    filters.forEach(filter => {
      builder = builder.filter(filter);
    });

    if (sortFn) {
      builder = builder.sort(sortFn);
    }

    if (limit) {
      builder = builder.take(limit);
    }

    return builder.execute();
  }, [data, initialPath, filters, sortFn, limit]);

  return {
    result,
    addFilter: (filter: (item: T) => boolean) =>
      setFilters(prev => [...prev, filter]),
    clearFilters: () => setFilters([]),
    setSort: setSortFn,
    setLimit
  };
}
```

## State Management Integration

### With Redux

```typescript
// actions.ts
import { JSONPath } from 'jsonpathx';

export const LOAD_PRODUCTS = 'LOAD_PRODUCTS';
export const FILTER_PRODUCTS = 'FILTER_PRODUCTS';

export const loadProducts = (data: any) => async (dispatch: any) => {
  const products = await JSONPath.query('$.products[*]', data);
  dispatch({ type: LOAD_PRODUCTS, payload: products });
};

export const filterProducts = (data: any, filters: any) => async (dispatch: any) => {
  let builder = JSONPath.create(data).query('$.products[*]');

  if (filters.category) {
    builder = builder.filter(p => p.category === filters.category);
  }

  if (filters.minPrice) {
    builder = builder.filter(p => p.price >= filters.minPrice);
  }

  const filtered = await builder.execute();
  dispatch({ type: FILTER_PRODUCTS, payload: filtered });
};
```

### With Context API

```typescript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { JSONPath } from 'jsonpathx';

interface DataContextType {
  data: any;
  query: (path: string) => Promise<any[]>;
  updateData: (newData: any) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children, initialData }: any) {
  const [data, setData] = useState(initialData);

  const query = useCallback(async (path: string) => {
    return JSONPath.query(path, data);
  }, [data]);

  const updateData = useCallback((newData: any) => {
    setData(newData);
  }, []);

  return (
    <DataContext.Provider value={{ data, query, updateData }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within DataProvider');
  return context;
}

// Usage
function ProductFilter() {
  const { query } = useData();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    query('$.products[?(@.inStock === true)]').then(setProducts);
  }, [query]);

  return <div>{/* render products */}</div>;
}
```

## Performance Optimization

### Memoization

```typescript
import { useMemo } from 'react';
import { JSONPath } from 'jsonpathx';

function OptimizedProductList({ data, category }) {
  const products = useMemo(() => {
    return JSONPath.query(
      `$.products[?(@.category === "${category}")]`,
      data
    );
  }, [data, category]);

  return (
    <div>
      {products.map(product => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

### Debounced Search

```typescript
import { useState, useEffect, useCallback } from 'react';
import { JSONPath } from 'jsonpathx';
import { debounce } from 'lodash';

function SearchableList({ data }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);

  const search = useCallback(
    debounce(async (searchTerm: string) => {
      if (!searchTerm) {
        setResults([]);
        return;
      }

      const sandbox = {
        matches: (item: any) =>
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
      };

      const found = await JSONPath.query(
        '$.items[?(@.matches())]',
        data,
        { sandbox }
      );

      setResults(found);
    }, 300),
    [data]
  );

  useEffect(() => {
    search(query);
  }, [query, search]);

  return (
    <div>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <ul>
        {results.map(item => (
          <li key={item.id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Form Handling

```typescript
import { useState } from 'react';
import { Mutation } from 'jsonpathx';

function UserForm({ userData, onSave }) {
  const [data, setData] = useState(userData);

  const handleUpdate = async (path: string, value: any) => {
    const result = await Mutation.set(data, path, value);
    setData(result.data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        value={data.name}
        onChange={e => handleUpdate('$.name', e.target.value)}
      />
      <input
        value={data.email}
        onChange={e => handleUpdate('$.email', e.target.value)}
      />
      <button type="submit">Save</button>
    </form>
  );
}
```

## Real-Time Updates

```typescript
import { useState, useEffect } from 'react';
import { JSONPath } from 'jsonpathx';

function LiveDataComponent({ socket }) {
  const [data, setData] = useState(null);
  const [activeItems, setActiveItems] = useState([]);

  useEffect(() => {
    socket.on('data-update', async (newData: any) => {
      setData(newData);

      // Query active items
      const items = await JSONPath.query(
        '$.items[?(@.status === "active")]',
        newData
      );
      setActiveItems(items);
    });

    return () => socket.off('data-update');
  }, [socket]);

  return <div>{/* render active items */}</div>;
}
```

## See Also

- [TypeScript Guide](../guide/typescript.md) - Type-safe React components
- [Performance Guide](../performance.md) - Optimization techniques
- [Advanced Patterns](../guide/advanced-patterns.md) - Advanced usage
