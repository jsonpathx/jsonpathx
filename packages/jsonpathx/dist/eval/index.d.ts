import type { EvalContext } from "../evaluator/context.js";
export type EvalMode = false | "native" | "safe";
export type EvalPolicy = {
    eval?: EvalMode;
    preventEval?: boolean;
    sandbox?: Record<string, unknown>;
    ignoreEvalErrors?: boolean;
};
export declare function evaluateExpression(expression: string, context: EvalContext, root: unknown, policy: EvalPolicy): unknown;
