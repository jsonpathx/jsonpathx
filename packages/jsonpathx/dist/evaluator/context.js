export function createRootContext(value, parent, parentProperty) {
    return {
        value,
        path: [],
        payloadType: "value",
        parent,
        parentProperty
    };
}
export function createChildContext(parentContext, key, value) {
    return {
        value,
        path: parentContext.path.concat(key),
        parent: parentContext.value,
        parentProperty: key,
        payloadType: "value"
    };
}
