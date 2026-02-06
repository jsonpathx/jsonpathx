# QueryBuilder

QueryBuilder is included in the main `jsonpathx` package (no separate package).

```typescript
import { JSONPath, QueryBuilder } from '@jsonpathx/jsonpathx';

const result = await JSONPath.create(data)
  .query('$.items[*]')
  .filter(item => item.active)
  .execute();
```

See the full QueryBuilder API reference at `/api/query-builder`.
