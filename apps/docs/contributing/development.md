# Development Guide

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- **Git** 2.30+

The current engine is JavaScript-only. No Rust or WASM toolchain is required.

## Setup

```bash
git clone https://github.com/jsonpathx/jsonpathx.git
cd jsonpathx
npm install
```

## Project Structure

```
jsonpathx/
├── apps/
│   ├── docs/         # VitePress site
│   └── playground/   # Vite playground
├── bench/            # Benchmarks
├── packages/
│   └── jsonpathx/    # Core library (single package)
├── .github/          # CI/CD workflows
└── package.json      # Workspace root
```

## Development Workflow

```bash
# Run tests
npm test

# Build the library
npm run build

# Run benchmarks
npm run bench

# Docs dev server
npm run docs:dev
```

## Code Style

Follow existing patterns and keep changes minimal. If you add new APIs, update the VitePress docs under `apps/docs`.
