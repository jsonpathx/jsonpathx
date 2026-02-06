# jsonpathx Documentation

This directory contains the VitePress documentation site for jsonpathx.

## Development

Start the documentation development server:

```bash
npm run docs:dev
```

Then open http://localhost:5173/jsonpathx/

## Building

Build the static documentation site:

```bash
npm run docs:build
```

Output will be in `docs/.vitepress/dist/`

## Preview Build

Preview the production build locally:

```bash
npm run docs:preview
```

## Structure

- `guide/` - User guides and tutorials
- `api/` - API reference documentation
- `examples/` - Code examples
- `migration/` - Migration guides
- `performance/` - Performance documentation
- `contributing/` - Contributing guide
- `.vitepress/` - VitePress configuration

## Adding New Pages

1. Create a new `.md` file in the appropriate directory
2. Add the page to the sidebar in `.vitepress/config.mjs`
3. Test locally with `npm run docs:dev`

## Deployment

Documentation is automatically deployed to GitHub Pages when changes are pushed to the `main` branch via the `.github/workflows/docs.yml` workflow.

## License

MIT
