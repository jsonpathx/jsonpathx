import { defineConfig } from 'vitepress';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const configDir = path.dirname(fileURLToPath(import.meta.url));
const markShim = path.resolve(configDir, 'markjs-shim.js');

export default defineConfig({
  title: 'jsonpathx',
  description: 'Modern JSONPath library with WebAssembly performance',
  base: process.env.BASE_URL ?? '/jsonpathx/',
  ignoreDeadLinks: true,

  head: [
    ['link', { rel: 'icon', href: '/jsonpathx/favicon.ico' }],
  ],

  themeConfig: {
    logo: '/logo.svg',

    nav: [
      { text: 'Guide', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: 'Examples', link: '/examples/' },
      { text: 'Migration', link: '/migration/' },
      {
        text: 'v0.1.0',
        items: [
          { text: 'Changelog', link: '/CHANGELOG' },
          { text: 'Performance', link: '/performance/' },
          { text: 'Benchmarks', link: '/bench' },
          { text: 'Contributing', link: '/contributing/' }
        ]
      }
    ],

    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'Getting Started', link: '/guide/' },
            { text: 'Installation', link: '/guide/installation' },
            { text: 'Quick Start', link: '/guide/quick-start' }
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'JSONPath Syntax', link: '/guide/syntax' },
            { text: 'Selectors', link: '/guide/selectors' },
            { text: 'Filter Expressions', link: '/guide/filters' },
            { text: 'Type Selectors', link: '/guide/type-selectors' },
            { text: 'Parent Selector', link: '/guide/parent-selector' }
          ]
        },
        {
          text: 'Advanced Features',
          items: [
            { text: 'Result Types', link: '/guide/result-types' },
            { text: 'Query Options', link: '/guide/options' },
            { text: 'QueryBuilder API', link: '/guide/builder-api' },
            { text: 'Path Utilities', link: '/guide/path-utilities' },
            { text: 'Caching', link: '/guide/caching' }
          ]
        }
      ],

      '/api/': [
        {
          text: 'API Reference',
          items: [
            { text: 'Overview', link: '/api/' },
            { text: 'JSONPath Class', link: '/api/jsonpath' },
            { text: 'QueryBuilder', link: '/api/query-builder' },
            { text: 'Types', link: '/api/types' },
            { text: 'Utilities', link: '/api/utilities' }
          ]
        }
      ],

      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Basic Queries', link: '/examples/basic' },
            { text: 'Advanced Queries', link: '/examples/advanced' },
            { text: 'Filter Examples', link: '/examples/filters' },
            { text: 'Real-World Use Cases', link: '/examples/real-world' },
            { text: 'Performance Tips', link: '/examples/performance' }
          ]
        }
      ],

      '/migration/': [
        {
          text: 'Migration Guides',
          items: [
            { text: 'Overview', link: '/migration/' },
            { text: 'From jsonpath-plus', link: '/migration/from-jsonpath-plus' },
            { text: 'Breaking Changes', link: '/migration/breaking-changes' }
          ]
        }
      ],

      '/performance/': [
        {
          text: 'Performance',
          items: [
            { text: 'Overview', link: '/performance/' },
            { text: 'Benchmarks', link: '/bench' },
            { text: 'Optimization Guide', link: '/performance/optimization' },
            { text: 'Caching Strategies', link: '/performance/caching' }
          ]
        }
      ],

      '/contributing/': [
        {
          text: 'Contributing',
          items: [
            { text: 'Overview', link: '/contributing/' },
            { text: 'Development Setup', link: '/contributing/development' },
            { text: 'Architecture', link: '/contributing/architecture' }
          ]
        }
      ]
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/jsonpathx/jsonpathx' }
    ],

    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026-present'
    },

    search: {
      provider: 'local'
    },

    editLink: {
      pattern: 'https://github.com/jsonpathx/jsonpathx/edit/main/docs/:path',
      text: 'Edit this page on GitHub'
    }
  },

  markdown: {
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    lineNumbers: true
  },

  vite: {
    resolve: {
      alias: {
        'mark.js/src/vanilla.js': markShim
      }
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }
            if (id.includes('vitepress')) {
              return 'vitepress';
            }
            if (id.includes('vue')) {
              return 'vue';
            }
            if (id.includes('algolia') || id.includes('docsearch')) {
              return 'search';
            }
            const parts = id.split('node_modules/')[1]?.split('/') ?? [];
            const name = parts[0]?.startsWith('@') ? `${parts[0]}/${parts[1]}` : parts[0];
            return name ? `vendor-${name.replace('@', '').replace('/', '-')}` : 'vendor';
          }
        }
      }
    }
  }
});
