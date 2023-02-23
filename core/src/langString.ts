import { SupportsEquals } from "./baseTypes.js";

export class LangString implements SupportsEquals<LangString> {
  readonly text: string;
  readonly languageTag?: string;

  constructor(text: string, languageTag?: string) {
    this.text = text;
    this.languageTag = languageTag;
  }

  equals(other?: LangString): boolean {
    return (
      !!other &&
      this.text === other.text &&
      this.languageTag === other.languageTag
    );
  }

  toString(): string {
    return this.text + (this.languageTag ? `@${this.languageTag}` : "");
  }
}
