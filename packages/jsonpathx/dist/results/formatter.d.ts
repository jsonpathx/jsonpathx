import type { QueryOptions } from "../evaluator/index.js";
import type { ResultPayload } from "./payload.js";
export declare class ResultFormatter {
    static format(result: unknown, options?: QueryOptions): unknown;
    static formatValues(values: unknown[], options?: QueryOptions): unknown[];
}
export declare function isAllTypesResult(result: unknown): result is ResultPayload[];
