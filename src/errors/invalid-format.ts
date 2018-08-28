export class InvalidFormatError extends Error {
  constructor(str: string, format: string) {
    super(
      `Invalid string ${str} provided. Expected format ${format}`
    );
  }
}
