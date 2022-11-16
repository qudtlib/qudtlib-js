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

  private withExponentMultiplied(by: number): FactorUnit {
    checkInteger(by, "by");
    return new FactorUnit(this.unit, this.exponent * by);
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

  match(
    factorUnitSelection: FactorUnitSelection[],
    cumulativeExponent: number,
    matchedPath: Unit[],
    matchingMode: FactorUnitMatchingMode
  ): FactorUnitSelection[] {
    const mySelection: FactorUnitSelection[] = [];
    factorUnitSelection.forEach((fus) => mySelection.push(fus));
    return this.unit.match(
      mySelection,
      this.getExponentCumulated(cumulativeExponent),
      matchedPath,
      matchingMode
    );
  }

  getLeafFactorUnitsWithCumulativeExponents(): FactorUnit[] {
    const leafFactorUnits =
      this.unit.getLeafFactorUnitsWithCumulativeExponents();
    if (!!leafFactorUnits?.length) {
      return leafFactorUnits.map((fu) =>
        fu.withExponentMultiplied(this.exponent)
      );
    }
    return [this];
  }
}

/** Represents a unit that has been matched in a FactorUnitSelection. */
export class FactorUnitMatch implements SupportsEquals<FactorUnitMatch> {
  readonly matchedFactorUnit: FactorUnit;
  readonly matchedPath: Unit[];
  readonly matchedMultiplier: Decimal;

  constructor(
    matchedFactorUnit: FactorUnit,
    matchedMultiplier: Decimal,
    matchedPath: Unit[]
  ) {
    this.matchedFactorUnit = matchedFactorUnit;
    this.matchedMultiplier = matchedMultiplier;
    this.matchedPath = [...matchedPath];
  }

  equals(other?: FactorUnitMatch): boolean {
    return (
      !!other &&
      this.matchedFactorUnit.equals(other.matchedFactorUnit) &&
      arrayEquals(this.matchedPath, other.matchedPath, compareUsingEquals) &&
      this.matchedMultiplier.eq(other.matchedMultiplier)
    );
  }

  toString(): string {
    return (
      this.getPathAsString() +
      (this.matchedMultiplier.eq(new Decimal(1))
        ? ""
        : "*" + this.matchedMultiplier.toString())
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
    matchedPath: Unit[]
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
        new FactorUnitMatch(factorUnit, matchedMultiplier, matchedPath)
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

  static fromFactorUnit(factorUnit: FactorUnit) {
    return new FactorUnitSelector(factorUnit.unit, factorUnit.exponent);
  }

  toFactorUnit(): FactorUnit {
    return new FactorUnit(this.unit, this.exponent);
  }
}

export class FactorUnitSelection
  implements SupportsEquals<FactorUnitSelection>
{
  /**
   * If the matched units required scaling to match the unit being checked, the scale factor is
   * accumulated in this property.
   */
  readonly scaleFactor: Decimal;
  /**
   * The selectors of this selection, defining the individual units that are being searched or
   * have already been found.
   */
  readonly selectors: FactorUnitSelector[];

  constructor(
    selectors: FactorUnitSelector[],
    scaleFactor: Decimal = new Decimal(1)
  ) {
    this.selectors = selectors;
    this.scaleFactor = scaleFactor;
  }

  /**
   * Returns a new FactorUnitSelection with the same selectors as this one, whose <code>
   * scaleFactor</code> is this FactorUnitSelection's <code>scaleFactor</code> multiplied with the
   * specified one.
   *
   * @param scaleFactor
   * @return
   */
  scale(scaleFactor: Decimal) {
    return new FactorUnitSelection(
      this.selectors,
      this.scaleFactor.mul(scaleFactor)
    );
  }

  /**
   * For each selector in each of the specified selections that uses a derived unit, an alternative
   * selection is generated that uses its factor units. If there are multiple selectors with derived
   * units, all expansion combinations are generated.
   *
   * For example, the selection
   * ```
   * [[ Units.N, 1, Units.M, 1 ]]
   * ```
   * is expanded to
   * ```
   * [
   *  [ Units.N, 1, Units.M, 1 ],
   *  [ Units.KiloGM, 1, Units.M, 1, Units.SEC, -2, Units.M, 1]
   * ]
   * ```
   * @param selections
   */
  static expandForDerivedUnits(
    selections: FactorUnitSelection[]
  ): FactorUnitSelection[] {
    // call recursively for each array element
    // pass array index i (start with 0)
    // add input to result
    // if element at i can be expanded, recurse with array element expanded, same index (maybe the expansion can be expanded as well?)
    //
    /*
    [A, X, Y], 0
    r [A, X, Y], .
    c [A, X, Y], 1
    r [A, BX, Y] .,
    c [A, BX, Y], 2
    c [A, X, Y], 2
    r [A, BX, CY, DY] .
    c [A, BX, CY, DY] - .
    r [A, X, CY, DY]
    c [A, X, CY, DY] - .
    */
    let results = selections.flatMap((s) => FactorUnitSelection.expand(s, 0));
    results = arrayDeduplicate(results, compareUsingEquals);
    results = results.flatMap((s) => [
      s,
      s.contractExponents(),
      s.reduceExponents(),
    ]);
    results = arrayDeduplicate(results, compareUsingEquals);
    return results;
  }

  private static expand(
    selection: FactorUnitSelection,
    position: number
  ): FactorUnitSelection[] {
    const ret = [];
    const factorUnitAtPosition = selection.selectors[position];
    if (factorUnitAtPosition.unit.hasFactorUnits()) {
      const selectors = selection.selectors;
      const expandedSelectors = factorUnitAtPosition.unit.factorUnits.map(
        (fu) =>
          new FactorUnitSelector(
            fu.unit,
            fu.exponent * factorUnitAtPosition.exponent
          )
      );
      const expandedSelection = new FactorUnitSelection(
        [
          ...selectors.slice(0, position),
          ...expandedSelectors,
          ...selectors.slice(position + 1),
        ],
        selection.scaleFactor
      );
      ret.push(expandedSelection);
      const subResult = FactorUnitSelection.expand(expandedSelection, position);
      subResult.forEach((fus) => ret.push(fus));
    }
    ret.push(selection);
    if (position + 1 < selection.selectors.length) {
      const subResultWithoutExpansion = FactorUnitSelection.expand(
        selection,
        position + 1
      );
      subResultWithoutExpansion.forEach((fus) => ret.push(fus));
    }
    return ret;
  }

  private contractExponents(): FactorUnitSelection {
    return new FactorUnitSelection(
      FactorUnit.contractExponents(
        this.selectors.map((sel) => sel.toFactorUnit())
      ).map((fu) => FactorUnitSelector.fromFactorUnit(fu)),
      this.scaleFactor
    );
  }

  private reduceExponents(): FactorUnitSelection {
    return new FactorUnitSelection(
      FactorUnit.reduceExponents(
        this.selectors.map((sel) => sel.toFactorUnit())
      ).map((fu) => FactorUnitSelector.fromFactorUnit(fu)),
      this.scaleFactor
    );
  }

  static fromFactorUnits(factorUnits: FactorUnit[]) {
    return new FactorUnitSelection(
      factorUnits.map((fu) => FactorUnitSelector.fromFactorUnit(fu))
    );
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
      arrayEqualsIgnoreOrdering(
        this.selectors,
        other.selectors,
        compareUsingEquals
      )
    );
  }

  toString() {
    return (
      (this.scaleFactor.eq(new Decimal(1))
        ? ""
        : this.scaleFactor.toString() + "*") +
      "[" +
      this.selectors.map((s) => s.toString()).reduce((p, n) => p + ", " + n) +
      "]"
    );
  }

  isCompleteMatch(): boolean {
    if (!this.selectors.every((s) => s.isBound())) {
      return false;
    }
    const accumulatedMatchedMultipliers = this.selectors.reduce(
      (prev, cur) =>
        !!cur.factorUnitMatch
          ? cur.factorUnitMatch.matchedMultiplier.mul(prev)
          : prev,
      new Decimal("1")
    );
    const cumulativeScale = this.scaleFactor.mul(accumulatedMatchedMultipliers);
    return cumulativeScale.eq(new Decimal("1"));
  }

  /**
   * If there are matches for the specified data, return all selections resulting from such
   * matches. If there are no matches, the result is an empty set
   *
   * @param factorUnit the factor unit to match
   * @param cumulativeExponent the exponent accumulated on the path from the root unit to the
   *     factor unit
   * @param matchedPath the path from the root unit to the factor unit
   * @param mode the matching mode
   * @return FactorUnitSelections resulting from the match, empty set if no matches are found.
   */
  forPotentialMatch(
    factorUnit: FactorUnit,
    cumulativeExponent: number,
    matchedPath: Unit[],
    matchingMode: FactorUnitMatchingMode
  ): FactorUnitSelection[] {
    const newSelections: FactorUnitSelection[] = [];
    // we have to iterate by index as we need to replace selectors, which may exist in multiple,
    // equal instances in the selection
    for (let index = 0; index < this.selectors.length; index++) {
      const s: FactorUnitSelector = this.selectors[index];
      if (
        s.isAvailable() &&
        s.matches(factorUnit, cumulativeExponent, matchingMode)
      ) {
        const origSelectorsWithOneMatch: FactorUnitSelector[] = [];
        for (let i = 0; i < this.selectors.length; i++) {
          if (i === index) {
            s.forMatch(factorUnit, cumulativeExponent, matchedPath).forEach(
              (sMatched) => origSelectorsWithOneMatch.push(sMatched)
            );
          } else {
            origSelectorsWithOneMatch.push(this.selectors[i]);
          }
        }
        newSelections.push(
          new FactorUnitSelection(origSelectorsWithOneMatch, this.scaleFactor)
        );
      }
    }
    return newSelections;
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
        matchingMode
      ).forEach((s) => results.push(s));
    } else {
      if (this.scalingOf?.hasFactorUnits()) {
        const baseUnit: Unit = this.scalingOf;
        const scaleFactor: Decimal = this.getConversionMultiplier(baseUnit);
        baseUnit
          .match(
            selections,
            cumulativeExponent,
            matchedPath,
            FactorUnitMatchingMode.ALLOW_SCALED //if we do not allow to scale here, we will miss exact matches
          )
          .forEach((s) => results.push(s.scale(scaleFactor)));
      }
    }
    // match this unit - even if it has factor units, the unit itself may also match,
    // e.g. if the unit is KiloN__M and the selectors contain M^1 as well as N.
    this.matchThisUnit(
      selections,
      cumulativeExponent,
      matchedPath,
      matchingMode
    ).forEach((s) => results.push(s));
    matchedPath.pop();
    return results;
  }

  private matchFactorUnits(
    selections: FactorUnitSelection[],
    cumulativeExponent: number,
    matchedPath: Unit[],
    matchingMode: FactorUnitMatchingMode
  ): FactorUnitSelection[] {
    let lastResults = selections;
    let subResults = selections;
    for (const factorUnit of this.factorUnits) {
      subResults = factorUnit.match(
        lastResults,
        cumulativeExponent,
        matchedPath,
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
    matchingMode: FactorUnitMatchingMode
  ): FactorUnitSelection[] {
    const result: FactorUnitSelection[] = [];
    for (const factorUnitSelection of selections) {
      factorUnitSelection
        .forPotentialMatch(
          new FactorUnit(this, 1),
          cumulativeExponent,
          matchedPath,
          matchingMode
        )
        .forEach((s) => result.push(s));
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
      FactorUnitSelection.expandForDerivedUnits([selection]),
      1,
      [],
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

  getLeafFactorUnitsWithCumulativeExponents(): FactorUnit[] {
    if (!this.factorUnits) {
      return [];
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
    const initialFactorUnitSelection = FactorUnitSelection.fromFactorUnitSpec(
      ...spec
    );
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

function compareUsingEquals<Type extends SupportsEquals<Type>>(
  a: Type,
  b: Type
) {
  return a.equals(b);
}

function arrayDeduplicate<Type>(
  arr: Type[],
  cmp: EqualsComparator<Type> = (a, b) => a === b
) {
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
) {
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
) {
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
