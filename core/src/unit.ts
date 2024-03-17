import { SupportsEquals } from "./baseTypes.js";
import { LangString } from "./langString.js";
import { Prefix } from "./prefix.js";
import { QuantityKind } from "./quantityKind.js";
import { FactorUnit } from "./factorUnit.js";
import { arrayContains, getLastIriElement, isNullish, ZERO } from "./utils.js";
import { FactorUnits } from "./factorUnits.js";
import { Decimal } from "decimal.js";
import { QudtNamespaces } from "./qudtNamespaces.js";

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
  readonly exactMatchIris: string[];
  readonly symbol?: string;
  readonly scalingOfIri?: string;
  scalingOf?: Unit;
  readonly dimensionVectorIri?: string;
  factorUnits: FactorUnits = FactorUnits.empty();

  readonly unitOfSystemIris: string[];
  private static TEMPERATURE_DIFFERENCE = "TemperatureDifference";
  constructor(
    iri: string,
    quantityKindIris?: string[],
    exactMatchIris?: string[],
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
    if (typeof exactMatchIris === "undefined") {
      this.exactMatchIris = [];
    } else {
      this.exactMatchIris = exactMatchIris;
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
    this.factorUnits = FactorUnits.ofUnit(this); //might be replaced later by this.setFactorUnits().
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

  getIriLocalname(): string {
    return getLastIriElement(this.iri);
  }

  getIriAbbreviated(): string {
    return this.isCurrencyUnit()
      ? QudtNamespaces.currency.abbreviate(this.iri)
      : QudtNamespaces.unit.abbreviate(this.iri);
  }

  isCurrencyUnit(): boolean {
    return QudtNamespaces.currency.isFullNamespaceIri(this.iri);
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
    return this.factorUnits.hasFactorUnits();
  }

  /**
   * Returns true if this unit is defined to be another unit, such as litre is defined as cubic decimetre.
   */
  isDefinedAsOtherUnit(): boolean {
    return this.factorUnits.isOneOtherUnitWithExponentOne();
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

  convert(value: Decimal, toUnit: Unit, quantityKind?: QuantityKind): Decimal {
    if (isNullish(value)) {
      throw "Parameter 'value' is required";
    }
    if (isNullish(toUnit)) {
      throw "Parameter 'toUnit' is required";
    }
    let ignoreOffset = false;
    if (!isNullish(quantityKind)) {
      if (quantityKind?.getIriLocalname() === Unit.TEMPERATURE_DIFFERENCE) {
        ignoreOffset = true;
      }
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
    const fromOffset = ignoreOffset
      ? ZERO
      : this.conversionOffset
      ? this.conversionOffset
      : ZERO;
    const fromMultiplier = this.conversionMultiplier
      ? this.conversionMultiplier
      : new Decimal(1);
    const toOffset = ignoreOffset
      ? ZERO
      : toUnit.conversionOffset
      ? toUnit.conversionOffset
      : ZERO;
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
  addExactMatchIri(exactMatchIri: string): void {
    this.exactMatchIris.push(exactMatchIri);
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

  setFactorUnits(factorUnits: FactorUnits): void {
    this.factorUnits = factorUnits;
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
      return this.factorUnits.normalize();
    } else if (
      this.scalingOf !== null &&
      typeof this.scalingOf !== "undefined"
    ) {
      return this.scalingOf
        .normalize()
        .scale(this.getConversionMultiplier(this.scalingOf));
    }
    return this.factorUnits;
  }

  getLeafFactorUnitsWithCumulativeExponents(): FactorUnit[] {
    if (this.hasFactorUnits()) {
      const result = this.factorUnits.factorUnits.flatMap((fu) =>
        fu.getLeafFactorUnitsWithCumulativeExponents()
      );
      return result;
    } else {
      return [FactorUnit.ofUnit(this)];
    }
  }

  getAllPossibleFactorUnitCombinations(): FactorUnit[][] {
    if (!this.hasFactorUnits()) {
      if (!!this.scalingOf) {
        return this.scalingOf.getAllPossibleFactorUnitCombinations();
      }
      return [[FactorUnit.ofUnit(this)]];
    }
    const result = FactorUnit.getAllPossibleFactorUnitCombinations(
      this.factorUnits.factorUnits
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
    return !!this.conversionOffset && !this.conversionOffset.eq(ZERO);
  }
}
