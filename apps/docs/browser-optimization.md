# Browser Optimization

jsonpathx uses a JS engine, so no special WASM loading or bundler configuration is required.

## Tips

1. Use caching for repeated queries.
2. Prefer specific paths over recursive descent.
3. Avoid heavy filters when a path can narrow results earlier.
