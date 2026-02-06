# Breaking Changes

This project is now a single package (`jsonpathx`). The WASM engine and multi-package layout are removed.

## Summary

- Single package: `jsonpathx`
- No subpath packages are shipped
- JS-only engine (no WASM init required)

If you were using older multi-package paths, update imports accordingly.
