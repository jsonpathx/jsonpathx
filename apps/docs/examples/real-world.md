# Real-World Use Cases

Practical examples of jsonpathx in production scenarios. Learn from real-world applications including e-commerce, APIs, configuration management, and data processing.

## E-commerce Product Search

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  rating: number;
  inStock: boolean;
  tags: string[];
}

async function searchProducts(
  catalog: any,
  filters: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
    inStock?: boolean;
    tags?: string[];
  }
) {
  let builder = JSONPath.create<Product>(catalog).query('$.products[*]');

  if (filters.category) {
    builder = builder.filter(p => p.category === filters.category);
  }

  if (filters.minPrice !== undefined) {
    builder = builder.filter(p => p.price >= filters.minPrice);
  }

  if (filters.maxPrice !== undefined) {
    builder = builder.filter(p => p.price <= filters.maxPrice);
  }

  if (filters.minRating !== undefined) {
    builder = builder.filter(p => p.rating >= filters.minRating);
  }

  if (filters.inStock) {
    builder = builder.filter(p => p.inStock);
  }

  if (filters.tags && filters.tags.length > 0) {
    builder = builder.filter(p =>
      filters.tags!.some(tag => p.tags.includes(tag))
    );
  }

  return builder.sort((a, b) => b.rating - a.rating).execute();
}

// Usage
const results = await searchProducts(catalog, {
  category: 'electronics',
  minPrice: 50,
  maxPrice: 500,
  minRating: 4.0,
  inStock: true,
  tags: ['wireless', 'bluetooth']
});
```

## API Response Transformation

```typescript
// Transform nested API response
async function transformAPIResponse(apiData: any) {
  // Extract users with nested data
  const users = await JSONPath.create(apiData)
    .query('$.data.users[*]')
    .map(user => ({
      id: user.user_id,
      name: `${user.first_name} ${user.last_name}`,
      email: user.contact.email,
      phone: user.contact.phone,
      address: {
        street: user.address.street_address,
        city: user.address.city,
        country: user.address.country_code
      },
      preferences: user.settings || {},
      joinedAt: new Date(user.created_at).toISOString()
    }))
    .execute();

  return { users, count: users.length };
}

// Handle paginated responses
async function aggregatePaginatedData(responses: any[]) {
  const allItems = [];

  for (const response of responses) {
    const items = await JSONPath.query('$.data.items[*]', response);
    allItems.push(...items);
  }

  return allItems;
}
```

## Configuration Management

```typescript
// Merge multiple configuration sources
import { Mutation } from '@jsonpathx/jsonpathx';

async function mergeConfigurations(
  defaultConfig: any,
  envConfig: any,
  userConfig: any
): Promise<any> {
  let config = defaultConfig;

  // Apply environment config
  const envOverrides = await JSONPath.query('$..override', envConfig);
  for (const override of envOverrides) {
    config = (await Mutation.set(
      config,
      override.path,
      override.value,
      { createPath: true }
    )).data;
  }

  // Apply user config
  const userOverrides = await JSONPath.query('$..override', userConfig);
  for (const override of userOverrides) {
    config = (await Mutation.set(
      config,
      override.path,
      override.value,
      { createPath: true }
    )).data;
  }

  return config;
}

// Extract configuration values
async function getConfigValue(config: any, path: string, defaultValue?: any) {
  try {
    const values = await JSONPath.query(path, config);
    return values.length > 0 ? values[0] : defaultValue;
  } catch {
    return defaultValue;
  }
}
```

## Data Validation & Sanitization

```typescript
// Validate user input
async function validateUserData(userData: any): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Check required fields
  const requiredFields = ['email', 'username', 'password'];
  for (const field of requiredFields) {
    const values = await JSONPath.query(`$.${field}`, userData);
    if (values.length === 0 || !values[0]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate email format
  const emails = await JSONPath.query('$.email', userData);
  if (emails.length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emails[0])) {
    errors.push('Invalid email format');
  }

  // Validate nested structure
  const profile = await JSONPath.query('$.profile', userData);
  if (profile.length === 0) {
    errors.push('Profile object is required');
  }

  return { valid: errors.length === 0, errors };
}

// Sanitize data
async function sanitizeData(data: any): Promise<any> {
  // Remove sensitive fields
  let sanitized = await Mutation.delete(data, '$..password');
  sanitized = await Mutation.delete(sanitized.data, '$..ssn');
  sanitized = await Mutation.delete(sanitized.data, '$..creditCard');

  // Normalize email addresses
  sanitized = await Mutation.update(
    sanitized.data,
    '$..[?(@string() && @.includes("@"))].email',
    email => email.toLowerCase().trim()
  );

  return sanitized.data;
}
```

## Analytics & Reporting

```typescript
// Generate sales report
async function generateSalesReport(salesData: any) {
  // Group by region
  const byRegion = await JSONPath.create(salesData)
    .query('$.sales[*]')
    .groupBy(sale => sale.region);

  const regionReports = Array.from(byRegion.entries()).map(([region, sales]) => {
    const total = sales.reduce((sum, s) => sum + s.amount, 0);
    const count = sales.length;
    const average = total / count;
    const topProduct = sales
      .reduce((acc: any, s) => {
        acc[s.product] = (acc[s.product] || 0) + s.amount;
        return acc;
      }, {});

    return { region, total, count, average, topProduct };
  });

  return regionReports.sort((a, b) => b.total - a.total);
}

// Track metrics
async function analyzeMetrics(data: any, period: string) {
  const metrics = await JSONPath.create(data)
    .query(`$.metrics[?(@.period === "${period}")]`)
    .execute();

  return {
    total: metrics.reduce((sum, m) => sum + m.value, 0),
    average: metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length,
    min: Math.min(...metrics.map(m => m.value)),
    max: Math.max(...metrics.map(m => m.value)),
    count: metrics.length
  };
}
```

## Content Management

```typescript
// Query CMS content
async function getPublishedContent(cms: any, contentType: string) {
  const sandbox = {
    isPublished: (item: any) => {
      return item.status === 'published' &&
             new Date(item.publishDate) <= new Date();
    },
    hasValidSlug: (item: any) => {
      return /^[a-z0-9-]+$/.test(item.slug);
    }
  };

  return JSONPath.query(
    `$.content[?(@.type === "${contentType}" && @.isPublished() && @.hasValidSlug())]`,
    cms,
    { sandbox }
  );
}

// Build navigation tree
async function buildNavigation(pages: any) {
  const topLevel = await JSONPath.query(
    '$.pages[?(@.parentId === null)]',
    pages
  );

  const withChildren = await Promise.all(
    topLevel.map(async page => {
      const children = await JSONPath.query(
        `$.pages[?(@.parentId === ${page.id})]`,
        pages
      );
      return { ...page, children };
    })
  );

  return withChildren;
}
```

## See Also

- [Advanced Examples](./advanced.md) - Advanced query patterns
- [Mutations Examples](./mutations.md) - Data mutation examples
- [Custom Functions Examples](./custom-functions.md) - Filter functions
