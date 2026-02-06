export type PathKey = string | number;

export type EvalContext = {
  value: unknown;
  path: PathKey[];
  parent?: unknown;
  parentProperty?: PathKey;
  payloadType?: "value" | "property";
  parentChain?: { property: string | number; parent: unknown }[];
};

export function createRootContext(
  value: unknown,
  parent?: unknown,
  parentProperty?: PathKey
): EvalContext {
  return {
    value,
    path: [],
    payloadType: "value",
    parent,
    parentProperty
  };
}

export function createChildContext(parentContext: EvalContext, key: PathKey, value: unknown): EvalContext {
  return {
    value,
    path: parentContext.path.concat(key),
    parent: parentContext.value,
    parentProperty: key,
    payloadType: "value"
  };
}
