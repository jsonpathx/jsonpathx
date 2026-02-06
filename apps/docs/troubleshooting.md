# Troubleshooting

## Common Issues

### Invalid Path

```typescript
try {
  JSONPath.parse('$.invalid..path');
} catch (error) {
  console.error('Invalid path:', error.message);
}
```

### Performance

Enable caching for repeated queries:

```typescript
JSONPath.enableCache({ maxSize: 200, ttl: 60000 });
await JSONPath.query('$.items[*]', data, { enableCache: true });
```

## Notes

jsonpathx is JavaScript-only. There is no WASM initialization step.
