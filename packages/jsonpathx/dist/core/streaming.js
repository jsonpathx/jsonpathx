import { query } from "../evaluator/index.js";
export async function* streamArray(array, queryPath, options) {
    let processed = 0;
    for (let i = 0; i < array.length; i += 1) {
        const item = array[i];
        const results = await query(queryPath, item, options ?? {});
        const resultArray = Array.isArray(results) ? results : [results];
        for (const value of resultArray) {
            yield {
                value: value,
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
export async function* streamArrayBatched(array, queryPath, options) {
    const batchSize = options?.batchSize ?? 100;
    let batch = [];
    for await (const result of streamArray(array, queryPath, options)) {
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
export async function countMatches(array, queryPath, predicate, options) {
    let count = 0;
    for await (const result of streamArray(array, queryPath, options)) {
        if (!predicate || predicate(result.value)) {
            count += 1;
        }
    }
    return count;
}
export async function findFirst(array, queryPath, predicate, options) {
    for await (const result of streamArray(array, queryPath, options)) {
        if (!predicate || predicate(result.value)) {
            return result.value;
        }
    }
    return undefined;
}
export async function* streamArrayFile(filePath, queryPath, options) {
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
