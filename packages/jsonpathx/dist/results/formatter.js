import { formatPayloads } from "./index.js";
export class ResultFormatter {
    static format(result, options = {}) {
        if (isAllTypesResult(result)) {
            const resultType = options.resultType ?? "value";
            return formatPayloads(result, resultType, options.flatten);
        }
        if (Array.isArray(result) && options.flatten) {
            const depth = options.flatten === true ? 1 : options.flatten;
            return flattenArray(result, depth);
        }
        return result;
    }
    static formatValues(values, options = {}) {
        if (options.flatten) {
            const depth = options.flatten === true ? 1 : options.flatten;
            return flattenArray(values, depth);
        }
        return values;
    }
}
export function isAllTypesResult(result) {
    if (!Array.isArray(result)) {
        return false;
    }
    return result.every((entry) => entry &&
        typeof entry === "object" &&
        "value" in entry &&
        "path" in entry &&
        "pointer" in entry &&
        "parent" in entry &&
        "parentProperty" in entry);
}
function flattenArray(values, depth) {
    if (depth <= 0) {
        return values;
    }
    const flattened = [];
    for (const value of values) {
        if (Array.isArray(value)) {
            flattened.push(...flattenArray(value, depth - 1));
        }
        else {
            flattened.push(value);
        }
    }
    return flattened;
}
