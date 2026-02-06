export function isIdentifierStart(char) {
    return /[A-Za-z_]/.test(char);
}
export function isIdentifierPart(char) {
    return /[A-Za-z0-9_]/.test(char);
}
export function readIdentifier(source, start) {
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
export function readNumber(source, start) {
    let index = start;
    if (source[index] === "-") {
        index += 1;
    }
    const first = source[index];
    if (first == null || !/[0-9]/.test(first)) {
        return null;
    }
    index += 1;
    while (index < source.length && /[0-9]/.test(source[index])) {
        index += 1;
    }
    return { value: source.slice(start, index), end: index };
}
export function readString(source, start) {
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
                break;
            }
            value += next;
            index += 2;
            continue;
        }
        if (char === quote) {
            return { value, end: index + 1 };
        }
        value += char;
        index += 1;
    }
    return null;
}
export function tokenize(source) {
    const tokens = [];
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
