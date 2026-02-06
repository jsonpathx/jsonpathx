# QueryBuilder Usage

QueryBuilder is included in the main `jsonpathx` package.

```typescript
import { JSONPath } from '@jsonpathx/jsonpathx';

const result = await JSONPath.create(data)
  .query('$.items[*]')
  .filter(item => item.active)
  .execute();
```

See `/api/query-builder` for the full API.
