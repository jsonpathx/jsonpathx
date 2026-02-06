export type PathKey = string | number;

export type EvalContext = {
  value: unknown;
  path: PathKey[];
  parent?: unknown;
  parentProperty?: PathKey;
};

export function createRootContext(value: unknown): EvalContext {
  return { value, path: [] };
}

export function createChildContext(parentContext: EvalContext, key: PathKey, value: unknown): EvalContext {
  return {
    value,
    path: parentContext.path.concat(key),
    parent: parentContext.value,
    parentProperty: key
  };
}
