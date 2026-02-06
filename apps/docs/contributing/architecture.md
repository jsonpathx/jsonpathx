# Architecture (Contributor)

This repository ships a single JavaScript-only package: `jsonpathx`.

## Data Flow

1. Parse JSONPath into an AST.
2. Compile to an evaluator for fast execution.
3. Execute against JSON data.
4. Format results based on `resultType` and options.

## Key Modules

- `packages/jsonpathx/src/parser` – tokenizer + parser + normalization
- `packages/jsonpathx/src/evaluator` – evaluation and compilation
- `packages/jsonpathx/src/results` – payload + formatters
- `packages/jsonpathx/src/core` – builder, cache, streaming, mutation helpers

Historical WASM and multi-package architecture is not part of the current codebase.
