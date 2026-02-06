import { createChildContext } from "./context.js";
export function applySelector(context, selector) {
    switch (selector.type) {
        case "WildcardSelector":
            return selectWildcard(context, selector);
        case "IdentifierSelector":
            return selectIdentifier(context, selector);
        case "IndexSelector":
            return selectIndex(context, selector);
        case "SliceSelector":
            return selectSlice(context, selector);
        case "UnionSelector":
            return selector.items.flatMap((item) => selectUnionItem(context, item));
        default:
            return [];
    }
}
function selectWildcard(context, _selector) {
    const { value } = context;
    if (Array.isArray(value)) {
        return value.map((entry, index) => createChildContext(context, index, entry));
    }
    if (value && typeof value === "object") {
        return Object.keys(value).map((key) => createChildContext(context, key, value[key]));
    }
    return [];
}
function selectIdentifier(context, selector) {
    const { value } = context;
    if (!value || typeof value !== "object") {
        return [];
    }
    const record = value;
    if (Object.prototype.hasOwnProperty.call(record, selector.name)) {
        return [createChildContext(context, selector.name, record[selector.name])];
    }
    return [];
}
function selectIndex(context, selector) {
    const { value } = context;
    if (!Array.isArray(value)) {
        return [];
    }
    const index = selector.index < 0 ? value.length + selector.index : selector.index;
    if (index < 0 || index >= value.length) {
        return [];
    }
    return [createChildContext(context, index, value[index])];
}
function selectSlice(context, selector) {
    const { value } = context;
    if (!Array.isArray(value)) {
        return [];
    }
    const length = value.length;
    const step = selector.step ?? 1;
    if (step === 0) {
        return [];
    }
    const start = normalizeIndex(selector.start ?? (step > 0 ? 0 : length - 1), length);
    const end = normalizeIndex(selector.end ?? (step > 0 ? length : -1), length);
    const results = [];
    if (step > 0) {
        for (let i = start; i < end; i += step) {
            if (i >= 0 && i < length) {
                results.push(createChildContext(context, i, value[i]));
            }
        }
    }
    else {
        for (let i = start; i > end; i += step) {
            if (i >= 0 && i < length) {
                results.push(createChildContext(context, i, value[i]));
            }
        }
    }
    return results;
}
function normalizeIndex(index, length) {
    if (index < 0) {
        return length + index;
    }
    return index;
}
function selectUnionItem(context, item) {
    if (item.type === "IdentifierSelector") {
        return selectIdentifier(context, item);
    }
    if (item.type === "IndexSelector") {
        return selectIndex(context, item);
    }
    return selectSlice(context, item);
}
