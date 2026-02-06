# Contributing to jsonpathx

Thank you for your interest in contributing to jsonpathx! This guide will help you get started.

## Ways to Contribute

There are many ways to contribute to jsonpathx:

- Report bugs and request features via [GitHub Issues](https://github.com/jsonpathx/jsonpathx/issues)
- Improve documentation
- Submit pull requests with bug fixes or new features
- Help answer questions in [Discussions](https://github.com/jsonpathx/jsonpathx/discussions)
- Share your use cases and examples
- Spread the word about jsonpathx

## Development Setup

### Prerequisites

- Node.js 18.0.0 or higher
- npm 9.0.0 or higher
- Git

### Getting Started

1. **Fork and clone the repository**

```bash
git clone https://github.com/jsonpathx/jsonpathx.git
cd jsonpathx
```

2. **Install dependencies**

```bash
npm install
```

3. **Build the project**

```bash
npm run build
```

4. **Run tests**

```bash
npm test
```

5. **Start development mode**

```bash
npm run test:watch
```

## Project Structure

```
jsonpathx/
├── src/
│   ├── core/           # Main TypeScript package
│   │   ├── src/        # Source code
│   │   └── tests/      # Tests
│   ├── types/          # Shared TypeScript types
│   └── compat/         # Compatibility layer
├── docs/               # VitePress documentation
├── tools/              # Build scripts
└── examples/           # Example projects
```

## Development Workflow

### Making Changes

1. **Create a branch**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**

- Write code following our style guide
- Add tests for new features
- Update documentation as needed

3. **Run tests**

```bash
npm test
npm run lint
```

4. **Commit your changes**

```bash
git add .
git commit -m "feat: add new feature"
```

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions or changes
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Build process or tooling changes

5. **Push and create a pull request**

```bash
git push origin feature/your-feature-name
```

Then open a pull request on GitHub.

## Writing Tests

We use Vitest for testing. Tests should be comprehensive and cover:

- Normal use cases
- Edge cases
- Error conditions
- Performance regressions

### Test Example

```typescript
import { describe, it, expect } from 'vitest';
import { JSONPath } from '../src/query';

describe('JSONPath.query', () => {
  it('should query simple paths', async () => {
    const data = { name: 'John' };
    const result = await JSONPath.query('$.name', data);
    expect(result).toEqual(['John']);
  });

  it('should handle errors gracefully', async () => {
    const data = { name: 'John' };
    await expect(
      JSONPath.query('$.invalid..syntax', data)
    ).rejects.toThrow();
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## Code Style

We use ESLint and Prettier for code formatting:

```bash
# Check formatting
npm run lint

# Fix formatting
npm run format
```

### Style Guidelines

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use descriptive variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Write self-documenting code

### Example

```typescript
/**
 * Execute a JSONPath query
 *
 * @param path - JSONPath expression
 * @param data - JSON data to query
 * @param options - Query options
 * @returns Array of results
 */
export async function query<T>(
  path: string,
  data: unknown,
  options?: QueryOptions
): Promise<T[]> {
  // Implementation
}
```

## Documentation

### Writing Documentation

Documentation is written in Markdown using VitePress.

1. **Preview documentation locally**

```bash
npm run docs:dev
```

2. **Edit documentation files**

Documentation files are in `docs/`:

- `docs/guide/` - User guides
- `docs/api/` - API reference
- `docs/examples/` - Examples

3. **Build documentation**

```bash
npm run docs:build
npm run docs:preview
```

### Documentation Guidelines

- Use clear, concise language
- Include code examples
- Add TypeScript type annotations
- Link to related documentation
- Keep examples runnable

## Engine Development

The JS engine lives in `src/core/js-engine.ts` and will evolve into a native parser/evaluator.


## Pull Request Process

1. **Before submitting:**
   - Run all tests
   - Update documentation
   - Add tests for new features
   - Follow code style guidelines
   - Rebase on latest main

2. **PR requirements:**
   - Clear description of changes
   - Link to related issues
   - All tests passing
   - Code coverage maintained
   - Documentation updated

3. **Review process:**
   - Maintainers will review your PR
   - Address feedback promptly
   - Keep PR focused and atomic
   - Be patient and respectful

4. **After approval:**
   - Maintainers will merge your PR
   - Your contribution will be included in the next release
   - You'll be added to contributors list

## Reporting Bugs

Good bug reports help us fix issues quickly. Please include:

1. **Description** - Clear description of the bug
2. **Steps to reproduce** - Minimal steps to reproduce
3. **Expected behavior** - What should happen
4. **Actual behavior** - What actually happens
5. **Environment** - OS, Node.js version, package version
6. **Additional context** - Screenshots, error messages, etc.

### Bug Report Template

```markdown
## Description
A clear description of the bug.

## Steps to Reproduce
1. Create data: `const data = { ... }`
2. Run query: `await JSONPath.query('...', data)`
3. See error

## Expected Behavior
The query should return [...]

## Actual Behavior
The query throws an error: [...]

## Environment
- OS: macOS 14.0
- Node.js: v18.17.0
- jsonpathx: v0.1.0

## Additional Context
Error stack trace:
\`\`\`
...
\`\`\`
```

## Requesting Features

Feature requests help shape the future of jsonpathx. Please include:

1. **Use case** - What problem does this solve?
2. **Proposed solution** - How should it work?
3. **Alternatives** - What alternatives have you considered?
4. **Examples** - Show example usage

## Code of Conduct

We are committed to providing a welcoming and inclusive environment:

- Be respectful and considerate
- Welcome newcomers
- Focus on constructive feedback
- Respect different viewpoints
- Report unacceptable behavior

## Getting Help

- [GitHub Discussions](https://github.com/jsonpathx/jsonpathx/discussions) - Ask questions
- [Documentation](/guide/) - Read the guides
- [Examples](/examples/) - See examples
- [API Reference](/api/) - Explore the API

## Recognition

Contributors are recognized in:

- [CHANGELOG.md](https://github.com/jsonpathx/jsonpathx/blob/main/CHANGELOG.md)
- [Contributors page](https://github.com/jsonpathx/jsonpathx/graphs/contributors)
- Release notes

Thank you for contributing to jsonpathx!
