import type { QueryOptions } from "../evaluator/index.js";
import { query, querySync } from "../evaluator/index.js";
import { JSONPathQuery } from "./query-instance.js";

export class QueryBuilder<T = unknown> {
  private data: unknown;
  private path?: string;
  private options: QueryOptions & { autostart?: boolean } = {};
  private filterFn?: (value: unknown) => boolean;
  private mapFn?: (value: unknown) => unknown;
  private sortFn?: (a: unknown, b: unknown) => number;
  private takeCount?: number;
  private skipCount?: number;
  private dedup = false;
  private uniqueKeyFn?: (value: T) => unknown;
  private flattenDepth?: number;

  constructor(data: unknown) {
    this.data = data;
  }

  query(path: string): this {
    this.path = path;
    return this;
  }

  withOptions(options: QueryOptions): this {
    this.options = { ...this.options, ...options };
    return this;
  }

  resultType(type: QueryOptions["resultType"]): this {
    this.options.resultType = type;
    return this;
  }

  wrapped(enabled = true): this {
    this.options.wrap = enabled;
    return this;
  }

  cached(enabled = true): this {
    this.options.enableCache = enabled;
    return this;
  }

  withParent(parent: unknown, parentProperty?: string | number): this {
    this.options.parent = parent;
    this.options.parentProperty = parentProperty;
    return this;
  }

  filter(fn: (value: unknown) => boolean): this {
    this.filterFn = fn;
    return this;
  }

  map(fn: (value: unknown) => unknown): this {
    this.mapFn = fn;
    return this;
  }

  sort(fn: (a: unknown, b: unknown) => number): this {
    this.sortFn = fn;
    return this;
  }

  take(count: number): this {
    this.takeCount = count;
    return this;
  }

  skip(count: number): this {
    this.skipCount = count;
    return this;
  }

  deduplicate(): this {
    this.dedup = true;
    return this;
  }

  unique(keyFn?: (value: T) => unknown): this {
    this.dedup = true;
    if (keyFn) {
      this.uniqueKeyFn = keyFn;
    }
    return this;
  }

  flatten(depth = 1): this {
    this.flattenDepth = depth;
    return this;
  }

  autostart(value: boolean): this {
    this.options.autostart = value;
    return this;
  }

  async execute(): Promise<T[]> {
    if (!this.path) {
      throw new Error("Query path is required");
    }
    const results = await query(this.path, this.data, this.options);
    const array = Array.isArray(results) ? results : [results];
    return this.postProcess(array as T[]);
  }

  executeSync(): T[] {
    if (!this.path) {
      throw new Error("Query path is required");
    }
    const results = querySync(this.path, this.data, this.options);
    const array = Array.isArray(results) ? results : [results];
    return this.postProcess(array as T[]);
  }

  build(): JSONPathQuery {
    if (!this.path) {
      throw new Error("Query path is required");
    }
    return new JSONPathQuery(this.path, this.options);
  }

  private postProcess(values: T[]): T[] {
    let results = values;
    if (this.filterFn) {
      results = results.filter(this.filterFn);
    }
    if (this.mapFn) {
      results = results.map(this.mapFn as (value: T) => T);
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
      const seen = new Set<string>();
      results = results.filter((item) => {
        const value = this.uniqueKeyFn ? this.uniqueKeyFn(item) : item;
        let key: string;
        try {
          key = JSON.stringify(value);
        } catch {
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
      results = flattenValues(results, this.flattenDepth) as T[];
    }
    return results;
  }

  async exists(): Promise<boolean> {
    const results = await this.execute();
    return results.length > 0;
  }

  async every(predicate: (value: T) => boolean): Promise<boolean> {
    const results = await this.execute();
    return results.every(predicate);
  }

  async some(predicate: (value: T) => boolean): Promise<boolean> {
    const results = await this.execute();
    return results.some(predicate);
  }

  async find(predicate: (value: T) => boolean): Promise<T | undefined> {
    const results = await this.execute();
    return results.find(predicate);
  }

  async reduce<R>(reducer: (acc: R, value: T) => R, initial: R): Promise<R> {
    const results = await this.execute();
    return results.reduce(reducer, initial);
  }

  async groupBy<K extends string | number | symbol>(
    keyFn: (value: T) => K
  ): Promise<Record<string, T[]>> {
    const results = await this.execute();
    return results.reduce<Record<string, T[]>>((acc, value) => {
      const key = String(keyFn(value));
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(value);
      return acc;
    }, {});
  }

  async partition(predicate: (value: T) => boolean): Promise<[T[], T[]]> {
    const results = await this.execute();
    const truthy: T[] = [];
    const falsy: T[] = [];
    for (const value of results) {
      if (predicate(value)) {
        truthy.push(value);
      } else {
        falsy.push(value);
      }
    }
    return [truthy, falsy];
  }

  async stats(): Promise<{
    count: number;
    min?: number;
    max?: number;
    sum: number;
    avg?: number;
  }> {
    const results = await this.execute();
    const numeric = results.filter((value): value is number => typeof value === "number");
    const count = numeric.length;
    const sum = numeric.reduce((acc, value) => acc + value, 0);
    const min = count > 0 ? Math.min(...numeric) : undefined;
    const max = count > 0 ? Math.max(...numeric) : undefined;
    const avg = count > 0 ? sum / count : undefined;
    return { count, min, max, sum, avg };
  }

  async first(): Promise<T | undefined> {
    const results = await this.take(1).execute();
    return results[0];
  }

  async last(): Promise<T | undefined> {
    const results = await this.execute();
    return results[results.length - 1];
  }

  async count(): Promise<number> {
    const results = await this.execute();
    return results.length;
  }
}

export function createQueryBuilder<T = unknown>(data: unknown): QueryBuilder<T> {
  return new QueryBuilder<T>(data);
}

function flattenValues(values: unknown[], depth: number): unknown[] {
  if (depth <= 0) {
    return values;
  }
  const flattened: unknown[] = [];
  for (const value of values) {
    if (Array.isArray(value)) {
      flattened.push(...flattenValues(value, depth - 1));
    } else {
      flattened.push(value);
    }
  }
  return flattened;
}
