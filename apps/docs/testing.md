# Testing Guide

Comprehensive guide to testing jsonpathx in your applications. Learn best practices for unit testing queries, integration testing, performance testing, and CI/CD integration.

## Table of Contents

- [Unit Testing](#unit-testing)
- [Mock Data Strategies](#mock-data-strategies)
- [Snapshot Testing](#snapshot-testing)
- [Integration Testing](#integration-testing)
- [Performance Testing](#performance-testing)
- [Testing Custom Functions](#testing-custom-functions)
- [CI/CD Integration](#cicd-integration)

---

## Unit Testing

### Basic Query Tests

```typescript
import { describe, it, expect } from 'vitest';
import { JSONPath } from '@jsonpathx/jsonpathx';

describe('JSONPath Queries', () => {
  const data = {
    users: [
      { id: 1, name: 'Alice', age: 30 },
      { id: 2, name: 'Bob', age: 25 }
    ]
  };

  it('should extract user names', async () => {
    const result = await JSONPath.query('$.users[*].name', data);
    expect(result).toEqual(['Alice', 'Bob']);
  });

  it('should filter by age', async () => {
    const result = await JSONPath.query('$.users[?(@.age > 25)]', data);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });

  it('should return empty array for no matches', async () => {
    const result = await JSONPath.query('$.users[?(@.age > 100)]', data);
    expect(result).toEqual([]);
  });
});
```

### Testing with TypeScript Types

```typescript
interface User {
  id: number;
  name: string;
  age: number;
}

describe('Typed Queries', () => {
  it('should return typed results', async () => {
    const data = {
      users: [
        { id: 1, name: 'Alice', age: 30 },
        { id: 2, name: 'Bob', age: 25 }
      ]
    };

    const result = await JSONPath.query<User>('$.users[*]', data);

    // TypeScript knows result is User[]
    expect(result[0].name).toBe('Alice');
    expect(result[0].age).toBe(30);
  });
});
```

### Error Handling Tests

```typescript
describe('Error Handling', () => {
  it('should throw on invalid syntax', async () => {
    await expect(
      JSONPath.query('$.invalid[', {})
    ).rejects.toThrow();
  });

  it('should handle missing properties with ignoreEvalErrors', async () => {
    const data = { items: [{ name: 'A' }, { name: 'B', value: 10 }] };

    const result = await JSONPath.query(
      '$.items[?(@.value > 5)]',
      data,
      { ignoreEvalErrors: true }
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('B');
  });
});
```

---

## Mock Data Strategies

### Fixtures

```typescript
// test/fixtures/users.ts
export const mockUsers = {
  users: [
    { id: 1, name: 'Alice', email: 'alice@example.com', active: true },
    { id: 2, name: 'Bob', email: 'bob@example.com', active: false },
    { id: 3, name: 'Charlie', email: 'charlie@example.com', active: true }
  ]
};

// test/queries.test.ts
import { mockUsers } from './fixtures/users';

describe('User Queries', () => {
  it('should get active users', async () => {
    const result = await JSONPath.query(
      '$.users[?(@.active === true)]',
      mockUsers
    );
    expect(result).toHaveLength(2);
  });
});
```

### Factory Functions

```typescript
// test/factories/user.factory.ts
export function createUser(overrides = {}) {
  return {
    id: Math.random(),
    name: 'Test User',
    email: 'test@example.com',
    age: 25,
    active: true,
    ...overrides
  };
}

export function createUsers(count: number, overrides = {}) {
  return Array.from({ length: count }, (_, i) =>
    createUser({ id: i + 1, ...overrides })
  );
}

// Usage in tests
describe('Bulk Operations', () => {
  it('should handle large datasets', async () => {
    const data = { users: createUsers(1000) };
    const result = await JSONPath.query('$.users[*].id', data);
    expect(result).toHaveLength(1000);
  });
});
```

### Dynamic Test Data

```typescript
import { faker } from '@faker-js/faker';

function generateTestData(userCount: number) {
  return {
    users: Array.from({ length: userCount }, () => ({
      id: faker.string.uuid(),
      name: faker.person.fullName(),
      email: faker.internet.email(),
      age: faker.number.int({ min: 18, max: 80 }),
      address: {
        city: faker.location.city(),
        country: faker.location.country()
      }
    }))
  };
}

describe('Random Data Tests', () => {
  it('should handle various data structures', async () => {
    const data = generateTestData(50);
    const result = await JSONPath.query('$.users[*].name', data);
    expect(result).toHaveLength(50);
  });
});
```

---

## Snapshot Testing

### Query Result Snapshots

```typescript
import { describe, it, expect } from 'vitest';

describe('Complex Query Snapshots', () => {
  it('should match snapshot', async () => {
    const data = {
      products: [
        { id: 1, name: 'Laptop', price: 999, category: 'Electronics' },
        { id: 2, name: 'Phone', price: 599, category: 'Electronics' },
        { id: 3, name: 'Desk', price: 299, category: 'Furniture' }
      ]
    };

    const result = await JSONPath.query(
      '$.products[?(@.category === "Electronics")]',
      data
    );

    expect(result).toMatchSnapshot();
  });
});
```

### Path and Pointer Snapshots

```typescript
describe('Result Types Snapshots', () => {
  it('should match path snapshot', async () => {
    const data = { a: { b: [1, 2, 3] } };

    const result = await JSONPath.query('$.a.b[*]', data, {
      resultType: 'all'
    });

    expect(result.paths).toMatchSnapshot('paths');
    expect(result.pointers).toMatchSnapshot('pointers');
    expect(result.values).toMatchSnapshot('values');
  });
});
```

---

## Integration Testing

### API Integration

```typescript
import request from 'supertest';
import express from 'express';
import { JSONPath } from '@jsonpathx/jsonpathx';

const app = express();
app.use(express.json());

app.post('/query', async (req, res) => {
  const { path, data } = req.body;
  const result = await JSONPath.query(path, data);
  res.json({ result });
});

describe('API Integration', () => {
  it('should execute query via API', async () => {
    const response = await request(app)
      .post('/query')
      .send({
        path: '$.users[*].name',
        data: { users: [{ name: 'Alice' }, { name: 'Bob' }] }
      });

    expect(response.status).toBe(200);
    expect(response.body.result).toEqual(['Alice', 'Bob']);
  });
});
```

### Database Integration

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

describe('Database Integration', () => {
  it('should query JSON column', async () => {
    // PostgreSQL JSON query
    const row = await db.query(
      'SELECT data FROM documents WHERE id = $1',
      [1]
    );

    const result = await JSONPath.query('$.metadata.tags[*]', row.data);
    expect(result).toContain('important');
  });
});
```

### External API Testing

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';
import nock from 'nock';

describe('External API', () => {
  it('should query API response', async () => {
    // Mock API
    nock('https://api.example.com')
      .get('/users')
      .reply(200, {
        users: [
          { id: 1, name: 'Alice' },
          { id: 2, name: 'Bob' }
        ]
      });

    const response = await fetch('https://api.example.com/users');
    const data = await response.json();

    const result = await JSONPath.query('$.users[*].name', data);
    expect(result).toEqual(['Alice', 'Bob']);
  });
});
```

---

## Performance Testing

### Benchmarking Queries

```typescript
import { describe, it, expect } from 'vitest';
import { JSONPath } from '@jsonpathx/jsonpathx';

describe('Performance Tests', () => {
  it('should complete within time limit', async () => {
    const data = {
      items: Array.from({ length: 10000 }, (_, i) => ({ id: i, value: i * 2 }))
    };

    const start = Date.now();
    await JSONPath.query('$.items[*].value', data);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100); // Should complete in <100ms
  });
});
```

### Cache Performance

```typescript
describe('Cache Performance', () => {
  beforeAll(() => {
    JSONPath.enableCache({ maxSize: 100 });
  });

  it('should be faster with cache', async () => {
    const data = generateLargeDataset();
    const path = '$.complex[?(@.nested.value > 100)]';

    // First run (no cache)
    const start1 = Date.now();
    await JSONPath.query(path, data, { enableCache: true });
    const duration1 = Date.now() - start1;

    // Second run (cached)
    const start2 = Date.now();
    await JSONPath.query(path, data, { enableCache: true });
    const duration2 = Date.now() - start2;

    expect(duration2).toBeLessThan(duration1 * 0.5);
  });
});
```

### Memory Usage

```typescript
describe('Memory Tests', () => {
  it('should not leak memory', async () => {
    const iterations = 1000;
    const initialMemory = process.memoryUsage().heapUsed;

    for (let i = 0; i < iterations; i++) {
      const data = { value: i };
      await JSONPath.query('$.value', data);
    }

    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memory increase should be reasonable
    expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024); // <10MB
  });
});
```

---

## Testing Custom Functions

### Sandbox Function Tests

```typescript
describe('Custom Functions', () => {
  it('should use custom validation function', async () => {
    const sandbox = {
      isValid: (user: any) => user.age >= 18 && user.verified
    };

    const data = {
      users: [
        { name: 'Alice', age: 25, verified: true },
        { name: 'Bob', age: 16, verified: true },
        { name: 'Charlie', age: 30, verified: false }
      ]
    };

    const result = await JSONPath.query(
      '$.users[?(@.isValid())]',
      data,
      { sandbox }
    );

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Alice');
  });
});
```

### Mock External Dependencies

```typescript
describe('Functions with Dependencies', () => {
  it('should mock external service', async () => {
    const mockExternalService = {
      isBlacklisted: jest.fn((email) => email.includes('spam'))
    };

    const sandbox = {
      checkEmail: (user: any) => !mockExternalService.isBlacklisted(user.email)
    };

    const data = {
      users: [
        { email: 'user@example.com' },
        { email: 'spam@spam.com' }
      ]
    };

    const result = await JSONPath.query(
      '$.users[?(@.checkEmail())]',
      data,
      { sandbox }
    );

    expect(result).toHaveLength(1);
    expect(mockExternalService.isBlacklisted).toHaveBeenCalledTimes(2);
  });
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Run performance tests
        run: npm run test:performance

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

### GitLab CI

```yaml
# .gitlab-ci.yml
test:
  image: node:18
  script:
    - npm ci
    - npm test
    - npm run test:performance
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

### Test Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:performance": "vitest run --config vitest.performance.config.ts",
    "test:integration": "vitest run --config vitest.integration.config.ts"
  }
}
```

### Pre-commit Hooks

```bash
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm test
npm run test:performance
```

---

## Best Practices

### 1. Organize Tests by Feature

```typescript
describe('User Management', () => {
  describe('Filtering', () => {
    it('should filter by active status', async () => {
      // Test implementation
    });

    it('should filter by age range', async () => {
      // Test implementation
    });
  });

  describe('Sorting', () => {
    it('should sort by name', async () => {
      // Test implementation
    });
  });
});
```

### 2. Use Descriptive Test Names

```typescript
// ❌ Bad
it('test 1', async () => { /* ... */ });

// ✅ Good
it('should return empty array when no users match filter', async () => {
  /* ... */
});
```

### 3. Test Edge Cases

```typescript
describe('Edge Cases', () => {
  it('should handle empty data', async () => {
    const result = await JSONPath.query('$.users[*]', {});
    expect(result).toEqual([]);
  });

  it('should handle null values', async () => {
    const result = await JSONPath.query('$.value', { value: null });
    expect(result).toEqual([null]);
  });

  it('should handle deeply nested data', async () => {
    const data = { a: { b: { c: { d: { e: 'deep' } } } } };
    const result = await JSONPath.query('$.a.b.c.d.e', data);
    expect(result).toEqual(['deep']);
  });
});
```

### 4. Setup and Teardown

```typescript
describe('Cache Tests', () => {
  beforeEach(() => {
    JSONPath.enableCache({ maxSize: 100 });
  });

  afterEach(() => {
    JSONPath.clearCache();
  });

  it('should cache queries', async () => {
    // Test implementation
  });
});
```

---

## Coverage Goals

### Recommended Coverage Targets

- **Statements**: 90%+
- **Branches**: 85%+
- **Functions**: 90%+
- **Lines**: 90%+

### Coverage Report

```bash
# Generate coverage report
npm run test:coverage

# View HTML report
open coverage/index.html
```

---

## See Also

- [API Reference](./api/index.md) - Complete API documentation
- [Error Handling](./guide/error-handling.md) - Error handling strategies
- [Examples](./examples/index.md) - More examples
