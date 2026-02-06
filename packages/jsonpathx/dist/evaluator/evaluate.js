import { createRootContext } from "./context.js";
import { collectDescendants } from "./recursive.js";
import { applySelector } from "./selectors.js";
import { matchesTypeSelector } from "./types.js";
import { evaluateExpression } from "../eval/index.js";
export function evaluatePath(ast, json, options = {}) {
    if (ast.type === "UnionPath") {
        return ast.paths.flatMap((path) => evaluatePath(path, json, options));
    }
    const root = json;
    let contexts = [createRootContext(json, options.parent, options.parentProperty)];
    for (const segment of ast.segments) {
        contexts = applySegment(segment, contexts, options, root);
        if (contexts.length === 0) {
            break;
        }
    }
    return contexts;
}
function applySegment(segment, contexts, options, root) {
    switch (segment.type) {
        case "Root":
            return contexts.map(() => createRootContext(root));
        case "Current":
            return contexts;
        case "Child":
            return contexts.flatMap((context) => applySelector(context, segment.selector));
        case "Recursive":
            return applyRecursive(segment, contexts);
        case "Filter":
            return applyFilter(segment, contexts, options, root);
        case "Script":
            return applyScript(segment, contexts, options, root);
        case "Parent":
            return applyParent(contexts);
        case "PropertyName":
            return applyPropertyName(contexts);
        case "TypeSelector":
            return applyTypeSelector(segment, contexts);
        default:
            return contexts;
    }
}
function applyRecursive(segment, contexts) {
    const descendants = contexts.flatMap((context) => collectDescendants(context));
    const selector = segment.selector;
    if (!selector) {
        return descendants;
    }
    return descendants.flatMap((context) => applySelector(context, selector));
}
function applyFilter(segment, contexts, options, root) {
    return contexts.flatMap((context) => {
        if (options.filterMode === "xpath") {
            try {
                return evaluateExpression(segment.expression, context, root, options) ? [context] : [];
            }
            catch (error) {
                if (options.ignoreEvalErrors) {
                    return [];
                }
                throw error;
            }
        }
        const targets = expandFilterTargets(context);
        const matches = [];
        for (const target of targets) {
            try {
                if (evaluateExpression(segment.expression, target, root, options)) {
                    matches.push(target);
                }
            }
            catch (error) {
                if (options.ignoreEvalErrors) {
                    continue;
                }
                throw error;
            }
        }
        return matches;
    });
}
function applyScript(segment, contexts, options, root) {
    return contexts.flatMap((context) => {
        let result;
        try {
            result = evaluateExpression(segment.expression, context, root, options);
        }
        catch (error) {
            if (options.ignoreEvalErrors) {
                return [];
            }
            throw error;
        }
        if (typeof result === "number") {
            return applySelector(context, { type: "IndexSelector", index: result });
        }
        if (typeof result === "string") {
            return applySelector(context, { type: "IdentifierSelector", name: result, quoted: false, escaped: false });
        }
        return [];
    });
}
function applyParent(contexts) {
    return contexts.flatMap((context) => {
        if (context.parent === undefined || context.parentProperty === undefined) {
            return [];
        }
        const path = context.path.slice(0, -1);
        const parentContext = {
            value: context.parent,
            path,
            parent: undefined,
            parentProperty: undefined
        };
        return [parentContext];
    });
}
function applyPropertyName(contexts) {
    return contexts.flatMap((context) => {
        if (context.parentProperty !== undefined) {
            return [
                {
                    value: String(context.parentProperty),
                    path: context.path,
                    parent: context.parent,
                    parentProperty: context.parentProperty,
                    payloadType: "property"
                }
            ];
        }
        const value = context.value;
        if (value == null || (typeof value !== "object" && !Array.isArray(value))) {
            return [];
        }
        const keys = Object.keys(value);
        return keys.map((key) => ({
            value: key,
            path: context.path.concat(key),
            parent: context.value,
            parentProperty: key,
            payloadType: "property"
        }));
    });
}
function applyTypeSelector(segment, contexts) {
    return contexts.filter((context) => matchesTypeSelector(context.value, segment.name));
}
function expandFilterTargets(context) {
    const value = context.value;
    if (Array.isArray(value)) {
        return value.map((entry, index) => ({
            value: entry,
            path: context.path.concat(index),
            parent: context.value,
            parentProperty: index
        }));
    }
    if (value && typeof value === "object") {
        return Object.keys(value).map((key) => ({
            value: value[key],
            path: context.path.concat(key),
            parent: context.value,
            parentProperty: key
        }));
    }
    return [context];
}
