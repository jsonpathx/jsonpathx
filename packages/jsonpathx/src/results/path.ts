import type { PathKey } from "../evaluator/context.js";

export function toPathString(path: PathKey[]): string {
  if (path.length === 0) {
    return "$";
  }
  const segments = path.map((entry) => {
    if (typeof entry === "number") {
      return `[${entry}]`;
    }
    const escaped = escapePathComponent(entry);
    return `['${escaped}']`;
  });
  return `$${segments.join("")}`;
}

function escapePathComponent(value: string): string {
  let escaped = "";
  for (const char of value) {
    switch (char) {
      case "\\":
        escaped += "\\\\";
        break;
      case "'":
        escaped += "\\'";
        break;
      case "\b":
        escaped += "\\b";
        break;
      case "\f":
        escaped += "\\f";
        break;
      case "\n":
        escaped += "\\n";
        break;
      case "\r":
        escaped += "\\r";
        break;
      case "\t":
        escaped += "\\t";
        break;
      default: {
        const code = char.charCodeAt(0);
        if (code < 0x20) {
          escaped += `\\u${code.toString(16).padStart(4, "0")}`;
        } else {
          escaped += char;
        }
      }
    }
  }
  return escaped;
}

export function toPointer(path: PathKey[]): string {
  if (path.length === 0) {
    return "";
  }
  return (
    "/" +
    path
      .map((entry) => String(entry))
      .map((segment) => segment.replace(/~/g, "~0").replace(/\//g, "~1"))
      .join("/")
  );
}
