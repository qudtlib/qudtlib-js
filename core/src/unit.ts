import { SupportsEquals } from "./baseTypes";
import { LangString } from "./langString";
import { Prefix } from "./prefix";
import { QuantityKind } from "./quantityKind";
import { FactorUnit } from "./factorUnit";
import { arrayContains, getLastIriElement } from "./utils";
import { FactorUnits } from "./factorUnits";
import { Decimal } from "decimal.js";

export class Unit implements SupportsEquals<Unit> {
  readonly iri: string;
  readonly labels: LangString[];
  readonly currencyCode;
  readonly currencyNumber;
  readonly prefixIri?: string;
  prefix?: Prefix;
  readonly conversionMultiplier: Decimal;
  readonly conversionOffset: Decimal;
  readonly quantityKindIris: string[];
  readonly quantityKinds: QuantityKind[] = [];
  readonly symbol?: string;
  readonly scalingOfIri?: string;
  scalingOf?: Unit;
  readonly dimensionVectorIri?: string;
  readonly factorUnits: FactorUnit[] = [];

  readonly unitOfSystemIris: string[];
  constructor(
    iri: string,
    quantityKindIris?: string[],
    dimensionVectorIri?: string,
    conversionMultiplier?: Decimal,
    conversionOffset?: Decimal,
    prefixIri?: string,
    scalingOfIri?: string,
    scalingOf?: Unit,
    symbol?: string,
    labels?: LangString[],
    currencyCode?: string,
    currencyNumber?: number,
    unitOfSystemIris?: string[]
  ) {
    this.iri = iri;
    this.prefixIri = prefixIri;
    this.conversionMultiplier =
      typeof conversionMultiplier === "undefined"
        ? new Decimal("1.0")
        : conversionMultiplier;
    this.conversionOffset =
      typeof conversionOffset === "undefined"
        ? new Decimal("0.0")
        : conversionOffset;
    this.symbol = symbol;
    this.scalingOfIri = scalingOfIri;
    this.scalingOf = scalingOf;
    this.dimensionVectorIri = dimensionVectorIri;
    this.prefix = undefined;
    if (typeof quantityKindIris === "undefined") {
      this.quantityKindIris = [];
    } else {
      this.quantityKindIris = quantityKindIris;
    }
    if (typeof labels === "undefined") {
      this.labels = [];
    } else {
      this.labels = labels;
    }
    this.currencyCode = currencyCode;
    this.currencyNumber = currencyNumber;
    if (typeof unitOfSystemIris === "undefined") {
      this.unitOfSystemIris = [];
    } else {
      this.unitOfSystemIris = unitOfSystemIris;
    }
  }

  equals(other?: Unit): boolean {
    return !!other && this.iri === other.iri;
  }

  toString(): string {
    if (this.symbol) {
      return this.symbol;
    }
    if (this.scalingOf?.symbol && this.prefix?.symbol) {
      return this.prefix.symbol + this.scalingOf.symbol;
    }
    return "unit:" + getLastIriElement(this.iri);
  }

  matchesFactorUnitSpec(...factorUnitSpec: (number | Unit)[]): boolean {
    return this.matches(FactorUnits.ofFactorUnitSpec(...factorUnitSpec));
  }

  matches(selection: FactorUnits): boolean {
    const thisNormalized: FactorUnits = this.normalize();
    const selectionNormalized: FactorUnits = selection.normalize();
    return thisNormalized.equals(selectionNormalized);
  }

  hasFactorUnits(): boolean {
    return this.factorUnits && this.factorUnits.length > 0;
  }

  isScaled(): boolean {
    return !!this.scalingOfIri;
  }

  hasSymbol(): boolean {
    return typeof this.symbol !== "undefined";
  }
  isConvertible(toUnit: Unit): boolean {
    return this.dimensionVectorIri === toUnit.dimensionVectorIri;
  }

  getConversionMultiplier(toUnit: Unit): Decimal {
    if (this.equals(toUnit)) {
      return new Decimal(1);
    }
    if (this.conversionOffsetDiffers(toUnit)) {
      throw `Cannot convert from ${this} to ${toUnit} just by multiplication as their conversion offsets differ`;
    }
    const fromMultiplier = this.conversionMultiplier
      ? this.conversionMultiplier
      : new Decimal(1);
    const toMultiplier = toUnit.conversionMultiplier
      ? toUnit.conversionMultiplier
      : new Decimal(1);
    return fromMultiplier.div(toMultiplier);
  }

  private findInBasesRecursively(toFind: Unit): boolean {
    if (!this.isScaled()) {
      return this.equals(toFind);
    }
    if (!!this.scalingOf) {
      return this.scalingOf.findInBasesRecursively(toFind);
    } else {
      throw `No base unit found for ${this} - this is a bug`;
    }
  }

  isSameScaleAs(other: Unit): boolean {
    if (this.equals(other)) {
      return true;
    }
    if (!!this.scalingOfIri && this.scalingOfIri === other.scalingOfIri) {
      return true;
    }
    return (
      this.findInBasesRecursively(other) || other.findInBasesRecursively(this)
    );
  }

  static isUnitless(unit: Unit): boolean {
    return unit.iri === "http://qudt.org/vocab/unit/UNITLESS";
  }

  convert(value: Decimal, toUnit: Unit): Decimal {
    if (!value) {
      throw "Parameter 'value' is required";
    }
    if (!toUnit) {
      throw "Parameter 'toUnit' is required";
    }
    if (this.equals(toUnit)) {
      return value;
    }
    if (Unit.isUnitless(this) || Unit.isUnitless(toUnit)) {
      return value;
    }
    if (!this.isConvertible(toUnit)) {
      throw `Not convertible: ${this} -> ${toUnit}`;
    }
    const fromOffset = this.conversionOffset
      ? this.conversionOffset
      : new Decimal(0);
    const fromMultiplier = this.conversionMultiplier
      ? this.conversionMultiplier
      : new Decimal(1);
    const toOffset = toUnit.conversionOffset
      ? toUnit.conversionOffset
      : new Decimal(0);
    const toMultiplier = toUnit.conversionMultiplier
      ? toUnit.conversionMultiplier
      : new Decimal(1);
    return value
      .add(fromOffset)
      .mul(fromMultiplier)
      .div(toMultiplier)
      .minus(toOffset);
  }

  addLabel(label: LangString): void {
    this.labels.push(label);
  }

  addQuantityKindIri(quantityKindIri: string): void {
    this.quantityKindIris.push(quantityKindIri);
  }

  hasLabel(label: string): boolean {
    return this.labels.some((l) => label === l.text);
  }

  getLabelForLanguageTag(languageTag: string): string | undefined {
    const label = this.labels.find((l) => languageTag === l.languageTag);
    return label?.text;
  }

  addQuantityKind(quantityKind: QuantityKind): void {
    this.quantityKinds.push(quantityKind);
  }

  addFactorUnit(factorUnit: FactorUnit): void {
    this.factorUnits.push(factorUnit);
  }

  setPrefix(prefix: Prefix): void {
    if (prefix.iri !== this.prefixIri)
      throw "prefix.iri does not equal this.prefixIri";
    this.prefix = prefix;
  }

  setScalingOf(scalingOf: Unit): void {
    if (scalingOf.iri !== this.scalingOfIri)
      throw "scalingOf.iri does not equal this.scalingOfIri";
    this.scalingOf = scalingOf;
  }

  /**
   * Returns this unit as a set of exponent-reduced factors, unless they are two factors that cancel each other out, in
   * which case return the unit as a factor unit with exponent 1. For example, Steradian is m²/m² and will
   * therefore return SR.
   */
  normalize(): FactorUnits {
    if (this.hasFactorUnits()) {
      const ret = this.factorUnits
        .flatMap((fu) => fu.normalize())
        .reduce((prev, cur) => cur.combineWith(prev));
      if (ret.isRatioOfSameUnits()) {
        // we don't want to reduce units like M²/M², as such units then match any other unit if they are
        // compared by the normalization result
        return FactorUnits.ofUnit(this);
      }
      return ret.reduceExponents();
    } else if (!!this.scalingOf) {
      return this.scalingOf
        .normalize()
        .scale(this.getConversionMultiplier(this.scalingOf));
    }
    return FactorUnits.ofUnit(this);
  }

  getLeafFactorUnitsWithCumulativeExponents(): FactorUnit[] {
    if (!this.factorUnits || this.factorUnits.length === 0) {
      return [new FactorUnit(this, 1)];
    }
    return this.factorUnits.flatMap((fu) =>
      fu.getLeafFactorUnitsWithCumulativeExponents()
    );
  }

  getAllPossibleFactorUnitCombinations(): FactorUnit[][] {
    if (!this.hasFactorUnits() || this.factorUnits.length === 0) {
      if (!!this.scalingOf) {
        return this.scalingOf.getAllPossibleFactorUnitCombinations();
      }
      return [[FactorUnit.ofUnit(this)]];
    }
    const result = FactorUnit.getAllPossibleFactorUnitCombinations(
      this.factorUnits
    );
    const thisAsResult = [FactorUnit.ofUnit(this)];
    if (
      !arrayContains(result, thisAsResult, (l, r) =>
        l.every((le) => r.some((re) => le.equals(re)))
      )
    ) {
      result.push(thisAsResult);
    }
    return result;
  }

  public conversionOffsetDiffers(other: Unit): boolean {
    if (
      this.hasNonzeroConversionOffset() &&
      other.hasNonzeroConversionOffset()
    ) {
      if (!!this.conversionOffset && !!other.conversionOffset) {
        return !this.conversionOffset.eq(other.conversionOffset);
      }
    }
    return false;
  }

  public hasNonzeroConversionOffset(): boolean {
    return !!this.conversionOffset && !this.conversionOffset.eq(new Decimal(0));
  }
}
