export class ParseError extends Error {
  readonly index: number;

  constructor(message: string, index: number) {
    super(`${message} (at ${index})`);
    this.name = "ParseError";
    this.index = index;
  }
}
