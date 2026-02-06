# Custom Functions Examples

Practical examples of custom filter functions using the sandbox. Learn how to extend JSONPath with reusable, powerful filter logic.

## Table of Contents

- [Basic Filter Functions](#basic-filter-functions)
- [String Operations](#string-operations)
- [Number Operations](#number-operations)
- [Date Operations](#date-operations)
- [Array Operations](#array-operations)
- [Complex Validation](#complex-validation)
- [External Data Integration](#external-data-integration)
- [Real-World Scenarios](#real-world-scenarios)

---

## Basic Filter Functions

### Example 1: Simple Predicates

```typescript
import { JSONPath } from 'jsonpathx';

const data = {
  products: [
    { id: 1, name: 'Widget', price: 50, inStock: true },
    { id: 2, name: 'Gadget', price: 150, inStock: false },
    { id: 3, name: 'Tool', price: 25, inStock: true }
  ]
};

const sandbox = {
  isExpensive: (item) => item.price > 100,
  isAvailable: (item) => item.inStock === true,
  isCheap: (item) => item.price < 50
};

// Find expensive products
const expensive = await JSONPath.query(
  '$.products[?(@.isExpensive())]',
  data,
  { sandbox }
);
// [{ id: 2, name: 'Gadget', ... }]

// Find available and cheap
const cheapAvailable = await JSONPath.query(
  '$.products[?(@.isAvailable() && @.isCheap())]',
  data,
  { sandbox }
);
// [{ id: 3, name: 'Tool', ... }]
```

### Example 2: Functions with Parameters

```typescript
const data = {
  items: [
    { name: 'Item A', value: 25 },
    { name: 'Item B', value: 50 },
    { name: 'Item C', value: 75 },
    { name: 'Item D', value: 100 }
  ]
};

const sandbox = {
  inRange: (item, min, max) => {
    return item.value >= min && item.value <= max;
  },

  isMultipleOf: (item, divisor) => {
    return item.value % divisor === 0;
  }
};

// Find items in range 40-80
const inRange = await JSONPath.query(
  '$.items[?(@.inRange(40, 80))]',
  data,
  { sandbox }
);

// Find multiples of 25
const multiples = await JSONPath.query(
  '$.items[?(@.value.isMultipleOf(25))]',
  data,
  { sandbox }
);
```

---

## String Operations

### Example 3: String Matching

```typescript
const data = {
  users: [
    { id: 1, name: 'Alice Smith', email: 'alice@example.com' },
    { id: 2, name: 'Bob Johnson', email: 'bob@test.com' },
    { id: 3, name: 'Charlie Smith', email: 'charlie@example.com' }
  ]
};

const sandbox = {
  // Case-insensitive search
  containsIgnoreCase: (item, search) => {
    return typeof item === 'string' &&
           item.toLowerCase().includes(search.toLowerCase());
  },

  // Starts with
  startsWith: (item, prefix) => {
    return typeof item === 'string' && item.startsWith(prefix);
  },

  // Email domain check
  hasDomain: (item, domain) => {
    return typeof item === 'string' && item.endsWith(`@${domain}`);
  },

  // Regex match
  matches: (item, pattern) => {
    return typeof item === 'string' && new RegExp(pattern).test(item);
  }
};

// Find users with "Smith" in name
const smiths = await JSONPath.query(
  '$.users[?(@.name.containsIgnoreCase("smith"))]',
  data,
  { sandbox }
);

// Find users with example.com email
const exampleUsers = await JSONPath.query(
  '$.users[?(@.email.hasDomain("example.com"))]',
  data,
  { sandbox }
);
```

### Example 4: Advanced String Operations

```typescript
const products = {
  items: [
    { sku: 'ELEC-001', name: 'Phone', category: 'Electronics' },
    { sku: 'CLOTH-042', name: 'Shirt', category: 'Clothing' },
    { sku: 'ELEC-105', name: 'Laptop', category: 'Electronics' }
  ]
};

const sandbox = {
  // SKU validation
  isValidSKU: (item) => {
    return /^[A-Z]+-\d{3}$/.test(item);
  },

  // Extract category from SKU
  skuMatchesCategory: (item) => {
    const skuCategory = item.sku.split('-')[0].toLowerCase();
    return item.category.toLowerCase().startsWith(skuCategory.slice(0, 5));
  },

  // Length check
  hasLength: (item, min, max) => {
    return typeof item === 'string' &&
           item.length >= min &&
           item.length <= max;
  }
};

// Find items with valid SKUs
const validSkus = await JSONPath.query(
  '$.items[?(@.sku.isValidSKU())]',
  products,
  { sandbox }
);

// Find items where SKU matches category
const matching = await JSONPath.query(
  '$.items[?(@.skuMatchesCategory())]',
  products,
  { sandbox }
);
```

---

## Number Operations

### Example 5: Numeric Filters

```typescript
const analytics = {
  metrics: [
    { page: 'home', views: 1250, clicks: 85, bounceRate: 0.35 },
    { page: 'about', views: 750, clicks: 45, bounceRate: 0.52 },
    { page: 'products', views: 2100, clicks: 320, bounceRate: 0.22 },
    { page: 'contact', views: 420, clicks: 38, bounceRate: 0.68 }
  ]
};

const sandbox = {
  // Percentage check
  percentageAbove: (item, threshold) => {
    return item >= threshold;
  },

  // Within range
  between: (item, min, max) => {
    return item >= min && item <= max;
  },

  // Click-through rate
  hasGoodCTR: (item, minRate) => {
    const ctr = item.clicks / item.views;
    return ctr >= minRate;
  },

  // Statistical outlier
  isOutlier: (item, mean, stdDev, threshold = 2) => {
    const zScore = Math.abs((item - mean) / stdDev);
    return zScore > threshold;
  }
};

// Find high-traffic pages
const highTraffic = await JSONPath.query(
  '$.metrics[?(@.views.between(1000, 3000))]',
  analytics,
  { sandbox }
);

// Find pages with good engagement
const goodEngagement = await JSONPath.query(
  '$.metrics[?(@.hasGoodCTR(0.05) && @.bounceRate.percentageAbove(0.3) === false)]',
  analytics,
  { sandbox }
);
```

### Example 6: Mathematical Operations

```typescript
const inventory = {
  products: [
    { name: 'Widget', cost: 40, price: 50, quantity: 100 },
    { name: 'Gadget', cost: 60, price: 75, quantity: 50 },
    { name: 'Tool', cost: 20, price: 30, quantity: 200 }
  ]
};

const sandbox = {
  // Profit margin
  hasMinMargin: (item, minPercent) => {
    const margin = ((item.price - item.cost) / item.price) * 100;
    return margin >= minPercent;
  },

  // Inventory value
  inventoryValueAbove: (item, threshold) => {
    return (item.cost * item.quantity) > threshold;
  },

  // Price tier
  isInPriceTier: (item, tier) => {
    const tiers = {
      budget: [0, 30],
      mid: [30, 60],
      premium: [60, Infinity]
    };
    const [min, max] = tiers[tier] || [0, Infinity];
    return item.price >= min && item.price < max;
  }
};

// Find products with good margin
const goodMargin = await JSONPath.query(
  '$.products[?(@.hasMinMargin(20))]',
  inventory,
  { sandbox }
);

// Find premium products with high inventory value
const premiumHighValue = await JSONPath.query(
  '$.products[?(@.isInPriceTier("premium") && @.inventoryValueAbove(2000))]',
  inventory,
  { sandbox }
);
```

---

## Date Operations

### Example 7: Date Filtering

```typescript
const events = {
  list: [
    { id: 1, title: 'Event A', date: '2024-01-15', status: 'upcoming' },
    { id: 2, title: 'Event B', date: '2023-12-20', status: 'past' },
    { id: 3, title: 'Event C', date: '2024-02-10', status: 'upcoming' },
    { id: 4, title: 'Event D', date: '2024-01-05', status: 'past' }
  ]
};

const sandbox = {
  // Is future date
  isFuture: (item) => {
    try {
      return new Date(item) > new Date();
    } catch {
      return false;
    }
  },

  // Is past date
  isPast: (item) => {
    try {
      return new Date(item) < new Date();
    } catch {
      return false;
    }
  },

  // Date in range
  dateInRange: (item, startDate, endDate) => {
    try {
      const date = new Date(item);
      const start = new Date(startDate);
      const end = new Date(endDate);
      return date >= start && date <= end;
    } catch {
      return false;
    }
  },

  // Within days
  withinDays: (item, days) => {
    try {
      const date = new Date(item);
      const now = new Date();
      const diff = Math.abs(now.getTime() - date.getTime());
      const daysDiff = diff / (1000 * 60 * 60 * 24);
      return daysDiff <= days;
    } catch {
      return false;
    }
  }
};

// Find upcoming events
const upcoming = await JSONPath.query(
  '$.list[?(@.date.isFuture())]',
  events,
  { sandbox }
);

// Find events in January 2024
const january = await JSONPath.query(
  '$.list[?(@.date.dateInRange("2024-01-01", "2024-01-31"))]',
  events,
  { sandbox }
);

// Find recent events (within 30 days)
const recent = await JSONPath.query(
  '$.list[?(@.date.withinDays(30))]',
  events,
  { sandbox }
);
```

---

## Array Operations

### Example 8: Array Filtering

```typescript
const data = {
  users: [
    { id: 1, name: 'Alice', tags: ['admin', 'verified'], roles: ['user', 'moderator'] },
    { id: 2, name: 'Bob', tags: ['verified'], roles: ['user'] },
    { id: 3, name: 'Charlie', tags: ['new'], roles: ['user', 'admin'] }
  ]
};

const sandbox = {
  // Array contains value
  arrayContains: (item, value) => {
    return Array.isArray(item) && item.includes(value);
  },

  // Array contains any
  containsAny: (item, ...values) => {
    return Array.isArray(item) && values.some(v => item.includes(v));
  },

  // Array contains all
  containsAll: (item, ...values) => {
    return Array.isArray(item) && values.every(v => item.includes(v));
  },

  // Array length check
  hasLength: (item, min, max = Infinity) => {
    return Array.isArray(item) && item.length >= min && item.length <= max;
  }
};

// Find admins
const admins = await JSONPath.query(
  '$.users[?(@.tags.arrayContains("admin"))]',
  data,
  { sandbox }
);

// Find users with admin or moderator roles
const privileged = await JSONPath.query(
  '$.users[?(@.roles.containsAny("admin", "moderator"))]',
  data,
  { sandbox }
);

// Find verified users with specific tag count
const verifiedWithTags = await JSONPath.query(
  '$.users[?(@.tags.arrayContains("verified") && @.tags.hasLength(1, 3))]',
  data,
  { sandbox }
);
```

---

## Complex Validation

### Example 9: Multi-Field Validation

```typescript
const users = {
  list: [
    { id: 1, email: 'alice@example.com', age: 25, verified: true, score: 85 },
    { id: 2, email: 'invalid-email', age: 17, verified: false, score: 45 },
    { id: 3, email: 'bob@test.com', age: 30, verified: true, score: 92 }
  ]
};

const sandbox = {
  // Email validation
  hasValidEmail: (item) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(item.email);
  },

  // Age check
  isAdult: (item) => {
    return typeof item.age === 'number' && item.age >= 18;
  },

  // Composite validation
  isValidUser: (item) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      item &&
      typeof item === 'object' &&
      typeof item.id === 'number' &&
      typeof item.email === 'string' &&
      emailRegex.test(item.email) &&
      typeof item.age === 'number' &&
      item.age >= 18 &&
      typeof item.verified === 'boolean' &&
      item.verified === true &&
      typeof item.score === 'number' &&
      item.score >= 50
    );
  }
};

// Find valid users
const validUsers = await JSONPath.query(
  '$.list[?(@.isValidUser())]',
  users,
  { sandbox }
);
```

### Example 10: Business Logic Validation

```typescript
const orders = {
  list: [
    { id: 1, total: 150, items: 3, customer: { vip: true }, discount: 10 },
    { id: 2, total: 45, items: 1, customer: { vip: false }, discount: 0 },
    { id: 3, total: 200, items: 5, customer: { vip: true }, discount: 25 }
  ]
};

const sandbox = {
  // Eligible for free shipping
  freeShipping: (item) => {
    return item.total >= 50 || item.customer.vip;
  },

  // Discount validation
  hasValidDiscount: (item) => {
    const maxDiscount = item.customer.vip ? 30 : 15;
    const calculatedDiscount = item.total >= 100 ? 10 : 0;
    return item.discount <= maxDiscount && item.discount >= calculatedDiscount;
  },

  // Order priority
  isHighPriority: (item) => {
    return item.customer.vip || item.total > 150 || item.items >= 5;
  }
};

// Find orders eligible for free shipping
const freeShipEligible = await JSONPath.query(
  '$.list[?(@.freeShipping())]',
  orders,
  { sandbox }
);

// Find high priority orders with valid discounts
const highPriorityValid = await JSONPath.query(
  '$.list[?(@.isHighPriority() && @.hasValidDiscount())]',
  orders,
  { sandbox }
);
```

---

## External Data Integration

### Example 11: Using External Data

```typescript
// External configuration
const config = {
  allowedCategories: new Set(['electronics', 'computers', 'phones']),
  bannedSellers: new Set(['seller123', 'seller456']),
  minRating: 4.0,
  priceThreshold: 1000
};

const products = {
  items: [
    { id: 1, name: 'Phone', category: 'phones', seller: 'seller789', rating: 4.5, price: 599 },
    { id: 2, name: 'Laptop', category: 'computers', seller: 'seller123', rating: 4.2, price: 1200 },
    { id: 3, name: 'Watch', category: 'accessories', seller: 'seller789', rating: 3.8, price: 299 }
  ]
};

const sandbox = {
  // Check against allowed categories
  isAllowedCategory: (item) => {
    return config.allowedCategories.has(item.category);
  },

  // Check seller is not banned
  isAllowedSeller: (item) => {
    return !config.bannedSellers.has(item.seller);
  },

  // Check rating meets minimum
  meetsRatingRequirement: (item) => {
    return item.rating >= config.minRating;
  },

  // Composite check
  isEligibleProduct: (item) => {
    return (
      config.allowedCategories.has(item.category) &&
      !config.bannedSellers.has(item.seller) &&
      item.rating >= config.minRating &&
      item.price <= config.priceThreshold
    );
  }
};

// Find eligible products
const eligible = await JSONPath.query(
  '$.items[?(@.isEligibleProduct())]',
  products,
  { sandbox }
);
```

### Example 12: Dynamic Configuration

```typescript
function createFilterSandbox(options: {
  minPrice?: number;
  maxPrice?: number;
  requiredTags?: string[];
  blockedUsers?: Set<number>;
}) {
  return {
    meetsPrice: (item) => {
      if (options.minPrice !== undefined && item.price < options.minPrice) {
        return false;
      }
      if (options.maxPrice !== undefined && item.price > options.maxPrice) {
        return false;
      }
      return true;
    },

    hasRequiredTags: (item) => {
      if (!options.requiredTags || options.requiredTags.length === 0) {
        return true;
      }
      return options.requiredTags.every(tag =>
        Array.isArray(item.tags) && item.tags.includes(tag)
      );
    },

    isAllowedUser: (item) => {
      if (!options.blockedUsers) return true;
      return !options.blockedUsers.has(item.userId);
    }
  };
}

// Create sandbox with specific options
const sandbox = createFilterSandbox({
  minPrice: 50,
  maxPrice: 500,
  requiredTags: ['verified', 'active'],
  blockedUsers: new Set([10, 20, 30])
});

const results = await JSONPath.query(
  '$.items[?(@.meetsPrice() && @.hasRequiredTags() && @.isAllowedUser())]',
  data,
  { sandbox }
);
```

---

## Real-World Scenarios

### Example 13: E-commerce Product Filtering

```typescript
const catalog = {
  products: [
    {
      id: 1,
      name: 'Smartphone',
      price: 699,
      category: 'electronics',
      stock: 50,
      rating: 4.5,
      reviews: 120,
      seller: { verified: true, rating: 4.8 }
    },
    {
      id: 2,
      name: 'Laptop',
      price: 1299,
      category: 'computers',
      stock: 0,
      rating: 4.2,
      reviews: 85,
      seller: { verified: true, rating: 4.6 }
    },
    {
      id: 3,
      name: 'Headphones',
      price: 149,
      category: 'accessories',
      stock: 200,
      rating: 4.7,
      reviews: 350,
      seller: { verified: false, rating: 4.1 }
    }
  ]
};

const sandbox = {
  // Product available
  isAvailable: (item) => {
    return item.stock > 0;
  },

  // Good value
  isGoodValue: (item) => {
    return item.rating >= 4.0 && item.price < 1000 && item.reviews >= 100;
  },

  // Trusted seller
  isTrustedSeller: (item) => {
    return item.seller.verified && item.seller.rating >= 4.5;
  },

  // Premium product
  isPremium: (item) => {
    return item.price >= 500 && item.rating >= 4.5 && item.seller.verified;
  },

  // Bestseller
  isBestseller: (item) => {
    return item.reviews >= 200 && item.rating >= 4.5;
  }
};

// Find available products from trusted sellers
const trustedAvailable = await JSONPath.query(
  '$.products[?(@.isAvailable() && @.isTrustedSeller())]',
  catalog,
  { sandbox }
);

// Find bestsellers that are good value
const bestValueSellers = await JSONPath.query(
  '$.products[?(@.isBestseller() && @.isGoodValue())]',
  catalog,
  { sandbox }
);
```

### Example 14: User Access Control

```typescript
const users = {
  list: [
    {
      id: 1,
      username: 'alice',
      roles: ['admin', 'moderator'],
      permissions: ['read', 'write', 'delete'],
      verified: true,
      mfa: true,
      lastLogin: '2024-01-15T10:30:00Z'
    },
    {
      id: 2,
      username: 'bob',
      roles: ['user'],
      permissions: ['read'],
      verified: true,
      mfa: false,
      lastLogin: '2023-11-20T14:22:00Z'
    }
  ]
};

const sandbox = {
  // Has role
  hasRole: (item, role) => {
    return Array.isArray(item.roles) && item.roles.includes(role);
  },

  // Has any role
  hasAnyRole: (item, ...roles) => {
    return Array.isArray(item.roles) && roles.some(r => item.roles.includes(r));
  },

  // Has permission
  canPerform: (item, action) => {
    return Array.isArray(item.permissions) && item.permissions.includes(action);
  },

  // Is secure account
  isSecureAccount: (item) => {
    return item.verified && item.mfa;
  },

  // Recently active
  isRecentlyActive: (item, days = 30) => {
    try {
      const lastLogin = new Date(item.lastLogin);
      const now = new Date();
      const diff = now.getTime() - lastLogin.getTime();
      const daysDiff = diff / (1000 * 60 * 60 * 24);
      return daysDiff <= days;
    } catch {
      return false;
    }
  }
};

// Find admins with secure accounts
const secureAdmins = await JSONPath.query(
  '$.list[?(@.hasRole("admin") && @.isSecureAccount())]',
  users,
  { sandbox }
);

// Find users who can delete and are recently active
const activeDeleters = await JSONPath.query(
  '$.list[?(@.canPerform("delete") && @.isRecentlyActive(60))]',
  users,
  { sandbox }
);
```

---

## See Also

- [Sandbox & Custom Functions Guide](../guide/custom-functions.md) - Complete guide
- [Advanced Patterns](../guide/advanced-patterns.md) - Advanced usage patterns
- [Type Safety](../guide/typescript.md) - TypeScript with custom functions
