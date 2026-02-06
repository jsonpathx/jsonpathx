export class ParseError extends Error {
    index;
    constructor(message, index) {
        super(`${message} (at ${index})`);
        this.name = "ParseError";
        this.index = index;
    }
}
