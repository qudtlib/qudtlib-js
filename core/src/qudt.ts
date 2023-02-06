import { Unit } from "./unit";
import {
  arrayDeduplicate,
  arrayMax,
  compareUsingEquals,
  findInIterable,
  getLastIriElement,
} from "./utils";
import { QuantityKind } from "./quantityKind";
import { Prefix } from "./prefix";
import { DerivedUnitSearchMode } from "./derivedUnitSearchMode";
import { FactorUnit } from "./factorUnit";
import { FactorUnits } from "./factorUnits";
import { AssignmentProblem } from "./assignmentProblem";
import { QuantityValue } from "./quantityValue";
import { LangString } from "./langString";
import { Namespace } from "./namespace";
import { Decimal } from "decimal.js";
import { QudtNamespaces } from "./qudtNamespaces";
import { SystemOfUnits } from "./systemOfUnits";

export class QudtlibConfig {
  readonly units: Map<string, Unit>;
  readonly quantityKinds: Map<string, QuantityKind>;
  readonly prefixes: Map<string, Prefix>;

  readonly systemsOfUnits: Map<string, SystemOfUnits>;

  constructor() {
    this.units = new Map<string, Unit>();
    this.quantityKinds = new Map<string, QuantityKind>();
    this.prefixes = new Map<string, Prefix>();
    this.systemsOfUnits = new Map<string, SystemOfUnits>();
  }
}

export const config = new QudtlibConfig();
export class Qudt {
  public static NAMESPACES = QudtNamespaces;

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
      (u) =>
        matcher.matchesLangStrings(u.labels) ||
        (!!u.currencyCode && matcher.matchesString(u.currencyCode))
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

  static unitIriFromLocalname(localname: string): string {
    return Qudt.NAMESPACES.unit.makeIriInNamespace(localname);
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

  static quantityKindIriFromLocalname(localname: string): string {
    return Qudt.NAMESPACES.quantityKind.makeIriInNamespace(localname);
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

  static prefixIriFromLocalname(localname: string): string {
    return Qudt.NAMESPACES.prefix.makeIriInNamespace(localname);
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

  static systemOfUnitsFromLabelRequired(label: string): SystemOfUnits {
    const match = this.systemOfUnitsFromLabel(label);
    if (!match) throw `No systemOfUnits found for label ${label}`;
    return match;
  }

  static systemOfUnitsFromLabel(label: string): SystemOfUnits | undefined {
    const matcher: LabelMatcher =
      new CaseInsensitiveUnderscoreIgnoringLabelMatcher(label);
    const firstMatch: SystemOfUnits | undefined = findInIterable(
      config.systemsOfUnits.values(),
      (u) => matcher.matchesLangStrings(u.labels)
    );
    return firstMatch;
  }

  static systemOfUnitsFromLocalname(
    localname: string
  ): SystemOfUnits | undefined {
    return Qudt.systemOfUnits(Qudt.systemOfUnitsIriFromLocalname(localname));
  }

  static systemOfUnitsFromLocalnameRequired(localname: string): SystemOfUnits {
    return Qudt.systemOfUnitsRequired(
      Qudt.systemOfUnitsIriFromLocalname(localname)
    );
  }

  static systemOfUnitsIriFromLocalname(localname: string): string {
    return Qudt.NAMESPACES.systemOfUnits.makeIriInNamespace(localname);
  }

  static systemOfUnits(systemOfUnitsIri: string): SystemOfUnits | undefined {
    return config.systemsOfUnits.get(systemOfUnitsIri);
  }

  static systemOfUnitsRequired(systemOfUnitsIri: string): SystemOfUnits {
    const ret = Qudt.systemOfUnits(systemOfUnitsIri);
    if (typeof ret === "undefined") {
      throw `SystemOfUnits ${systemOfUnitsIri} not found`;
    }
    return ret;
  }

  /**
   * Obtains units based on factor units, using the specified {@link DerivedUnitSearchMode}.
   *
   * For example,
   *
   * ```
   *   const spec = new Map<Unit, number>();
   *    spec.set(Units.M, 1);
   *    spec.set(Units.KiloGM, 1);
   *    spec.set(Units.SEC, -2);
   * Qudt.derivedUnitsFrom Map(
   *    DerivedUnitSearchMode.BEST_MATCH, spec);
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
    return this.derivedUnitsFromFactorUnitSelection(
      searchMode,
      new FactorUnits(factorUnits)
    );
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
        initialFactorUnitSelection.contractExponents().factorUnits;
      const scores: Map<Unit, number> = new Map();
      const results = this.findMatchingUnits(initialFactorUnitSelection);
      if (results.length < 2) {
        return results;
      }
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

  private static matchScore(unit: Unit, requested: FactorUnit[]): number {
    const unitFactors = unit.getAllPossibleFactorUnitCombinations();
    const requestedFactors =
      FactorUnit.getAllPossibleFactorUnitCombinations(requested);
    const smaller =
      unitFactors.length < requestedFactors.length
        ? unitFactors
        : requestedFactors;
    const larger =
      unitFactors.length < requestedFactors.length
        ? requestedFactors
        : unitFactors;

    const unitSimilarityMatrix = Qudt.getUnitSimilarityMatrix(smaller, larger);
    let overlapScore = 0.0;
    if (unitSimilarityMatrix.length > 0) {
      overlapScore = this.getOverlapScore(unitSimilarityMatrix);
    }
    const unitLocalName = getLastIriElement(unit.iri);
    const tiebreaker: number = requested.reduce(
      (prev, cur) =>
        prev +
        (unitLocalName.match("\\b" + getLastIriElement(cur.unit.iri) + "\\b") !=
          null ||
        unitLocalName.match(
          "\\b" +
            getLastIriElement(cur.unit.iri) +
            Math.abs(cur.exponent) +
            "\\b"
        ) != null
          ? 1
          : 0),
      0
    );
    return (
      overlapScore +
      tiebreaker / Math.pow(unitFactors.length + requestedFactors.length + 1, 2)
    );
  }

  private static getUnitSimilarityMatrix(
    smaller: FactorUnit[][],
    larger: FactorUnit[][]
  ) {
    return smaller.map((sFactors) =>
      larger.map((lFactors) => Qudt.scoreCombinations(sFactors, lFactors))
    );
  }

  private static scoreCombinations(
    leftFactors: FactorUnit[],
    rightFactors: FactorUnit[]
  ) {
    const smaller =
      leftFactors.length < rightFactors.length ? leftFactors : rightFactors;
    const larger =
      leftFactors.length < rightFactors.length ? rightFactors : leftFactors;
    const similarityMatix = smaller.map((sFactor) =>
      larger.map((lFactor) => {
        if (sFactor.equals(lFactor)) {
          return 0.0;
        }
        const sScalingOfOrSelf = sFactor.unit.scalingOf
          ? sFactor.unit.scalingOf
          : sFactor.unit;
        const lScalingOfOrSelf = lFactor.unit.scalingOf
          ? lFactor.unit.scalingOf
          : lFactor.unit;
        if (
          sFactor.exponent === lFactor.exponent &&
          sScalingOfOrSelf.equals(lScalingOfOrSelf)
        ) {
          return 0.6;
        }
        if (sFactor.unit.equals(lFactor.unit)) {
          return 0.8;
        }
        if (sScalingOfOrSelf.equals(lScalingOfOrSelf)) {
          return 0.9;
        }
        return 1.0;
      })
    );
    if (similarityMatix.length === 0) {
      return 1;
    } else {
      return 1 - Qudt.getOverlapScore(similarityMatix);
    }
  }

  private static getOverlapScore(mat: number[][]) {
    const numAssignments = mat.length;
    const instance = AssignmentProblem.instance(mat);
    const solution = instance.solve();
    const minAssignmentScore = solution.isEmpty()
      ? 1 * numAssignments
      : solution.weight!;
    const overlap = numAssignments * (1 - minAssignmentScore / numAssignments);
    const rowsPlusCols = mat.length + mat[0].length;
    return overlap / (rowsPlusCols - overlap);
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

  static allSystemsOfUnits(): SystemOfUnits[] {
    const ret = [];
    for (const prefix of config.systemsOfUnits.values()) {
      ret.push(prefix);
    }
    return ret;
  }

  static allUnitsOfSystem(system: SystemOfUnits): Unit[] {
    const ret = [];
    for (const unit of config.units.values()) {
      if (system.allowsUnit(unit)) {
        ret.push(unit);
      }
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
