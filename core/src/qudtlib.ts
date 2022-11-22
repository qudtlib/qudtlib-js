import { Decimal } from "decimal.js";

export { Decimal };

export class QudtlibConfig {
  readonly units: Map<string, Unit>;
  readonly quantityKinds: Map<string, QuantityKind>;
  readonly prefixes: Map<string, Prefix>;

  constructor() {
    this.units = new Map<string, Unit>();
    this.quantityKinds = new Map<string, QuantityKind>();
    this.prefixes = new Map<string, Prefix>();
  }
}

export const config = new QudtlibConfig();

export type UnitOrExponent = Unit | number;
export type ExponentUnitPairs = UnitOrExponent[];

interface SupportsEquals<Type> {
  equals(other?: Type): boolean;
}

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

export class QuantityValue implements SupportsEquals<QuantityValue> {
  value: Decimal;
  unit: Unit;

  constructor(quantity: Decimal, unit: Unit) {
    this.value = quantity;
    this.unit = unit;
  }

  equals(other?: QuantityValue): boolean {
    return (
      !!other && this.value.equals(other.value) && this.unit.equals(other.unit)
    );
  }

  toString(): string {
    return this.value.toString() + this.unit.toString();
  }

  convert(to: Unit) {
    return new QuantityValue(this.unit.convert(this.value, to), to);
  }
}

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

function checkInteger(arg: number, argName: string) {
  if (!Number.isInteger(arg)) {
    throw `${argName} must be integer, ${arg} (type ${typeof arg}) is not`;
  }
}

/**
 * Governs the algorithm used to find units based on their derived units. The DerivedUnitSearchMode
 * is mapped to the {@link FactorUnitMatchingMode} which governs individual unit/factor unit
 * matching.
 */
export enum DerivedUnitSearchMode {
  /** Return all matching units. */
  ALL,
  /**
   * Return the best matching unit.
   */
  BEST_MATCH,
}

/** Specifies the check whether a Unit matches a given set of factor units. */
export enum FactorUnitMatchingMode {
  /** Only select exact matches. */
  EXACT,
  /**
   * Select exact matches and units whose factor units have different scale, but the scale of the
   * result is equivalent to the cumulative scale of the original factor units
   */
  ALLOW_SCALED,
}

/**
 * Combines a {@link Unit} and an exponent; some Units are a combination of {@link FactorUnit}s. If
 * a unit is such a 'derived unit', its {@link Unit#getFactorUnits()} method returns a non-empty Set
 * of FactorUnits.
 *
 */
export class FactorUnit implements SupportsEquals<FactorUnit> {
  readonly exponent: number;
  readonly unit: Unit;

  constructor(unit: Unit, exponent: number) {
    checkInteger(exponent, "exponent");
    this.exponent = exponent;
    this.unit = unit;
  }

  /**
   * Perform mathematical simplification on factor units. Only simplifies units with exponents of the same sign.
   *
   * For example,
   * ```
   * N / M * M -> N per M^2
   * ```
   *
   * @param factorUnits the factor units to simplify
   * @return the simplified factor units.
   */
  static contractExponents(factorUnits: FactorUnit[]): FactorUnit[] {
    const ret: FactorUnit[] = [];
    const factorUnitsByKind: Map<string, FactorUnit> = factorUnits.reduce(
      (mapping, cur) => {
        const kind = cur.getKind();
        const prevUnit = mapping.get(kind);
        if (prevUnit) {
          mapping.set(kind, FactorUnit.combine(prevUnit, cur));
        } else {
          mapping.set(kind, cur);
        }
        return mapping;
      },
      new Map<string, FactorUnit>()
    );
    for (const fu of factorUnitsByKind.values()) {
      ret.push(fu);
    }
    return ret;
  }

  static reduceExponents(factorUnits: FactorUnit[]): FactorUnit[] {
    const ret: FactorUnit[] = [];
    const exponentsByUnit: Map<Unit, number> = factorUnits.reduce(
      (mapping, cur) => {
        const unit = cur.unit;
        const prevExponent = mapping.get(unit);
        if (prevExponent) {
          mapping.set(unit, prevExponent + cur.exponent);
        } else {
          mapping.set(unit, cur.exponent);
        }
        return mapping;
      },
      new Map<Unit, number>()
    );
    for (const [unit, exponent] of exponentsByUnit.entries()) {
      if (Math.abs(exponent) > 0) {
        ret.push(new FactorUnit(unit, exponent));
      }
    }
    return ret;
  }

  pow(by: number): FactorUnit {
    checkInteger(by, "by");
    return new FactorUnit(this.unit, this.exponent * by);
  }

  static normalizeFactorUnits(factorUnits: FactorUnit[]) {
    const ret = factorUnits
      .flatMap((fu) => fu.normalize())
      .reduce((prev, cur) => cur.combineWith(prev));
    if (ret.isRatioOfSameUnits()) {
      // we don't want to reduce units like M²/M², as such units then match any other unit if they are
      // compared by the normalization result
      return ret;
    }
    return ret.reduceExponents();
  }

  getExponentCumulated(cumulatedExponent: number): number {
    checkInteger(cumulatedExponent, "cumulatedExponent");
    return this.exponent * cumulatedExponent;
  }

  isCompatibleWith(other: FactorUnit): boolean {
    return (
      this.exponent === other.exponent && this.unit.isConvertible(other.unit)
    );
  }

  getConversionMultiplier(other: FactorUnit): Decimal {
    if (!this.isCompatibleWith(other)) {
      throw `${this.toString()} is not compatible with ${other.toString()}`;
    }
    return this.unit.getConversionMultiplier(other.unit).pow(this.exponent);
  }

  equals(other?: FactorUnit): boolean {
    return (
      !!other &&
      this.exponent === other.exponent &&
      this.unit.equals(other.unit)
    );
  }

  toString(): string {
    return (
      this.unit.toString() + (this.exponent === 1 ? "" : "^" + this.exponent)
    );
  }

  static combine(left: FactorUnit, right: FactorUnit): FactorUnit {
    if (left.getKind() !== right.getKind()) {
      throw `Cannot combine UnitFactors of different kind (left: ${left}, right: ${right}`;
    }
    if (!left.unit.equals(right.unit)) {
      throw `Cannot combine UnitFactors of different units (left: ${left.unit.toString()}, right:${right.unit.toString()}`;
    }
    return new FactorUnit(left.unit, left.exponent + right.exponent);
  }

  /**
   * Combines unit IRI and sign of exponent in one string.
   */
  getKind(): string {
    return (
      this.unit.iri +
      (this.exponent === 0 ? "0" : this.exponent > 0 ? "1" : "-1")
    );
  }

  getLeafFactorUnitsWithCumulativeExponents(): FactorUnit[] {
    const leafFactorUnits =
      this.unit.getLeafFactorUnitsWithCumulativeExponents();
    if (!!leafFactorUnits?.length) {
      return leafFactorUnits.map((fu) => fu.pow(this.exponent));
    }
    return [this];
  }

  normalize(): FactorUnits {
    return this.unit.normalize().pow(this.exponent);
  }
}

/**
 * Class representing a set of FactorUnits and a conversionMultiplier, so the units can be
 * used to replace any other unit of the same dimensionality.
 */
export class FactorUnits implements SupportsEquals<FactorUnits> {
  readonly factorUnits: FactorUnit[];
  readonly conversionMultiplier: Decimal;

  constructor(
    factorUnits: FactorUnit[],
    scaleFactor: Decimal = new Decimal(1)
  ) {
    this.factorUnits = factorUnits;
    this.conversionMultiplier = scaleFactor;
  }

  static ofUnit(unit: Unit) {
    return new FactorUnits([new FactorUnit(unit, 1)]);
  }

  static ofFactorUnitSpec(...factorUnitSpec: (Unit | number)[]): FactorUnits {
    if (factorUnitSpec.length % 2 !== 0) {
      throw "An even number of arguments is required";
    }
    if (factorUnitSpec.length > 14) {
      throw "No more than 14 arguments (7 factor units) are supported";
    }
    const factorUnits = [];
    for (let i = 0; i < factorUnitSpec.length; i += 2) {
      const requestedUnit = factorUnitSpec[i];
      const requestedExponent = factorUnitSpec[i + 1];
      if (!(requestedUnit instanceof Unit)) {
        throw `argument at 0-based position ${i} is not of type Unit. The input must be between 1 and 7 Unit, exponent pairs`;
      }
      if (
        typeof requestedExponent !== "number" ||
        !Number.isInteger(requestedExponent)
      ) {
        throw `argument at 0-based position ${
          i + 1
        } is not of type number or not an integer. The input must be between 1 and 7 Unit, exponent pairs`;
      }
      factorUnits.push(new FactorUnit(requestedUnit, requestedExponent));
    }
    return new FactorUnits(factorUnits);
  }

  /**
   * Returns this ScaledFactorUnits object, raised to the specified power.
   * @param power
   */
  pow(power: number) {
    return new FactorUnits(
      this.factorUnits.map((fu) => fu.pow(power)),
      this.conversionMultiplier.pow(power)
    );
  }

  /**
   *
   * @param other
   */
  combineWith(other: FactorUnits | undefined): FactorUnits {
    if (!other) {
      return this;
    }
    return new FactorUnits(
      FactorUnit.contractExponents([...this.factorUnits, ...other.factorUnits]),
      this.conversionMultiplier.mul(other.conversionMultiplier)
    );
  }

  /**
   * Returns this ScaledFactorUnits object, with its conversionMultiplier multiplied by the specified value.
   *
   * @param by
   */
  scale(by: Decimal) {
    return new FactorUnits(this.factorUnits, this.conversionMultiplier.mul(by));
  }

  scaleFactor(other: FactorUnits) {
    return this.conversionMultiplier.div(other.conversionMultiplier);
  }

  isRatioOfSameUnits() {
    return (
      this.factorUnits.length === 2 &&
      this.factorUnits[0].unit.equals(this.factorUnits[1].unit) &&
      this.factorUnits[0].exponent === this.factorUnits[1].exponent * -1
    );
  }

  reduceExponents() {
    return new FactorUnits(
      FactorUnit.reduceExponents(this.factorUnits),
      this.conversionMultiplier
    );
  }

  normalize(): FactorUnits {
    const normalized = FactorUnit.normalizeFactorUnits(this.factorUnits);
    return new FactorUnits(
      normalized.factorUnits,
      normalized.conversionMultiplier.mul(this.conversionMultiplier)
    );
  }

  equals(other?: FactorUnits): boolean {
    if (!other) {
      return false;
    }
    return (
      this.conversionMultiplier.eq(other?.conversionMultiplier) &&
      arrayEqualsIgnoreOrdering(
        this.factorUnits,
        other?.factorUnits,
        compareUsingEquals
      )
    );
  }

  toString(): string {
    return (
      (this.conversionMultiplier.eq(new Decimal(1))
        ? ""
        : this.conversionMultiplier.toString() + "*") +
      "[" +
      this.factorUnits.map((s) => s.toString()).reduce((p, n) => p + ", " + n) +
      "]"
    );
  }
}

export class Unit implements SupportsEquals<Unit> {
  readonly iri: string;
  readonly labels: LangString[];
  readonly prefixIri?: string;
  prefix?: Prefix;
  readonly conversionMultiplier?: Decimal;
  readonly conversionOffset?: Decimal;
  readonly quantityKindIris: string[];
  readonly quantityKinds: QuantityKind[] = [];
  readonly symbol?: string;
  readonly scalingOfIri?: string;
  scalingOf?: Unit;
  readonly dimensionVectorIri?: string;
  readonly factorUnits: FactorUnit[] = [];

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
    labels?: LangString[]
  ) {
    this.iri = iri;
    this.prefixIri = prefixIri;
    this.conversionMultiplier = conversionMultiplier;
    this.conversionOffset = conversionOffset;
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

  private factorUnitsMatch(
    leftSFU: FactorUnits,
    rightSFU: FactorUnits,
    mode: FactorUnitMatchingMode = FactorUnitMatchingMode.EXACT
  ) {
    if (mode === FactorUnitMatchingMode.EXACT) {
      return leftSFU.equals(rightSFU);
    }
    const left = leftSFU.factorUnits;
    const right = rightSFU.factorUnits;
    let scaleFactor: Decimal = new Decimal(1);
    if (!left || !right || left.length !== right.length) {
      return false;
    }
    const unmatched = Array.from({ length: left.length }, (v, i) => i);
    outer: for (let i = 0; i < left.length; i++) {
      for (let j = 0; j < unmatched.length; j++) {
        const leftFactorUnit = left[i];
        const rightFactorUnit = right[unmatched[j]];
        if (leftFactorUnit.isCompatibleWith(rightFactorUnit)) {
          scaleFactor = scaleFactor.mul(
            leftFactorUnit.getConversionMultiplier(rightFactorUnit)
          );
          unmatched.splice(j, 1);
          continue outer;
        }
      }
      return false;
    }
    const conversionFactor = leftSFU.scaleFactor(rightSFU);
    return scaleFactor.eq(conversionFactor);
  }

  matches(selection: FactorUnits): boolean {
    const thisNormalized: FactorUnits = this.normalize();
    const selectionNormalized: FactorUnits = selection.normalize();
    return this.factorUnitsMatch(thisNormalized, selectionNormalized);
  }

  hasFactorUnits(): boolean {
    return this.factorUnits && this.factorUnits.length > 0;
  }

  isScaled(): boolean {
    return !!this.scalingOfIri;
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

export const QUDT_UNIT_BASE_IRI = "http://qudt.org/vocab/unit/";
export const QUDT_QUANTITYKIND_BASE_IRI = "http://qudt.org/vocab/quantitykind/";
export const QUDT_PREFIX_BASE_IRI = "http://qudt.org/vocab/prefix/";

function findInIterable<T>(
  iterable: IterableIterator<T>,
  predicate: (value: T) => boolean
): T | undefined {
  for (const elem of iterable) {
    if (predicate(elem)) {
      return elem;
    }
  }
  return undefined;
}

export class Qudt {
  /**
   * Returns the first unit found whose label matches the specified label after replacing any
   * underscore with space and ignoring case (US locale). If more intricate matching is needed,
   * clients can use `{@link #allUnits()}.filter(...)`.
   *
   * @param label the matched label
   * @return the first unit found
   */
  static unitFromLabel(label: string): Unit | undefined {
    const matcher: LabelMatcher =
      new CaseInsensitiveUnderscoreIgnoringLabelMatcher(label);
    const firstMatch: Unit | undefined = findInIterable(
      config.units.values(),
      (u) => matcher.matchesLangStrings(u.labels)
    );
    return firstMatch;
  }

  static unitFromLabelRequired(label: string): Unit {
    const match = this.unitFromLabel(label);
    if (!match) throw `No unit found for label ${label}`;
    return match;
  }

  static unitFromLocalname(localname: string): Unit | undefined {
    return Qudt.unit(Qudt.unitIriFromLocalname(localname));
  }

  static unitFromLocalnameRequired(localname: string): Unit {
    return Qudt.unitRequired(Qudt.unitIriFromLocalname(localname));
  }

  static quantityKindFromLocalname(
    localname: string
  ): QuantityKind | undefined {
    return Qudt.quantityKind(Qudt.quantityKindIriFromLocalname(localname));
  }

  static quantityKindFromLocalnameRequired(localname: string): QuantityKind {
    return Qudt.quantityKindRequired(
      Qudt.quantityKindIriFromLocalname(localname)
    );
  }

  static prefixFromLabelRequired(label: string): Prefix {
    const match = this.prefixFromLabel(label);
    if (!match) throw `No prefix found for label ${label}`;
    return match;
  }

  static prefixFromLabel(label: string): Prefix | undefined {
    const matcher: LabelMatcher =
      new CaseInsensitiveUnderscoreIgnoringLabelMatcher(label);
    const firstMatch: Prefix | undefined = findInIterable(
      config.prefixes.values(),
      (u) => matcher.matchesLangStrings(u.labels)
    );
    return firstMatch;
  }

  static prefixFromLocalname(localname: string): Prefix | undefined {
    return Qudt.prefix(Qudt.prefixIriFromLocalname(localname));
  }

  static prefixFromLocalnameRequired(localname: string): Prefix {
    return Qudt.prefixRequired(Qudt.prefixIriFromLocalname(localname));
  }

  static unitIriFromLocalname(localname: string): string {
    return QUDT_UNIT_BASE_IRI + localname;
  }

  static quantityKindIriFromLocalname(localname: string): string {
    return QUDT_QUANTITYKIND_BASE_IRI + localname;
  }

  static prefixIriFromLocalname(localname: string): string {
    return QUDT_PREFIX_BASE_IRI + localname;
  }

  /**
   * Returns the {@link Unit} identified the specified IRI. For example, <code>
   * unit("http://qudt.org/vocab/unit/N-PER-M2")</code> yields `Units.N__PER__M2`,
   * if that unit has been loaded;
   *
   * @param iri the requested unit IRI
   * @return the unit or `undefined` if no unit is found
   */
  static unit(unitIri: string): Unit | undefined {
    return config.units.get(unitIri);
  }

  /**
   * Same as {@link #unit(string)} but throws an exception if no unit is found.
   * @param unitIri the unit IRI
   * @return the unit
   */
  static unitRequired(unitIri: string): Unit {
    const ret = Qudt.unit(unitIri);
    if (typeof ret === "undefined") {
      throw `Unit ${unitIri} not found`;
    }
    return ret;
  }

  static quantityKind(quantityKindIri: string): QuantityKind | undefined {
    return config.quantityKinds.get(quantityKindIri);
  }

  static quantityKindRequired(quantityKindIri: string): QuantityKind {
    const ret = Qudt.quantityKind(quantityKindIri);
    if (typeof ret === "undefined") {
      throw `QuantityKind ${quantityKindIri} not found`;
    }
    return ret;
  }

  static prefix(prefixIri: string): Prefix | undefined {
    return config.prefixes.get(prefixIri);
  }

  static prefixRequired(prefixIri: string): Prefix {
    const ret = Qudt.prefix(prefixIri);
    if (typeof ret === "undefined") {
      throw `Prefix ${prefixIri} not found`;
    }
    return ret;
  }

  static quantityKinds(unit: Unit): QuantityKind[] {
    return unit.quantityKindIris.map((iri) => Qudt.quantityKindRequired(iri));
  }

  static quantityKindsBroad(unit: Unit): QuantityKind[] {
    let current: QuantityKind[] = Qudt.quantityKinds(unit);
    const result: QuantityKind[] = [];
    current.forEach((qk) => result.push(qk));
    while (current.length) {
      current = current
        .flatMap((qk) => qk.broaderQuantityKindIris)
        .map((iri) => Qudt.quantityKindRequired(iri));
      current.forEach((qk) => result.includes(qk) || result.push(qk));
    }
    return result;
  }

  /**
   * Obtains units based on factor units, using the specified {@link FactorUnitMatchingMode}.
   *
   * For example,
   *
   * ```
   *   const spec = new Map<Unit, number>();
   *    spec.set(Units.M, 1);
   *    spec.set(Units.KiloGM, 1);
   *    spec.set(Units.SEC, -2);
   * Qudt.derivedUnitsFrom Map(
   *    FactorUnitMatchingMode.EXACT, spec);
   * ```
   *
   * will yield an array containing the Newton Unit ({@code Qudt.Units.N})
   *
   * @param searchMode the {@link DerivedUnitSearchMode} to use
   * @param factorUnits a map containing unit to exponent entries.
   * @return the derived units that match the given factor units
   */
  static derivedUnitsFromMap(
    searchMode: DerivedUnitSearchMode,
    factorUnits: Map<Unit, number>
  ): Unit[] {
    const flattened: (Unit | number)[] = [];
    for (const [key, value] of factorUnits.entries()) {
      flattened.push(key, value);
    }
    return this.derivedUnitsFromExponentUnitPairs(searchMode, ...flattened);
  }

  /**
   * Obtains units based on factor units.
   *
   * @param searchMode the {@link DerivedUnitSearchMode} to use
   * @param factorUnits the factor units
   * @return the derived unit that match the given factor units
   * @see #derivedUnitsFromMap(DerivedUnitSearchMode, Map)
   */
  static derivedUnitsFromFactorUnits(
    searchMode: DerivedUnitSearchMode,
    ...factorUnits: FactorUnit[]
  ): Unit[] {
    const flattened = factorUnits.flatMap((fu) => [fu.unit, fu.exponent]);
    return this.derivedUnitsFromExponentUnitPairs(searchMode, ...flattened);
  }

  /**
   * Vararg method, must be an even number of arguments, always alternating types of Unit|String
   * and Integer.
   *
   * @param factorUnitSpec alternating Unit (representing a unit IRI) and Decimal|number (the
   *     exponent)
   * @return the units that match
   */
  static derivedUnitsFromExponentUnitPairs(
    searchMode: DerivedUnitSearchMode,
    ...factorUnitSpecs: (Unit | string | number)[]
  ): Unit[] {
    const spec: (Unit | number)[] = [];
    for (let i = 0; i < factorUnitSpecs.length; i++) {
      const specAtI: Unit | string | number = factorUnitSpecs[i];
      if (i % 2 == 0 && specAtI instanceof Unit) {
        spec[i] = specAtI as Unit;
      } else if (i % 2 == 0 && typeof specAtI === "string") {
        const unitString: string = specAtI as string;
        let unit = Qudt.unit(unitString);
        if (typeof unit === "undefined") {
          unit = Qudt.unitFromLocalname(unitString);
        }
        if (typeof unit === "undefined") {
          unit = Qudt.unitFromLabel(unitString);
        }
        if (typeof unit === "undefined") {
          throw `Unable to find unit for string ${unitString}, interpreted as iri, label or localname`;
        }
        spec[i] = unit;
      } else if (i % 2 == 1 && typeof specAtI === "number") {
        spec[i] = specAtI;
      } else {
        throw `Cannot handle input ${specAtI} at 0-based position ${i}`;
      }
    }
    const initialFactorUnitSelection = FactorUnits.ofFactorUnitSpec(...spec);
    return Qudt.derivedUnitsFromFactorUnitSelection(
      searchMode,
      initialFactorUnitSelection
    );
  }

  /**
   * @param searchMode the {@link DerivedUnitSearchMode} to use
   * @param selection the factor unit selection
   * @return the units that match
   * @see #derivedUnitsFromMap(DerivedUnitSearchMode, Map)
   */
  static derivedUnitsFromFactorUnitSelection(
    searchMode: DerivedUnitSearchMode,
    initialFactorUnitSelection: FactorUnits
  ): Unit[] {
    if (searchMode === DerivedUnitSearchMode.ALL) {
      return this.findMatchingUnits(initialFactorUnitSelection);
    } else {
      const requestedUnits: FactorUnit[] =
        initialFactorUnitSelection.factorUnits;
      const scores: Map<Unit, number> = new Map();
      const results = this.findMatchingUnits(initialFactorUnitSelection);
      for (const result of results) {
        scores.set(result, Qudt.matchScore(result, requestedUnits));
      }
      return [
        arrayMax(
          results,
          (left, right) => (scores.get(left) || 0) - (scores.get(right) || 0)
        ),
      ];
    }
  }

  private static matchScore(unit: Unit, selection: FactorUnit[]): number {
    const unitLeafFactors = unit.getLeafFactorUnitsWithCumulativeExponents();
    const numExactMatches = arrayCountEqualElements(
      unitLeafFactors,
      selection,
      compareUsingEquals
    );
    //break ties with string matches in the local names
    const unitLocalName = getLastIriElement(unit.iri);
    const tiebreaker: number = selection.reduce(
      (prev, cur) =>
        prev + unitLocalName.indexOf(getLastIriElement(cur.unit.iri)) > -1
          ? 1
          : 0,
      0
    );

    return (
      numExactMatches / selection.length +
      tiebreaker / selection.length / selection.length
    );
  }

  private static retainOnlyOne(matchingUnits: Unit[]): Unit {
    return matchingUnits.reduce((p, n) => (p.iri > n.iri ? n : p));
  }

  private static findMatchingUnits(
    initialFactorUnitSelection: FactorUnits
  ): Unit[] {
    const matchingUnits: Unit[] = [];
    for (const unit of config.units.values()) {
      if (unit.matches(initialFactorUnitSelection)) {
        matchingUnits.push(unit);
      }
    }
    arrayDeduplicate(matchingUnits, compareUsingEquals);
    return matchingUnits;
  }

  /**
   * Returns the unit resulting from scaling the specified `unit` with the specified `prefix`.
   * NOTE: if you have unit/prefix labels (not IRIs) - such as "KILO", "NEWTON", use {@link #scaleUnitFromLabels(string, string):Unit}.
   *
   * @param prefix the prefix to use for scaling or its IRI.
   * @param baseUnit the unit to scale or its IRI
   * @return the resulting unit
   * @throws exception if no such unit is found
   */
  static scale(prefix: Prefix | string, baseUnit: Unit | string) {
    const thePrefix =
      prefix instanceof Prefix ? prefix : this.prefixRequired(prefix);
    const theUnit =
      baseUnit instanceof Unit ? baseUnit : this.unitRequired(baseUnit);
    for (const u of config.units.values()) {
      if (u.prefix?.equals(thePrefix) && u.scalingOf?.equals(theUnit)) {
        return u;
      }
    }
    throw `No scaled unit found with base unit ${theUnit.toString()} and prefix ${thePrefix.toString()}`;
  }

  /**
   * Returns the unit resulting from scaling the specified `baseUnitLabel` label
   * (such as "METER") with the specified `prefixLabel` (such as "KILO").
   *
   * @param prefixLabel the label of the prefix, case-insensitive , such as "KILO", or "kilo"
   * @param baseUnitLabel the label of the base unit, case-insensitive, such as "Meter"
   */
  static scaleUnitFromLabels(prefixLabel: string, baseUnitLabel: string) {
    return this.scale(
      Qudt.prefixFromLabelRequired(prefixLabel),
      Qudt.unitFromLabelRequired(baseUnitLabel)
    );
  }

  /**
   * Returns the list of {@link FactorUnit}s of the specified `unit`.
   *
   * @param unit the unit to get factors for
   * @return the factors of the unit or an empty list if the unit is not a derived unit
   */
  static factorUnits(unit: Unit): FactorUnit[] {
    return FactorUnit.contractExponents(
      unit.getLeafFactorUnitsWithCumulativeExponents()
    );
  }

  /**
   * Perform mathematical simplification on factor units. Only simplifies units with exponents of the same sign.
   *
   * For example,
   * ```
   * N / M * M -> N per M^2
   * ```
   *
   * @param factorUnits the factor units to simplify
   * @return the simplified factor units.
   * @deprecated `use contractExponents(FactorUnit[]): FactorUnit[]` instead
   */
  static simplifyFactorUnits(factorUnits: FactorUnit[]): FactorUnit[] {
    return FactorUnit.contractExponents(factorUnits);
  }

  static contractFactorUnits(factorUnits: FactorUnit[]): FactorUnit[] {
    return FactorUnit.contractExponents(factorUnits);
  }

  static reduceFactorUnits(factorUnits: FactorUnit[]): FactorUnit[] {
    return FactorUnit.reduceExponents(factorUnits);
  }

  static unscale(unit: Unit): Unit {
    if (!unit.scalingOfIri) {
      return unit;
    }
    return this.unitRequired(unit.scalingOfIri);
  }

  /**
   * Return a list of {@link FactorUnit}s with the same exponents as the specified `factorUnits` but their base units as units.
   *
   * @param factorUnits the factor units to unscale
   * @return the unscaled factor units
   */
  static unscaleFactorUnits(factorUnits: FactorUnit[]): FactorUnit[] {
    return factorUnits.map(
      (fu) => new FactorUnit(Qudt.unscale(fu.unit), fu.exponent)
    );
  }

  /**
   * Instantiates a QuantityValue.
   * @param value a Decimal
   * @param unit a Unit or unit IRI.
   * @return a QuantityValue with the specified data
   */
  static quantityValue(value: Decimal, unit: Unit | string): QuantityValue {
    if (typeof unit === "string") {
      return new QuantityValue(value, Qudt.unitRequired(unit));
    }
    return new QuantityValue(value, unit);
  }

  /**
   * Converts the specified value from the unit it is in (`fromUnit`) to the specified target unit (`toUnit`).
   * @param value: a Decimal, the value to convert.
   * @param fromUnit: a Unit or string. A string is interpreted as a Unit IRI.
   * @param toUnit: a Unit or string. A string is interpreted as a Unit IRI.
   * @return the resulting value
   */
  static convert(
    value: Decimal,
    fromUnit: Unit | string,
    toUnit: Unit | string
  ): Decimal {
    if (!fromUnit) {
      throw "Parameter 'fromUnit' is required";
    }
    if (!toUnit) {
      throw "Parameter 'toUnit' is required";
    }
    const from: Unit =
      typeof fromUnit === "string" ? Qudt.unitRequired(fromUnit) : fromUnit;
    const to: Unit =
      typeof toUnit === "string" ? Qudt.unitRequired(toUnit) : toUnit;
    return from.convert(value, to);
  }

  /**
   * Converts the specified QuantityValue from to the specified target unit (`toUnit`).
   * @param value: a Decimal, the value to convert.
   * @param fromUnit: a Unit or string. A string is interpreted as a Unit IRI.
   * @param toUnit: a Unit or string. A string is interpreted as a Unit IRI.
   * @return a QuantityValue holding the result
   */
  static convertQuantityValue(
    from: QuantityValue,
    toUnit: Unit | string
  ): QuantityValue {
    if (!from) {
      throw "Parameter 'from' is required";
    }
    if (!toUnit) {
      throw "Parameter 'toUnit' is required";
    }
    const to = typeof toUnit === "string" ? Qudt.unitRequired(toUnit) : toUnit;
    return from.convert(to);
  }

  /**
   * Returns `true` if the two units can be converted into each other.
   * @param fromUnit a Unit or unit IRI
   * @param toUnit a Unit or unit IRI
   * @return a boolean indicating whether the units are convertible.
   */
  static isConvertible(fromUnit: Unit | string, toUnit: Unit | string) {
    const from: Unit =
      typeof fromUnit === "string" ? Qudt.unitRequired(fromUnit) : fromUnit;
    const to: Unit =
      typeof toUnit === "string" ? Qudt.unitRequired(toUnit) : toUnit;
    return from.isConvertible(to);
  }

  /**
   * Returns a [Unit, Decimal] tuple containing the base unit of the specified `unit`
   * along with the scale factor needed to convert values from the base unit to
   * the specified unit.
   *
   * @param unit the unit to scale to its base
   * @return a [Unit, Decimal] tuple with the base unit and the required scale factor
   */
  static scaleToBaseUnit(unit: Unit): { unit: Unit; factor: Decimal } {
    if (!unit.scalingOf) {
      return { unit: unit, factor: new Decimal(1) };
    }
    const baseUnit = unit.scalingOf;
    return { unit: baseUnit, factor: unit.getConversionMultiplier(baseUnit) };
  }

  static allUnits(): Unit[] {
    const ret = [];
    for (const unit of config.units.values()) {
      ret.push(unit);
    }
    return ret;
  }

  static allQuantityKinds(): QuantityKind[] {
    const ret = [];
    for (const quantityKind of config.quantityKinds.values()) {
      ret.push(quantityKind);
    }
    return ret;
  }

  static allPrefixes(): Prefix[] {
    const ret = [];
    for (const prefix of config.prefixes.values()) {
      ret.push(prefix);
    }
    return ret;
  }
}

interface LabelMatcher {
  matchesString(searchTerm: string): boolean;
  matchesLangString(searchTerm: LangString): boolean;
  matchesLangStrings(searchTerms: LangString[]): boolean;
}

class CaseInsensitiveUnderscoreIgnoringLabelMatcher implements LabelMatcher {
  readonly compareForEquality: string;

  constructor(searchTerm: string) {
    this.compareForEquality = this.convert(searchTerm);
  }

  convert(term: string): string {
    return term.replaceAll("_", " ").toLocaleUpperCase("en-US");
  }

  matchesString(searchTerm: string): boolean {
    return this.convert(searchTerm) === this.compareForEquality;
  }

  matchesLangString(searchTerm: LangString): boolean {
    return this.convert(searchTerm.text) === this.compareForEquality;
  }

  matchesLangStrings(searchTerms: LangString[]): boolean {
    return searchTerms.some(
      (st) => this.convert(st.text) === this.compareForEquality
    );
  }
}

function getLastIriElement(iri: string) {
  return iri.replaceAll(/.+\/([^\/]+)/g, "$1");
}

interface EqualsComparator<Type> {
  (left: Type, right: Type): boolean;
}

/**
 * Compares two instances, `left` and `right`, yielding a negative result if `left` is smaller,
 * a positive result if `left` is greater, and 0 if they are equal.
 */
interface OrderComparator<Type> {
  (left: Type, right: Type): number;
}

function compareUsingEquals<Type extends SupportsEquals<Type>>(
  a: Type,
  b: Type
) {
  return a.equals(b);
}

function arrayDeduplicate<Type>(
  arr: Type[],
  cmp: EqualsComparator<Type> = (a, b) => a === b
): Type[] {
  if (!arr || !arr.length || arr.length === 0) {
    return arr;
  }
  return arr.reduce(
    (prev: Type[], cur: Type) =>
      prev.some((p) => cmp(p, cur)) ? prev : [...prev, cur],
    []
  );
}

export function arrayEquals<Type>(
  left?: Type[],
  right?: Type[],
  cmp: EqualsComparator<Type> = (a, b) => a === b
): boolean {
  return (
    !!left &&
    !!right &&
    left.length === right.length &&
    left.every((e, i) => cmp(e, right[i]))
  );
}

export function arrayEqualsIgnoreOrdering<Type>(
  left?: Type[],
  right?: Type[],
  cmp: EqualsComparator<Type> = (a, b) => a === b
): boolean {
  if (!!left && !!right && left.length === right.length) {
    const unmatched = Array.from({ length: left.length }, (v, i) => i);
    outer: for (let i = 0; i < left.length; i++) {
      for (let j = 0; j < unmatched.length; j++) {
        if (cmp(left[i], right[unmatched[j]])) {
          unmatched.splice(j, 1);
          continue outer;
        }
      }
      return false;
    }
    return true;
  }
  return false;
}

export function arrayCountEqualElements<Type>(
  left?: Type[],
  right?: Type[],
  cmp: EqualsComparator<Type> = (a, b) => a === b
): number {
  if (!!left && !!right) {
    const unmatched = Array.from({ length: left.length }, (v, i) => i);
    outer: for (let i = 0; i < left.length; i++) {
      for (let j = 0; j < unmatched.length; j++) {
        if (cmp(left[i], right[unmatched[j]])) {
          unmatched.splice(j, 1);
          continue outer;
        }
      }
    }
    return left.length - unmatched.length;
  }
  return 0;
}

export function arrayMin<Type>(arr: Type[], cmp: OrderComparator<Type>): Type {
  if (!arr || !arr?.length) {
    throw "array is undefined or empty";
  }
  let min: Type | undefined = undefined;
  for (const elem of arr as Type[]) {
    if (typeof min === "undefined" || cmp(min, elem) > 0) {
      min = elem;
    }
  }
  if (typeof min === "undefined") {
    throw "no minimum found";
  }
  return min;
}

export function arrayMax<Type>(arr: Type[], cmp: OrderComparator<Type>): Type {
  return arrayMin(arr, (left, right) => -1 * cmp(left, right));
}
