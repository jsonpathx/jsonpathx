import { parsePath, normalizePath } from "./parser/index.js";
export { parsePath } from "./parser/index.js";
export { normalizePath } from "./parser/index.js";
import { JSONPath as JSONPathFn, query, querySync } from "./evaluator/index.js";
export { query, querySync } from "./evaluator/index.js";
export { JSONPathQuery } from "./core/query-instance.js";
import { createQueryBuilder } from "./core/builder.js";
export { QueryBuilder, createQueryBuilder } from "./core/builder.js";
import { enableGlobalCache, disableGlobalCache, clearGlobalCache, getGlobalCacheStats } from "./core/cache.js";
export { QueryCache, getGlobalCache, resetGlobalCache } from "./core/cache.js";
export { streamArray, streamArrayBatched, streamArrayFile, countMatches, findFirst } from "./core/streaming.js";
export { ResultFormatter, isAllTypesResult } from "./results/formatter.js";
export { set, update, deleteAtPath, insert, push, unshift, merge, increment, decrement, toggle } from "./core/mutation.js";
export { ParentChainTracker, buildParentChain, getParentAtLevel, navigateUp, getAncestors, getPropertyPath } from "./core/parent-chain.js";
import { toPathArray, toPathString, toPointer, fromPointer, fromPointerArray, isValidPath, normalize, parse as parsePathComponents, stringify as stringifyPath, build as buildPath, parent as parentPath, append as appendPath, isPointer, equals as pathEquals, startsWith as pathStartsWith, contains as pathContains } from "./path-utils.js";
export { toPathArray, toPathString, toPointer, fromPointer, fromPointerArray, isValidPath, normalize, parse as parsePathComponents, stringify as stringifyPath, build as buildPath, parent as parentPath, append as appendPath, isPointer, equals as pathEquals, startsWith as pathStartsWith, contains as pathContains } from "./path-utils.js";
let initialized = false;
async function init() {
    initialized = true;
}
function isInitialized() {
    return initialized;
}
function create(data) {
    return createQueryBuilder(data);
}
function parse(path) {
    return parsePath(path);
}
async function paths(path, data) {
    return query(path, data, { resultType: "path" });
}
async function pointers(path, data) {
    return query(path, data, { resultType: "pointer" });
}
async function parents(path, data) {
    return query(path, data, { resultType: "parent" });
}
async function parentProperties(path, data) {
    return query(path, data, { resultType: "parentProperty" });
}
const JSONPath = Object.assign(JSONPathFn, {
    query,
    querySync,
    paths,
    pointers,
    parents,
    parentProperties,
    init,
    isInitialized,
    create,
    parse,
    enableCache: enableGlobalCache,
    disableCache: disableGlobalCache,
    clearCache: clearGlobalCache,
    getCacheStats: getGlobalCacheStats,
    toPathArray,
    toPathString,
    toPointer,
    fromPointer,
    normalizePath,
    isValidPath
});
export { JSONPath };
export const PathUtils = {
    toPathArray,
    toPathString,
    toPointer,
    fromPointer,
    fromPointerArray,
    normalizePath,
    isValidPath,
    normalize,
    parse: parsePathComponents,
    stringify: stringifyPath,
    build: buildPath,
    parent: parentPath,
    append: appendPath,
    isPointer,
    equals: pathEquals,
    startsWith: pathStartsWith,
    contains: pathContains
};
