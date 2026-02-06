import { parsePath, normalizePath } from "./parser/index.js";
export { parsePath } from "./parser/index.js";
export { normalizePath } from "./parser/index.js";
export type { PathNode, SegmentNode, SelectorNode } from "./ast/index.js";
import {
  JSONPath as JSONPathFn,
  query,
  querySync,
  type QueryConfig,
  type QueryOptions,
  type FilterMode
} from "./evaluator/index.js";
export { query, querySync, type QueryConfig, type QueryOptions, type FilterMode } from "./evaluator/index.js";
export { JSONPathQuery } from "./core/query-instance.js";
import { QueryBuilder, createQueryBuilder } from "./core/builder.js";
export { QueryBuilder, createQueryBuilder } from "./core/builder.js";
import {
  QueryCache,
  getGlobalCache,
  resetGlobalCache,
  enableGlobalCache,
  disableGlobalCache,
  clearGlobalCache,
  getGlobalCacheStats
} from "./core/cache.js";
export { QueryCache, getGlobalCache, resetGlobalCache } from "./core/cache.js";
export {
  streamArray,
  streamArrayBatched,
  streamArrayFile,
  countMatches,
  findFirst,
  type StreamingResult,
  type StreamingOptions
} from "./core/streaming.js";
export { ResultFormatter, isAllTypesResult } from "./results/formatter.js";
export type { ResultPayload, AllTypesResult } from "./results/payload.js";
export {
  set,
  update,
  deleteAtPath,
  insert,
  push,
  unshift,
  merge,
  increment,
  decrement,
  toggle,
  type MutationOptions,
  type MutationResult
} from "./core/mutation.js";
export {
  ParentChainTracker,
  buildParentChain,
  getParentAtLevel,
  navigateUp,
  getAncestors,
  getPropertyPath,
  type ParentChainEntry,
  type ParentChainResult,
  type ParentChainConfig
} from "./core/parent-chain.js";
import {
  toPathArray,
  toPathString,
  toPointer,
  fromPointer,
  fromPointerArray,
  isValidPath,
  normalize,
  parse as parsePathComponents,
  stringify as stringifyPath,
  build as buildPath,
  parent as parentPath,
  append as appendPath,
  isPointer,
  equals as pathEquals,
  startsWith as pathStartsWith,
  contains as pathContains
} from "./path-utils.js";
export {
  toPathArray,
  toPathString,
  toPointer,
  fromPointer,
  fromPointerArray,
  isValidPath,
  normalize,
  parse as parsePathComponents,
  stringify as stringifyPath,
  build as buildPath,
  parent as parentPath,
  append as appendPath,
  isPointer,
  equals as pathEquals,
  startsWith as pathStartsWith,
  contains as pathContains
} from "./path-utils.js";
export type { PathComponent, PathComponentType } from "./path-utils.js";

let initialized = false;

async function init(): Promise<void> {
  initialized = true;
}

function isInitialized(): boolean {
  return initialized;
}

function create<T = unknown>(data: unknown): QueryBuilder<T> {
  return createQueryBuilder<T>(data);
}

function parse(path: string) {
  return parsePath(path);
}

async function paths(path: string, data: unknown) {
  return query(path, data, { resultType: "path" });
}

async function pointers(path: string, data: unknown) {
  return query(path, data, { resultType: "pointer" });
}

async function parents(path: string, data: unknown) {
  return query(path, data, { resultType: "parent" });
}

async function parentProperties(path: string, data: unknown) {
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
