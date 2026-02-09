import type {
  ChildNode,
  FilterNode,
  ParentNode,
  PathNode,
  PathRootNode,
  PropertyNameNode,
  RecursiveNode,
  SliceSelector,
  ScriptNode,
  SegmentNode,
  SelectorNode,
  TypeSelectorNode
} from "../ast/nodes.js";
import { createChildContext, createRootContext, type EvalContext } from "./context.js";
import { collectDescendants, forEachDescendant } from "./recursive.js";
import { applySelector } from "./selectors.js";
import { matchesTypeSelector } from "./types.js";
import { evaluateExpression, normalizeEvalExpression } from "../eval/index.js";
import type { EvalOptions } from "./evaluate.js";
import { evaluateFilterExpression, parseFilterExpression } from "../filter/rfc.js";

export type CompiledPath = ((json: unknown, options: EvalOptions) => EvalContext[]) & {
  runValues?: (json: unknown, options: EvalOptions) => unknown[] | null;
};

type SegmentRunner = (
  contexts: EvalContext[],
  options: EvalOptions,
  root: unknown,
  trackPath: boolean
) => EvalContext[];

type FastSelector = { type: "Identifier"; name: string } | { type: "Index"; index: number };

export function compilePath(ast: PathNode): CompiledPath {
  if (ast.type === "UnionPath") {
    const compiledPaths = ast.paths.map((path) => compilePath(path));
    const compiled: CompiledPath = (json, options) =>
      compiledPaths.flatMap((compiledPath) => compiledPath(json, options));
    return compiled;
  }
  const requiresPath = requiresPathTracking(ast);
  const fastSliceValuePath = getFastSliceValuePath(ast);
  const fastSelectors = getFastSelectors(ast);
  if (fastSelectors) {
    const compiled: CompiledPath = (json, options) =>
      executeFastSelectors(json, fastSelectors, options, requiresPath);
    if (fastSliceValuePath) {
      compiled.runValues = (json, options) =>
        executeFastSliceValue(json, fastSliceValuePath, options);
    }
    return compiled;
  }

  const runners = ast.segments.map((segment) => buildRunner(segment));
  const compiled: CompiledPath = (json, options) => {
    const root = json;
    const trackPath = shouldTrackPath(options, requiresPath);
    let contexts: EvalContext[] = [
      createRootContext(json, options.parent, options.parentProperty, trackPath)
    ];
    for (const run of runners) {
      contexts = run(contexts, options, root, trackPath);
      if (contexts.length === 0) {
        break;
      }
    }
    return contexts;
  };
  if (fastSliceValuePath) {
    compiled.runValues = (json, options) =>
      executeFastSliceValue(json, fastSliceValuePath, options);
  }
  return compiled;
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

function executeFastSelectors(
  json: unknown,
  selectors: FastSelector[],
  options: EvalOptions,
  requiresPath: boolean
): EvalContext[] {
  const trackPath = shouldTrackPath(options, requiresPath);
  let context = createRootContext(json, undefined, undefined, trackPath);
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

type FastSliceValuePath = {
  collection: string;
  slice: SliceSelector;
  property: string;
};

function getFastSliceValuePath(ast: PathRootNode): FastSliceValuePath | null {
  const segments = ast.segments;
  let index = 0;
  while (index < segments.length && (segments[index].type === "Root" || segments[index].type === "Current")) {
    index += 1;
  }
  if (segments.length - index !== 3) {
    return null;
  }
  const collection = segments[index];
  const slice = segments[index + 1];
  const property = segments[index + 2];
  if (
    collection.type !== "Child" ||
    collection.selector.type !== "IdentifierSelector" ||
    slice.type !== "Child" ||
    slice.selector.type !== "SliceSelector" ||
    property.type !== "Child" ||
    property.selector.type !== "IdentifierSelector"
  ) {
    return null;
  }
  return {
    collection: collection.selector.name,
    slice: slice.selector,
    property: property.selector.name
  };
}

function executeFastSliceValue(
  json: unknown,
  spec: FastSliceValuePath,
  _options: EvalOptions
): unknown[] | null {
  if (!json || typeof json !== "object") {
    return [];
  }
  const record = json as Record<string, unknown>;
  if (!Object.prototype.hasOwnProperty.call(record, spec.collection)) {
    return [];
  }
  const list = record[spec.collection];
  if (!Array.isArray(list)) {
    return [];
  }
  const length = list.length;
  const step = spec.slice.step ?? 1;
  if (step === 0) {
    return [];
  }
  let start = spec.slice.start ?? (step > 0 ? 0 : length - 1);
  let end = spec.slice.end ?? (step > 0 ? length : -1);
  if (step > 0) {
    start = normalizeIndex(start, length);
    end = normalizeIndex(end, length);
    start = clamp(start, 0, length);
    end = clamp(end, 0, length);
  } else {
    start = normalizeIndex(start, length);
    if (spec.slice.end != null) {
      end = normalizeIndex(end, length);
    }
    start = clamp(start, -1, length - 1);
    end = clamp(end, -1, length - 1);
  }
  const values: unknown[] = [];
  const prop = spec.property;
  const hasOwn = Object.prototype.hasOwnProperty;
  if (step > 0) {
    const count = start < end ? Math.ceil((end - start) / step) : 0;
    values.length = count;
    let pos = 0;
    for (let i = start; i < end; i += step) {
      const entry = list[i];
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        const item = entry as Record<string, unknown>;
        if (hasOwn.call(item, prop)) {
          values[pos] = item[prop];
          pos += 1;
        }
      }
    }
    if (pos < values.length) {
      values.length = pos;
    }
  } else {
    if (start < 0) {
      return [];
    }
    const count = start > end ? Math.ceil((start - end) / -step) : 0;
    values.length = count;
    let pos = 0;
    for (let i = start; i > end; i += step) {
      const entry = list[i];
      if (entry && typeof entry === "object" && !Array.isArray(entry)) {
        const item = entry as Record<string, unknown>;
        if (hasOwn.call(item, prop)) {
          values[pos] = item[prop];
          pos += 1;
        }
      }
    }
    if (pos < values.length) {
      values.length = pos;
    }
  }
  return values;
}

function normalizeIndex(index: number, length: number) {
  return index < 0 ? length + index : index;
}

function clamp(value: number, min: number, max: number) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

function buildRunner(segment: SegmentNode): SegmentRunner {
  switch (segment.type) {
    case "Root":
      return (_contexts, options, root, trackPath) => [
        createRootContext(root, options.parent, options.parentProperty, trackPath)
      ];
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

function requiresPathTracking(ast: PathRootNode): boolean {
  return ast.segments.some((segment) => {
    if (segment.type === "Filter" || segment.type === "Script") {
      return segment.expression.includes("@path");
    }
    return false;
  });
}

function buildRecursiveRunner(segment: RecursiveNode): SegmentRunner {
  if (!segment.selector) {
    return (contexts) => {
      const results: EvalContext[] = [];
      for (const context of contexts) {
        forEachDescendant(context, (descendant) => {
          results.push(descendant);
        });
      }
      return results;
    };
  }
  return (contexts) => {
    const results: EvalContext[] = [];
    for (const context of contexts) {
      forEachDescendant(context, (descendant) => {
        const selected = applySelector(descendant, segment.selector as SelectorNode);
        for (const entry of selected) {
          results.push(entry);
        }
      });
    }
    return results;
  };
}

function buildFilterRunner(segment: FilterNode): SegmentRunner {
  let rfcExpression: ReturnType<typeof parseFilterExpression> | null = null;
  const canEvalFast = !segment.expression.includes("@path");
  let nativeEval: ((...args: unknown[]) => unknown) | null = null;
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
      if (
        canEvalFast &&
        (options.eval === "native" || options.eval === "safe") &&
        !options.preventEval
      ) {
        const hasSandbox = options.sandbox && Object.keys(options.sandbox).length > 0;
        const useNativeFast = options.eval === "native" && !hasSandbox;
        if (useNativeFast && !nativeEval) {
          const normalized = normalizeEvalExpression(segment.expression);
          nativeEval = new Function(
            "value",
            "parent",
            "property",
            "parentProperty",
            "root",
            "path",
            `"use strict"; return (${normalized});`
          ) as (...args: unknown[]) => unknown;
        }
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
              const passed = useNativeFast
                ? nativeEval?.(
                    temp.value,
                    temp.parent,
                    temp.parentProperty,
                    temp.parentProperty,
                    root,
                    temp.path
                  )
                : evaluateExpression(segment.expression, temp, root, options);
              if (passed) {
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
              const passed = useNativeFast
                ? nativeEval?.(
                    temp.value,
                    temp.parent,
                    temp.parentProperty,
                    temp.parentProperty,
                    root,
                    temp.path
                  )
                : evaluateExpression(segment.expression, temp, root, options);
              if (passed) {
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
