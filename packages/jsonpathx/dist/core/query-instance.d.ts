import type { QueryOptions } from "../evaluator/index.js";
export declare class JSONPathQuery {
    private readonly path;
    private readonly options;
    constructor(path: string, options?: QueryOptions);
    evaluate(data: unknown): Promise<unknown[]>;
    evaluateSync(data: unknown): unknown[];
    withOptions(options: Partial<QueryOptions>): this;
    getPath(): string;
    getOptions(): Readonly<QueryOptions>;
}
