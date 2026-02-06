# TypeScript Strict Mode

jsonpathx is built with TypeScript's **strictest possible configuration** to ensure maximum type safety and catch potential bugs at compile time.

## Enabled Strict Checks

### Core Strict Mode (`"strict": true`)

When `strict: true` is enabled in `tsconfig.json`, it automatically enables all of these checks:

#### `strictNullChecks`
**What it does:** Treats `null` and `undefined` as distinct types that must be explicitly handled.

```typescript
// ❌ Error without strictNullChecks
let name: string = null; // Error: Type 'null' is not assignable to type 'string'

// ✅ Correct
let name: string | null = null;
if (name !== null) {
  console.log(name.toUpperCase()); // Safe
}
```

#### `strictFunctionTypes`
**What it does:** Checks function parameter types contravariantly (more strictly).

```typescript
// Prevents unsafe function assignments
type Logger = (msg: string | number) => void;
let log: Logger = (msg: string) => console.log(msg); // Error: Parameter types don't match
```

#### `strictBindCallApply`
**What it does:** Ensures `bind`, `call`, and `apply` have correct type signatures.

```typescript
function greet(name: string, age: number) {
  return `Hello ${name}, age ${age}`;
}

// ✅ Type-safe
greet.call(null, "Alice", 30);

// ❌ Error: Argument of type 'string' is not assignable to parameter of type 'number'
greet.call(null, "Alice", "30");
```

#### `strictPropertyInitialization`
**What it does:** Requires class properties to be initialized.

```typescript
class User {
  // ❌ Error: Property 'name' has no initializer
  name: string;

  // ✅ Correct - initialized
  email: string = "";

  // ✅ Correct - initialized in constructor
  constructor(name: string) {
    this.name = name;
  }
}
```

#### `noImplicitAny`
**What it does:** Requires explicit type annotations; doesn't allow implicit `any`.

```typescript
// ❌ Error: Parameter 'value' implicitly has an 'any' type
function process(value) {
  return value.toUpperCase();
}

// ✅ Correct
function process(value: string) {
  return value.toUpperCase();
}
```

#### `noImplicitThis`
**What it does:** Requires `this` to have an explicit type in functions.

```typescript
// ❌ Error: 'this' implicitly has type 'any'
function getName() {
  return this.name;
}

// ✅ Correct
function getName(this: { name: string }) {
  return this.name;
}
```

#### `alwaysStrict`
**What it does:** Emits `"use strict"` in all generated JavaScript files.

Ensures JavaScript runs in strict mode, catching common errors like:
- Assigning to undeclared variables
- Deleting variables
- Duplicate parameter names

#### `useUnknownInCatchVariables`
**What it does:** Catch clause variables are `unknown` instead of `any`.

```typescript
try {
  throw new Error("Oops");
} catch (error) {
  // error is 'unknown', not 'any'

  // ❌ Error: Object is of type 'unknown'
  console.log(error.message);

  // ✅ Correct - type guard
  if (error instanceof Error) {
    console.log(error.message);
  }
}
```

---

### Additional Quality Checks

Beyond the core `strict` flag, jsonpathx enables these additional checks:

#### `noUnusedLocals`
**What it does:** Reports errors on unused local variables.

```typescript
// ❌ Error: 'unusedVar' is declared but its value is never read
const unusedVar = "hello";

// ✅ Correct - prefix with underscore for intentional unused
const _unusedVar = "hello";
```

#### `noUnusedParameters`
**What it does:** Reports errors on unused function parameters.

```typescript
// ❌ Error: 'unusedParam' is declared but its value is never read
function process(data: string, unusedParam: number) {
  return data.toUpperCase();
}

// ✅ Correct
function process(data: string, _unusedParam: number) {
  return data.toUpperCase();
}
```

#### `noFallthroughCasesInSwitch`
**What it does:** Reports errors for fallthrough cases in switch statements.

```typescript
function getType(value: unknown): string {
  switch (typeof value) {
    case 'string':
      return 'string';
      // ✅ Explicit return/break required

    case 'number':
      // ❌ Error: Fallthrough case in switch
    case 'boolean':
      return 'primitive';

    default:
      return 'unknown';
  }
}
```

#### `noUncheckedIndexedAccess`
**What it does:** Array and object index access returns `T | undefined`.

This is an **extra strict** check that catches potential index out-of-bounds errors:

```typescript
const arr: string[] = ['a', 'b', 'c'];

// With noUncheckedIndexedAccess, arr[0] is 'string | undefined'
const first = arr[0];

// ❌ Error: Object is possibly 'undefined'
console.log(first.toUpperCase());

// ✅ Correct - check for undefined
if (first !== undefined) {
  console.log(first.toUpperCase());
}

// Or use optional chaining
console.log(first?.toUpperCase());
```

```typescript
const obj: Record<string, number> = { a: 1, b: 2 };

// obj['a'] is 'number | undefined'
const value = obj['a'];

if (value !== undefined) {
  console.log(value * 2); // Safe
}
```

---

## Configuration Files

### Root Configuration

`tsconfig.json` (root):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "strict": true,                           // ✅ All core strict checks
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "noUnusedLocals": true,                   // ✅ Extra check
    "noUnusedParameters": true,               // ✅ Extra check
    "noFallthroughCasesInSwitch": true,       // ✅ Extra check
    "noUncheckedIndexedAccess": true          // ✅ Extra strict check
  }
}
```

### Package Configurations

All packages extend the root configuration:

`tsconfig.json`:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "composite": false,  // Disabled for tsup packages
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

Same pattern for:

---

## Type Safety Guarantees

With these strict checks enabled, jsonpathx guarantees:

### ✅ Null Safety
- All `null` and `undefined` cases are explicitly handled
- No implicit null dereferences
- Array indexing returns `T | undefined`
- Optional object properties are properly typed

### ✅ Type Correctness
- No implicit `any` types
- All function parameters and return types are explicit
- Type guards required for union type narrowing
- Function types checked contravariantly

### ✅ Code Quality
- No unused variables or parameters (except `_` prefixed)
- All switch statements have explicit breaks
- Catch variables are type-safe (`unknown` not `any`)
- Consistent casing in file names

### ✅ Runtime Safety
- All generated code runs in strict mode
- `this` context is always typed
- No silent type coercions

---

## Common Patterns

### Handling Potentially Undefined Values

```typescript
// Array access
const arr = [1, 2, 3];
const value = arr[0]; // number | undefined

// Pattern 1: Explicit check
if (value !== undefined) {
  console.log(value * 2);
}

// Pattern 2: Optional chaining
console.log(value?.toString());

// Pattern 3: Nullish coalescing
const result = value ?? 0;
```

### Type Guards

```typescript
function process(value: string | number | null): string {
  // Null check
  if (value === null) {
    return 'null';
  }

  // Type narrowing
  if (typeof value === 'string') {
    return value.toUpperCase();
  }

  // Type narrowing
  if (typeof value === 'number') {
    return value.toString();
  }

  // TypeScript knows all cases are handled
  const _exhaustive: never = value;
  return _exhaustive;
}
```

### Working with Arrays

```typescript
interface User {
  name: string;
  email?: string;
}

const users: User[] = [
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob' }
];

// Array methods that return potentially undefined
const firstUser = users[0]; // User | undefined
const foundUser = users.find(u => u.name === 'Alice'); // User | undefined

// Safe access
if (firstUser !== undefined) {
  console.log(firstUser.name);

  // Optional properties
  if (firstUser.email !== undefined) {
    console.log(firstUser.email);
  }

  // Or use optional chaining
  console.log(firstUser.email?.toLowerCase());
}
```

### Error Handling

```typescript
async function fetchData(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    return await response.text();
  } catch (error) {
    // error is 'unknown', not 'any'

    // Type guard for Error objects
    if (error instanceof Error) {
      console.error('Fetch failed:', error.message);
      throw error;
    }

    // Handle non-Error throws
    console.error('Unknown error:', error);
    throw new Error('Fetch failed with unknown error');
  }
}
```

### Function Parameters

```typescript
// Intentionally unused parameters
function handler(
  event: Event,
  _context: unknown,  // Prefix with _ to indicate intentional
  _callback: () => void
) {
  console.log('Event:', event);
  // context and callback not used, but required by interface
}
```

---

## Verification

### Compile-Time Checks

Run TypeScript compiler to verify strict mode compliance:

```bash
# Check all packages
npx tsc --build --force

# Check specific package
npx tsc --noEmit --project tsconfig.json
```

### Test Suite

Run the strict mode test suite:

```bash
npm test -- strict-mode
```

The test suite includes:
- Configuration verification (5 tests)
- Null safety examples (3 tests)
- Type safety examples (3 tests)
- Array access patterns (2 tests)
- Object property access (2 tests)
- Error handling (1 test)
- Code quality checks (3 tests)

**Total:** 20 comprehensive tests

---

## Benefits

### For Users

1. **Fewer Runtime Errors:** Many bugs caught at compile time
2. **Better IDE Support:** Accurate autocomplete and type checking
3. **Safer Refactoring:** TypeScript catches breaking changes
4. **Self-Documenting:** Types serve as inline documentation

### For Contributors

1. **Clear Expectations:** Types document intended usage
2. **Faster Reviews:** Type system catches many issues automatically
3. **Easier Debugging:** Type errors point to exact problems
4. **Better Confidence:** Comprehensive type checking reduces bugs

---

## Migration from Non-Strict Code

If you're contributing and encountering strict mode errors:

### Common Issues and Fixes

#### Issue: `Object is possibly 'null'`

```typescript
// ❌ Before
function getName(user: User | null) {
  return user.name; // Error
}

// ✅ After
function getName(user: User | null) {
  if (user === null) {
    return 'Unknown';
  }
  return user.name;
}

// Or use optional chaining
function getName(user: User | null) {
  return user?.name ?? 'Unknown';
}
```

#### Issue: `Object is possibly 'undefined'`

```typescript
// ❌ Before
const arr = [1, 2, 3];
const first = arr[0];
console.log(first * 2); // Error

// ✅ After
const arr = [1, 2, 3];
const first = arr[0];
if (first !== undefined) {
  console.log(first * 2);
}
```

#### Issue: `Parameter 'x' implicitly has an 'any' type`

```typescript
// ❌ Before
function process(value) { // Error
  return value.toUpperCase();
}

// ✅ After
function process(value: string) {
  return value.toUpperCase();
}
```

#### Issue: `'this' implicitly has type 'any'`

```typescript
// ❌ Before
const obj = {
  value: 10,
  getValue() {
    return this.value; // Error in standalone function
  }
};

// ✅ After
const obj = {
  value: 10,
  getValue(this: { value: number }) {
    return this.value;
  }
};
```

---

## Best Practices

### 1. Use Type Guards

```typescript
function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function process(value: unknown) {
  if (isString(value)) {
    // TypeScript knows value is string
    console.log(value.toUpperCase());
  }
}
```

### 2. Prefer Type-Only Imports

```typescript
// ✅ Good - no runtime cost
import { JSONPath, type QueryOptions } from '@jsonpathx/jsonpathx';

// ⚠️ Less optimal - runtime import
import { JSONPath, QueryOptions } from '@jsonpathx/jsonpathx';
```

### 3. Use Optional Chaining

```typescript
// ✅ Concise and safe
const email = user?.profile?.email?.toLowerCase();

// vs

// ⚠️ Verbose
const email = user && user.profile && user.profile.email
  ? user.profile.email.toLowerCase()
  : undefined;
```

### 4. Use Nullish Coalescing

```typescript
// ✅ Only replaces null/undefined
const count = user.count ?? 0;

// ⚠️ Also replaces 0, '', false
const count = user.count || 0;
```

### 5. Exhaustive Type Checking

```typescript
type Status = 'pending' | 'success' | 'error';

function handleStatus(status: Status): string {
  switch (status) {
    case 'pending':
      return 'Loading...';
    case 'success':
      return 'Done!';
    case 'error':
      return 'Failed';
    default:
      // If a new status is added, TypeScript will error here
      const _exhaustive: never = status;
      return _exhaustive;
  }
}
```

---

## Resources

- [TypeScript Strict Mode Documentation](https://www.typescriptlang.org/tsconfig#strict)
- [TypeScript Type Guards](https://www.typescriptlang.org/docs/handbook/2/narrowing.html)
- [Optional Chaining](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Optional_chaining)
- [Nullish Coalescing](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)

---

## Summary

jsonpathx uses TypeScript's strictest possible configuration to ensure:

✅ Maximum type safety
✅ Compile-time bug detection
✅ Better IDE experience
✅ Self-documenting code
✅ Safer refactoring
✅ Fewer runtime errors

All code must pass strict mode checks before merging. This ensures the highest quality and most reliable library for all users.
