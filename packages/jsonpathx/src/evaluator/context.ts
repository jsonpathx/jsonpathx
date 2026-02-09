export type PathKey = string | number;

export type EvalContext = {
  value: unknown;
  path: PathKey[];
  parent?: unknown;
  parentProperty?: PathKey;
  payloadType?: "value" | "property";
  parentChain?: { property: string | number; parent: unknown }[];
  trackPath?: boolean;
};

const EMPTY_PATH: PathKey[] = [];

export function createRootContext(
  value: unknown,
  parent?: unknown,
  parentProperty?: PathKey,
  trackPath = true
): EvalContext {
  return {
    value,
    path: trackPath ? [] : EMPTY_PATH,
    payloadType: "value",
    parent,
    parentProperty,
    trackPath
  };
}

export function createChildContext(parentContext: EvalContext, key: PathKey, value: unknown): EvalContext {
  return {
    value,
    path: parentContext.trackPath === false ? parentContext.path : parentContext.path.concat(key),
    parent: parentContext.value,
    parentProperty: key,
    payloadType: "value",
    trackPath: parentContext.trackPath
  };
}
