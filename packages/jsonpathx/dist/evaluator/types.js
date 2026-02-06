export function matchesTypeSelector(value, name) {
    switch (name) {
        case "null":
            return value === null;
        case "boolean":
            return typeof value === "boolean";
        case "number":
            return typeof value === "number" && Number.isFinite(value);
        case "string":
            return typeof value === "string";
        case "array":
            return Array.isArray(value);
        case "object":
            return value !== null && typeof value === "object" && !Array.isArray(value);
        case "integer":
            return typeof value === "number" && Number.isInteger(value);
        case "scalar":
            return (value === null ||
                typeof value === "boolean" ||
                typeof value === "number" ||
                typeof value === "string" ||
                typeof value === "undefined" ||
                (typeof value === "number" && !Number.isFinite(value)));
        case "undefined":
            return typeof value === "undefined";
        case "function":
            return typeof value === "function";
        case "nonFinite":
            return typeof value === "number" && !Number.isFinite(value);
        case "other":
            return false;
        default:
            return false;
    }
}
