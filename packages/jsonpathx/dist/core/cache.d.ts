export type CacheOptions = {
    maxSize?: number;
    ttl?: number;
};
export declare class QueryCache<T> {
    private cache;
    private maxSize;
    private ttl;
    private hits;
    private misses;
    constructor(options?: CacheOptions);
    get(key: string): T | null;
    set(key: string, value: T): void;
    clear(key?: string): void;
    stats(): {
        size: number;
        hits: number;
        misses: number;
        hitRate: number;
        maxSize: number;
        ttl: number;
    };
    getStats(): {
        size: number;
        hits: number;
        misses: number;
        hitRate: number;
        maxSize: number;
        ttl: number;
    };
    static createKey(path: string, data: unknown): string;
}
export declare function getGlobalCache(): QueryCache<unknown[]>;
export declare function resetGlobalCache(): void;
export declare function enableGlobalCache(options?: CacheOptions): void;
export declare function disableGlobalCache(): void;
export declare function clearGlobalCache(): void;
export declare function isGlobalCacheEnabled(): boolean;
export declare function getGlobalCacheStats(): {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
    maxSize: number;
    ttl: number;
} | {
    size: number;
    hits: number;
    misses: number;
    hitRate: number;
};
