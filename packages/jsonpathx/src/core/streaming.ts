import type { QueryOptions } from "../evaluator/index.js";
import { query } from "../evaluator/index.js";

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

export async function* streamArray<T = unknown>(
  array: unknown[],
  queryPath: string,
  options?: StreamingOptions
): AsyncGenerator<StreamingResult<T>, void, unknown> {
  let processed = 0;
  for (let i = 0; i < array.length; i += 1) {
    const item = array[i];
    const results = await query(queryPath, item, options ?? {});
    const resultArray = Array.isArray(results) ? results : [results];
    for (const value of resultArray) {
      yield {
        value: value as T,
        index: i,
        path: `$[${i}]${queryPath.substring(1)}`,
        processed: ++processed
      };
    }
    if (i % 100 === 0) {
      await new Promise((resolve) => setImmediate(resolve));
    }
  }
}

export async function* streamArrayBatched<T = unknown>(
  array: unknown[],
  queryPath: string,
  options?: StreamingOptions & { batchSize?: number }
): AsyncGenerator<StreamingResult<T>[], void, unknown> {
  const batchSize = options?.batchSize ?? 100;
  let batch: StreamingResult<T>[] = [];
  for await (const result of streamArray<T>(array, queryPath, options)) {
    batch.push(result);
    if (batch.length >= batchSize) {
      yield batch;
      batch = [];
    }
  }
  if (batch.length > 0) {
    yield batch;
  }
}

export async function countMatches(
  array: unknown[],
  queryPath: string,
  predicate?: (value: unknown) => boolean,
  options?: StreamingOptions
): Promise<number> {
  let count = 0;
  for await (const result of streamArray(array, queryPath, options)) {
    if (!predicate || predicate(result.value)) {
      count += 1;
    }
  }
  return count;
}

export async function findFirst<T = unknown>(
  array: unknown[],
  queryPath: string,
  predicate?: (value: unknown) => boolean,
  options?: StreamingOptions
): Promise<T | undefined> {
  for await (const result of streamArray<T>(array, queryPath, options)) {
    if (!predicate || predicate(result.value)) {
      return result.value;
    }
  }
  return undefined;
}

export async function* streamArrayFile<T = unknown>(
  filePath: string,
  queryPath: string,
  options?: StreamingOptions
): AsyncGenerator<StreamingResult<T>, void, unknown> {
  if (typeof process === "undefined" || !process.versions?.node) {
    throw new Error("streamArrayFile is only available in Node.js");
  }
  const fs = await import("node:fs/promises");
  const content = await fs.readFile(filePath, "utf8");
  const data = JSON.parse(content);
  if (Array.isArray(data)) {
    yield* streamArray(data, queryPath, options);
    return;
  }
  throw new Error("File must contain a JSON array at root level");
}
