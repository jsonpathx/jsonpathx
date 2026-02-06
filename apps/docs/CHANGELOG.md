# Changelog

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
