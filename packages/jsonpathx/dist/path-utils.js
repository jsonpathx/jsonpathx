import { parsePath, normalizePath } from "./parser/index.js";
export function toPathArray(pathString) {
    if (!pathString || pathString === "$") {
        return ["$"];
    }
    const components = ["$"];
    let remaining = pathString.startsWith("$") ? pathString.slice(1) : pathString;
    while (remaining.length > 0) {
        if (remaining[0] === ".") {
            remaining = remaining.slice(1);
            if (remaining[0] === ".") {
                components.push("..");
                remaining = remaining.slice(1);
                continue;
            }
        }
        if (remaining[0] === "[") {
            const closeIndex = remaining.indexOf("]");
            if (closeIndex === -1) {
                throw new Error(`Invalid path: missing closing bracket in "${pathString}"`);
            }
            let content = remaining.slice(1, closeIndex);
            if ((content[0] === "\"" || content[0] === "'") && content[0] === content[content.length - 1]) {
                content = content.slice(1, -1);
            }
            const num = Number.parseInt(content, 10);
            components.push(Number.isNaN(num) ? content : num);
            remaining = remaining.slice(closeIndex + 1);
            continue;
        }
        const nextDot = remaining.indexOf(".");
        const nextBracket = remaining.indexOf("[");
        let endIndex;
        if (nextDot === -1 && nextBracket === -1) {
            endIndex = remaining.length;
        }
        else if (nextDot === -1) {
            endIndex = nextBracket;
        }
        else if (nextBracket === -1) {
            endIndex = nextDot;
        }
        else {
            endIndex = Math.min(nextDot, nextBracket);
        }
        if (endIndex > 0) {
            const component = remaining.slice(0, endIndex);
            if (component) {
                components.push(component);
            }
            remaining = remaining.slice(endIndex);
        }
        else {
            break;
        }
    }
    return components;
}
export function toPathString(pathArray) {
    if (!pathArray || pathArray.length === 0) {
        return "$";
    }
    let result = "";
    for (let i = 0; i < pathArray.length; i += 1) {
        const component = pathArray[i];
        if (i === 0) {
            result = component === "$" ? "$" : `$['${component}']`;
            continue;
        }
        if (component === "..") {
            result += "..";
            continue;
        }
        if (typeof component === "number") {
            result += `[${component}]`;
            continue;
        }
        if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(component)) {
            result += `.${component}`;
        }
        else {
            result += `['${component}']`;
        }
    }
    return result;
}
export function toPointer(path) {
    const pathArray = typeof path === "string" ? toSimplePathArray(path) : path;
    if (!pathArray || pathArray.length === 0) {
        return "";
    }
    const components = [];
    for (const component of pathArray) {
        if (component === "$" || component === "..") {
            continue;
        }
        const escaped = String(component).replace(/~/g, "~0").replace(/\//g, "~1");
        components.push(escaped);
    }
    return components.length ? `/${components.join("/")}` : "";
}
export function fromPointer(pointer) {
    return toPathString(fromPointerArray(pointer));
}
export function fromPointerArray(pointer) {
    if (!pointer || pointer === "") {
        return ["$"];
    }
    if (!isPointer(pointer)) {
        throw new Error(`Invalid JSON Pointer: "${pointer}"`);
    }
    const parts = pointer.split("/").slice(1).map((segment) => segment.replace(/~1/g, "/").replace(/~0/g, "~"));
    return ["$", ...parts.map((part) => (Number.isNaN(Number(part)) ? part : Number(part)))];
}
export function isValidPath(path) {
    try {
        parsePath(path);
        return true;
    }
    catch {
        return false;
    }
}
export function normalize(path) {
    const normalized = normalizePath(path);
    return normalized.length === 1 ? normalized[0] : normalized.join(" | ");
}
export function parse(path) {
    const ast = parsePath(path);
    return flattenComponents(ast);
}
export function stringify(components) {
    let result = "";
    for (const component of components) {
        switch (component.type) {
            case "root":
                result = "$";
                break;
            case "recursive":
                result += "..";
                break;
            case "property":
                result += appendProperty(result, String(component.value));
                break;
            case "index":
                result += `[${component.value}]`;
                break;
            case "wildcard":
                result += "[*]";
                break;
            case "slice":
                result += `[${component.value}]`;
                break;
            case "filter":
                result += `[?(${component.value})]`;
                break;
            default:
                throw new Error(`Unsupported component type: ${component.type}`);
        }
    }
    return result || "$";
}
export function build(segments) {
    const components = [{ type: "root", value: "$" }];
    for (const segment of segments) {
        if (segment === "*") {
            components.push({ type: "wildcard", value: "*" });
            continue;
        }
        if (typeof segment === "number") {
            components.push({ type: "index", value: segment });
            continue;
        }
        components.push({ type: "property", value: segment });
    }
    return stringify(components);
}
export function parent(path) {
    const components = parse(path);
    if (components.length <= 1) {
        return null;
    }
    return stringify(components.slice(0, -1));
}
export function append(basePath, ...segments) {
    let result = basePath;
    for (const segment of segments) {
        if (!segment) {
            continue;
        }
        if (segment.startsWith(".") || segment.startsWith("[")) {
            result += segment;
        }
        else {
            result += `.${segment}`;
        }
    }
    return result;
}
export function isPointer(value) {
    if (value === "") {
        return true;
    }
    if (!value.startsWith("/")) {
        return false;
    }
    for (let i = 0; i < value.length; i += 1) {
        if (value[i] === "~") {
            const next = value[i + 1];
            if (next !== "0" && next !== "1") {
                return false;
            }
        }
    }
    return true;
}
export function equals(path1, path2) {
    return normalizePath(path1) === normalizePath(path2);
}
export function startsWith(path, prefix) {
    const pathComponents = parse(path);
    const prefixComponents = parse(prefix);
    if (prefixComponents.length > pathComponents.length) {
        return false;
    }
    return prefixComponents.every((component, index) => matchesComponent(component, pathComponents[index]));
}
export function contains(path, segment) {
    const components = parse(path);
    return components.some((component) => component.value === segment);
}
function appendProperty(current, name) {
    if (current.endsWith("..")) {
        return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : `['${name}']`;
    }
    if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
        return `.${name}`;
    }
    return `['${name}']`;
}
function toSimplePathArray(path) {
    const ast = parsePath(path);
    if (ast.type === "UnionPath") {
        throw new Error("JSON Pointer conversion does not support unions");
    }
    const segments = ast.segments;
    const pathKeys = ["$"];
    for (const segment of segments) {
        if (segment.type === "Root" || segment.type === "Current") {
            continue;
        }
        if (segment.type !== "Child") {
            throw new Error("JSON Pointer conversion only supports direct child selectors");
        }
        const selector = segment.selector;
        if (selector.type === "IdentifierSelector") {
            pathKeys.push(selector.name);
            continue;
        }
        if (selector.type === "IndexSelector") {
            pathKeys.push(selector.index);
            continue;
        }
        throw new Error("JSON Pointer conversion does not support wildcards, slices, or filters");
    }
    return pathKeys;
}
function flattenComponents(ast) {
    if (ast.type === "UnionPath") {
        throw new Error("Union paths are not supported by PathUtils.parse");
    }
    const components = [{ type: "root", value: "$" }];
    for (const segment of ast.segments) {
        if (segment.type === "Root" || segment.type === "Current") {
            continue;
        }
        if (segment.type === "Recursive") {
            components.push({ type: "recursive", value: ".." });
            if (segment.selector) {
                components.push(mapSelector(segment.selector));
            }
            continue;
        }
        if (segment.type === "Child") {
            components.push(mapSelector(segment.selector));
            continue;
        }
        if (segment.type === "Filter") {
            components.push({ type: "filter", value: segment.expression });
            continue;
        }
        if (segment.type === "Script") {
            components.push({ type: "filter", value: segment.expression });
            continue;
        }
        if (segment.type === "Parent") {
            components.push({ type: "property", value: "^" });
            continue;
        }
        if (segment.type === "PropertyName") {
            components.push({ type: "property", value: "~" });
            continue;
        }
        throw new Error(`Unsupported segment for PathUtils.parse: ${segment.type}`);
    }
    return components;
}
function mapSelector(selector) {
    switch (selector.type) {
        case "IdentifierSelector":
            return { type: "property", value: selector.name };
        case "IndexSelector":
            return { type: "index", value: selector.index };
        case "WildcardSelector":
            return { type: "wildcard", value: "*" };
        case "SliceSelector": {
            const start = selector.start ?? "";
            const end = selector.end ?? "";
            const step = selector.step ?? "";
            const value = [start, end, step].filter((part) => part !== "").join(":");
            return { type: "slice", value };
        }
        case "UnionSelector":
            throw new Error("Union selectors are not supported by PathUtils.parse");
        default: {
            const _exhaustive = selector;
            throw new Error(`Unsupported selector for PathUtils.parse: ${String(_exhaustive)}`);
        }
    }
}
function matchesComponent(a, b) {
    return a.type === b.type && a.value === b.value;
}
