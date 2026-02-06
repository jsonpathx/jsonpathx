export type ParentChainEntry = {
    property: string | number;
    parent: unknown;
};
export type ParentChainResult = {
    value: unknown;
    chain: ParentChainEntry[];
    rootPath: string;
    depth: number;
};
export type ParentChainConfig = {
    maxDepth?: number;
};
export declare class ParentChainTracker {
    private chain;
    private maxDepth;
    constructor(config?: ParentChainConfig);
    push(property: string | number, parent: unknown): void;
    pop(): ParentChainEntry | undefined;
    getChain(): ParentChainEntry[];
    getDepth(): number;
    clear(): void;
    getParent(level: number): ParentChainEntry | undefined;
    buildPath(includeRoot?: boolean): string;
    createResult(value: unknown): ParentChainResult;
}
export declare function buildParentChain(data: unknown, pathComponents: (string | number)[]): ParentChainEntry[];
export declare function getParentAtLevel(chain: ParentChainEntry[], level: number): ParentChainEntry | undefined;
export declare function navigateUp(chain: ParentChainEntry[], levels: number): unknown;
export declare function getAncestors(chain: ParentChainEntry[]): unknown[];
export declare function getPropertyPath(chain: ParentChainEntry[]): (string | number)[];
