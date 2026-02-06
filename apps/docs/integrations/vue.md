# Vue Integration

Complete guide to using jsonpathx with Vue.js. Learn how to integrate JSONPath queries into your Vue applications with composables, reactive queries, and best practices.

## Installation

```bash
npm install @jsonpathx/jsonpathx
```

## Vue 3 Composition API

### Basic Usage

```vue
<script setup>
import { ref, computed } from 'vue';
import { JSONPath } from '@jsonpathx/jsonpathx';

const data = ref({
  users: [
    { id: 1, name: 'Alice', active: true },
    { id: 2, name: 'Bob', active: false },
    { id: 3, name: 'Charlie', active: true }
  ]
});

const activeUsers = computed(async () => {
  return await JSONPath.query('$.users[?(@.active === true)]', data.value);
});
</script>

<template>
  <div>
    <h2>Active Users</h2>
    <ul>
      <li v-for="user in activeUsers" :key="user.id">
        {{ user.name }}
      </li>
    </ul>
  </div>
</template>
```

## Custom Composables

### `useJSONPath()`

Create a reusable composable for JSONPath queries:

```typescript
// composables/useJSONPath.ts
import { ref, watch, toValue } from 'vue';
import { JSONPath } from '@jsonpathx/jsonpathx';
import type { MaybeRefOrGetter } from 'vue';

export function useJSONPath<T = unknown>(
  path: MaybeRefOrGetter<string>,
  data: MaybeRefOrGetter<unknown>,
  options?: MaybeRefOrGetter<QueryOptions>
) {
  const result = ref<T[]>([]);
  const loading = ref(false);
  const error = ref<Error | null>(null);

  const execute = async () => {
    loading.value = true;
    error.value = null;

    try {
      const pathValue = toValue(path);
      const dataValue = toValue(data);
      const optionsValue = toValue(options);

      result.value = await JSONPath.query<T>(
        pathValue,
        dataValue,
        optionsValue
      );
    } catch (err) {
      error.value = err as Error;
    } finally {
      loading.value = false;
    }
  };

  // Re-execute when inputs change
  watch(
    () => [toValue(path), toValue(data), toValue(options)],
    execute,
    { immediate: true, deep: true }
  );

  return {
    result,
    loading,
    error,
    refetch: execute
  };
}
```

### Usage

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useJSONPath } from '@/composables/useJSONPath';

interface User {
  id: number;
  name: string;
  active: boolean;
}

const data = ref({
  users: [
    { id: 1, name: 'Alice', active: true },
    { id: 2, name: 'Bob', active: false }
  ]
});

const path = ref('$.users[?(@.active === true)]');

const { result, loading, error, refetch } = useJSONPath<User>(path, data);
</script>

<template>
  <div>
    <div v-if="loading">Loading...</div>
    <div v-else-if="error">Error: {{ error.message }}</div>
    <div v-else>
      <ul>
        <li v-for="user in result" :key="user.id">
          {{ user.name }}
        </li>
      </ul>
      <button @click="refetch">Refresh</button>
    </div>
  </div>
</template>
```

## Pinia Store Integration

### Store Definition

```typescript
// stores/data.ts
import { defineStore } from 'pinia';
import { JSONPath } from '@jsonpathx/jsonpathx';

export const useDataStore = defineStore('data', {
  state: () => ({
    rawData: {},
    cache: new Map()
  }),

  actions: {
    async query<T>(path: string): Promise<T[]> {
      // Check cache
      if (this.cache.has(path)) {
        return this.cache.get(path);
      }

      // Execute query
      const result = await JSONPath.query<T>(path, this.rawData);

      // Cache result
      this.cache.set(path, result);

      return result;
    },

    setData(data: unknown) {
      this.rawData = data;
      this.cache.clear();
    },

    clearCache() {
      this.cache.clear();
    }
  },

  getters: {
    activeUsers: (state) => {
      return state.cache.get('$.users[?(@.active === true)]') || [];
    },

    featuredProducts: (state) => {
      return state.cache.get('$.products[?(@.featured === true)]') || [];
    }
  }
});
```

### Usage in Component

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useDataStore } from '@/stores/data';

const store = useDataStore();
const { activeUsers, featuredProducts } = storeToRefs(store);

// Load data
fetch('/api/data')
  .then(res => res.json())
  .then(data => store.setData(data));
</script>

<template>
  <div>
    <h2>Active Users</h2>
    <ul>
      <li v-for="user in activeUsers" :key="user.id">
        {{ user.name }}
      </li>
    </ul>

    <h2>Featured Products</h2>
    <ul>
      <li v-for="product in featuredProducts" :key="product.id">
        {{ product.name }}
      </li>
    </ul>
  </div>
</template>
```

## Vuex Integration (Vue 2/3)

```typescript
// store/index.ts
import { createStore } from 'vuex';
import { JSONPath } from '@jsonpathx/jsonpathx';

export default createStore({
  state: {
    data: {},
    queryCache: {}
  },

  mutations: {
    SET_DATA(state, data) {
      state.data = data;
      state.queryCache = {};
    },

    SET_QUERY_RESULT(state, { path, result }) {
      state.queryCache[path] = result;
    }
  },

  actions: {
    async query({ state, commit }, path) {
      if (state.queryCache[path]) {
        return state.queryCache[path];
      }

      const result = await JSONPath.query(path, state.data);
      commit('SET_QUERY_RESULT', { path, result });
      return result;
    },

    async loadData({ commit }, url) {
      const response = await fetch(url);
      const data = await response.json();
      commit('SET_DATA', data);
    }
  },

  getters: {
    queryResult: (state) => (path) => {
      return state.queryCache[path] || [];
    }
  }
});
```

## Real-time Data with QueryBuilder

```vue
<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { JSONPath } from '@jsonpathx/jsonpathx';

const products = ref([]);
const minPrice = ref(0);
const maxPrice = ref(1000);

let interval: number;

const updateQuery = async () => {
  const data = await fetchProducts();

  products.value = await JSONPath.create(data)
    .query('$.products[*]')
    .filter(p => p.price >= minPrice.value && p.price <= maxPrice.value)
    .sort((a, b) => a.price - b.price)
    .execute();
};

onMounted(() => {
  updateQuery();
  interval = setInterval(updateQuery, 5000);
});

onUnmounted(() => {
  clearInterval(interval);
});
</script>

<template>
  <div>
    <div>
      <label>
        Min Price: {{ minPrice }}
        <input v-model.number="minPrice" type="range" min="0" max="1000" />
      </label>
      <label>
        Max Price: {{ maxPrice }}
        <input v-model.number="maxPrice" type="range" min="0" max="1000" />
      </label>
    </div>

    <ul>
      <li v-for="product in products" :key="product.id">
        {{ product.name }} - ${{ product.price }}
      </li>
    </ul>
  </div>
</template>
```

## Form Filtering

```vue
<script setup lang="ts">
import { ref, computed } from 'vue';
import { JSONPath } from '@jsonpathx/jsonpathx';

const users = ref([
  { id: 1, name: 'Alice', age: 30, city: 'NYC' },
  { id: 2, name: 'Bob', age: 25, city: 'LA' },
  { id: 3, name: 'Charlie', age: 35, city: 'NYC' }
]);

const filters = ref({
  minAge: 0,
  maxAge: 100,
  city: ''
});

const filteredUsers = computed(async () => {
  const sandbox = {
    matchesFilter: (user) => {
      return user.age >= filters.value.minAge &&
             user.age <= filters.value.maxAge &&
             (!filters.value.city || user.city === filters.value.city);
    }
  };

  return await JSONPath.query(
    '$.users[?(@.matchesFilter())]',
    { users: users.value },
    { sandbox }
  );
});
</script>

<template>
  <div>
    <form>
      <label>
        Min Age:
        <input v-model.number="filters.minAge" type="number" />
      </label>
      <label>
        Max Age:
        <input v-model.number="filters.maxAge" type="number" />
      </label>
      <label>
        City:
        <select v-model="filters.city">
          <option value="">All</option>
          <option value="NYC">NYC</option>
          <option value="LA">LA</option>
        </select>
      </label>
    </form>

    <ul>
      <li v-for="user in filteredUsers" :key="user.id">
        {{ user.name }} ({{ user.age }}, {{ user.city }})
      </li>
    </ul>
  </div>
</template>
```

## TypeScript Support

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { JSONPath } from '@jsonpathx/jsonpathx';

interface Product {
  id: number;
  name: string;
  price: number;
  featured: boolean;
}

const data = ref<{ products: Product[] }>({
  products: []
});

const featured = ref<Product[]>([]);

const loadFeatured = async () => {
  featured.value = await JSONPath.query<Product>(
    '$.products[?(@.featured === true)]',
    data.value
  );
};
</script>
```

## SSR Support (Nuxt 3)

```vue
<script setup lang="ts">
import { JSONPath } from '@jsonpathx/jsonpathx';

// Server-side data fetching
const { data } = await useAsyncData('products', async () => {
  const response = await $fetch('/api/products');

  return await JSONPath.query('$.products[*]', response, {
    resultType: 'value'
  });
});
</script>

<template>
  <div>
    <ul>
      <li v-for="product in data" :key="product.id">
        {{ product.name }}
      </li>
    </ul>
  </div>
</template>
```

## Performance Optimization

### 1. Memoization

```typescript
import { computed, ref } from 'vue';
import { JSONPath } from '@jsonpathx/jsonpathx';

const data = ref({});
const path = ref('$.items[*]');

// Memoized query
const result = computed(async () => {
  return await JSONPath.query(path.value, data.value, {
    enableCache: true
  });
});
```

### 2. Debounced Queries

```vue
<script setup lang="ts">
import { ref, watch } from 'vue';
import { useDebounceFn } from '@vueuse/core';
import { JSONPath } from '@jsonpathx/jsonpathx';

const searchTerm = ref('');
const results = ref([]);

const search = useDebounceFn(async (term: string) => {
  const sandbox = {
    matches: (item) => item.name.toLowerCase().includes(term.toLowerCase())
  };

  results.value = await JSONPath.query(
    '$.items[?(@.matches())]',
    data,
    { sandbox }
  );
}, 300);

watch(searchTerm, search);
</script>
```

## Best Practices

### 1. Initialize engine Early

```typescript
// main.ts or app.vue
import { createApp } from 'vue';
import { JSONPath } from '@jsonpathx/jsonpathx';
import App from './App.vue';

// Initialize engine before mounting
// Optional no-op initialization for API parity
JSONPath.init().then(() => {
  createApp(App).mount('#app');
});
```

### 2. Use Reactive Queries

```typescript
// ✅ Reactive
const result = computed(() => JSONPath.query(path.value, data.value));

// ❌ Not reactive
const result = JSONPath.query(path.value, data.value);
```

### 3. Handle Loading States

```vue
<template>
  <div v-if="loading">Loading...</div>
  <div v-else-if="error">Error: {{ error }}</div>
  <div v-else>{{ result }}</div>
</template>
```

## See Also

- [React Integration](./react.md) - React examples
- [API Reference](../api/index.md) - Complete API
- [TypeScript Guide](../guide/typescript.md) - Type safety
