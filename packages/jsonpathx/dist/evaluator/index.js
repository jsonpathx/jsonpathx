import { parsePath } from "../parser/index.js";
import { formatPayloads } from "../results/index.js";
import { compilePath } from "./compiled.js";
import { buildPayload } from "../results/payload.js";
import { JSONPathQuery } from "../core/query-instance.js";
import { QueryCache, getGlobalCache, isGlobalCacheEnabled } from "../core/cache.js";
const astCache = new Map();
const compiledCache = new Map();
export async function query(pathOrConfig, data, options = {}) {
    if (typeof pathOrConfig === "object" && pathOrConfig !== null) {
        const config = pathOrConfig;
        if (config.autostart === false) {
            return new JSONPathQuery(config.path, config);
        }
        if (config.json === undefined) {
            throw new Error('Config object requires "json" property when autostart is not false');
        }
        return querySync(config.path, config.json, config);
    }
    const path = pathOrConfig;
    if (data === undefined) {
        throw new Error("Data parameter is required when using path string signature");
    }
    return querySync(path, data, options);
}
export function querySync(path, data, options = {}) {
    const useCache = options.enableCache ?? isGlobalCacheEnabled();
    if (useCache) {
        const cache = getGlobalCache();
        const key = QueryCache.createKey(path, data);
        const cached = cache.get(key);
        if (cached) {
            return cached;
        }
        const result = JSONPath({ ...options, path, json: data });
        cache.set(key, result);
        return result;
    }
    return JSONPath({ ...options, path, json: data });
}
function getCompiled(path) {
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
function attachParentChains(contexts, root, maxDepth) {
    const limit = maxDepth ?? Infinity;
    for (const context of contexts) {
        const chain = [];
        const path = context.path;
        let currentParent = root;
        for (let i = 0; i < path.length && chain.length < limit; i += 1) {
            if (currentParent === undefined || currentParent === null) {
                break;
            }
            const key = path[i];
            chain.push({ property: key, parent: currentParent });
            currentParent = currentParent[key];
        }
        context.parentChain = chain;
    }
}
export function JSONPath(options) {
    const compiled = getCompiled(options.path);
    const contexts = compiled(options.json, options);
    if (options.resultType === "parentChain") {
        attachParentChains(contexts, options.json, options.maxParentChainDepth);
    }
    const payloads = contexts.map((context) => buildPayload(context));
    if (options.callback) {
        payloads.forEach((payload, index) => {
            const type = contexts[index]?.payloadType ?? "value";
            const value = options.callback?.(payload.value, type, payload);
            if (value !== undefined) {
                payload.value = value;
            }
        });
    }
    const resultType = options.resultType ?? "value";
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
