import type { QueryOptions } from "../evaluator/index.js";
export type StreamingOptions = QueryOptions & {
    chunkSize?: number;
    incremental?: boolean;
};
export type StreamingResult<T = unknown> = {
    value: T;
    index: number;
    path: string;
    processed: number;
};
export declare function streamArray<T = unknown>(array: unknown[], queryPath: string, options?: StreamingOptions): AsyncGenerator<StreamingResult<T>, void, unknown>;
export declare function streamArrayBatched<T = unknown>(array: unknown[], queryPath: string, options?: StreamingOptions & {
    batchSize?: number;
}): AsyncGenerator<StreamingResult<T>[], void, unknown>;
export declare function countMatches(array: unknown[], queryPath: string, predicate?: (value: unknown) => boolean, options?: StreamingOptions): Promise<number>;
export declare function findFirst<T = unknown>(array: unknown[], queryPath: string, predicate?: (value: unknown) => boolean, options?: StreamingOptions): Promise<T | undefined>;
export declare function streamArrayFile<T = unknown>(filePath: string, queryPath: string, options?: StreamingOptions): AsyncGenerator<StreamingResult<T>, void, unknown>;
