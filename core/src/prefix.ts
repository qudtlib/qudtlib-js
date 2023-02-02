import { SupportsEquals } from "./baseTypes";
import { LangString } from "./langString";
import {
  arrayEqualsIgnoreOrdering,
  compareUsingEquals,
  getLastIriElement,
} from "./utils";
import { Decimal } from "decimal.js";

export class Prefix implements SupportsEquals<Prefix> {
  iri: string;
  multiplier: Decimal;
  symbol: string;
  ucumCode?: string;
  labels: LangString[];

  constructor(
    iri: string,
    multiplier: Decimal,
    symbol: string,
    ucumCode?: string,
    labels?: LangString[]
  ) {
    this.iri = iri;
    this.multiplier = multiplier;
    this.symbol = symbol;
    this.ucumCode = ucumCode;
    if (typeof labels === "undefined") {
      this.labels = [];
    } else {
      this.labels = labels;
    }
  }

  equals(other?: Prefix): boolean {
    return (
      !!other &&
      this.iri === other.iri &&
      this.multiplier.equals(other.multiplier) &&
      this.symbol === other.symbol &&
      this.ucumCode === other.ucumCode &&
      this.labels.length == other.labels.length &&
      arrayEqualsIgnoreOrdering(this.labels, other.labels, compareUsingEquals)
    );
  }

  toString(): string {
    if (this.symbol) {
      return this.symbol;
    }
    return "prefix:" + getLastIriElement(this.iri);
  }

  addLabel(label: LangString): void {
    this.labels.push(label);
  }
}
