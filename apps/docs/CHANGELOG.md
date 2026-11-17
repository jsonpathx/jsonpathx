# Changelog

## Unreleased

Planned for 0.2.0.

### Breaking
- Node.js 22 or later is required: `engines.node` is now `>=22` (was `>=18`). Node.js 18 and 20 are end-of-life; CI tests 22, 24 and 26.
- The `./umd` and `./umd.min` subpaths are removed from `exports`. They pointed at the browser scripts that set `window.JSONPathX`, which have no exports or types, so importing them gave nothing useful. The files are still published in `dist/`, and the `unpkg`/`jsdelivr` fields still point at `dist/jsonpathx.umd.min.js`. Load them with a `<script>` tag from a CDN instead:
  ```html
  <script src="https://unpkg.com/@jsonpathx/jsonpathx@0.2.0/dist/jsonpathx.umd.min.js"></script>
  <!-- or https://cdn.jsdelivr.net/npm/@jsonpathx/jsonpathx@0.2.0 -->
  ```
  If you imported `@jsonpathx/jsonpathx/umd` through a bundler, import `@jsonpathx/jsonpathx` (the ESM entry) instead.

## 0.1.7 - 2026-11-16

### Changed
- `repository` metadata now includes `directory: packages/jsonpathx`, so npm links to the package folder.
- `sideEffects` marks only the UMD bundles (`dist/*.umd*.js`) as side-effectful, so bundlers can tree-shake the ESM entry while keeping `import "@jsonpathx/jsonpathx/umd"`.
- Published from GitHub Actions with npm trusted publishing, so the release carries npm provenance.

### Fixed
- `LICENSE` is now included in the published package.
- README links on npm now point to the docs site and GitHub instead of repository-relative paths, and the browser (UMD/CDN) snippet is back.

## 0.1.6 - 2026-02-09

### Added
- Benchmark-leading performance across the current suite (44/48 query wins).

### Changed
- Faster evaluators with value-only fast paths, reduced path tracking, and optimized recursive traversal.
- Compiled eval filters now bypass per-element overhead for native eval cases.

### Fixed
- Recursive traversal ordering to preserve jsonpath-plus compatibility.

## 0.1.5 - 2026-02-09

### Added
- RFC 9535 CTS coverage wired to the official compliance test suite.
- Expanded benchmark coverage with wide objects, large arrays, and Unicode-heavy datasets.
- New benchmark queries for RFC filters, reverse slices, and heavier eval paths.

### Fixed
- RFC filter semantics around negative-step slices, whitespace, and scalar filter targets.
- `match`/`search` regex behavior to match RFC dot semantics and Unicode classes.
- Parser snapshot stability by normalizing short filter expressions.

## 0.1.4 - 2026-02-08

### Added
- UMD/global build for browser usage with `window.JSONPathX` and CDN-friendly artifacts.
- `unpkg`/`jsdelivr` package metadata to make CDN targeting frictionless.
- Quick-start UMD example in the docs and package README for copy-paste browser usage.
- Playground link in the docs home hero for instant experimentation.

### Changed
- Build pipeline now produces both ESM TypeScript outputs and browser UMD bundles in one pass.

## 0.1.3 - 2026-02-08

### Fixed
- Ensure TypeScript declaration files are shipped in the npm package (dist/*.d.ts).
- Add a publish-time build hook so the package always includes compiled artifacts.
- Tighten npm packaging to include only dist, README, and LICENSE for predictable installs.

## 0.1.2 - 2026-02-08

### Fixed
- Library entry point to ensure packages load correctly.

## 0.1.1 - 2026-02-07

### Added
- README content for initial package usage guidance.

### Fixed
- Package naming to align with published artifacts.

## 0.1.0 - 2026-02-06

### Added
- Initial public release of jsonpathx.
- RFC 9535-compliant JSONPath engine with jsonpath-plus extensions and options.
- Path utilities (normalize, parse, stringify, pointer helpers, parent/append, comparisons).
- QueryBuilder enhancements (build(), unique(keyFn?), additional helpers).
- Result formatter helpers and expanded result type support.
- Built-in query cache with stats and TTL/max size reporting.
- Benchmarks with JSON output and docs integration.
- VitePress documentation site, migration guides, and performance pages.

### Changed
- Documentation structure consolidated under apps/docs with updated API, guide, and migration content.
- Benchmarks detect LFS pointer data and skip large dataset when unavailable in CI.

### Fixed
- Docs build stability in CI and VitePress mark.js resolution.
