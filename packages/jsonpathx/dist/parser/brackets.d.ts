import type { ChildNode, FilterNode, ScriptNode } from "../ast/nodes.js";
export type BracketParseResult = {
    node: ChildNode | FilterNode | ScriptNode;
    nextIndex: number;
};
export declare function parseBracketExpression(source: string, startIndex: number): BracketParseResult;
