export type PathKey = string | number;
export type EvalContext = {
    value: unknown;
    path: PathKey[];
    parent?: unknown;
    parentProperty?: PathKey;
    payloadType?: "value" | "property";
    parentChain?: {
        property: string | number;
        parent: unknown;
    }[];
};
export declare function createRootContext(value: unknown, parent?: unknown, parentProperty?: PathKey): EvalContext;
export declare function createChildContext(parentContext: EvalContext, key: PathKey, value: unknown): EvalContext;
