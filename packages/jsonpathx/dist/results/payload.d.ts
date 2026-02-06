import type { EvalContext } from "../evaluator/context.js";
export type ResultPayload = {
    value: unknown;
    path: string;
    pointer: string;
    parent: unknown;
    parentProperty: string | number | undefined;
    parentChain?: {
        property: string | number;
        parent: unknown;
    }[];
};
export type AllTypesResult = ResultPayload[];
export declare function buildPayload(context: EvalContext): ResultPayload;
