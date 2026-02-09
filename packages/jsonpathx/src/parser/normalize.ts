function splitTopLevel(path: string, delimiter: string): string[] {
  const parts: string[] = [];
  let buffer = "";
  let quote: string | null = null;
  let bracketDepth = 0;
  let parenDepth = 0;
  let escaped = false;

  for (let i = 0; i < path.length; i += 1) {
    const ch = path[i];
    if (escaped) {
      buffer += ch;
      escaped = false;
      continue;
    }
    if (ch === "\\") {
      buffer += ch;
      escaped = true;
      continue;
    }
    if (quote) {
      buffer += ch;
      if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === "'" || ch === '"') {
      buffer += ch;
      quote = ch;
      continue;
    }
    if (ch === "[") {
      bracketDepth += 1;
      buffer += ch;
      continue;
    }
    if (ch === "]") {
      bracketDepth = Math.max(0, bracketDepth - 1);
      buffer += ch;
      continue;
    }
    if (ch === "(") {
      parenDepth += 1;
      buffer += ch;
      continue;
    }
    if (ch === ")") {
      parenDepth = Math.max(0, parenDepth - 1);
      buffer += ch;
      continue;
    }
    if (ch === delimiter && bracketDepth === 0 && parenDepth === 0) {
      parts.push(buffer.trim());
      buffer = "";
      continue;
    }
    buffer += ch;
  }

  if (buffer.trim().length > 0) {
    parts.push(buffer.trim());
  }
  return parts;
}

function parseGroupingList(path: string, startIndex: number): { items: string[]; nextIndex: number } {
  const items: string[] = [];
  let i = startIndex;
  let buffer = "";
  let quote: string | null = null;
  let escaped = false;

  while (i < path.length) {
    const ch = path[i];
    if (escaped) {
      buffer += ch;
      escaped = false;
      i += 1;
      continue;
    }
    if (ch === "\\") {
      buffer += ch;
      escaped = true;
      i += 1;
      continue;
    }
    if (quote) {
      buffer += ch;
      if (ch === quote) {
        quote = null;
      }
      i += 1;
      continue;
    }
    if (ch === "'" || ch === '"') {
      buffer += ch;
      quote = ch;
      i += 1;
      continue;
    }
    if (ch === ")") {
      if (buffer.trim().length > 0) {
        items.push(buffer.trim());
      }
      return { items, nextIndex: i + 1 };
    }
    if (ch === ",") {
      if (buffer.trim().length > 0) {
        items.push(buffer.trim());
      }
      buffer = "";
      i += 1;
      continue;
    }
    buffer += ch;
    i += 1;
  }

  throw new Error("Unclosed grouping syntax");
}

function buildSelector(item: string, recursive: boolean): string {
  const trimmed = item.trim();
  if (/^-?\d+$/.test(trimmed)) {
    return `[${trimmed}]`;
  }
  if (/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(trimmed)) {
    return recursive ? trimmed : `.${trimmed}`;
  }
  const escaped = trimmed.replace(/'/g, "\\'");
  return recursive ? `['${escaped}']` : `['${escaped}']`;
}

function expandGrouping(path: string): string {
  let i = 0;
  while (i < path.length) {
    if (path[i] === "." && path[i + 1] === "." && path[i + 2] === "(") {
      const prefix = path.slice(0, i);
      const { items, nextIndex } = parseGroupingList(path, i + 3);
      const suffix = path.slice(nextIndex);
      return items
        .map((item) => expandGrouping(`${prefix}..${buildSelector(item, true)}${suffix}`))
        .join(" | ");
    }
    if (path[i] === "." && path[i + 1] === "(") {
      const prefix = path.slice(0, i);
      const { items, nextIndex } = parseGroupingList(path, i + 2);
      const suffix = path.slice(nextIndex);
      return items
        .map((item) => expandGrouping(`${prefix}${buildSelector(item, false)}${suffix}`))
        .join(" | ");
    }
    i += 1;
  }
  return path;
}

export function normalizePath(path: string): string[] {
  const expanded = expandGrouping(path);
  const filterExpanded = expandFilterUnion(expanded);
  return splitTopLevel(filterExpanded, "|");
}

function expandFilterUnion(path: string): string {
  let i = 0;
  while (i < path.length) {
    if (path[i] === "[") {
      const { content, nextIndex } = readBracketContent(path, i + 1);
      const items = splitTopLevel(content, ",");
      if (items.length > 1 && items.some((item) => item.trim().startsWith("?"))) {
        const prefix = path.slice(0, i);
        const suffix = path.slice(nextIndex);
        return items
          .map((item) => expandFilterUnion(`${prefix}[${item.trim()}]${suffix}`))
          .join(" | ");
      }
      i = nextIndex;
      continue;
    }
    i += 1;
  }
  return path;
}

function readBracketContent(path: string, startIndex: number): { content: string; nextIndex: number } {
  let index = startIndex;
  let quote: string | null = null;
  let escaped = false;
  while (index < path.length) {
    const ch = path[index];
    if (escaped) {
      escaped = false;
      index += 1;
      continue;
    }
    if (ch === "\\") {
      escaped = true;
      index += 1;
      continue;
    }
    if (quote) {
      if (ch === quote) {
        quote = null;
      }
      index += 1;
      continue;
    }
    if (ch === "'" || ch === "\"") {
      quote = ch;
      index += 1;
      continue;
    }
    if (ch === "]") {
      return { content: path.slice(startIndex, index).trim(), nextIndex: index + 1 };
    }
    index += 1;
  }
  return { content: path.slice(startIndex).trim(), nextIndex: path.length };
}
