import type {
  ChildNode,
  PathNode,
  RecursiveNode,
  SegmentNode,
  SelectorNode,
  TypeSelectorNode
} from "../ast/nodes.js";
import { parseBracketExpression } from "./brackets.js";
import { ParseError } from "./errors.js";
import { isIdentifierStart, readIdentifier } from "./tokenizer.js";

export function parsePath(source: string): PathNode {
  const segments: SegmentNode[] = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (char.trim() === "") {
      index += 1;
      continue;
    }
    if (char === "$") {
      segments.push({ type: "Root" });
      index += 1;
      continue;
    }
    if (char === "@") {
      const typeSelector = readTypeSelector(source, index);
      if (typeSelector) {
        segments.push(typeSelector.node);
        index = typeSelector.nextIndex;
      } else {
        segments.push({ type: "Current" });
        index += 1;
      }
      continue;
    }
    if (char === "." && source[index + 1] === ".") {
      index += 2;
      const recursive = readRecursiveSelector(source, index);
      segments.push(recursive.node);
      index = recursive.nextIndex;
      continue;
    }
    if (char === ".") {
      index += 1;
      const child = readChildSelector(source, index);
      segments.push(child.node);
      index = child.nextIndex;
      continue;
    }
    if (char === "[") {
      const result = parseBracketExpression(source, index);
      segments.push(result.node);
      index = result.nextIndex;
      continue;
    }
    if (char === "^") {
      segments.push({ type: "Parent" });
      index += 1;
      continue;
    }
    if (char === "~") {
      segments.push({ type: "PropertyName" });
      index += 1;
      continue;
    }
    if (char === "*") {
      segments.push({ type: "Child", selector: { type: "WildcardSelector" } });
      index += 1;
      continue;
    }
    if (char === "`") {
      const { name, nextIndex } = readEscapedName(source, index + 1);
      segments.push({
        type: "Child",
        selector: { type: "IdentifierSelector", name, quoted: false, escaped: true }
      });
      index = nextIndex;
      continue;
    }
    if (isIdentifierStart(char)) {
      const ident = readIdentifier(source, index);
      if (!ident) {
        throw new ParseError("Invalid identifier", index);
      }
      segments.push({
        type: "Child",
        selector: {
          type: "IdentifierSelector",
          name: ident.value,
          quoted: false,
          escaped: false
        }
      });
      index = ident.end;
      continue;
    }
    throw new ParseError(`Unexpected token '${char}'`, index);
  }
  return { type: "Path", segments };
}

function readRecursiveSelector(source: string, startIndex: number) {
  if (startIndex >= source.length) {
    return { node: { type: "Recursive" } as RecursiveNode, nextIndex: startIndex };
  }
  const char = source[startIndex];
  if (char === "[") {
    const result = parseBracketExpression(source, startIndex);
    if (result.node.type === "Child") {
      return {
        node: { type: "Recursive", selector: result.node.selector },
        nextIndex: result.nextIndex
      };
    }
    return {
      node: { type: "Recursive" } as RecursiveNode,
      nextIndex: startIndex
    };
  }
  if (char === "*") {
    return {
      node: { type: "Recursive", selector: { type: "WildcardSelector" } },
      nextIndex: startIndex + 1
    };
  }
  if (char === "`") {
    const { name, nextIndex } = readEscapedName(source, startIndex + 1);
    return {
      node: {
        type: "Recursive",
        selector: { type: "IdentifierSelector", name, quoted: false, escaped: true }
      },
      nextIndex
    };
  }
  if (isIdentifierStart(char)) {
    const ident = readIdentifier(source, startIndex);
    if (!ident) {
      throw new ParseError("Invalid recursive identifier", startIndex);
    }
    return {
      node: {
        type: "Recursive",
        selector: { type: "IdentifierSelector", name: ident.value, quoted: false, escaped: false }
      },
      nextIndex: ident.end
    };
  }
  const typeSelector = readTypeSelector(source, startIndex);
  if (typeSelector) {
    return {
      node: { type: "Recursive" } as RecursiveNode,
      nextIndex: startIndex
    };
  }
  return { node: { type: "Recursive" } as RecursiveNode, nextIndex: startIndex };
}

function readChildSelector(source: string, startIndex: number) {
  if (startIndex >= source.length) {
    throw new ParseError("Expected selector after '.'", startIndex);
  }
  const char = source[startIndex];
  if (char === "[") {
    const result = parseBracketExpression(source, startIndex);
    return { node: result.node, nextIndex: result.nextIndex };
  }
  if (char === "*") {
    return {
      node: { type: "Child", selector: { type: "WildcardSelector" } },
      nextIndex: startIndex + 1
    };
  }
  if (char === "`") {
    const { name, nextIndex } = readEscapedName(source, startIndex + 1);
    return {
      node: {
        type: "Child",
        selector: { type: "IdentifierSelector", name, quoted: false, escaped: true }
      },
      nextIndex
    };
  }
  if (isIdentifierStart(char)) {
    const ident = readIdentifier(source, startIndex);
    if (!ident) {
      throw new ParseError("Invalid identifier", startIndex);
    }
    return {
      node: {
        type: "Child",
        selector: { type: "IdentifierSelector", name: ident.value, quoted: false, escaped: false }
      },
      nextIndex: ident.end
    };
  }
  const typeSelector = readTypeSelector(source, startIndex);
  if (typeSelector) {
    return { node: typeSelector.node, nextIndex: typeSelector.nextIndex };
  }
  throw new ParseError("Unsupported child selector", startIndex);
}

function readTypeSelector(source: string, startIndex: number) {
  if (source[startIndex] !== "@") {
    return null;
  }
  const ident = readIdentifier(source, startIndex + 1);
  if (!ident) {
    return null;
  }
  if (source[ident.end] !== "(" || source[ident.end + 1] !== ")") {
    return null;
  }
  const node: TypeSelectorNode = { type: "TypeSelector", name: ident.value };
  return { node, nextIndex: ident.end + 2 };
}

function readEscapedName(source: string, startIndex: number) {
  const name = source.slice(startIndex);
  return { name, nextIndex: source.length };
}
