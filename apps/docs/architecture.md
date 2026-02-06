# Architecture

jsonpathx is a JavaScript-only JSONPath engine with a single published package: `jsonpathx`.

## High-Level Flow

1. Parse JSONPath into an AST.
2. Compile the AST into an evaluator.
3. Execute against data with optional caching and result formatting.

## Components

- **Parser**: tokenizes and parses JSONPath into an AST.
- **Evaluator**: executes AST against data, supports filters/scripts with eval policy.
- **Results**: formats values, paths, pointers, parents, and parent chains.
- **Utilities**: PathUtils, caching, streaming, mutation helpers.

## Packages

This repo ships a single package (`packages/jsonpathx`). Other historical packages (WASM, compat, CLI, bindings) are not part of the current codebase.
