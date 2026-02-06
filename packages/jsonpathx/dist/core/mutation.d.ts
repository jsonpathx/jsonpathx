import type { QueryOptions } from "../evaluator/index.js";
export type MutationOptions = QueryOptions & {
    immutable?: boolean;
    createPath?: boolean;
};
export type MutationResult = {
    data: unknown;
    modified: number;
    paths: string[];
};
export declare function set(data: unknown, path: string, value: unknown, options?: MutationOptions): Promise<MutationResult>;
export declare function update(data: unknown, path: string, updater: (value: unknown) => unknown, options?: MutationOptions): Promise<MutationResult>;
export declare function deleteAtPath(data: unknown, path: string, options?: MutationOptions): Promise<MutationResult>;
export declare function push(data: unknown, path: string, value: unknown, options?: MutationOptions): Promise<MutationResult>;
export declare function unshift(data: unknown, path: string, value: unknown, options?: MutationOptions): Promise<MutationResult>;
export declare function insert(data: unknown, path: string, value: unknown, options?: MutationOptions & {
    position?: "start" | "end";
}): Promise<MutationResult>;
export declare function merge(data: unknown, path: string, value: Record<string, unknown>, options?: MutationOptions): Promise<MutationResult>;
export declare function increment(data: unknown, path: string, amount?: number, options?: MutationOptions): Promise<MutationResult>;
export declare function decrement(data: unknown, path: string, amount?: number, options?: MutationOptions): Promise<MutationResult>;
export declare function toggle(data: unknown, path: string, options?: MutationOptions): Promise<MutationResult>;
