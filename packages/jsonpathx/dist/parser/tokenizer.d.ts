export type Token = {
    type: string;
    value?: string;
    start: number;
    end: number;
};
export declare function isIdentifierStart(char: string): boolean;
export declare function isIdentifierPart(char: string): boolean;
export declare function readIdentifier(source: string, start: number): {
    value: string;
    end: number;
} | null;
export declare function readNumber(source: string, start: number): {
    value: string;
    end: number;
} | null;
export declare function readString(source: string, start: number): {
    value: string;
    end: number;
} | null;
export declare function tokenize(source: string): Token[];
