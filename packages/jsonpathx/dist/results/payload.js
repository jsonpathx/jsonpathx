import { toPathString, toPointer } from "./path.js";
export function buildPayload(context) {
    return {
        value: context.value,
        path: toPathString(context.path),
        pointer: toPointer(context.path),
        parent: context.parent,
        parentProperty: context.parentProperty,
        parentChain: context.parentChain
    };
}
