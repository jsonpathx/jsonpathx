import { parsePath } from "../parser/index.js";
import { formatPayloads, type ResultType } from "../results/index.js";
import { compilePath, type CompiledPath } from "./compiled.js";
import type { EvalOptions } from "./evaluate.js";
import type { PathNode } from "../ast/index.js";
import type { EvalContext } from "./context.js";
import { buildPayload, type ResultPayload } from "../results/payload.js";
import { JSONPathQuery } from "../core/query-instance.js";
import { QueryCache, getGlobalCache, isGlobalCacheEnabled } from "../core/cache.js";

export type CallbackType = "value" | "property";

export type CallbackFunction = (
  value: unknown,
  type: CallbackType,
  payload: ResultPayload
) => unknown | void;

export type FilterMode = "jsonpath" | "xpath" | "rfc";

export type QueryOptions = EvalOptions & {
  wrap?: boolean;
  resultType?: ResultType;
  flatten?: boolean | number;
  callback?: CallbackFunction;
  enableCache?: boolean;
  maxParentChainDepth?: number;
  parent?: unknown;
  parentProperty?: string | number;
  filterMode?: FilterMode;
};

export type JSONPathOptions = QueryOptions & {
  path: string;
  json: unknown;
  autostart?: boolean;
};

const astCache = new Map<string, PathNode>();
const compiledCache = new Map<string, CompiledPath>();

export type QueryConfig = QueryOptions & { path: string; json?: unknown; autostart?: boolean };

export async function query<T = unknown>(
  pathOrConfig: string | QueryConfig,
  data?: unknown,
  options: QueryOptions = {}
): Promise<T[] | JSONPathQuery> {
  if (typeof pathOrConfig === "object" && pathOrConfig !== null) {
    const config = pathOrConfig as QueryConfig;
    if (config.autostart === false) {
      return new JSONPathQuery(config.path, config);
    }
    if (config.json === undefined) {
      throw new Error('Config object requires "json" property when autostart is not false');
    }
    return querySync(config.path, config.json, config) as T[];
  }
  const path = pathOrConfig as string;
  if (data === undefined) {
    throw new Error("Data parameter is required when using path string signature");
  }
  return querySync(path, data, options) as T[];
}

export function querySync<T = unknown>(
  path: string,
  data: unknown,
  options: QueryOptions = {}
): T[] {
  const useCache = options.enableCache ?? isGlobalCacheEnabled();
  if (useCache) {
    const cache = getGlobalCache();
    const key = QueryCache.createKey(path, data);
    const cached = cache.get(key);
    if (cached) {
      return cached as T[];
    }
    const result = JSONPath({ ...options, path, json: data }) as T[];
    cache.set(key, result as unknown[]);
    return result;
  }
  return JSONPath({ ...options, path, json: data }) as T[];
}

function getCompiled(path: string): CompiledPath {
  const existing = compiledCache.get(path);
  if (existing) {
    return existing;
  }
  const ast = parsePath(path);
  astCache.set(path, ast);
  const compiled = compilePath(ast);
  compiledCache.set(path, compiled);
  return compiled;
}

function attachParentChains(
  contexts: EvalContext[],
  root: unknown,
  maxDepth?: number
): void {
  const limit = maxDepth ?? Infinity;
  for (const context of contexts) {
    const chain: { property: string | number; parent: unknown }[] = [];
    const path = context.path;
    let currentParent: any = root;

    for (let i = 0; i < path.length && chain.length < limit; i += 1) {
      if (currentParent === undefined || currentParent === null) {
        break;
      }
      const key = path[i];
      chain.push({ property: key, parent: currentParent });
      currentParent = (currentParent as any)[key as any];
    }

    context.parentChain = chain;
  }
}

export function JSONPath(options: JSONPathOptions): unknown {
  const resultType = options.resultType ?? "value";
  const compiled = getCompiled(options.path);
  if (resultType === "value" && !options.callback) {
    const fastValues =
      compiled.runValues && (options.flatten === undefined || options.flatten === false)
        ? compiled.runValues(options.json, options)
        : null;
    if (fastValues) {
      let values = fastValues;
      if (options.flatten !== undefined && options.flatten !== false && Array.isArray(values)) {
        const depth = options.flatten === true ? 1 : options.flatten;
        values = flattenArray(values, depth);
      }
      if (options.wrap === false) {
        if (values.length === 0) {
          return undefined;
        }
        if (values.length === 1) {
          return values[0];
        }
      }
      return values;
    }
  }

  const contexts = compiled(options.json, options);
  if (options.resultType === "parentChain") {
    attachParentChains(contexts, options.json, options.maxParentChainDepth);
  }
  if (resultType === "value" && !options.callback) {
    let values = contexts.map((context) => context.value);
    if (options.flatten !== undefined && options.flatten !== false && Array.isArray(values)) {
      const depth = options.flatten === true ? 1 : options.flatten;
      values = flattenArray(values, depth);
    }
    if (options.wrap === false) {
      if (values.length === 0) {
        return undefined;
      }
      if (values.length === 1) {
        return values[0];
      }
    }
    return values;
  }

  const payloads = contexts.map((context) => buildPayload(context));

  if (options.callback) {
    payloads.forEach((payload, index) => {
      const type: CallbackType = contexts[index]?.payloadType ?? "value";
      const value = options.callback?.(payload.value, type, payload);
      if (value !== undefined) {
        payload.value = value;
      }
    });
  }

  const values = formatPayloads(payloads, resultType, options.flatten);
  if (options.wrap === false) {
    if (values.length === 0) {
      return undefined;
    }
    if (values.length === 1) {
      return values[0];
    }
  }
  return values;
}

function flattenArray(values: unknown[], depth: number): unknown[] {
  if (depth <= 0) {
    return values;
  }
  const flattened: unknown[] = [];
  for (const value of values) {
    if (Array.isArray(value)) {
      flattened.push(...flattenArray(value, depth - 1));
    } else {
      flattened.push(value);
    }
  }
  return flattened;
}
