export class QueryCache {
    cache = new Map();
    maxSize;
    ttl;
    hits = 0;
    misses = 0;
    constructor(options = {}) {
        this.maxSize = options.maxSize ?? 100;
        this.ttl = options.ttl ?? 60_000;
    }
    get(key) {
        const entry = this.cache.get(key);
        if (!entry) {
            this.misses += 1;
            return null;
        }
        if (Date.now() - entry.createdAt > this.ttl) {
            this.cache.delete(key);
            this.misses += 1;
            return null;
        }
        this.cache.delete(key);
        this.cache.set(key, entry);
        this.hits += 1;
        return entry.value;
    }
    set(key, value) {
        if (!this.cache.has(key) && this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value;
            if (oldestKey !== undefined) {
                this.cache.delete(oldestKey);
            }
        }
        this.cache.set(key, { value, createdAt: Date.now() });
    }
    clear(key) {
        if (key) {
            this.cache.delete(key);
            return;
        }
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }
    stats() {
        const total = this.hits + this.misses;
        return {
            size: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: total === 0 ? 0 : this.hits / total,
            maxSize: this.maxSize,
            ttl: this.ttl
        };
    }
    getStats() {
        return this.stats();
    }
    static createKey(path, data) {
        let payload = "";
        try {
            payload = JSON.stringify(data);
        }
        catch {
            payload = String(data);
        }
        return `${path}::${payload}`;
    }
}
let globalCache = null;
let globalCacheEnabled = false;
export function getGlobalCache() {
    if (!globalCache) {
        globalCache = new QueryCache();
    }
    return globalCache;
}
export function resetGlobalCache() {
    globalCache = null;
}
export function enableGlobalCache(options = {}) {
    globalCacheEnabled = true;
    globalCache = new QueryCache(options);
}
export function disableGlobalCache() {
    globalCacheEnabled = false;
}
export function clearGlobalCache() {
    if (globalCache) {
        globalCache.clear();
    }
}
export function isGlobalCacheEnabled() {
    return globalCacheEnabled;
}
export function getGlobalCacheStats() {
    if (!globalCache) {
        return { size: 0, hits: 0, misses: 0, hitRate: 0 };
    }
    return globalCache.stats();
}
