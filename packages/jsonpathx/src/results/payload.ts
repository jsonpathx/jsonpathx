import type { EvalContext } from "../evaluator/context.js";
import { toPathString, toPointer } from "./path.js";

export type ResultPayload = {
  value: unknown;
  path: string;
  pointer: string;
  parent: unknown;
  parentProperty: string | number | undefined;
  parentChain?: { property: string | number; parent: unknown }[];
};

export type AllTypesResult = ResultPayload[];

export function buildPayload(context: EvalContext): ResultPayload {
  return {
    value: context.value,
    path: toPathString(context.path),
    pointer: toPointer(context.path),
    parent: context.parent,
    parentProperty: context.parentProperty,
    parentChain: context.parentChain
  };
}
