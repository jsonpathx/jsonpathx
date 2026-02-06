export class ParentChainTracker {
    chain = [];
    maxDepth;
    constructor(config = {}) {
        this.maxDepth = config.maxDepth ?? Infinity;
    }
    push(property, parent) {
        if (this.chain.length < this.maxDepth) {
            this.chain.push({ property, parent });
        }
    }
    pop() {
        return this.chain.pop();
    }
    getChain() {
        return [...this.chain];
    }
    getDepth() {
        return this.chain.length;
    }
    clear() {
        this.chain = [];
    }
    getParent(level) {
        if (level < 0) {
            return this.chain[this.chain.length + level];
        }
        return this.chain[level];
    }
    buildPath(includeRoot = true) {
        if (this.chain.length === 0) {
            return includeRoot ? "$" : "";
        }
        const parts = includeRoot ? ["$"] : [];
        for (const entry of this.chain) {
            if (typeof entry.property === "number") {
                parts.push(`[${entry.property}]`);
            }
            else {
                parts.push(`.${entry.property}`);
            }
        }
        return parts.join("");
    }
    createResult(value) {
        return {
            value,
            chain: this.getChain(),
            rootPath: this.buildPath(),
            depth: this.getDepth()
        };
    }
}
export function buildParentChain(data, pathComponents) {
    const chain = [];
    let current = data;
    for (const component of pathComponents) {
        chain.push({ property: component, parent: current });
        if (current && typeof current === "object") {
            if (Array.isArray(current)) {
                current = current[component];
            }
            else {
                current = current[component];
            }
        }
        else {
            break;
        }
    }
    return chain;
}
export function getParentAtLevel(chain, level) {
    if (level < 0) {
        return chain[chain.length + level];
    }
    return chain[level];
}
export function navigateUp(chain, levels) {
    if (levels <= 0 || levels > chain.length) {
        return undefined;
    }
    const targetIndex = chain.length - levels;
    return chain[targetIndex]?.parent;
}
export function getAncestors(chain) {
    return chain.map((entry) => entry.parent);
}
export function getPropertyPath(chain) {
    return chain.map((entry) => entry.property);
}
