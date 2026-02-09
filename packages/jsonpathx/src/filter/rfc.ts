import type { FilterNode, PathNode, RecursiveNode, ScriptNode, SegmentNode, TypeSelectorNode } from "../ast/index.js";
import { parsePath } from "../parser/index.js";
import { ParseError } from "../parser/errors.js";
import type { EvalContext } from "../evaluator/context.js";
import { createRootContext, createChildContext } from "../evaluator/context.js";
import { collectDescendants } from "../evaluator/recursive.js";
import { applySelector } from "../evaluator/selectors.js";
import { matchesTypeSelector } from "../evaluator/types.js";
import { evaluateExpression as evaluateScript } from "../eval/index.js";
import type { EvalOptions } from "../evaluator/evaluate.js";

type FilterExpression =
  | { type: "Literal"; value: unknown }
  | { type: "Path"; path: string; ast: PathNode; singular: boolean; scope: "root" | "current" }
  | { type: "Function"; name: string; args: FilterExpression[] }
  | { type: "Unary"; operator: "!"; expr: FilterExpression }
  | {
      type: "Binary";
      operator: "&&" | "||" | "==" | "!=" | "<" | "<=" | ">" | ">=";
      left: FilterExpression;
      right: FilterExpression;
    };

type ValueResult =
  | { kind: "nothing" }
  | { kind: "scalar"; value: unknown; fromPath?: boolean }
  | { kind: "list"; values: unknown[]; fromPath?: boolean };

const NOTHING: ValueResult = { kind: "nothing" };

const comparisonOperators = new Set(["==", "!=", "<", "<=", ">", ">="]);
const logicalOperators = new Set(["&&", "||"]);
const regexCache = new Map<string, RegExp | null>();

const functionsRequiringComparison = new Set(["length", "count", "value"]);
const filterExpressionCache = new WeakMap<FilterNode, FilterExpression>();

export function parseFilterExpression(source: string): FilterExpression {
  const parser = new FilterParser(source);
  const expr = parser.parseExpression();
  parser.skipWhitespace();
  if (!parser.isAtEnd()) {
    throw new ParseError("Unexpected token in filter expression", parser.index);
  }
  validateFunctionUsage(expr, false);
  validateBooleanExpression(expr);
  return expr;
}

export function evaluateFilterExpression(
  expr: FilterExpression,
  context: EvalContext,
  root: unknown,
  options: EvalOptions
): boolean {
  const result = evaluateExpression(expr, context, root, options);
  return toBoolean(result);
}

function evaluateExpression(
  expr: FilterExpression,
  context: EvalContext,
  root: unknown,
  options: EvalOptions
): ValueResult {
  switch (expr.type) {
    case "Literal":
      return { kind: "scalar", value: expr.value };
    case "Path":
      return evaluatePathExpression(expr, context, root, options);
    case "Function":
      return evaluateFunctionExpression(expr, context, root, options);
    case "Unary": {
      const value = evaluateExpression(expr.expr, context, root, options);
      return { kind: "scalar", value: !toBoolean(value) };
    }
    case "Binary":
      if (logicalOperators.has(expr.operator)) {
        const left = evaluateExpression(expr.left, context, root, options);
        const leftBool = toBoolean(left);
        if (expr.operator === "&&") {
          if (!leftBool) {
            return { kind: "scalar", value: false };
          }
          const right = evaluateExpression(expr.right, context, root, options);
          return { kind: "scalar", value: leftBool && toBoolean(right) };
        }
        if (expr.operator === "||") {
          if (leftBool) {
            return { kind: "scalar", value: true };
          }
          const right = evaluateExpression(expr.right, context, root, options);
          return { kind: "scalar", value: leftBool || toBoolean(right) };
        }
      }
      if (comparisonOperators.has(expr.operator)) {
        const left = evaluateExpression(expr.left, context, root, options);
        const right = evaluateExpression(expr.right, context, root, options);
        return { kind: "scalar", value: compareValues(expr.operator, left, right) };
      }
      return { kind: "scalar", value: false };
    default:
      return { kind: "scalar", value: false };
  }
}

function evaluatePathExpression(
  expr: Extract<FilterExpression, { type: "Path" }>,
  context: EvalContext,
  root: unknown,
  options: EvalOptions
): ValueResult {
  const base = expr.scope === "root" ? root : context.value;
  const fast = resolveSimplePathValue(expr.ast, base);
  if (fast) {
    return fast;
  }
  const evalOptions: EvalOptions = {
    ...options,
    filterMode: "rfc",
    parent: context.parent,
    parentProperty: context.parentProperty
  };
  const contexts = evaluatePath(expr.ast, base, evalOptions);
  if (expr.singular) {
    if (contexts.length === 0) {
      return NOTHING;
    }
    return { kind: "scalar", value: contexts[0]?.value, fromPath: true };
  }
  const values = contexts.map((item) => item.value);
  return { kind: "list", values, fromPath: true };
}

function resolveSimplePathValue(ast: PathNode, base: unknown): ValueResult | null {
  if (ast.type === "UnionPath") {
    return null;
  }
  let current: unknown = base;
  for (const segment of ast.segments) {
    switch (segment.type) {
      case "Root":
      case "Current":
        continue;
      case "Child":
        switch (segment.selector.type) {
          case "IdentifierSelector": {
            if (!current || typeof current !== "object" || Array.isArray(current)) {
              return NOTHING;
            }
            const record = current as Record<string, unknown>;
            if (!Object.prototype.hasOwnProperty.call(record, segment.selector.name)) {
              return NOTHING;
            }
            current = record[segment.selector.name];
            continue;
          }
          case "IndexSelector": {
            if (!Array.isArray(current)) {
              return NOTHING;
            }
            const index =
              segment.selector.index < 0
                ? current.length + segment.selector.index
                : segment.selector.index;
            if (index < 0 || index >= current.length) {
              return NOTHING;
            }
            current = current[index];
            continue;
          }
          default:
            return null;
        }
      default:
        return null;
    }
  }
  return { kind: "scalar", value: current, fromPath: true };
}

function evaluateFunctionExpression(
  expr: Extract<FilterExpression, { type: "Function" }>,
  context: EvalContext,
  root: unknown,
  options: EvalOptions
): ValueResult {
  const args = expr.args.map((arg) => evaluateExpression(arg, context, root, options));
  switch (expr.name) {
    case "length":
      return { kind: "scalar", value: evaluateLength(args[0] ?? NOTHING) };
    case "count":
      return { kind: "scalar", value: evaluateCount(expr.args[0], context, root, options) };
    case "value":
      return evaluateValue(expr.args[0], context, root, options);
    case "match":
      return { kind: "scalar", value: evaluateMatch(args[0] ?? NOTHING, args[1] ?? NOTHING) };
    case "search":
      return { kind: "scalar", value: evaluateSearch(args[0] ?? NOTHING, args[1] ?? NOTHING) };
    default:
      throw new ParseError(`Unknown function: ${expr.name}`, 0);
  }
}

function evaluateLength(arg: ValueResult): number {
  if (arg.kind === "nothing") {
    return 0;
  }
  if (arg.kind === "list") {
    throw new ParseError("length() cannot accept non-singular queries", 0);
  }
  const value = arg.value;
  if (typeof value === "string") {
    return value.length;
  }
  if (Array.isArray(value)) {
    return value.length;
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).length;
  }
  return 0;
}

function evaluateCount(
  arg: FilterExpression | undefined,
  context: EvalContext,
  root: unknown,
  options: EvalOptions
): number {
  if (!arg || arg.type !== "Path") {
    throw new ParseError("count() requires a query argument", 0);
  }
  const base = arg.scope === "root" ? root : context.value;
  const evalOptions: EvalOptions = { ...options, filterMode: "rfc" };
  const contexts = evaluatePath(arg.ast, base, evalOptions);
  return contexts.length;
}

function evaluateValue(
  arg: FilterExpression | undefined,
  context: EvalContext,
  root: unknown,
  options: EvalOptions
): ValueResult {
  if (!arg || arg.type !== "Path") {
    throw new ParseError("value() requires a query argument", 0);
  }
  const base = arg.scope === "root" ? root : context.value;
  const evalOptions: EvalOptions = { ...options, filterMode: "rfc" };
  const contexts = evaluatePath(arg.ast, base, evalOptions);
  if (contexts.length !== 1) {
    return NOTHING;
  }
  return { kind: "scalar", value: contexts[0]?.value };
}

function evaluateMatch(left: ValueResult, right: ValueResult): boolean {
  const source = resolveScalar(left);
  const pattern = resolveScalar(right);
  if (typeof source !== "string" || typeof pattern !== "string") {
    return false;
  }
  const regex = getCachedRegex(pattern);
  if (!regex) {
    return false;
  }
  const match = regex.exec(source);
  return match !== null && match[0] === source;
}

function evaluateSearch(left: ValueResult, right: ValueResult): boolean {
  const source = resolveScalar(left);
  const pattern = resolveScalar(right);
  if (typeof source !== "string" || typeof pattern !== "string") {
    return false;
  }
  const regex = getCachedRegex(pattern);
  if (!regex) {
    return false;
  }
  return regex.test(source);
}

function rewriteDotPattern(pattern: string): string {
  let result = "";
  let inClass = false;
  let escaped = false;
  for (let i = 0; i < pattern.length; i += 1) {
    const char = pattern[i];
    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      result += char;
      escaped = true;
      continue;
    }
    if (char === "[" && !inClass) {
      inClass = true;
      result += char;
      continue;
    }
    if (char === "]" && inClass) {
      inClass = false;
      result += char;
      continue;
    }
    if (char === "." && !inClass) {
      result += "[^\\r\\n]";
      continue;
    }
    result += char;
  }
  return result;
}

function getCachedRegex(pattern: string): RegExp | null {
  if (regexCache.has(pattern)) {
    return regexCache.get(pattern) ?? null;
  }
  try {
    const compiled = new RegExp(rewriteDotPattern(pattern), "u");
    regexCache.set(pattern, compiled);
    return compiled;
  } catch {
    regexCache.set(pattern, null);
    return null;
  }
}

function resolveScalar(value: ValueResult): unknown {
  if (value.kind === "scalar") {
    return value.value;
  }
  return undefined;
}

function isDeepEqual(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) {
    return true;
  }
  if (typeof left !== typeof right) {
    return false;
  }
  if (left == null || right == null) {
    return false;
  }
  if (Array.isArray(left)) {
    if (!Array.isArray(right)) {
      return false;
    }
    if (left.length !== right.length) {
      return false;
    }
    for (let i = 0; i < left.length; i += 1) {
      if (!isDeepEqual(left[i], right[i])) {
        return false;
      }
    }
    return true;
  }
  if (typeof left === "object") {
    if (Array.isArray(right)) {
      return false;
    }
    const leftKeys = Object.keys(left as Record<string, unknown>);
    const rightKeys = Object.keys(right as Record<string, unknown>);
    if (leftKeys.length !== rightKeys.length) {
      return false;
    }
    for (const key of leftKeys) {
      if (!Object.prototype.hasOwnProperty.call(right, key)) {
        return false;
      }
      if (
        !isDeepEqual(
          (left as Record<string, unknown>)[key],
          (right as Record<string, unknown>)[key]
        )
      ) {
        return false;
      }
    }
    return true;
  }
  return false;
}

function toBoolean(value: ValueResult): boolean {
  if (value.kind === "nothing") {
    return false;
  }
  if (value.kind === "list") {
    return value.values.length > 0;
  }
  if (value.fromPath) {
    return true;
  }
  return Boolean(value.value);
}

function compareValues(
  operator: Extract<FilterExpression, { type: "Binary" }>["operator"],
  left: ValueResult,
  right: ValueResult
): boolean {
  if (left.kind === "list" || right.kind === "list") {
    throw new ParseError("Non-singular query in comparison", 0);
  }
  const leftMissing = left.kind === "nothing";
  const rightMissing = right.kind === "nothing";

  if (leftMissing || rightMissing) {
    if (operator === "==" && ((leftMissing && isZero(right)) || (rightMissing && isZero(left)))) {
      return true;
    }
    if (operator === "!=" && ((leftMissing && isZero(right)) || (rightMissing && isZero(left)))) {
      return false;
    }
    if (operator === "==") {
      return leftMissing && rightMissing;
    }
    if (operator === "!=") {
      return leftMissing !== rightMissing;
    }
    return false;
  }

  const leftValue = left.value;
  const rightValue = right.value;

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    if (operator === "==") {
      return leftValue === rightValue || (leftValue === 0 && rightValue === 0);
    }
    if (operator === "!=") {
      return !(leftValue === rightValue || (leftValue === 0 && rightValue === 0));
    }
  } else {
    if (operator === "==") {
      return isDeepEqual(leftValue, rightValue);
    }
    if (operator === "!=") {
      return !isDeepEqual(leftValue, rightValue);
    }
  }

  if (leftValue === null && rightValue === null) {
    return operator === "<=" || operator === ">=";
  }

  if (typeof leftValue !== typeof rightValue) {
    return false;
  }

  if (typeof leftValue === "number" && typeof rightValue === "number") {
    if (operator === "<") return leftValue < rightValue;
    if (operator === "<=") return leftValue <= rightValue;
    if (operator === ">") return leftValue > rightValue;
    if (operator === ">=") return leftValue >= rightValue;
  }

  if (typeof leftValue === "string" && typeof rightValue === "string") {
    if (operator === "<") return leftValue < rightValue;
    if (operator === "<=") return leftValue <= rightValue;
    if (operator === ">") return leftValue > rightValue;
    if (operator === ">=") return leftValue >= rightValue;
  }

  if (typeof leftValue === "boolean" && typeof rightValue === "boolean") {
    const leftNum = leftValue ? 1 : 0;
    const rightNum = rightValue ? 1 : 0;
    if (operator === "<") return leftNum < rightNum;
    if (operator === "<=") return leftNum <= rightNum;
    if (operator === ">") return leftNum > rightNum;
    if (operator === ">=") return leftNum >= rightNum;
  }

  return false;
}

function isZero(value: ValueResult): boolean {
  return value.kind === "scalar" && value.value === 0;
}

function evaluatePath(ast: PathNode, json: unknown, options: EvalOptions): EvalContext[] {
  if (ast.type === "UnionPath") {
    return ast.paths.flatMap((path) => evaluatePath(path, json, options));
  }
  const root = json;
  let contexts: EvalContext[] = [createRootContext(json, options.parent, options.parentProperty)];
  for (const segment of ast.segments) {
    contexts = applySegment(segment, contexts, options, root);
    if (contexts.length === 0) {
      break;
    }
  }
  return contexts;
}

function applySegment(
  segment: SegmentNode,
  contexts: EvalContext[],
  options: EvalOptions,
  root: unknown
): EvalContext[] {
  switch (segment.type) {
    case "Root":
      return contexts.map(() => createRootContext(root, options.parent, options.parentProperty));
    case "Current":
      return contexts;
    case "Child":
      return contexts.flatMap((context) => applySelector(context, segment.selector));
    case "Recursive":
      return applyRecursive(segment, contexts);
    case "Filter":
      return applyFilter(segment, contexts, options, root);
    case "Script":
      return applyScript(segment, contexts, options, root);
    case "Parent":
      return applyParent(contexts);
    case "PropertyName":
      return applyPropertyName(contexts);
    case "TypeSelector":
      return applyTypeSelector(segment, contexts);
    default:
      return contexts;
  }
}

function applyRecursive(segment: RecursiveNode, contexts: EvalContext[]) {
  const descendants = contexts.flatMap((context) => collectDescendants(context));
  const selector = segment.selector;
  if (!selector) {
    return descendants;
  }
  return descendants.flatMap((context) => applySelector(context, selector));
}

function applyFilter(
  segment: FilterNode,
  contexts: EvalContext[],
  options: EvalOptions,
  root: unknown
): EvalContext[] {
  let expr = filterExpressionCache.get(segment);
  if (!expr) {
    expr = parseFilterExpression(segment.expression);
    filterExpressionCache.set(segment, expr);
  }
  return contexts.flatMap((context) => {
    const targets = expandFilterTargets(context);
    const matches: EvalContext[] = [];
    for (const target of targets) {
      try {
        if (evaluateFilterExpression(expr, target, root, options)) {
          matches.push(target);
        }
      } catch (error) {
        if (options.ignoreEvalErrors) {
          continue;
        }
        throw error;
      }
    }
    return matches;
  });
}

function applyScript(
  segment: ScriptNode,
  contexts: EvalContext[],
  options: EvalOptions,
  root: unknown
): EvalContext[] {
  return contexts.flatMap((context) => {
    let result: unknown;
    try {
      result = evaluateScript(segment.expression, context, root, options);
    } catch (error) {
      if (options.ignoreEvalErrors) {
        return [];
      }
      throw error;
    }
    if (typeof result === "number") {
      return applySelector(context, { type: "IndexSelector", index: result });
    }
    if (typeof result === "string") {
      return applySelector(context, { type: "IdentifierSelector", name: result, quoted: false, escaped: false });
    }
    return [];
  });
}

function applyParent(contexts: EvalContext[]): EvalContext[] {
  return contexts.flatMap((context) => {
    if (context.parent === undefined || context.parentProperty === undefined) {
      return [];
    }
    const path = context.path.slice(0, -1);
    return [
      {
        value: context.parent,
        path,
        parent: undefined,
        parentProperty: undefined
      }
    ];
  });
}

function applyPropertyName(contexts: EvalContext[]): EvalContext[] {
  return contexts.flatMap((context) => {
    if (context.parentProperty !== undefined) {
      return [
        {
          value: String(context.parentProperty),
          path: context.path,
          parent: context.parent,
          parentProperty: context.parentProperty,
          payloadType: "property"
        }
      ];
    }
    const value = context.value;
    if (value == null || (typeof value !== "object" && !Array.isArray(value))) {
      return [];
    }
    const keys = Object.keys(value as Record<string, unknown>);
    return keys.map((key) => ({
      value: key,
      path: context.path.concat(key),
      parent: context.value,
      parentProperty: key,
      payloadType: "property"
    }));
  });
}

function applyTypeSelector(
  segment: TypeSelectorNode,
  contexts: EvalContext[]
): EvalContext[] {
  return contexts.filter((context) => matchesTypeSelector(context.value, segment.name));
}

function expandFilterTargets(context: EvalContext): EvalContext[] {
  const value = context.value;
  if (Array.isArray(value)) {
    return value.map((entry, index) =>
      createChildContext(context, index, entry)
    );
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).map((key) =>
      createChildContext(context, key, (value as Record<string, unknown>)[key])
    );
  }
  return [];
}

function validateFunctionUsage(expr: FilterExpression, inComparison: boolean): void {
  switch (expr.type) {
    case "Function": {
      const requiresComparison = functionsRequiringComparison.has(expr.name);
      if ((expr.name === "match" || expr.name === "search") && inComparison) {
        throw new ParseError(`${expr.name}() result cannot be compared`, 0);
      }
      if (requiresComparison && !inComparison) {
        throw new ParseError(`${expr.name}() result must be compared`, 0);
      }
      const argComparisonContext =
        inComparison ||
        expr.name === "length" ||
        expr.name === "count" ||
        expr.name === "match" ||
        expr.name === "search";
      for (const arg of expr.args) {
        validateFunctionUsage(arg, argComparisonContext);
      }
      return;
    }
    case "Binary": {
      const isComparison = comparisonOperators.has(expr.operator);
      validateFunctionUsage(expr.left, inComparison || isComparison);
      validateFunctionUsage(expr.right, inComparison || isComparison);
      return;
    }
    case "Unary":
      validateFunctionUsage(expr.expr, inComparison);
      return;
    default:
      return;
  }
}

function validateBooleanExpression(expr: FilterExpression): void {
  switch (expr.type) {
    case "Literal":
      throw new ParseError("Literal must be compared", 0);
    case "Path":
      return;
    case "Function":
      if (functionsRequiringComparison.has(expr.name)) {
        throw new ParseError(`${expr.name}() result must be compared`, 0);
      }
      return;
    case "Unary":
      return validateBooleanExpression(expr.expr);
    case "Binary":
      if (logicalOperators.has(expr.operator)) {
        validateBooleanExpression(expr.left);
        validateBooleanExpression(expr.right);
        return;
      }
      return;
    default:
      return;
  }
}

function isSingularPath(ast: PathNode): boolean {
  if (ast.type === "UnionPath") {
    return false;
  }
  for (const segment of ast.segments) {
    switch (segment.type) {
      case "Root":
      case "Current":
        continue;
      case "Child":
        if (
          segment.selector.type !== "IdentifierSelector" &&
          segment.selector.type !== "IndexSelector"
        ) {
          return false;
        }
        continue;
      default:
        return false;
    }
  }
  return true;
}

class FilterParser {
  source: string;
  index = 0;

  constructor(source: string) {
    this.source = source;
  }

  parseExpression(): FilterExpression {
    return this.parseOr();
  }

  parseOr(): FilterExpression {
    let expr = this.parseAnd();
    while (true) {
      this.skipWhitespace();
      if (this.match("||")) {
        const right = this.parseAnd();
        expr = { type: "Binary", operator: "||", left: expr, right };
        continue;
      }
      break;
    }
    return expr;
  }

  parseAnd(): FilterExpression {
    let expr = this.parseComparison();
    while (true) {
      this.skipWhitespace();
      if (this.match("&&")) {
        const right = this.parseComparison();
        expr = { type: "Binary", operator: "&&", left: expr, right };
        continue;
      }
      break;
    }
    return expr;
  }

  parseComparison(): FilterExpression {
    let expr = this.parseUnary();
    this.skipWhitespace();
    const op = this.matchOne([
      "==",
      "!=",
      "<=",
      ">=",
      "<",
      ">"
    ]) as Extract<FilterExpression, { type: "Binary" }>["operator"] | null;
    if (!op) {
      return expr;
    }
    const right = this.parseUnary();
    if (expr.type === "Path" && !expr.singular) {
      throw new ParseError("Non-singular query in comparison", this.index);
    }
    if (right.type === "Path" && !right.singular) {
      throw new ParseError("Non-singular query in comparison", this.index);
    }
    return { type: "Binary", operator: op, left: expr, right };
  }

  parseUnary(): FilterExpression {
    this.skipWhitespace();
    if (this.match("!")) {
      const expr = this.parseUnary();
      return { type: "Unary", operator: "!", expr };
    }
    return this.parsePrimary();
  }

  parsePrimary(): FilterExpression {
    this.skipWhitespace();
    const char = this.peek();
    if (char === "(") {
      this.index += 1;
      const expr = this.parseExpression();
      this.skipWhitespace();
      if (!this.match(")")) {
        throw new ParseError("Unclosed parenthetical expression", this.index);
      }
      return expr;
    }
    if (char === "'" || char === "\"") {
      return { type: "Literal", value: this.readString() };
    }
    if (char === "-" || isDigit(char)) {
      return { type: "Literal", value: this.readNumber() };
    }
    if (this.startsWithKeyword("true")) {
      this.index += 4;
      return { type: "Literal", value: true };
    }
    if (this.startsWithKeyword("false")) {
      this.index += 5;
      return { type: "Literal", value: false };
    }
    if (this.startsWithKeyword("null")) {
      this.index += 4;
      return { type: "Literal", value: null };
    }
    if (char === "@" || char === "$") {
      return this.readPath();
    }
    if (isIdentifierStart(char)) {
      return this.readFunction();
    }
    throw new ParseError("Unexpected token in filter expression", this.index);
  }

  readFunction(): FilterExpression {
    const name = this.readIdentifier();
    if (this.source[this.index]?.trim() === "") {
      throw new ParseError("Unexpected whitespace after function name", this.index);
    }
    if (!this.match("(")) {
      throw new ParseError("Expected '(' after function name", this.index);
    }
    const args: FilterExpression[] = [];
    this.skipWhitespace();
    if (!this.match(")")) {
      while (true) {
        args.push(this.parseExpression());
        this.skipWhitespace();
        if (this.match(")")) {
          break;
        }
        if (!this.match(",")) {
          throw new ParseError("Expected ',' between function arguments", this.index);
        }
      }
    }

    if (!["length", "count", "match", "search", "value"].includes(name)) {
      throw new ParseError(`Unknown function: ${name}`, this.index);
    }
    if (name === "count" || name === "value") {
      if (args.length !== 1 || args[0]?.type !== "Path") {
        throw new ParseError(`${name}() requires a single query argument`, this.index);
      }
    }
    if (name === "length") {
      if (args.length !== 1) {
        throw new ParseError("length() requires a single argument", this.index);
      }
      const arg = args[0];
      if (arg?.type === "Path" && !arg.singular) {
        throw new ParseError("length() cannot accept non-singular queries", this.index);
      }
    }
    if (name === "match" || name === "search") {
      if (args.length !== 2) {
        throw new ParseError(`${name}() requires two arguments`, this.index);
      }
    }

    return { type: "Function", name, args };
  }

  readPath(): FilterExpression {
    const start = this.index;
    const scope = this.source[start] === "$" ? "root" : "current";
    const path = this.readPathString();
    const ast = parsePath(path);
    const singular = isSingularPath(ast);
    return { type: "Path", path, ast, singular, scope };
  }

  readPathString(): string {
    let result = "";
    let depth = 0;
    let inQuote: string | null = null;
    let escaped = false;
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (escaped) {
        result += char;
        escaped = false;
        this.index += 1;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        result += char;
        this.index += 1;
        continue;
      }
      if (inQuote) {
        if (char === inQuote) {
          inQuote = null;
        }
        result += char;
        this.index += 1;
        continue;
      }
      if (char === "'" || char === "\"") {
        inQuote = char;
        result += char;
        this.index += 1;
        continue;
      }
      if (char === "[") {
        depth += 1;
        result += char;
        this.index += 1;
        continue;
      }
      if (char === "]") {
        if (depth === 0) {
          break;
        }
        depth -= 1;
        result += char;
        this.index += 1;
        continue;
      }
      if (depth === 0 && char.trim() === "") {
        let lookahead = this.index + 1;
        while (lookahead < this.source.length && this.source[lookahead]?.trim() === "") {
          lookahead += 1;
        }
        const next = this.source[lookahead];
        if (next === "." || next === "[") {
          this.index = lookahead;
          continue;
        }
        break;
      }
      if (depth === 0 && isPathBoundary(char)) {
        break;
      }
      result += char;
      this.index += 1;
    }
    return result.trim();
  }

  readString(): string {
    const quote = this.source[this.index];
    this.index += 1;
    let result = "";
    let escaped = false;
    while (this.index < this.source.length) {
      const char = this.source[this.index];
      if (escaped) {
        result += char;
        escaped = false;
        this.index += 1;
        continue;
      }
      if (char === "\\") {
        escaped = true;
        this.index += 1;
        continue;
      }
      if (char === quote) {
        this.index += 1;
        return result;
      }
      result += char;
      this.index += 1;
    }
    throw new ParseError("Unterminated string literal", this.index);
  }

  readNumber(): number {
    const start = this.index;
    const slice = this.source.slice(start);
    const match = slice.match(/^-?(0|[1-9]\d*)(\.\d+)?([eE][+-]?\d+)?/);
    if (!match) {
      throw new ParseError("Invalid number literal", start);
    }
    const raw = match[0];
    this.index += raw.length;
    return Number.parseFloat(raw);
  }

  readIdentifier(): string {
    const start = this.index;
    if (!isIdentifierStart(this.source[this.index])) {
      throw new ParseError("Invalid identifier", this.index);
    }
    this.index += 1;
    while (this.index < this.source.length && isIdentifierPart(this.source[this.index])) {
      this.index += 1;
    }
    return this.source.slice(start, this.index);
  }

  startsWithKeyword(keyword: string): boolean {
    if (!this.source.startsWith(keyword, this.index)) {
      return false;
    }
    const next = this.source[this.index + keyword.length];
    if (next && isIdentifierPart(next)) {
      return false;
    }
    return true;
  }

  skipWhitespace(): void {
    while (this.index < this.source.length && this.source[this.index].trim() === "") {
      this.index += 1;
    }
  }

  match(value: string): boolean {
    if (this.source.startsWith(value, this.index)) {
      this.index += value.length;
      return true;
    }
    return false;
  }

  matchOne(values: string[]): string | null {
    for (const value of values) {
      if (this.source.startsWith(value, this.index)) {
        this.index += value.length;
        return value;
      }
    }
    return null;
  }

  peek(): string {
    return this.source[this.index] ?? "";
  }

  isAtEnd(): boolean {
    return this.index >= this.source.length;
  }
}

function isIdentifierStart(char: string): boolean {
  return /[A-Za-z_]/.test(char);
}

function isIdentifierPart(char: string): boolean {
  return /[A-Za-z0-9_]/.test(char);
}

function isDigit(char: string): boolean {
  return /[0-9]/.test(char);
}

function isPathBoundary(char: string): boolean {
  return (
    char.trim() === "" ||
    char === "," ||
    char === ")" ||
    char === "&" ||
    char === "|" ||
    char === "=" ||
    char === "!" ||
    char === "<" ||
    char === ">"
  );
}
