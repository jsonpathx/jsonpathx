import { query } from "../evaluator/index.js";
function deepClone(value) {
    if (value === null || typeof value !== "object") {
        return value;
    }
    if (Array.isArray(value)) {
        return value.map((item) => deepClone(item));
    }
    if (value instanceof Date) {
        return new Date(value);
    }
    if (value instanceof RegExp) {
        return new RegExp(value.source, value.flags);
    }
    const cloned = {};
    for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
            cloned[key] = deepClone(value[key]);
        }
    }
    return cloned;
}
function parseJSONPath(path) {
    const segments = [];
    let remaining = path.startsWith("$") ? path.substring(1) : path;
    while (remaining.length > 0) {
        const arrayMatch = remaining.match(/^\[(\d+)\]/);
        if (arrayMatch) {
            segments.push(Number.parseInt(arrayMatch[1] ?? "0", 10));
            remaining = remaining.substring(arrayMatch[0].length);
            continue;
        }
        const dotMatch = remaining.match(/^\.([^.\[]+)/);
        if (dotMatch) {
            segments.push(dotMatch[1] ?? "");
            remaining = remaining.substring(dotMatch[0].length);
            continue;
        }
        const bracketMatch = remaining.match(/^\[(?:"([^"]+)"|'([^']+)')\]/);
        if (bracketMatch) {
            segments.push((bracketMatch[1] ?? bracketMatch[2]) ?? "");
            remaining = remaining.substring(bracketMatch[0].length);
            continue;
        }
        break;
    }
    return segments;
}
function navigateToPath(data, segments, createPath) {
    let current = data;
    for (let i = 0; i < segments.length - 1; i += 1) {
        const segment = segments[i];
        if (segment === undefined) {
            return null;
        }
        if (current[segment] === undefined || current[segment] === null) {
            if (createPath) {
                const nextSegment = segments[i + 1];
                const isNextArray = typeof nextSegment === "number";
                current[segment] = isNextArray ? [] : {};
            }
            else {
                return null;
            }
        }
        current = current[segment];
    }
    const lastKey = segments[segments.length - 1];
    if (lastKey === undefined) {
        return null;
    }
    return { parent: current, key: lastKey };
}
async function resolveEntries(data, path, options) {
    const result = await query({ path, json: data, resultType: "all", ...options });
    if (!Array.isArray(result)) {
        return [];
    }
    return result;
}
export async function set(data, path, value, options = {}) {
    const immutable = options.immutable !== false;
    const workingData = immutable ? deepClone(data) : data;
    const entries = await resolveEntries(workingData, path, options);
    const modifiedPaths = [];
    if (entries.length === 0 && options.createPath) {
        const segments = parseJSONPath(path);
        const location = navigateToPath(workingData, segments, true);
        if (location) {
            location.parent[location.key] = value;
            modifiedPaths.push(path);
        }
    }
    else {
        for (const entry of entries) {
            const segments = parseJSONPath(entry.path);
            const location = navigateToPath(workingData, segments, false);
            if (!location) {
                continue;
            }
            location.parent[location.key] = value;
            modifiedPaths.push(entry.path);
        }
    }
    return { data: workingData, modified: modifiedPaths.length, paths: modifiedPaths };
}
export async function update(data, path, updater, options = {}) {
    const entries = await resolveEntries(data, path, options);
    const values = entries.map((entry) => entry.value);
    const updated = await set(data, path, undefined, options);
    const workingData = updated.data;
    const modifiedPaths = [];
    for (let i = 0; i < entries.length; i += 1) {
        const entry = entries[i];
        const segments = parseJSONPath(entry.path);
        const location = navigateToPath(workingData, segments, false);
        if (!location) {
            continue;
        }
        const nextValue = updater(values[i]);
        location.parent[location.key] = nextValue;
        modifiedPaths.push(entry.path);
    }
    return { data: workingData, modified: modifiedPaths.length, paths: modifiedPaths };
}
export async function deleteAtPath(data, path, options = {}) {
    const entries = await resolveEntries(data, path, options);
    const immutable = options.immutable !== false;
    const workingData = immutable ? deepClone(data) : data;
    const modifiedPaths = [];
    for (const entry of entries) {
        const segments = parseJSONPath(entry.path);
        const location = navigateToPath(workingData, segments, false);
        if (!location) {
            continue;
        }
        if (Array.isArray(location.parent)) {
            location.parent.splice(location.key, 1);
        }
        else {
            delete location.parent[location.key];
        }
        modifiedPaths.push(entry.path);
    }
    return { data: workingData, modified: modifiedPaths.length, paths: modifiedPaths };
}
export async function push(data, path, value, options = {}) {
    return insert(data, path, value, { ...options, position: "end" });
}
export async function unshift(data, path, value, options = {}) {
    return insert(data, path, value, { ...options, position: "start" });
}
export async function insert(data, path, value, options = {}) {
    const entries = await resolveEntries(data, path, options);
    const immutable = options.immutable !== false;
    const workingData = immutable ? deepClone(data) : data;
    const modifiedPaths = [];
    for (const entry of entries) {
        const segments = parseJSONPath(entry.path);
        const location = navigateToPath(workingData, segments, false);
        if (!location) {
            continue;
        }
        const target = location.parent[location.key];
        if (!Array.isArray(target)) {
            continue;
        }
        if (options.position === "start") {
            target.unshift(value);
        }
        else {
            target.push(value);
        }
        modifiedPaths.push(entry.path);
    }
    return { data: workingData, modified: modifiedPaths.length, paths: modifiedPaths };
}
export async function merge(data, path, value, options = {}) {
    return update(data, path, (current) => ({ ...current, ...value }), options);
}
export async function increment(data, path, amount = 1, options = {}) {
    return update(data, path, (current) => (typeof current === "number" ? current + amount : current), options);
}
export async function decrement(data, path, amount = 1, options = {}) {
    return update(data, path, (current) => (typeof current === "number" ? current - amount : current), options);
}
export async function toggle(data, path, options = {}) {
    return update(data, path, (current) => (typeof current === "boolean" ? !current : current), options);
}
