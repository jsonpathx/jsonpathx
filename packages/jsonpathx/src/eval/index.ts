import type { EvalContext } from "../evaluator/context.js";

export type EvalMode = false | "native" | "safe";

export type EvalPolicy = {
  eval?: EvalMode;
  preventEval?: boolean;
  sandbox?: Record<string, unknown>;
  ignoreEvalErrors?: boolean;
};

const allowedKeywords = new Set([
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
]);

const builtins = new Set([
  "value",
  "parent",
  "property",
  "parentProperty",
  "root",
  "path"
]);

const forbiddenProperties = new Set(["constructor", "__proto__", "prototype"]);
const evalCache = new Map<string, Function>();
const normalizeCache = new Map<string, string>();

export function normalizeEvalExpression(expression: string): string {
  return normalizeExpression(expression);
}

export function evaluateExpression(
  expression: string,
  context: EvalContext,
  root: unknown,
  policy: EvalPolicy
): unknown {
  if (policy.preventEval) {
    throw new Error("Evaluation is disabled (preventEval)");
  }
  if (policy.eval !== "native" && policy.eval !== "safe") {
    throw new Error("Evaluation is disabled (eval: false)");
  }
  const cachedNormalized = normalizeCache.get(expression);
  const normalized = cachedNormalized ?? normalizeExpression(expression);
  if (!cachedNormalized) {
    normalizeCache.set(expression, normalized);
  }
  const sandbox = policy.sandbox ?? {};
  const sandboxKeys = Object.keys(sandbox);
  const cacheKey = `${policy.eval}|${normalized}|${sandboxKeys.join(",")}`;
  let fn = evalCache.get(cacheKey);
  if (!fn) {
    if (policy.eval === "safe") {
      enforceSandboxOnly(normalized, sandbox);
    }
    const argNames = [
      "value",
      "parent",
      "property",
      "parentProperty",
      "root",
      "path",
      ...sandboxKeys
    ];
    fn = new Function(
      ...argNames,
      `"use strict"; return (${normalized});`
    );
    evalCache.set(cacheKey, fn);
  }
  if (sandboxKeys.length === 0) {
    return fn(
      context.value,
      context.parent,
      context.parentProperty,
      context.parentProperty,
      root,
      context.path
    );
  }
  const argValues = new Array(sandboxKeys.length + 6);
  argValues[0] = context.value;
  argValues[1] = context.parent;
  argValues[2] = context.parentProperty;
  argValues[3] = context.parentProperty;
  argValues[4] = root;
  argValues[5] = context.path;
  for (let i = 0; i < sandboxKeys.length; i += 1) {
    argValues[i + 6] = sandbox[sandboxKeys[i] as string];
  }
  return fn(...argValues);
}

function normalizeExpression(expression: string) {
  return expression
    .replace(/@root/g, "root")
    .replace(/@parentProperty/g, "parentProperty")
    .replace(/@parent/g, "parent")
    .replace(/@property/g, "property")
    .replace(/@path/g, "path")
    .replace(/@(?=\.|\[)/g, "value")
    .replace(/@$/g, "value");
}

function enforceSandboxOnly(expression: string, sandbox: Record<string, unknown>) {
  const identifierRegex = /[A-Za-z_$][A-Za-z0-9_$]*/g;
  let match: RegExpExecArray | null;
  while ((match = identifierRegex.exec(expression))) {
    const ident = match[0];
    if (allowedKeywords.has(ident)) {
      continue;
    }
    if (builtins.has(ident)) {
      continue;
    }
    if (Object.prototype.hasOwnProperty.call(sandbox, ident)) {
      continue;
    }
    const prefix = expression.slice(0, match.index).trimEnd();
    const prevChar = prefix[prefix.length - 1];
    if (prevChar === ".") {
      if (forbiddenProperties.has(ident)) {
        throw new Error(`Unsafe identifier in safe eval: ${ident}`);
      }
      continue;
    }
    throw new Error(`Unsafe identifier in safe eval: ${ident}`);
  }
}
