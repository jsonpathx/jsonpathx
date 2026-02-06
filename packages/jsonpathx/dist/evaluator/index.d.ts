import { type ResultType } from "../results/index.js";
import type { EvalOptions } from "./evaluate.js";
import { type ResultPayload } from "../results/payload.js";
import { JSONPathQuery } from "../core/query-instance.js";
export type CallbackType = "value" | "property";
export type CallbackFunction = (value: unknown, type: CallbackType, payload: ResultPayload) => unknown | void;
export type FilterMode = "jsonpath" | "xpath";
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
export type QueryConfig = QueryOptions & {
    path: string;
    json?: unknown;
    autostart?: boolean;
};
export declare function query<T = unknown>(pathOrConfig: string | QueryConfig, data?: unknown, options?: QueryOptions): Promise<T[] | JSONPathQuery>;
export declare function querySync<T = unknown>(path: string, data: unknown, options?: QueryOptions): T[];
export declare function JSONPath(options: JSONPathOptions): unknown;
