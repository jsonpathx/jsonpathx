import type { EvalContext } from "./context.js";
import { createChildContext } from "./context.js";

export function collectDescendants(context: EvalContext): EvalContext[] {
  const results: EvalContext[] = [];
  const stack: EvalContext[] = [context];
  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }
    results.push(current);
    const value = current.value;
    if (Array.isArray(value)) {
      for (let i = value.length - 1; i >= 0; i -= 1) {
        stack.push(createChildContext(current, i, value[i]));
      }
      continue;
    }
    if (value && typeof value === "object") {
      const keys = Object.keys(value as Record<string, unknown>);
      for (let i = keys.length - 1; i >= 0; i -= 1) {
        const key = keys[i];
        stack.push(createChildContext(current, key, (value as Record<string, unknown>)[key]));
      }
    }
  }
  return results;
}
