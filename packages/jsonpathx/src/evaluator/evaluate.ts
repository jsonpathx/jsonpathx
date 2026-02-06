import type {
  ChildNode,
  FilterNode,
  ParentNode,
  PathNode,
  PropertyNameNode,
  RecursiveNode,
  ScriptNode,
  SegmentNode,
  TypeSelectorNode
} from "../ast/nodes.js";
import { createRootContext, type EvalContext } from "./context.js";
import { collectDescendants } from "./recursive.js";
import { applySelector } from "./selectors.js";
import { matchesTypeSelector } from "./types.js";
import { evaluateExpression, type EvalPolicy } from "../eval/index.js";

export type EvalOptions = EvalPolicy;

export function evaluatePath(ast: PathNode, json: unknown, options: EvalOptions = {}): EvalContext[] {
  const root = json;
  let contexts: EvalContext[] = [createRootContext(json)];
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
      return contexts.map(() => createRootContext(root));
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

function applyRecursive(segment: RecursiveNode, contexts: EvalContext[]): EvalContext[] {
  const descendants = contexts.flatMap((context) => collectDescendants(context));
  if (!segment.selector) {
    return descendants;
  }
  return descendants.flatMap((context) => applySelector(context, segment.selector));
}

function applyFilter(
  segment: FilterNode,
  contexts: EvalContext[],
  options: EvalOptions,
  root: unknown
): EvalContext[] {
  return contexts.flatMap((context) => {
    const targets = expandFilterTargets(context);
    return targets.filter((target) => evaluateExpression(segment.expression, target, root, options));
  });
}

function applyScript(
  segment: ScriptNode,
  contexts: EvalContext[],
  options: EvalOptions,
  root: unknown
): EvalContext[] {
  return contexts.flatMap((context) => {
    const result = evaluateExpression(segment.expression, context, root, options);
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
    const parentContext: EvalContext = {
      value: context.parent,
      path,
      parent: undefined,
      parentProperty: undefined
    };
    return [parentContext];
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
          parentProperty: context.parentProperty
        }
      ];
    }
    const value = context.value;
    if (value == null || (typeof value !== "object" && !Array.isArray(value))) {
      return [];
    }
    const keys = Object.keys(value as Record<string, unknown>);
    return keys.map((key) => ({ value: key, path: context.path.concat(key), parent: context.value, parentProperty: key }));
  });
}

function applyTypeSelector(segment: TypeSelectorNode, contexts: EvalContext[]): EvalContext[] {
  return contexts.filter((context) => matchesTypeSelector(context.value, segment.name));
}

function expandFilterTargets(context: EvalContext): EvalContext[] {
  const value = context.value;
  if (Array.isArray(value)) {
    return value.map((entry, index) => ({
      value: entry,
      path: context.path.concat(index),
      parent: context.value,
      parentProperty: index
    }));
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).map((key) => ({
      value: (value as Record<string, unknown>)[key],
      path: context.path.concat(key),
      parent: context.value,
      parentProperty: key
    }));
  }
  return [context];
}
