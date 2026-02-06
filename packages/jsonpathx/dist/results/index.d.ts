import type { EvalContext } from "../evaluator/context.js";
import { type ResultPayload } from "./payload.js";
export type ResultType = "value" | "path" | "pointer" | "parent" | "parentProperty" | "parentChain" | "all";
export declare function formatResults(contexts: EvalContext[], resultType: ResultType, flatten?: boolean | number): unknown[];
export declare function formatPayloads(payloads: ResultPayload[], resultType: ResultType, flatten?: boolean | number): unknown[];
export type { ResultPayload } from "./payload.js";
