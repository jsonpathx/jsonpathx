import type { EvalContext } from "../evaluator/context.js";
import { buildPayload, type ResultPayload } from "./payload.js";

export type ResultType = "value" | "path" | "pointer" | "parent" | "parentProperty" | "all";

export function formatResults(contexts: EvalContext[], resultType: ResultType): unknown[] {
  const payloads = contexts.map((context) => buildPayload(context));
  switch (resultType) {
    case "value":
      return payloads.map((payload) => payload.value);
    case "path":
      return payloads.map((payload) => payload.path);
    case "pointer":
      return payloads.map((payload) => payload.pointer);
    case "parent":
      return payloads.map((payload) => payload.parent);
    case "parentProperty":
      return payloads.map((payload) => payload.parentProperty);
    case "all":
      return payloads;
    default:
      return payloads.map((payload) => payload.value);
  }
}

export type { ResultPayload } from "./payload.js";
