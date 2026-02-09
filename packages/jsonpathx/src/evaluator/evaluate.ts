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
import { createChildContext, createRootContext, type EvalContext, type PathKey } from "./context.js";
import { collectDescendants, forEachDescendant } from "./recursive.js";
import { applySelector } from "./selectors.js";
import { matchesTypeSelector } from "./types.js";
import { evaluateExpression, type EvalPolicy } from "../eval/index.js";
import { evaluateFilterExpression, parseFilterExpression } from "../filter/rfc.js";

export type EvalOptions = EvalPolicy & {
  parent?: unknown;
  parentProperty?: PathKey;
  filterMode?: "jsonpath" | "xpath" | "rfc";
};

export function evaluatePath(ast: PathNode, json: unknown, options: EvalOptions = {}): EvalContext[] {
  if (ast.type === "UnionPath") {
    return ast.paths.flatMap((path) => evaluatePath(path, json, options));
  }
  const root = json;
  const trackPath = shouldTrackPath(options, requiresPathTracking(ast));
  let contexts: EvalContext[] = [
    createRootContext(json, options.parent, options.parentProperty, trackPath)
  ];
  for (const segment of ast.segments) {
    contexts = applySegment(segment, contexts, options, root, trackPath);
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
  root: unknown,
  trackPath: boolean
): EvalContext[] {
  switch (segment.type) {
    case "Root":
      return contexts.map(() => createRootContext(root, undefined, undefined, trackPath));
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

function shouldTrackPath(options: EvalOptions, requiresPath: boolean): boolean {
  const opts = options as EvalOptions & {
    resultType?: string;
    callback?: unknown;
    flatten?: boolean | number;
  };
  if (opts.callback) {
    return true;
  }
  if (opts.resultType && opts.resultType !== "value") {
    return true;
  }
  if (opts.flatten !== undefined && opts.flatten !== false) {
    return true;
  }
  if (options.eval === "native" || options.eval === "safe") {
    return requiresPath;
  }
  return false;
}

function requiresPathTracking(ast: PathNode): boolean {
  if (ast.type === "UnionPath") {
    return ast.paths.some((path) => requiresPathTracking(path));
  }
  return ast.segments.some((segment) => {
    if (segment.type === "Filter" || segment.type === "Script") {
      return segment.expression.includes("@path");
    }
    return false;
  });
}

function applyRecursive(segment: RecursiveNode, contexts: EvalContext[]): EvalContext[] {
  const selector = segment.selector;
  const results: EvalContext[] = [];
  for (const context of contexts) {
    forEachDescendant(context, (descendant) => {
      if (!selector) {
        results.push(descendant);
        return;
      }
      const selected = applySelector(descendant, selector);
      for (const entry of selected) {
        results.push(entry);
      }
    });
  }
  return results;
}

function applyFilter(
  segment: FilterNode,
  contexts: EvalContext[],
  options: EvalOptions,
  root: unknown
): EvalContext[] {
  const canEvalFast =
    (options.eval === "native" || options.eval === "safe") &&
    !options.preventEval &&
    !segment.expression.includes("@path");
  return contexts.flatMap((context) => {
    if (options.filterMode === "rfc") {
      const expr = parseFilterExpression(segment.expression);
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
    }
    if (options.filterMode === "xpath") {
      try {
        return evaluateExpression(segment.expression, context, root, options) ? [context] : [];
      } catch (error) {
        if (options.ignoreEvalErrors) {
          return [];
        }
        throw error;
      }
    }
    if (canEvalFast) {
      const value = context.value;
      const matches: EvalContext[] = [];
      if (Array.isArray(value)) {
        const temp: EvalContext = {
          value: undefined,
          path: context.path,
          parent: context.value,
          parentProperty: 0,
          payloadType: "value",
          trackPath: context.trackPath
        };
        for (let i = 0; i < value.length; i += 1) {
          temp.value = value[i];
          temp.parentProperty = i;
          try {
            if (evaluateExpression(segment.expression, temp, root, options)) {
              matches.push(createChildContext(context, i, value[i]));
            }
          } catch (error) {
            if (options.ignoreEvalErrors) {
              continue;
            }
            throw error;
          }
        }
        return matches;
      }
      if (value && typeof value === "object") {
        const record = value as Record<string, unknown>;
        const temp: EvalContext = {
          value: undefined,
          path: context.path,
          parent: context.value,
          parentProperty: undefined,
          payloadType: "value",
          trackPath: context.trackPath
        };
        for (const key in record) {
          if (!Object.prototype.hasOwnProperty.call(record, key)) {
            continue;
          }
          temp.value = record[key];
          temp.parentProperty = key;
          try {
            if (evaluateExpression(segment.expression, temp, root, options)) {
              matches.push(createChildContext(context, key, record[key]));
            }
          } catch (error) {
            if (options.ignoreEvalErrors) {
              continue;
            }
            throw error;
          }
        }
        return matches;
      }
      return [];
    }
    const targets = expandFilterTargets(context);
    const matches: EvalContext[] = [];
    for (const target of targets) {
      try {
        if (evaluateExpression(segment.expression, target, root, options)) {
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
      result = evaluateExpression(segment.expression, context, root, options);
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
  return [];
}
