import { query, querySync } from "../evaluator/index.js";
import { JSONPathQuery } from "./query-instance.js";
export class QueryBuilder {
    data;
    path;
    options = {};
    filterFn;
    mapFn;
    sortFn;
    takeCount;
    skipCount;
    dedup = false;
    uniqueKeyFn;
    flattenDepth;
    constructor(data) {
        this.data = data;
    }
    query(path) {
        this.path = path;
        return this;
    }
    withOptions(options) {
        this.options = { ...this.options, ...options };
        return this;
    }
    resultType(type) {
        this.options.resultType = type;
        return this;
    }
    wrapped(enabled = true) {
        this.options.wrap = enabled;
        return this;
    }
    cached(enabled = true) {
        this.options.enableCache = enabled;
        return this;
    }
    withParent(parent, parentProperty) {
        this.options.parent = parent;
        this.options.parentProperty = parentProperty;
        return this;
    }
    filter(fn) {
        this.filterFn = fn;
        return this;
    }
    map(fn) {
        this.mapFn = fn;
        return this;
    }
    sort(fn) {
        this.sortFn = fn;
        return this;
    }
    take(count) {
        this.takeCount = count;
        return this;
    }
    skip(count) {
        this.skipCount = count;
        return this;
    }
    deduplicate() {
        this.dedup = true;
        return this;
    }
    unique(keyFn) {
        this.dedup = true;
        if (keyFn) {
            this.uniqueKeyFn = keyFn;
        }
        return this;
    }
    flatten(depth = 1) {
        this.flattenDepth = depth;
        return this;
    }
    autostart(value) {
        this.options.autostart = value;
        return this;
    }
    async execute() {
        if (!this.path) {
            throw new Error("Query path is required");
        }
        const results = await query(this.path, this.data, this.options);
        const array = Array.isArray(results) ? results : [results];
        return this.postProcess(array);
    }
    executeSync() {
        if (!this.path) {
            throw new Error("Query path is required");
        }
        const results = querySync(this.path, this.data, this.options);
        const array = Array.isArray(results) ? results : [results];
        return this.postProcess(array);
    }
    build() {
        if (!this.path) {
            throw new Error("Query path is required");
        }
        return new JSONPathQuery(this.path, this.options);
    }
    postProcess(values) {
        let results = values;
        if (this.filterFn) {
            results = results.filter(this.filterFn);
        }
        if (this.mapFn) {
            results = results.map(this.mapFn);
        }
        if (this.sortFn) {
            results = [...results].sort(this.sortFn);
        }
        if (this.skipCount) {
            results = results.slice(this.skipCount);
        }
        if (this.takeCount !== undefined) {
            results = results.slice(0, this.takeCount);
        }
        if (this.dedup) {
            const seen = new Set();
            results = results.filter((item) => {
                const value = this.uniqueKeyFn ? this.uniqueKeyFn(item) : item;
                let key;
                try {
                    key = JSON.stringify(value);
                }
                catch {
                    key = String(value);
                }
                if (seen.has(key)) {
                    return false;
                }
                seen.add(key);
                return true;
            });
        }
        if (this.flattenDepth !== undefined) {
            results = flattenValues(results, this.flattenDepth);
        }
        return results;
    }
    async exists() {
        const results = await this.execute();
        return results.length > 0;
    }
    async every(predicate) {
        const results = await this.execute();
        return results.every(predicate);
    }
    async some(predicate) {
        const results = await this.execute();
        return results.some(predicate);
    }
    async find(predicate) {
        const results = await this.execute();
        return results.find(predicate);
    }
    async reduce(reducer, initial) {
        const results = await this.execute();
        return results.reduce(reducer, initial);
    }
    async groupBy(keyFn) {
        const results = await this.execute();
        return results.reduce((acc, value) => {
            const key = String(keyFn(value));
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(value);
            return acc;
        }, {});
    }
    async partition(predicate) {
        const results = await this.execute();
        const truthy = [];
        const falsy = [];
        for (const value of results) {
            if (predicate(value)) {
                truthy.push(value);
            }
            else {
                falsy.push(value);
            }
        }
        return [truthy, falsy];
    }
    async stats() {
        const results = await this.execute();
        const numeric = results.filter((value) => typeof value === "number");
        const count = numeric.length;
        const sum = numeric.reduce((acc, value) => acc + value, 0);
        const min = count > 0 ? Math.min(...numeric) : undefined;
        const max = count > 0 ? Math.max(...numeric) : undefined;
        const avg = count > 0 ? sum / count : undefined;
        return { count, min, max, sum, avg };
    }
    async first() {
        const results = await this.take(1).execute();
        return results[0];
    }
    async last() {
        const results = await this.execute();
        return results[results.length - 1];
    }
    async count() {
        const results = await this.execute();
        return results.length;
    }
}
export function createQueryBuilder(data) {
    return new QueryBuilder(data);
}
function flattenValues(values, depth) {
    if (depth <= 0) {
        return values;
    }
    const flattened = [];
    for (const value of values) {
        if (Array.isArray(value)) {
            flattened.push(...flattenValues(value, depth - 1));
        }
        else {
            flattened.push(value);
        }
    }
    return flattened;
}
