export declare class ParseError extends Error {
    readonly index: number;
    constructor(message: string, index: number);
}
