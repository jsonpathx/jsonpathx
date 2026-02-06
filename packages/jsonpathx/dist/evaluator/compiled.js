import { createChildContext, createRootContext } from "./context.js";
import { collectDescendants } from "./recursive.js";
import { applySelector } from "./selectors.js";
import { matchesTypeSelector } from "./types.js";
import { evaluateExpression } from "../eval/index.js";
export function compilePath(ast) {
    if (ast.type === "UnionPath") {
        const compiledPaths = ast.paths.map((path) => compilePath(path));
        return (json, options) => compiledPaths.flatMap((compiled) => compiled(json, options));
    }
    const fastSelectors = getFastSelectors(ast);
    if (fastSelectors) {
        return (json) => executeFastSelectors(json, fastSelectors);
    }
    const runners = ast.segments.map((segment) => buildRunner(segment));
    return (json, options) => {
        const root = json;
        let contexts = [createRootContext(json, options.parent, options.parentProperty)];
        for (const run of runners) {
            contexts = run(contexts, options, root);
            if (contexts.length === 0) {
                break;
            }
        }
        return contexts;
    };
}
function getFastSelectors(ast) {
    const selectors = [];
    for (const segment of ast.segments) {
        if (segment.type === "Root" || segment.type === "Current") {
            continue;
        }
        if (segment.type !== "Child") {
            return null;
        }
        const selector = segment.selector;
        if (selector.type === "IdentifierSelector") {
            selectors.push({ type: "Identifier", name: selector.name });
            continue;
        }
        if (selector.type === "IndexSelector") {
            selectors.push({ type: "Index", index: selector.index });
            continue;
        }
        return null;
    }
    return selectors.length === 0 ? null : selectors;
}
function executeFastSelectors(json, selectors) {
    let context = createRootContext(json);
    for (const selector of selectors) {
        const value = context.value;
        if (selector.type === "Identifier") {
            if (!value || typeof value !== "object") {
                return [];
            }
            const record = value;
            if (!Object.prototype.hasOwnProperty.call(record, selector.name)) {
                return [];
            }
            context = createChildContext(context, selector.name, record[selector.name]);
            continue;
        }
        if (!Array.isArray(value)) {
            return [];
        }
        const index = selector.index < 0 ? value.length + selector.index : selector.index;
        if (index < 0 || index >= value.length) {
            return [];
        }
        context = createChildContext(context, index, value[index]);
    }
    return [context];
}
function buildRunner(segment) {
    switch (segment.type) {
        case "Root":
            return (_contexts, options, root) => [createRootContext(root, options.parent, options.parentProperty)];
        case "Current":
            return (contexts) => contexts;
        case "Child":
            return (contexts) => contexts.flatMap((context) => applySelector(context, segment.selector));
        case "Recursive":
            return buildRecursiveRunner(segment);
        case "Filter":
            return buildFilterRunner(segment);
        case "Script":
            return buildScriptRunner(segment);
        case "Parent":
            return (contexts) => applyParent(contexts);
        case "PropertyName":
            return (contexts) => applyPropertyName(contexts);
        case "TypeSelector":
            return (contexts) => applyTypeSelector(segment, contexts);
        default:
            return (contexts) => contexts;
    }
}
function buildRecursiveRunner(segment) {
    if (!segment.selector) {
        return (contexts) => contexts.flatMap((context) => collectDescendants(context));
    }
    return (contexts) => contexts
        .flatMap((context) => collectDescendants(context))
        .flatMap((context) => applySelector(context, segment.selector));
}
function buildFilterRunner(segment) {
    return (contexts, options, root) => contexts.flatMap((context) => {
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
function buildScriptRunner(segment) {
    return (contexts, options, root) => contexts.flatMap((context) => {
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
        return [
            {
                value: context.parent,
                path,
                parent: undefined,
                parentProperty: undefined,
                payloadType: "value"
            }
        ];
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
            parentProperty: index,
            payloadType: "value"
        }));
    }
    if (value && typeof value === "object") {
        return Object.keys(value).map((key) => ({
            value: value[key],
            path: context.path.concat(key),
            parent: context.value,
            parentProperty: key,
            payloadType: "value"
        }));
    }
    return [context];
}
