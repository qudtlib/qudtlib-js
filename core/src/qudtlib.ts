import { Decimal } from "decimal.js";

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

export class ScaleFactor implements SupportsEquals<ScaleFactor> {
  readonly factor: Decimal;

  constructor(factor: Decimal = new Decimal(1)) {
    this.factor = factor;
  }

  copy(): ScaleFactor {
    return new ScaleFactor(this.factor);
  }

  multiplyBy(by: Decimal): ScaleFactor {
    return new ScaleFactor(this.factor.mul(by));
  }

  toString(): string {
    return `${this.factor.toString()}`;
  }

  equals(other?: ScaleFactor): boolean {
    return !!other && this.factor === other.factor;
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
      arrayEquals(this.labels, other.labels, compareUsingEquals)
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
  quantity: Decimal;
  unit: Unit;

  constructor(quantity: Decimal, unit: Unit) {
    this.quantity = quantity;
    this.unit = unit;
  }

  equals(other?: QuantityValue): boolean {
    return (
      !!other &&
      this.quantity.equals(other.quantity) &&
      this.unit.equals(other.unit)
    );
  }

  toString(): string {
    return this.quantity.toString() + this.unit.toString();
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
  /** Only select exact matches. */
  EXACT,
  /**
   * Only select exact matches, and if there are multiple matches, select only one of them. The
   * Unit's IRI is used as the tie-breaker, so the result is stable over multiple executions.
   */
  EXACT_ONLY_ONE,
  /**
   * Select exact matches and units whose factor units have different scale, but the scale of the
   * result is equivalent to the cumulative scale of the original factor units
   */
  ALLOW_SCALED,
  /**
   * Select only one unit. Try EXACT mode first. If no match is found, try ALLOW_SCALED. Break
   * ties using the matching units' IRIs.
   */
  BEST_EFFORT_ONLY_ONE,
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

  getExponentCumulated(cumulatedExponent: number): number {
    checkInteger(cumulatedExponent, "cumulatedExponent");
    return this.exponent * cumulatedExponent;
  }

  equals(other?: FactorUnit): boolean {
    return (
      !!other &&
      this.exponent === other.exponent &&
      this.unit.equals(other.unit)
    );
  }

  toString(): string {
    return this.unit.toString() + "^" + this.exponent;
  }

  static combine(left: FactorUnit, right: FactorUnit): FactorUnit {
    if (left.getKind() !== right.getKind()) {
      throw `Cannot combine UnitFactors of different kind (left: ${left}, right: ${right}`;
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

  match(
    factorUnitSelection: FactorUnitSelection[],
    cumulativeExponent: number,
    matchedPath: Unit[],
    scaleFactor: ScaleFactor,
    matchingMode: FactorUnitMatchingMode
  ): FactorUnitSelection[] {
    const mySelection: FactorUnitSelection[] = [];
    factorUnitSelection.forEach((fus) => mySelection.push(fus));
    return this.unit.match(
      mySelection,
      this.getExponentCumulated(cumulativeExponent),
      matchedPath,
      scaleFactor,
      matchingMode
    );
  }
}

/** Represents a unit that has been matched in a FactorUnitSelection. */
export class FactorUnitMatch implements SupportsEquals<FactorUnitMatch> {
  readonly matchedFactorUnit: FactorUnit;
  readonly matchedPath: Unit[];
  readonly matchedMultiplier: Decimal;
  readonly scaleFactor: ScaleFactor;

  constructor(
    matchedFactorUnit: FactorUnit,
    matchedMultiplier: Decimal,
    matchedPath: Unit[],
    scaleFactor: ScaleFactor
  ) {
    this.matchedFactorUnit = matchedFactorUnit;
    this.matchedMultiplier = matchedMultiplier;
    this.matchedPath = [...matchedPath];
    this.scaleFactor = scaleFactor;
  }

  equals(other?: FactorUnitMatch): boolean {
    return (
      !!other &&
      this.matchedFactorUnit.equals(other.matchedFactorUnit) &&
      arrayEquals(this.matchedPath, other.matchedPath, compareUsingEquals) &&
      this.matchedMultiplier.eq(other.matchedMultiplier) &&
      this.scaleFactor.equals(other.scaleFactor)
    );
  }

  toString(): string {
    return (
      this.getPathAsString() +
      (this.matchedMultiplier.eq(new Decimal(1))
        ? ""
        : "*" + this.matchedMultiplier.toString()) +
      (this.scaleFactor.factor.eq(new Decimal(1))
        ? ""
        : "*" + this.scaleFactor.toString())
    );
  }

  private getPathAsString(): string {
    let result = "/";
    if (!!this.matchedPath) {
      result += this.matchedPath
        .map((u) => u.toString())
        .reduce((p, n) => p + "/" + n);
    }
    return result;
  }
}

export class FactorUnitSelector implements SupportsEquals<FactorUnitSelector> {
  readonly unit: Unit;
  readonly exponent: number;
  readonly factorUnitMatch?: FactorUnitMatch;

  constructor(unit: Unit, exponent: number, factorUnitMatch?: FactorUnitMatch) {
    this.unit = unit;
    this.exponent = exponent;
    this.factorUnitMatch = factorUnitMatch;
  }

  equals(other?: FactorUnitSelector): boolean {
    return (
      !!other &&
      this.exponent === other.exponent &&
      this.unit.equals(other.unit) &&
      (this.factorUnitMatch === other.factorUnitMatch ||
        (!!this.factorUnitMatch &&
          this.factorUnitMatch.equals(other.factorUnitMatch)))
    );
  }

  isAvailable(): boolean {
    return !this.isBound();
  }

  isBound(): boolean {
    return !!this.factorUnitMatch;
  }

  copy(): FactorUnitSelector {
    return new FactorUnitSelector(
      this.unit,
      this.exponent,
      this.factorUnitMatch
    );
  }

  matched(factorUnitMatch: FactorUnitMatch): FactorUnitSelector {
    return new FactorUnitSelector(this.unit, this.exponent, factorUnitMatch);
  }

  matches(
    factorUnit: FactorUnit,
    cumulativeExponent: number,
    mode: FactorUnitMatchingMode
  ) {
    switch (mode) {
      case FactorUnitMatchingMode.EXACT:
        return (
          this.unit.equals(factorUnit.unit) &&
          this.exponentMatches(factorUnit, cumulativeExponent)
        );
      case FactorUnitMatchingMode.ALLOW_SCALED:
        return (
          this.unit.isSameScaleAs(factorUnit.unit) &&
          this.exponentMatches(factorUnit, cumulativeExponent)
        );
      default:
    }
    throw `Cannot handle matching mode ${mode}`;
  }

  exponentMatches(factorUnit: FactorUnit, cumulativeExponent: number): boolean {
    const cumulatedFactorUnitExponent =
      factorUnit.getExponentCumulated(cumulativeExponent);
    return (
      Math.abs(this.exponent) > 0 &&
      Math.abs(this.exponent) >= Math.abs(cumulatedFactorUnitExponent) &&
      Math.sign(this.exponent) === Math.sign(cumulatedFactorUnitExponent)
    );
  }

  forMatch(
    factorUnit: FactorUnit,
    cumulativeExponent: number,
    matchedPath: Unit[],
    scaleFactor: ScaleFactor
  ): FactorUnitSelector[] {
    if (!this.isAvailable()) {
      throw "not available - selector is already bound";
    }
    checkInteger(cumulativeExponent, "cumulativeExponent");
    if (!this.exponentMatches(factorUnit, cumulativeExponent)) {
      throw "exponents do not match";
    }
    const matchedPower = factorUnit.getExponentCumulated(cumulativeExponent);
    const matchedMultiplier = this.calculateMatchedMultiplier(
      factorUnit,
      matchedPower
    );
    if (!matchedMultiplier) {
      throw "units do not match";
    }
    const remainingPower = this.exponent - matchedPower;
    const ret: FactorUnitSelector[] = [];
    ret.push(
      this.matched(
        new FactorUnitMatch(
          factorUnit,
          matchedMultiplier,
          matchedPath,
          scaleFactor
        )
      )
    );
    if (remainingPower !== 0) {
      ret.push(new FactorUnitSelector(this.unit, remainingPower));
    }
    return ret;
  }

  private calculateMatchedMultiplier(
    factorUnit: FactorUnit,
    matchedExponent: number
  ): Decimal | undefined {
    if (!this.unit.isConvertible(factorUnit.unit)) {
      return undefined;
    }
    const conversionMultiplier = factorUnit.unit.getConversionMultiplier(
      this.unit
    );
    return conversionMultiplier.pow(matchedExponent);
  }

  toString(): string {
    return (
      this.unit.toString() +
      (this.exponent === 1 ? "" : "^" + this.exponent) +
      "@" +
      (!!this.factorUnitMatch ? this.factorUnitMatch.toString() : "?")
    );
  }
}

export class FactorUnitSelection
  implements SupportsEquals<FactorUnitSelection>
{
  readonly selectors: FactorUnitSelector[];

  constructor(selectors: FactorUnitSelector[]) {
    this.selectors = selectors;
  }

  static fromFactorUnitSpec(
    ...factorUnitSpec: (Unit | number)[]
  ): FactorUnitSelection {
    if (factorUnitSpec.length % 2 !== 0) {
      throw "An even number of arguments is required";
    }
    if (factorUnitSpec.length > 14) {
      throw "No more than 14 arguments (7 factor units) are supported";
    }
    const selectors = [];
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
      selectors.push(new FactorUnitSelector(requestedUnit, requestedExponent));
    }
    return new FactorUnitSelection(selectors);
  }

  equals(other: FactorUnitSelection): boolean {
    return (
      !!other &&
      arrayEquals(this.selectors, other.selectors, compareUsingEquals)
    );
  }

  toString() {
    return (
      "Select " +
      "[" +
      this.selectors.map((s) => s.toString()).reduce((p, n) => p + ", " + n) +
      "]"
    );
  }

  isCompleteMatch(): boolean {
    if (!this.selectors.every((s) => s.isBound())) {
      return false;
    }
    const accumulatedScaleFactors = this.selectors.reduce(
      (prev, cur) =>
        !!cur.factorUnitMatch
          ? cur.factorUnitMatch.scaleFactor.factor.mul(prev)
          : prev,
      new Decimal("1")
    );
    const accumulatedMatchedMultipliers = this.selectors.reduce(
      (prev, cur) =>
        !!cur.factorUnitMatch
          ? cur.factorUnitMatch.matchedMultiplier.mul(prev)
          : prev,
      new Decimal("1")
    );
    const cumulativeScale = accumulatedScaleFactors.mul(
      accumulatedMatchedMultipliers
    );
    return cumulativeScale.eq(new Decimal("1"));
  }

  forPotentialMatch(
    factorUnit: FactorUnit,
    cumulativeExponent: number,
    matchedPath: Unit[],
    scaleFactor: ScaleFactor,
    matchingMode: FactorUnitMatchingMode
  ): FactorUnitSelection {
    const newSelectors: FactorUnitSelector[] = [];
    let matched = false;
    for (const sel of this.selectors) {
      if (
        !matched &&
        sel.isAvailable() &&
        sel.matches(factorUnit, cumulativeExponent, matchingMode)
      ) {
        matched = true;
        sel
          .forMatch(factorUnit, cumulativeExponent, matchedPath, scaleFactor)
          .forEach((s) => newSelectors.push(s));
      } else {
        newSelectors.push(sel.copy());
      }
    }
    return new FactorUnitSelection(newSelectors);
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

  match(
    selections: FactorUnitSelection[],
    cumulativeExponent: number,
    matchedPath: Unit[],
    scaleFactor: ScaleFactor,
    matchingMode: FactorUnitMatchingMode
  ): FactorUnitSelection[] {
    checkInteger(cumulativeExponent, "cumulativeExponent");
    const results: FactorUnitSelection[] = [];
    matchedPath.push(this);
    if (this.hasFactorUnits()) {
      this.matchFactorUnits(
        selections,
        cumulativeExponent,
        matchedPath,
        scaleFactor,
        matchingMode
      ).forEach((s) => results.push(s));
    } else {
      if (this.scalingOf && this.prefix && this.scalingOf.hasFactorUnits()) {
        this.scalingOf
          .match(
            selections,
            cumulativeExponent,
            matchedPath,
            scaleFactor.multiplyBy(this.prefix.multiplier),
            matchingMode
          )
          .forEach((s) => results.push(s));
      }
    }
    this.matchThisUnit(
      selections,
      cumulativeExponent,
      matchedPath,
      scaleFactor,
      matchingMode
    ).forEach((s) => results.push(s));
    matchedPath.pop();
    return results;
  }

  private matchFactorUnits(
    selections: FactorUnitSelection[],
    cumulativeExponent: number,
    matchedPath: Unit[],
    scaleFactor: ScaleFactor,
    matchingMode: FactorUnitMatchingMode
  ): FactorUnitSelection[] {
    let lastResults = selections;
    let subResults = selections;
    for (const factorUnit of this.factorUnits) {
      subResults = factorUnit.match(
        lastResults,
        cumulativeExponent,
        matchedPath,
        scaleFactor,
        matchingMode
      );
      if (arrayEquals(subResults, lastResults)) {
        //no new matches for current factor unit - abort
        return selections;
      }
      lastResults = subResults;
    }
    return subResults;
  }

  private matchThisUnit(
    selections: FactorUnitSelection[],
    cumulativeExponent: number,
    matchedPath: Unit[],
    scaleFactor: ScaleFactor,
    matchingMode: FactorUnitMatchingMode
  ): FactorUnitSelection[] {
    const result = [];
    for (const factorUnitSelection of selections) {
      const possiblyMatched = factorUnitSelection.forPotentialMatch(
        new FactorUnit(this, 1),
        cumulativeExponent,
        matchedPath,
        scaleFactor,
        matchingMode
      );
      if (!possiblyMatched.equals(factorUnitSelection)) {
        // if there was a match, (i.e, we modified the selection),
        // it's a new partial solution - return it
        result.push(possiblyMatched);
      }
    }
    return result;
  }

  matchesFactorUnitSpec(...factorUnitSpec: (number | Unit)[]): boolean {
    return this.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factorUnitSpec)
    );
  }

  matches(
    selection: FactorUnitSelection,
    matchingMode: FactorUnitMatchingMode = FactorUnitMatchingMode.EXACT
  ): boolean {
    const selections = this.match(
      [selection],
      1,
      [],
      new ScaleFactor(),
      matchingMode
    );
    if (!selections || selections.length == 0) {
      return false;
    }
    return selections.some((sel) => sel.isCompleteMatch());
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
    if (this.conversionOffset || toUnit.conversionOffset) {
      throw `Cannot convert from ${this} to ${toUnit} just by multiplication, one of them has a conversion offset!`;
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

  convert(value: Decimal, toUnit: Unit) {
    throw "TODO";
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

  static unit(unitIri: string): Unit | undefined {
    return config.units.get(unitIri);
  }

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
    const initialFactorUnitSelection = FactorUnitSelection.fromFactorUnitSpec(
      ...spec
    );
    return Qudt.derivedUnitsFromFactorUnitSelection(
      searchMode,
      initialFactorUnitSelection
    );
  }

  static derivedUnitsFromFactorUnitSelection(
    searchMode: DerivedUnitSearchMode,
    initialFactorUnitSelection: FactorUnitSelection
  ): Unit[] {
    const matchingMode =
      searchMode == DerivedUnitSearchMode.EXACT ||
      searchMode == DerivedUnitSearchMode.EXACT_ONLY_ONE ||
      searchMode == DerivedUnitSearchMode.BEST_EFFORT_ONLY_ONE
        ? FactorUnitMatchingMode.EXACT
        : FactorUnitMatchingMode.ALLOW_SCALED;
    let matchingUnits = this.findMatchingUnits(
      initialFactorUnitSelection,
      matchingMode
    );
    if (
      searchMode == DerivedUnitSearchMode.EXACT ||
      searchMode == DerivedUnitSearchMode.ALLOW_SCALED
    ) {
      return matchingUnits;
    }
    if (searchMode == DerivedUnitSearchMode.EXACT_ONLY_ONE) {
      return [Qudt.retainOnlyOne(matchingUnits)];
    }
    if (searchMode == DerivedUnitSearchMode.BEST_EFFORT_ONLY_ONE) {
      if (matchingUnits.length == 0) {
        matchingUnits = this.findMatchingUnits(
          initialFactorUnitSelection,
          FactorUnitMatchingMode.ALLOW_SCALED
        );
      }
      return [this.retainOnlyOne(matchingUnits)];
    }
    throw `Search mode ${searchMode} was not handled properly, this should never happen - please report as bug`;
  }

  private static retainOnlyOne(matchingUnits: Unit[]): Unit {
    return matchingUnits.reduce((p, n) => (p.iri > n.iri ? n : p));
  }

  private static findMatchingUnits(
    initialFactorUnitSelection: FactorUnitSelection,
    matchingMode: FactorUnitMatchingMode
  ): Unit[] {
    const matchingUnits: Unit[] = [];
    for (const unit of config.units.values()) {
      if (
        unit.matches(initialFactorUnitSelection, matchingMode) &&
        !matchingUnits.includes(unit)
      ) {
        matchingUnits.push(unit);
      }
    }
    return matchingUnits;
  }

  static scaledUnit(prefix: Prefix, baseUnit: Unit) {
    for (const u of config.units.values()) {
      if (u.prefix?.equals(prefix) && u.scalingOf?.equals(baseUnit)) {
        return u;
      }
    }
    throw `No scaled unit found with base unit ${baseUnit} and prefix ${prefix}`;
  }

  static scaledUnitFromLabels(prefixLabel: string, baseUnit: string) {
    return this.scaledUnit(
      Qudt.prefixFromLabelRequired(prefixLabel),
      Qudt.unitFromLabelRequired(baseUnit)
    );
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

function compareUsingEquals<Type extends SupportsEquals<Type>>(
  a: Type,
  b: Type
) {
  return a.equals(b);
}

function arrayEquals<Type>(
  left?: Type[],
  right?: Type[],
  cmp: EqualsComparator<Type> = (a, b) => a === b
) {
  return (
    !!left &&
    !!right &&
    left.length === right.length &&
    left.every((e, i) => cmp(e, right[i]))
  );
}
