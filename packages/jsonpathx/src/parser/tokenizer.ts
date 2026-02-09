export type Token = {
  type: string;
  value?: string;
  start: number;
  end: number;
};

let unicodeIdStart: RegExp | null = null;
let unicodeIdPart: RegExp | null = null;

try {
  unicodeIdStart = new RegExp("[\\p{ID_Start}_$]", "u");
  unicodeIdPart = new RegExp("[\\p{ID_Continue}_$\\u200C\\u200D]", "u");
} catch {
  unicodeIdStart = null;
  unicodeIdPart = null;
}

export function isIdentifierStart(char: string) {
  if (!char) {
    return false;
  }
  if (unicodeIdStart && unicodeIdStart.test(char)) {
    return true;
  }
  if (/[A-Za-z_$]/.test(char)) {
    return true;
  }
  return isNonAsciiIdentifier(char);
}

export function isIdentifierPart(char: string) {
  if (!char) {
    return false;
  }
  if (unicodeIdPart && unicodeIdPart.test(char)) {
    return true;
  }
  if (/[A-Za-z0-9_$]/.test(char)) {
    return true;
  }
  return isNonAsciiIdentifier(char);
}

export function readIdentifier(source: string, start: number) {
  let index = start;
  if (!isIdentifierStart(source[index] ?? "")) {
    return null;
  }
  index += 1;
  while (index < source.length && isIdentifierPart(source[index])) {
    index += 1;
  }
  return { value: source.slice(start, index), end: index };
}

export function readNumber(source: string, start: number) {
  const slice = source.slice(start);
  const match = slice.match(/^-?(0|[1-9]\d*)/);
  if (!match) {
    return null;
  }
  const raw = match[0];
  if (raw === "-0") {
    return null;
  }
  const maxSafe = "9007199254740991";
  const negative = raw.startsWith("-");
  const digits = negative ? raw.slice(1) : raw;
  if (digits.length > maxSafe.length) {
    return null;
  }
  if (digits.length === maxSafe.length && digits > maxSafe) {
    return null;
  }
  return { value: raw, end: start + raw.length };
}

export function readString(source: string, start: number) {
  const quote = source[start];
  if (quote !== "'" && quote !== '"') {
    return null;
  }
  let index = start + 1;
  let value = "";
  while (index < source.length) {
    const char = source[index];
    if (char === "\\") {
      const next = source[index + 1];
      if (next == null) {
        return null;
      }
      if (next === "u") {
        const hex = source.slice(index + 2, index + 6);
        if (!/^[0-9A-Fa-f]{4}$/.test(hex)) {
          return null;
        }
        const code = Number.parseInt(hex, 16);
        index += 6;
        if (code >= 0xd800 && code <= 0xdbff) {
          const nextEscape = source.slice(index, index + 2);
          if (nextEscape === "\\u") {
            const lowHex = source.slice(index + 2, index + 6);
            if (/^[0-9A-Fa-f]{4}$/.test(lowHex)) {
              const low = Number.parseInt(lowHex, 16);
              if (low >= 0xdc00 && low <= 0xdfff) {
                const codePoint = (code - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000;
                value += String.fromCodePoint(codePoint);
                index += 6;
                continue;
              }
            }
          }
          return null;
        }
        if (code >= 0xdc00 && code <= 0xdfff) {
          return null;
        }
        value += String.fromCharCode(code);
        continue;
      }
      switch (next) {
        case "b":
          value += "\b";
          break;
        case "f":
          value += "\f";
          break;
        case "n":
          value += "\n";
          break;
        case "r":
          value += "\r";
          break;
        case "t":
          value += "\t";
          break;
        case "\\":
          value += "\\";
          break;
        case "\"":
          if (quote !== "\"") {
            return null;
          }
          value += "\"";
          break;
        case "'":
          if (quote !== "'") {
            return null;
          }
          value += "'";
          break;
        case "/":
          value += "/";
          break;
        default:
          return null;
      }
      index += 2;
      continue;
    }
    if (char === quote) {
      return { value, end: index + 1 };
    }
    if (char.charCodeAt(0) < 0x20) {
      return null;
    }
    value += char;
    index += 1;
  }
  return null;
}

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let index = 0;
  while (index < source.length) {
    const char = source[index];
    if (char.trim() === "") {
      index += 1;
      continue;
    }
    if (char === "." && source[index + 1] === ".") {
      tokens.push({ type: "Recursive", start: index, end: index + 2 });
      index += 2;
      continue;
    }
    if (char === ".") {
      tokens.push({ type: "Dot", start: index, end: index + 1 });
      index += 1;
      continue;
    }
    if (char === "$" || char === "@") {
      tokens.push({ type: char === "$" ? "Root" : "Current", start: index, end: index + 1 });
      index += 1;
      continue;
    }
    if (char === "[") {
      tokens.push({ type: "LBracket", start: index, end: index + 1 });
      index += 1;
      continue;
    }
    if (char === "]") {
      tokens.push({ type: "RBracket", start: index, end: index + 1 });
      index += 1;
      continue;
    }
    if (char === "*") {
      tokens.push({ type: "Wildcard", start: index, end: index + 1 });
      index += 1;
      continue;
    }
    if (char === "^") {
      tokens.push({ type: "Caret", start: index, end: index + 1 });
      index += 1;
      continue;
    }
    if (char === "~") {
      tokens.push({ type: "Tilde", start: index, end: index + 1 });
      index += 1;
      continue;
    }
    if (char === "`") {
      tokens.push({ type: "Backtick", start: index, end: index + 1 });
      index += 1;
      continue;
    }
    const stringToken = readString(source, index);
    if (stringToken) {
      tokens.push({ type: "String", value: stringToken.value, start: index, end: stringToken.end });
      index = stringToken.end;
      continue;
    }
    const numberToken = readNumber(source, index);
    if (numberToken) {
      tokens.push({ type: "Number", value: numberToken.value, start: index, end: numberToken.end });
      index = numberToken.end;
      continue;
    }
    const identToken = readIdentifier(source, index);
    if (identToken) {
      tokens.push({ type: "Identifier", value: identToken.value, start: index, end: identToken.end });
      index = identToken.end;
      continue;
    }
    tokens.push({ type: "Unknown", value: char, start: index, end: index + 1 });
    index += 1;
  }
  tokens.push({ type: "EOF", start: index, end: index });
  return tokens;
}

function isNonAsciiIdentifier(char: string) {
  const code = char.codePointAt(0);
  if (code === undefined || code < 0x80) {
    return false;
  }
  return !isIdentifierDelimiter(char);
}

function isIdentifierDelimiter(char: string) {
  if (char.trim() === "") {
    return true;
  }
  switch (char) {
    case ".":
    case "[":
    case "]":
    case "(":
    case ")":
    case "{":
    case "}":
    case ",":
    case "*":
    case "?":
    case "@":
    case "$":
    case ":":
    case "|":
    case "^":
    case "~":
    case "'":
    case "\"":
    case "\\":
      return true;
    default:
      return false;
  }
}
