import type {
  ChildNode,
  FilterNode,
  ScriptNode,
  SelectorNode,
  SliceSelector,
  UnionItemNode
} from "../ast/nodes.js";
import { ParseError } from "./errors.js";
import { isIdentifierPart, isIdentifierStart, readNumber, readString } from "./tokenizer.js";

export type BracketParseResult = {
  node: ChildNode | FilterNode | ScriptNode;
  nextIndex: number;
};

export function parseBracketExpression(source: string, startIndex: number): BracketParseResult {
  let index = startIndex + 1;
  while (index < source.length && source[index]?.trim() === "") {
    index += 1;
  }
  const next = source[index];
  if (next === "?") {
    index += 1;
    const { expression, nextIndex } = readShortFilterExpression(source, index);
    if (source[nextIndex] !== "]") {
      throw new ParseError("Unterminated filter expression", nextIndex);
    }
    const normalized = stripOuterParens(expression.trim());
    return {
      node: { type: "Filter", expression: normalized },
      nextIndex: nextIndex + 1
    };
  }
  if (next === "(") {
    index += 1;
    const { expression, nextIndex } = readBalancedParens(source, index);
    if (source[nextIndex] !== "]") {
      throw new ParseError("Unterminated script expression", nextIndex);
    }
    return {
      node: { type: "Script", expression },
      nextIndex: nextIndex + 1
    };
  }
  const { content, nextIndex } = readBracketContent(source, index);
  const selector = parseBracketSelector(content);
  return {
    node: { type: "Child", selector },
    nextIndex
  };
}

function readBalancedParens(source: string, startIndex: number) {
  let index = startIndex;
  let depth = 1;
  let inQuote: string | null = null;
  let escaped = false;
  while (index < source.length) {
    const char = source[index];
    if (escaped) {
      escaped = false;
      index += 1;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      index += 1;
      continue;
    }
    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      }
      index += 1;
      continue;
    }
    if (char === "'" || char === '"') {
      inQuote = char;
      index += 1;
      continue;
    }
    if (char === "(") {
      depth += 1;
      index += 1;
      continue;
    }
    if (char === ")") {
      depth -= 1;
      if (depth === 0) {
        const expression = source.slice(startIndex, index).trim();
        return { expression, nextIndex: index + 1 };
      }
      index += 1;
      continue;
    }
    index += 1;
  }
  throw new ParseError("Unterminated parenthetical expression", startIndex);
}

function readShortFilterExpression(source: string, startIndex: number) {
  let index = startIndex;
  let depth = 0;
  let inQuote: string | null = null;
  let escaped = false;
  while (index < source.length) {
    const char = source[index];
    if (escaped) {
      escaped = false;
      index += 1;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      index += 1;
      continue;
    }
    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      }
      index += 1;
      continue;
    }
    if (char === "'" || char === "\"") {
      inQuote = char;
      index += 1;
      continue;
    }
    if (char === "[") {
      depth += 1;
      index += 1;
      continue;
    }
    if (char === "]") {
      if (depth === 0) {
        const expression = source.slice(startIndex, index).trim();
        return { expression, nextIndex: index };
      }
      depth -= 1;
      index += 1;
      continue;
    }
    index += 1;
  }
  throw new ParseError("Unterminated filter expression", startIndex);
}

function stripOuterParens(expression: string) {
  if (!expression.startsWith("(") || !expression.endsWith(")")) {
    return expression;
  }
  let depth = 0;
  let inQuote: string | null = null;
  let escaped = false;
  for (let i = 0; i < expression.length; i += 1) {
    const char = expression[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      }
      continue;
    }
    if (char === "'" || char === "\"") {
      inQuote = char;
      continue;
    }
    if (char === "(") {
      depth += 1;
      continue;
    }
    if (char === ")") {
      depth -= 1;
      if (depth === 0 && i < expression.length - 1) {
        return expression;
      }
      continue;
    }
  }
  if (depth === 0) {
    return expression.slice(1, -1).trim();
  }
  return expression;
}

function readBracketContent(source: string, startIndex: number) {
  let index = startIndex;
  let inQuote: string | null = null;
  let escaped = false;
  while (index < source.length) {
    const char = source[index];
    if (escaped) {
      escaped = false;
      index += 1;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      index += 1;
      continue;
    }
    if (inQuote) {
      if (char === inQuote) {
        inQuote = null;
      }
      index += 1;
      continue;
    }
    if (char === "'" || char === '"') {
      inQuote = char;
      index += 1;
      continue;
    }
    if (char === "]") {
      const content = source.slice(startIndex, index).trim();
      return { content, nextIndex: index + 1 };
    }
    index += 1;
  }
  throw new ParseError("Unterminated bracket expression", startIndex);
}

function parseBracketSelector(content: string): SelectorNode {
  const trimmed = content.trim();
  if (trimmed === "") {
    throw new ParseError("Empty bracket selector", 0);
  }
  if (trimmed === "*") {
    return { type: "WildcardSelector" };
  }
  if (trimmed.startsWith("`")) {
    return {
      type: "IdentifierSelector",
      name: trimmed.slice(1),
      quoted: false,
      escaped: true
    };
  }
  const items = splitTopLevel(trimmed, ",");
  if (items.length > 1) {
    const parsedItems = items.map((item) => parseUnionItem(item.trim()));
    return { type: "UnionSelector", items: parsedItems };
  }
  if (trimmed.includes(":")) {
    return parseSlice(trimmed);
  }
  const stringValue = parseMaybeString(trimmed);
  if (stringValue != null) {
    return {
      type: "IdentifierSelector",
      name: stringValue,
      quoted: true,
      escaped: false
    };
  }
  const numberValue = parseMaybeNumber(trimmed);
  if (numberValue != null) {
    return { type: "IndexSelector", index: numberValue };
  }
  if (!isValidIdentifier(trimmed)) {
    throw new ParseError("Invalid identifier selector", 0);
  }
  return {
    type: "IdentifierSelector",
    name: trimmed,
    quoted: false,
    escaped: false
  };
}

function splitTopLevel(value: string, delimiter: string) {
  const parts: string[] = [];
  let buffer = "";
  let inQuote: string | null = null;
  let escaped = false;
  for (let i = 0; i < value.length; i += 1) {
    const char = value[i];
    if (escaped) {
      buffer += char;
      escaped = false;
      continue;
    }
    if (char === "\\") {
      buffer += char;
      escaped = true;
      continue;
    }
    if (inQuote) {
      buffer += char;
      if (char === inQuote) {
        inQuote = null;
      }
      continue;
    }
    if (char === "'" || char === '"') {
      buffer += char;
      inQuote = char;
      continue;
    }
    if (char === delimiter) {
      parts.push(buffer);
      buffer = "";
      continue;
    }
    buffer += char;
  }
  parts.push(buffer);
  return parts;
}

function parseUnionItem(value: string): UnionItemNode {
  if (value.trim() === "") {
    throw new ParseError("Empty union selector", 0);
  }
  if (value.trim() === "*") {
    return { type: "WildcardSelector" };
  }
  if (value.includes(":")) {
    return parseSlice(value);
  }
  const stringValue = parseMaybeString(value);
  if (stringValue != null) {
    return {
      type: "IdentifierSelector",
      name: stringValue,
      quoted: true,
      escaped: false
    };
  }
  const numberValue = parseMaybeNumber(value);
  if (numberValue != null) {
    return { type: "IndexSelector", index: numberValue };
  }
  if (!isValidIdentifier(value)) {
    throw new ParseError("Invalid identifier selector", 0);
  }
  return {
    type: "IdentifierSelector",
    name: value,
    quoted: false,
    escaped: false
  };
}

function parseSlice(value: string): SliceSelector {
  const parts = value.split(":");
  if (parts.length < 2 || parts.length > 3) {
    throw new ParseError("Invalid slice expression", 0);
  }
  const [startRaw, endRaw, stepRaw] = parts;
  const start = parseMaybeNumber(startRaw.trim());
  if (startRaw.trim() !== "" && start == null) {
    throw new ParseError("Invalid slice expression", 0);
  }
  const end = parseMaybeNumber(endRaw.trim());
  if (endRaw.trim() !== "" && end == null) {
    throw new ParseError("Invalid slice expression", 0);
  }
  const step = stepRaw == null ? undefined : parseMaybeNumber(stepRaw.trim());
  if (stepRaw != null && stepRaw.trim() !== "" && step == null) {
    throw new ParseError("Invalid slice expression", 0);
  }
  const selector: { type: "SliceSelector"; start?: number; end?: number; step?: number } = {
    type: "SliceSelector"
  };
  if (start != null) {
    selector.start = start;
  }
  if (end != null) {
    selector.end = end;
  }
  if (step != null) {
    selector.step = step;
  }
  return selector;
}

function parseMaybeString(value: string) {
  const str = readString(value, 0);
  if (!str || str.end !== value.length) {
    return null;
  }
  return str.value;
}

function parseMaybeNumber(value: string) {
  const num = readNumber(value, 0);
  if (!num || num.end !== value.length) {
    return null;
  }
  return Number.parseInt(num.value, 10);
}

function isValidIdentifier(value: string) {
  if (!value) {
    return false;
  }
  if (!isIdentifierStart(value[0] ?? "")) {
    return false;
  }
  for (let i = 1; i < value.length; i += 1) {
    if (!isIdentifierPart(value[i] ?? "")) {
      return false;
    }
  }
  return true;
}
