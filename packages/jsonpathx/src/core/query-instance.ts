import type { QueryOptions } from "../evaluator/index.js";
import { query, querySync } from "../evaluator/index.js";

export class JSONPathQuery {
  private readonly path: string;
  private readonly options: QueryOptions & { autostart?: boolean };

  constructor(path: string, options: QueryOptions = {}) {
    this.path = path;
    this.options = { ...options };
    delete this.options.autostart;
  }

  async evaluate(data: unknown): Promise<unknown[]> {
    const result = await query(this.path, data, this.options);
    return result as unknown[];
  }

  evaluateSync(data: unknown): unknown[] {
    return querySync(this.path, data, this.options) as unknown[];
  }

  withOptions(options: Partial<QueryOptions>): this {
    Object.assign(this.options, options);
    delete this.options.autostart;
    return this;
  }

  getPath(): string {
    return this.path;
  }

  getOptions(): Readonly<QueryOptions> {
    return { ...this.options };
  }
}
