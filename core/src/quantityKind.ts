import { SupportsEquals } from "./baseTypes";
import { LangString } from "./langString";
import { getLastIriElement } from "./utils";

export class QuantityKind implements SupportsEquals<QuantityKind> {
  readonly iri: string;
  readonly labels: LangString[];
  readonly applicableUnitIris: string[];
  readonly broaderQuantityKindIris: string[];
  readonly dimensionVectorIri?: string;
  readonly symbol?: string;

  constructor(
    iri: string,
    dimensionVector?: string,
    symbol?: string,
    labels?: LangString[]
  ) {
    this.iri = iri;
    this.applicableUnitIris = [];
    this.broaderQuantityKindIris = [];
    this.dimensionVectorIri = dimensionVector;
    this.symbol = symbol;
    if (typeof labels === "undefined") {
      this.labels = [];
    } else {
      this.labels = labels;
    }
  }

  addLabel(label: LangString): void {
    this.labels.push(label);
  }

  hasLabel(label: string): boolean {
    return this.labels.some((l) => label === l.text);
  }

  getLabelForLanguageTag(languageTag: string): string | undefined {
    const label = this.labels.find((l) => languageTag === l.languageTag);
    return label?.text;
  }

  addApplicableUnitIri(unit: string): void {
    this.applicableUnitIris.push(unit);
  }

  addBroaderQuantityKindIri(quantityKind: string): void {
    this.broaderQuantityKindIris.push(quantityKind);
  }

  equals(other?: QuantityKind): boolean {
    return !!other && this.iri === other.iri;
  }

  toString(): string {
    if (this.symbol) {
      return this.symbol;
    }
    return "quantityKind:" + getLastIriElement(this.iri);
  }
}