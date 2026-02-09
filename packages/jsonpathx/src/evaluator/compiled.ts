import type {
  ChildNode,
  FilterNode,
  ParentNode,
  PathNode,
  PathRootNode,
  PropertyNameNode,
  RecursiveNode,
  ScriptNode,
  SegmentNode,
  SelectorNode,
  TypeSelectorNode
} from "../ast/nodes.js";
import { createChildContext, createRootContext, type EvalContext } from "./context.js";
import { collectDescendants } from "./recursive.js";
import { applySelector } from "./selectors.js";
import { matchesTypeSelector } from "./types.js";
import { evaluateExpression } from "../eval/index.js";
import type { EvalOptions } from "./evaluate.js";
import { evaluateFilterExpression, parseFilterExpression } from "../filter/rfc.js";

export type CompiledPath = (json: unknown, options: EvalOptions) => EvalContext[];

type SegmentRunner = (contexts: EvalContext[], options: EvalOptions, root: unknown) => EvalContext[];

type FastSelector = { type: "Identifier"; name: string } | { type: "Index"; index: number };

export function compilePath(ast: PathNode): CompiledPath {
  if (ast.type === "UnionPath") {
    const compiledPaths = ast.paths.map((path) => compilePath(path));
    return (json, options) => compiledPaths.flatMap((compiled) => compiled(json, options));
  }
  const fastSelectors = getFastSelectors(ast);
  if (fastSelectors) {
    return (json) => executeFastSelectors(json, fastSelectors);
  }

  const runners = ast.segments.map((segment) => buildRunner(segment));
  return (json, options) => {
    const root = json;
    let contexts: EvalContext[] = [createRootContext(json, options.parent, options.parentProperty)];
    for (const run of runners) {
      contexts = run(contexts, options, root);
      if (contexts.length === 0) {
        break;
      }
    }
    return contexts;
  };
}

function getFastSelectors(ast: PathRootNode): FastSelector[] | null {
  const selectors: FastSelector[] = [];
  for (const segment of ast.segments) {
    if (segment.type === "Root" || segment.type === "Current") {
      continue;
    }
    if (segment.type !== "Child") {
      return null;
    }
    const selector = segment.selector;
    if (selector.type === "IdentifierSelector") {
      selectors.push({ type: "Identifier", name: selector.name });
      continue;
    }
    if (selector.type === "IndexSelector") {
      selectors.push({ type: "Index", index: selector.index });
      continue;
    }
    return null;
  }
  return selectors.length === 0 ? null : selectors;
}

function executeFastSelectors(json: unknown, selectors: FastSelector[]): EvalContext[] {
  let context = createRootContext(json);
  for (const selector of selectors) {
    const value = context.value;
    if (selector.type === "Identifier") {
      if (!value || typeof value !== "object") {
        return [];
      }
      const record = value as Record<string, unknown>;
      if (!Object.prototype.hasOwnProperty.call(record, selector.name)) {
        return [];
      }
      context = createChildContext(context, selector.name, record[selector.name]);
      continue;
    }
    if (!Array.isArray(value)) {
      return [];
    }
    const index = selector.index < 0 ? value.length + selector.index : selector.index;
    if (index < 0 || index >= value.length) {
      return [];
    }
    context = createChildContext(context, index, value[index]);
  }
  return [context];
}

function buildRunner(segment: SegmentNode): SegmentRunner {
  switch (segment.type) {
    case "Root":
      return (_contexts, options, root) => [createRootContext(root, options.parent, options.parentProperty)];
    case "Current":
      return (contexts) => contexts;
    case "Child":
      return (contexts) => contexts.flatMap((context) => applySelector(context, segment.selector));
    case "Recursive":
      return buildRecursiveRunner(segment);
    case "Filter":
      return buildFilterRunner(segment);
    case "Script":
      return buildScriptRunner(segment);
    case "Parent":
      return (contexts) => applyParent(contexts);
    case "PropertyName":
      return (contexts) => applyPropertyName(contexts);
    case "TypeSelector":
      return (contexts) => applyTypeSelector(segment, contexts);
    default:
      return (contexts) => contexts;
  }
}

function buildRecursiveRunner(segment: RecursiveNode): SegmentRunner {
  if (!segment.selector) {
    return (contexts) => contexts.flatMap((context) => collectDescendants(context));
  }
  return (contexts) =>
    contexts
      .flatMap((context) => collectDescendants(context))
      .flatMap((context) => applySelector(context, segment.selector as SelectorNode));
}

function buildFilterRunner(segment: FilterNode): SegmentRunner {
  let rfcExpression: ReturnType<typeof parseFilterExpression> | null = null;
  return (contexts, options, root) =>
    contexts.flatMap((context) => {
      if (options.filterMode === "rfc") {
        if (!rfcExpression) {
          rfcExpression = parseFilterExpression(segment.expression);
        }
        const targets = expandFilterTargets(context);
        const matches: EvalContext[] = [];
        for (const target of targets) {
          try {
            if (evaluateFilterExpression(rfcExpression, target, root, options)) {
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

function buildScriptRunner(segment: ScriptNode): SegmentRunner {
  return (contexts, options, root) =>
    contexts.flatMap((context) => {
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
    return [
      {
        value: context.parent,
        path,
        parent: undefined,
        parentProperty: undefined,
        payloadType: "value"
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
      parentProperty: index,
      payloadType: "value"
    }));
  }
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).map((key) => ({
      value: (value as Record<string, unknown>)[key],
      path: context.path.concat(key),
      parent: context.value,
      parentProperty: key,
      payloadType: "value"
    }));
  }
  return [];
}
