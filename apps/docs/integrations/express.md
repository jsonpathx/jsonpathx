# Express.js Integration Guide

Integrate jsonpathx with Express.js applications. Learn about middleware, request/response transformation, API endpoints, and best practices.

## Installation

```bash
npm install express jsonpathx
```

## Middleware

### Query Middleware

```typescript
import express from 'express';
import { JSONPath } from '@jsonpathx/jsonpathx';

// Middleware to add JSONPath query capability
function jsonPathMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  res.jsonPath = async (data: unknown, path: string) => {
    try {
      const result = await JSONPath.query(path, data);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid JSONPath query' });
    }
  };
  next();
}

app.use(jsonPathMiddleware);

// Usage in routes
app.get('/api/users', async (req, res) => {
  const data = await getUsersData();
  const path = req.query.path || '$.users[*]';
  await res.jsonPath(data, path as string);
});
```

### Request Body Transformation

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

async function transformRequestBody(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  if (req.body && req.query.transform) {
    try {
      const path = req.query.transform as string;
      req.body = await JSONPath.query(path, req.body);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid transformation' });
    }
  }
  next();
}

app.use(express.json());
app.use(transformRequestBody);
```

## API Endpoints

### Flexible Query Endpoint

```typescript
app.post('/api/query', async (req, res) => {
  try {
    const { data, path, options } = req.body;

    if (!data || !path) {
      return res.status(400).json({
        error: 'data and path are required'
      });
    }

    const result = await JSONPath.query(path, data, options);

    res.json({
      success: true,
      count: Array.isArray(result) ? result.length : 1,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});
```

### Search Endpoint

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

app.get('/api/products/search', async (req, res) => {
  try {
    const {
      category,
      minPrice,
      maxPrice,
      inStock,
      sort = 'rating',
      limit = 20
    } = req.query;

    const products = await getProductsData();

    let builder = JSONPath.create(products).query('$.products[*]');

    if (category) {
      builder = builder.filter(p => p.category === category);
    }

    if (minPrice) {
      builder = builder.filter(p => p.price >= Number(minPrice));
    }

    if (maxPrice) {
      builder = builder.filter(p => p.price <= Number(maxPrice));
    }

    if (inStock === 'true') {
      builder = builder.filter(p => p.inStock);
    }

    // Sort
    if (sort === 'price-asc') {
      builder = builder.sort((a, b) => a.price - b.price);
    } else if (sort === 'price-desc') {
      builder = builder.sort((a, b) => b.price - a.price);
    } else {
      builder = builder.sort((a, b) => b.rating - a.rating);
    }

    const results = await builder.take(Number(limit)).execute();

    res.json({
      count: results.length,
      products: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Data Mutation Endpoint

```typescript
import { Mutation } from '@jsonpathx/jsonpathx';

app.patch('/api/data', async (req, res) => {
  try {
    const { operation, path, value } = req.body;

    let data = await loadData();
    let result;

    switch (operation) {
      case 'set':
        result = await Mutation.set(data, path, value);
        break;
      case 'delete':
        result = await Mutation.delete(data, path);
        break;
      case 'increment':
        result = await Mutation.increment(data, path, value || 1);
        break;
      case 'merge':
        result = await Mutation.merge(data, path, value);
        break;
      default:
        return res.status(400).json({ error: 'Invalid operation' });
    }

    await saveData(result.data);

    res.json({
      success: true,
      modified: result.modified,
      paths: result.paths
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Response Transformation

### Transform Middleware

```typescript
function responseTransform(pathOrFn?: string | ((data: any) => any)) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const originalJson = res.json.bind(res);

    res.json = async function (data: any) {
      if (pathOrFn) {
        if (typeof pathOrFn === 'string') {
          data = await JSONPath.query(pathOrFn, { data });
        } else {
          data = await pathOrFn(data);
        }
      }
      return originalJson(data);
    };

    next();
  };
}

// Usage
app.get('/api/users',
  responseTransform('$.data.users[*]'),
  async (req, res) => {
    const data = await fetchUsers();
    res.json(data);
  }
);
```

## Error Handling

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

app.use(async (err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err.name === 'JSONPathError') {
    return res.status(400).json({
      error: 'Invalid JSONPath query',
      message: err.message
    });
  }

  res.status(500).json({
    error: 'Internal server error'
  });
});
```

## Validation Middleware

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

async function validateRequest(schema: any) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const values = await JSONPath.query(`$.${field}`, req.body);

      if (rules.required && values.length === 0) {
        errors.push(`${field} is required`);
      }

      // Add more validation rules
    }

    if (errors.length > 0) {
      return res.status(400).json({ errors });
    }

    next();
  };
}

// Usage
app.post('/api/users',
  validateRequest({
    email: { required: true, type: 'email' },
    name: { required: true, minLength: 2 }
  }),
  async (req, res) => {
    // Handle validated request
  }
);
```

## Caching Layer

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

const cache = new Map();

function cacheMiddleware(ttl: number = 60000) {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const key = req.originalUrl;

    if (cache.has(key)) {
      const { data, timestamp } = cache.get(key);
      if (Date.now() - timestamp < ttl) {
        return res.json(data);
      }
    }

    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      cache.set(key, { data, timestamp: Date.now() });
      return originalJson(data);
    };

    next();
  };
}

// Enable global query cache
JSONPath.enableCache({ maxSize: 200, ttl: 120000 });
```

## Real-World Example

```typescript
import express from 'express';
import { JSONPath, Mutation } from '@jsonpathx/jsonpathx';

const app = express();
app.use(express.json());

// Product catalog API
app.get('/api/products', async (req, res) => {
  try {
    const catalog = await loadCatalog();
    const {
      category,
      minPrice,
      maxPrice,
      sort,
      limit = 50,
      offset = 0
    } = req.query;

    let builder = JSONPath.create(catalog).query('$.products[*]');

    if (category) {
      builder = builder.filter(p => p.category === category);
    }

    if (minPrice) {
      builder = builder.filter(p => p.price >= Number(minPrice));
    }

    if (maxPrice) {
      builder = builder.filter(p => p.price <= Number(maxPrice));
    }

    if (sort === 'price') {
      builder = builder.sort((a, b) => a.price - b.price);
    }

    const results = await builder
      .skip(Number(offset))
      .take(Number(limit))
      .execute();

    res.json({
      count: results.length,
      products: results
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product
app.patch('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    let catalog = await loadCatalog();

    for (const [key, value] of Object.entries(updates)) {
      const result = await Mutation.set(
        catalog,
        `$.products[?(@.id === "${id}")].${key}`,
        value
      );
      catalog = result.data;
    }

    await saveCatalog(catalog);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## See Also

- [Advanced Patterns](../guide/advanced-patterns.md) - Advanced usage patterns
- [Performance Guide](../performance.md) - Optimization techniques
- [Mutations Guide](../guide/mutations.md) - Data mutations
