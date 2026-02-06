# GraphQL Integration Guide

Integrate jsonpathx with GraphQL servers. Learn about field resolvers, data fetching, query optimization, and best practices for using JSONPath with GraphQL.

## Installation

```bash
npm install graphql jsonpathx
```

## Basic Integration

```typescript
import { JSONPath } from 'jsonpathx';
import { GraphQLObjectType, GraphQLString, GraphQLList } from 'graphql';

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    email: { type: GraphQLString }
  }
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    users: {
      type: new GraphQLList(UserType),
      resolve: async (parent, args, context) => {
        const data = await context.dataSource.loadUsers();
        return JSONPath.query('$.users[*]', data);
      }
    }
  }
});
```

## Field Resolvers with JSONPath

```typescript
import { JSONPath } from 'jsonpathx';

const ProductType = new GraphQLObjectType({
  name: 'Product',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    price: { type: GraphQLFloat },
    reviews: {
      type: new GraphQLList(ReviewType),
      resolve: async (product, args, context) => {
        // Use JSONPath to extract nested data
        return JSONPath.query(
          `$.reviews[?(@.productId === "${product.id}")]`,
          context.data
        );
      }
    },
    averageRating: {
      type: GraphQLFloat,
      resolve: async (product, args, context) => {
        const reviews = await JSONPath.query(
          `$.reviews[?(@.productId === "${product.id}")].rating`,
          context.data
        );
        return reviews.reduce((a, b) => a + b, 0) / reviews.length;
      }
    }
  }
});
```

## Query Arguments

```typescript
const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    products: {
      type: new GraphQLList(ProductType),
      args: {
        category: { type: GraphQLString },
        minPrice: { type: GraphQLFloat },
        maxPrice: { type: GraphQLFloat },
        inStock: { type: GraphQLBoolean }
      },
      resolve: async (parent, args, context) => {
        const data = await context.dataSource.loadProducts();

        let builder = JSONPath.create(data).query('$.products[*]');

        if (args.category) {
          builder = builder.filter(p => p.category === args.category);
        }

        if (args.minPrice !== undefined) {
          builder = builder.filter(p => p.price >= args.minPrice);
        }

        if (args.maxPrice !== undefined) {
          builder = builder.filter(p => p.price <= args.maxPrice);
        }

        if (args.inStock !== undefined) {
          builder = builder.filter(p => p.inStock === args.inStock);
        }

        return builder.execute();
      }
    }
  }
});
```

## DataLoader Integration

```typescript
import DataLoader from 'dataloader';
import { JSONPath } from 'jsonpathx';

class ProductLoader {
  private data: any;
  private loader: DataLoader<string, any>;

  constructor(data: any) {
    this.data = data;
    this.loader = new DataLoader(async (ids: readonly string[]) => {
      return Promise.all(
        ids.map(async id => {
          const results = await JSONPath.query(
            `$.products[?(@.id === "${id}")]`,
            this.data
          );
          return results[0] || null;
        })
      );
    });
  }

  load(id: string) {
    return this.loader.load(id);
  }

  async loadMany(ids: string[]) {
    return this.loader.loadMany(ids);
  }
}

// Usage in context
const context = {
  loaders: {
    product: new ProductLoader(data)
  }
};
```

## Mutations with JSONPath

```typescript
import { Mutation } from 'jsonpathx';

const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    updateProduct: {
      type: ProductType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        input: { type: ProductInputType }
      },
      resolve: async (parent, args, context) => {
        let data = context.data;

        // Update each field
        for (const [key, value] of Object.entries(args.input)) {
          const result = await Mutation.set(
            data,
            `$.products[?(@.id === "${args.id}")].${key}`,
            value
          );
          data = result.data;
        }

        // Save updated data
        await context.dataSource.save(data);

        // Return updated product
        const updated = await JSONPath.query(
          `$.products[?(@.id === "${args.id}")]`,
          data
        );
        return updated[0];
      }
    },

    deleteProduct: {
      type: GraphQLBoolean,
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) }
      },
      resolve: async (parent, args, context) => {
        const result = await Mutation.delete(
          context.data,
          `$.products[?(@.id === "${args.id}")]`
        );

        await context.dataSource.save(result.data);
        return result.modified > 0;
      }
    }
  }
});
```

## Nested Resolvers

```typescript
const OrderType = new GraphQLObjectType({
  name: 'Order',
  fields: {
    id: { type: GraphQLString },
    customer: {
      type: UserType,
      resolve: async (order, args, context) => {
        const users = await JSONPath.query(
          `$.users[?(@.id === "${order.customerId}")]`,
          context.data
        );
        return users[0];
      }
    },
    items: {
      type: new GraphQLList(OrderItemType),
      resolve: async (order, args, context) => {
        return JSONPath.query('$.items[*]', order);
      }
    },
    total: {
      type: GraphQLFloat,
      resolve: async (order, args, context) => {
        const prices = await JSONPath.query('$.items[*].price', order);
        return prices.reduce((a, b) => a + b, 0);
      }
    }
  }
});
```

## Custom Directives

```typescript
import { SchemaDirectiveVisitor } from 'graphql-tools';
import { JSONPath } from 'jsonpathx';

class JsonPathDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: any) {
    const { resolve = defaultFieldResolver } = field;
    const { path } = this.args;

    field.resolve = async function (...args: any[]) {
      const result = await resolve.apply(this, args);
      if (path && result) {
        return JSONPath.query(path, result);
      }
      return result;
    };
  }
}

// Schema with directive
const typeDefs = `
  directive @jsonpath(path: String!) on FIELD_DEFINITION

  type User {
    id: ID!
    profile: Profile
    activeOrders: [Order] @jsonpath(path: "$.orders[?(@.status === 'active')]")
  }
`;
```

## Performance Optimization

### Query Caching

```typescript
import { JSONPath } from 'jsonpathx';

// Enable caching
JSONPath.enableCache({
  maxSize: 200,
  ttl: 120000
});

const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    products: {
      type: new GraphQLList(ProductType),
      resolve: async (parent, args, context) => {
        // Queries will be cached automatically
        return JSONPath.query('$.products[*]', context.data, {
          enableCache: true
        });
      }
    }
  }
});
```

### Batching Queries

```typescript
async function batchResolve(parent: any, keys: string[], context: any) {
  const queries = keys.map(key =>
    JSONPath.query(`$.${key}[*]`, context.data)
  );

  return Promise.all(queries);
}
```

## Real-World Example

```typescript
import { GraphQLSchema, GraphQLObjectType, GraphQLList, GraphQLString, GraphQLFloat, GraphQLBoolean } from 'graphql';
import { JSONPath, Mutation } from 'jsonpathx';

// Types
const ProductType = new GraphQLObjectType({
  name: 'Product',
  fields: {
    id: { type: GraphQLString },
    name: { type: GraphQLString },
    price: { type: GraphQLFloat },
    category: { type: GraphQLString },
    inStock: { type: GraphQLBoolean }
  }
});

// Query
const QueryType = new GraphQLObjectType({
  name: 'Query',
  fields: {
    products: {
      type: new GraphQLList(ProductType),
      args: {
        category: { type: GraphQLString },
        inStock: { type: GraphQLBoolean }
      },
      resolve: async (parent, args, context) => {
        let builder = JSONPath.create(context.data).query('$.products[*]');

        if (args.category) {
          builder = builder.filter(p => p.category === args.category);
        }

        if (args.inStock !== undefined) {
          builder = builder.filter(p => p.inStock === args.inStock);
        }

        return builder.execute();
      }
    },
    product: {
      type: ProductType,
      args: {
        id: { type: GraphQLString }
      },
      resolve: async (parent, args, context) => {
        const results = await JSONPath.query(
          `$.products[?(@.id === "${args.id}")]`,
          context.data
        );
        return results[0];
      }
    }
  }
});

// Mutations
const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    updateProductPrice: {
      type: ProductType,
      args: {
        id: { type: GraphQLString },
        price: { type: GraphQLFloat }
      },
      resolve: async (parent, args, context) => {
        const result = await Mutation.set(
          context.data,
          `$.products[?(@.id === "${args.id}")].price`,
          args.price
        );

        const updated = await JSONPath.query(
          `$.products[?(@.id === "${args.id}")]`,
          result.data
        );

        return updated[0];
      }
    }
  }
});

// Schema
const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType
});

export default schema;
```

## See Also

- [Advanced Patterns](../guide/advanced-patterns.md) - Advanced usage patterns
- [Performance Guide](../performance.md) - Optimization techniques
- [Mutations Guide](../guide/mutations.md) - Data mutations
