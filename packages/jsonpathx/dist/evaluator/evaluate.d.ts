import type { PathNode } from "../ast/nodes.js";
import { type EvalContext, type PathKey } from "./context.js";
import { type EvalPolicy } from "../eval/index.js";
export type EvalOptions = EvalPolicy & {
    parent?: unknown;
    parentProperty?: PathKey;
    filterMode?: "jsonpath" | "xpath";
};
export declare function evaluatePath(ast: PathNode, json: unknown, options?: EvalOptions): EvalContext[];
