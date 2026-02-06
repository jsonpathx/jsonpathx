import type { SelectorNode } from "../ast/nodes.js";
import type { EvalContext } from "./context.js";
export declare function applySelector(context: EvalContext, selector: SelectorNode): EvalContext[];
