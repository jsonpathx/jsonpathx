import { parsePath } from "../parser/index.js";
import { evaluatePath, type EvalOptions } from "./evaluate.js";
import { formatResults, type ResultType } from "../results/index.js";

export type JSONPathOptions = EvalOptions & {
  path: string;
  json: unknown;
  wrap?: boolean;
  resultType?: ResultType;
};

export function JSONPath(options: JSONPathOptions): unknown {
  const ast = parsePath(options.path);
  const contexts = evaluatePath(ast, options.json, options);
  const resultType = options.resultType ?? "value";
  const values = formatResults(contexts, resultType);
  if (options.wrap === false) {
    if (values.length === 0) {
      return undefined;
    }
    if (values.length === 1) {
      return values[0];
    }
  }
  return values;
}
