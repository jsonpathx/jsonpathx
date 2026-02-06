export function toPathString(path) {
    if (path.length === 0) {
        return "$";
    }
    const segments = path.map((entry) => {
        if (typeof entry === "number") {
            return `[${entry}]`;
        }
        const escaped = entry.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
        return `['${escaped}']`;
    });
    return `$${segments.join("")}`;
}
export function toPointer(path) {
    if (path.length === 0) {
        return "";
    }
    return ("/" +
        path
            .map((entry) => String(entry))
            .map((segment) => segment.replace(/~/g, "~0").replace(/\//g, "~1"))
            .join("/"));
}
