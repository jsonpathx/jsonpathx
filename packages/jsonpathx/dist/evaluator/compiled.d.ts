import type { PathNode } from "../ast/nodes.js";
import { type EvalContext } from "./context.js";
import type { EvalOptions } from "./evaluate.js";
export type CompiledPath = (json: unknown, options: EvalOptions) => EvalContext[];
export declare function compilePath(ast: PathNode): CompiledPath;
