import type { EvalContext } from "../evaluator/context.js";
import { buildPayload, type ResultPayload } from "./payload.js";

export type ResultType =
  | "value"
  | "path"
  | "pointer"
  | "parent"
  | "parentProperty"
  | "parentChain"
  | "all";

export function formatResults(
  contexts: EvalContext[],
  resultType: ResultType,
  flatten?: boolean | number
): unknown[] {
  const payloads = contexts.map((context) => buildPayload(context));
  return formatPayloads(payloads, resultType, flatten);
}

export function formatPayloads(
  payloads: ResultPayload[],
  resultType: ResultType,
  flatten?: boolean | number
): unknown[] {
  let result: unknown[];
  switch (resultType) {
    case "value":
      result = payloads.map((payload) => payload.value);
      break;
    case "path":
      result = payloads.map((payload) => payload.path);
      break;
    case "pointer":
      result = payloads.map((payload) => payload.pointer);
      break;
    case "parent":
      result = payloads.map((payload) => payload.parent);
      break;
    case "parentProperty":
      result = payloads.map((payload) => payload.parentProperty);
      break;
    case "parentChain":
      result = payloads.map((payload) => payload.parentChain ?? []);
      break;
    case "all":
      result = payloads as unknown[];
      break;
    default:
      result = payloads.map((payload) => payload.value);
  }

  if (flatten !== undefined && flatten !== false && Array.isArray(result)) {
    const depth = flatten === true ? 1 : flatten;
    result = flattenArray(result, depth);
  }

  return result;
}

function flattenArray(values: unknown[], depth: number): unknown[] {
  if (depth <= 0) {
    return values;
  }
  const flattened: unknown[] = [];
  for (const value of values) {
    if (Array.isArray(value)) {
      flattened.push(...flattenArray(value, depth - 1));
    } else {
      flattened.push(value);
    }
  }
  return flattened;
}

export type { ResultPayload } from "./payload.js";
