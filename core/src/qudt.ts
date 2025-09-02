import { Unit } from "./unit.js";
import {
  arrayContains,
  arrayDeduplicate,
  arrayMax,
  arrayMin,
  BooleanComparator,
  compareUsingEquals,
  findInIterable,
  getLastIriElement,
  NumberComparator,
  StringComparator,
  OrderComparator,
  ONE,
  ZERO,
  isNullish,
} from "./utils.js";
import { QuantityKind } from "./quantityKind.js";
import { Prefix } from "./prefix.js";
import { DerivedUnitSearchMode } from "./derivedUnitSearchMode.js";
import { FactorUnit } from "./factorUnit.js";
import { FactorUnits } from "./factorUnits.js";
import { AssignmentProblem } from "./assignmentProblem.js";
import { QuantityValue } from "./quantityValue.js";
import { LangString } from "./langString.js";
import { Decimal } from "decimal.js";
import { QudtNamespaces } from "./qudtNamespaces.js";
import { SystemOfUnits } from "./systemOfUnits.js";
import { DimensionVector } from "./dimensionVector.js";

export class QudtlibConfig {
  readonly units: Map<string, Unit>;
  readonly quantityKinds: Map<string, QuantityKind>;
  readonly prefixes: Map<string, Prefix>;
  readonly systemsOfUnits: Map<string, SystemOfUnits>;
  readonly unitsByDimensionVector: Map<string, Array<Unit>>;

  constructor() {
    this.units = new Map<string, Unit>();
    this.quantityKinds = new Map<string, QuantityKind>();
    this.prefixes = new Map<string, Prefix>();
    this.systemsOfUnits = new Map<string, SystemOfUnits>();
    this.unitsByDimensionVector = new Map<string, Array<Unit>>();
  }

  public indexUnitsByDimensionVector() {
    this.units.forEach((u) => {
      const dimVector = u.dimensionVectorIri;
      if (!isNullish(dimVector)) {
        let unitsWithSameDimVector = this.unitsByDimensionVector.get(
          dimVector as string
        );
        if (isNullish(unitsWithSameDimVector)) {
          unitsWithSameDimVector = [];
          this.unitsByDimensionVector.set(
            dimVector as string,
            unitsWithSameDimVector
          );
        }
        (unitsWithSameDimVector as Array<Unit>).push(u);
      }
    });
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

  /**
   * @deprecated The currencies have been moved back into the units graph. Just use the units methods.
   */
  static currencyFromLocalname(localname: string): Unit | undefined {
    return this.unitFromLocalname(localname);
  }

  /**
   * @deprecated The currencies have been moved back into the units graph. Just use the units methods.
   */
  static currencyFromLocalnameRequired(localname: string): Unit {
    return this.unitFromLocalnameRequired(localname);
  }

  /**
   * @deprecated The currencies have been moved back into the units graph. Just use the units methods.
   */
  static currencyIriFromLocalname(localname: string): string {
    return this.unitIriFromLocalname(localname);
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

  static isBroaderQuantityKind(
    suspectedBroader: QuantityKind,
    quantityKind: QuantityKind
  ): boolean {
    const broader = quantityKind.broaderQuantityKindIris;
    if (broader.length === 0) {
      return false;
    }
    if (broader.includes(suspectedBroader.iri)) {
      return true;
    }
    return broader.some((b) =>
      Qudt.isBroaderQuantityKind(Qudt.quantityKindRequired(b), suspectedBroader)
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
    selection: FactorUnits
  ): Unit[] {
    const matchingUnits = this.findMatchingUnits(selection);
    if (searchMode === DerivedUnitSearchMode.ALL || matchingUnits.length < 2) {
      return matchingUnits.sort(
        Qudt.bestMatchForFactorUnitsComparator(selection)
      );
    } else {
      const requestedUnits: FactorUnit[] =
        selection.contractExponents().factorUnits;
      return [
        arrayMin(
          matchingUnits,
          Qudt.bestMatchForFactorUnitsComparator(selection)
        ),
      ];
    }
  }

  private static bestMatchForFactorUnitsComparator(
    requestedFactorUnits: FactorUnits
  ): OrderComparator<Unit> {
    const reqNorm = requestedFactorUnits.normalize();
    const reqNum = requestedFactorUnits.numerator();
    const reqNumNorm = reqNum.normalize();
    const reqDen = requestedFactorUnits.denominator();
    const reqDenNorm = reqDen.normalize();
    const reqLocalNamePossibilities: string[] =
      requestedFactorUnits.generateAllLocalnamePossibilities();

    return (left: Unit, right: Unit) => {
      if (left.factorUnits.equals(requestedFactorUnits)) {
        if (!right.factorUnits.equals(requestedFactorUnits)) {
          return -1;
        }
      } else {
        if (right.factorUnits.equals(requestedFactorUnits)) {
          return 1;
        }
      }
      if (right.deprecated) {
        if (!left.deprecated) {
          return -1;
        }
      } else {
        if (left.deprecated) {
          return 1;
        }
      }
      if (
        right.isDefinedAsOtherUnit() &&
        left.factorUnits.factorUnits?.length == 1 &&
        left.factorUnits.factorUnits[0].unit.equals(right) &&
        right.factorUnits.factorUnits[0].exponent ===
          left.factorUnits.factorUnits[0]?.exponent
      ) {
        // if a unit is just another name of another unit with same exponent,
        // prefer the other (thus L would be preferred over DeciM)
        return -1;
      }
      if (
        left.isDefinedAsOtherUnit() &&
        right.factorUnits.factorUnits?.length == 1 &&
        right.factorUnits.factorUnits[0].unit.equals(left) &&
        left.factorUnits.factorUnits[0].exponent ===
          right.factorUnits.factorUnits[0]?.exponent
      ) {
        return 1;
      }

      if (left.getIriLocalname().indexOf("-") === -1) {
        if (right.getIriLocalname().indexOf("-") > -1) {
          return -1; // prefer a derived unit with a new name (such as W, J, N etc.)
        }
      } else if (right.getIriLocalname().indexOf("-") === -1) {
        return 1;
      }

      const diffFactorsCountDen = Qudt.expandedFactorsCountDiff(
        left.factorUnits.denominator(),
        right.factorUnits.denominator(),
        reqDen
      );
      if (diffFactorsCountDen != 0) {
        return diffFactorsCountDen;
      }
      const diffFactorsCountNum = Qudt.expandedFactorsCountDiff(
        left.factorUnits.numerator(),
        right.factorUnits.numerator(),
        reqNum
      );
      if (diffFactorsCountNum != 0) {
        return diffFactorsCountNum;
      }
      const factorCountDiff = Qudt.expandedFactorsCountDiff(
        left.factorUnits,
        right.factorUnits,
        requestedFactorUnits
      );
      if (factorCountDiff != 0) {
        return factorCountDiff;
      }
      if (left.dependents >= 10 && left.dependents > 2 * right.dependents) {
        return -1; // prefer a unit that has more dependents (other units that refer to
        // it as their factor unit or base unit)
      } else if (
        right.dependents >= 10 &&
        right.dependents > 2 * left.dependents
      ) {
        return 1;
      }

      const leftLocalname = left.getIriLocalname();
      const rightLocalname = right.getIriLocalname();
      if (reqLocalNamePossibilities.includes(leftLocalname)) {
        if (!reqLocalNamePossibilities.includes(rightLocalname)) {
          return -1;
        }
      } else if (reqLocalNamePossibilities.includes(rightLocalname)) {
        return 1;
      }
      const leftUnderscores = Qudt.countUnderscores(leftLocalname);
      const rightUnderscores = Qudt.countUnderscores(rightLocalname);
      if (leftUnderscores < rightUnderscores) {
        return -1; // prefer a unit without modifier in one of its components
      } else if (leftUnderscores > rightUnderscores) {
        return 1;
      }
      if (left.factorUnits.equals(reqNorm)) {
        if (!right.factorUnits.equals(reqNorm)) {
          return -1; // prefer a unit that matches the normalized factors exactly
        }
      } else {
        if (right.factorUnits.equals(reqNorm)) {
          return 1;
        }
      }

      return StringComparator(left.getIriLocalname(), right.getIriLocalname());
    };
  }

  private static countUnderscores(str: string): number {
    if (!str) return 0;
    let count = 0;
    for (const char of str) {
      if (char === "_") count++;
    }
    return count;
  }

  private static expandedFactorsCountDiff(
    leftDen: FactorUnits,
    rightDen: FactorUnits,
    target: FactorUnits
  ): number {
    const leftFactorsDenCnt = leftDen.expand().length;
    const rightFactorsDenCnt = rightDen.expand().length;
    const reqFactorsDenCnt = target.expand().length;
    const diffFactorsCountDen =
      Math.abs(reqFactorsDenCnt - leftFactorsDenCnt) -
      Math.abs(reqFactorsDenCnt - rightFactorsDenCnt);
    return diffFactorsCountDen;
  }

  private static findMatchingUnits(
    initialFactorUnitSelection: FactorUnits
  ): Unit[] {
    const matchingUnits: Unit[] = [];
    const unitsWithSameDimVector = this.getUnitsByDimensionVector(
      initialFactorUnitSelection.getDimensionVector()
    );
    if (
      isNullish(unitsWithSameDimVector) ||
      (unitsWithSameDimVector as Array<Unit>).length == 0
    ) {
      return [];
    }
    for (const unit of unitsWithSameDimVector as Array<Unit>) {
      if (unit.matches(initialFactorUnitSelection)) {
        matchingUnits.push(unit);
      }
    }
    arrayDeduplicate(matchingUnits, compareUsingEquals);
    return matchingUnits;
  }

  public static getUnitsByDimensionVector(
    dimVector: DimensionVector | string
  ): Array<Unit> {
    let dimVectorIri: string | undefined = undefined;
    if (typeof dimVector === "string") {
      dimVectorIri = dimVector;
    } else {
      dimVectorIri = dimVector.getDimensionVectorIri();
    }
    const unitsWithSameDimVector =
      config.unitsByDimensionVector.get(dimVectorIri);
    if (isNullish(unitsWithSameDimVector)) {
      return [];
    }
    return unitsWithSameDimVector as Array<Unit>;
  }

  public static getUnitsWithSameDimensionVector(unit: Unit) {
    if (isNullish(unit.dimensionVectorIri)) {
      throw new Error(
        `unit ${unit.getIriAbbreviated()} does not have a dimension vector iri`
      );
    }
    return this.getUnitsByDimensionVector(unit.dimensionVectorIri as string);
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
    // special case: KiloGM is not a scaling of GM, it's the other way round. Handle special case here.
    if (thePrefix.iri.endsWith("/Kilo") && theUnit.iri.endsWith("/GM")) {
      return this.unitFromLocalname("KiloGM");
    }
    const candidates = this.getUnitsWithSameDimensionVector(theUnit);
    for (const u of candidates) {
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

  static unscale(
    unit: Unit,
    treatKiloGmAsUnscaled = true,
    treatPrefixlessAsUnscaled = true
  ): Unit {
    if (!unit.scalingOf) {
      return unit;
    }
    if (treatPrefixlessAsUnscaled && !unit.prefix) {
      return unit;
    }
    if (treatKiloGmAsUnscaled && unit.getIriAbbreviated() === "unit:KiloGM") {
      return unit;
    }
    return unit.scalingOf;
  }

  /**
   * Return a list of {@link FactorUnit}s with the same exponents as the specified `factorUnits` but their base units as units.
   *
   * @param factorUnits the factor units to unscale
   * @return the unscaled factor units
   */
  static unscaleFactorUnits(
    factorUnits: FactorUnit[],
    treatKiloGMAsUnscaled = true,
    treatPrefixlessAsUnscaled = true
  ): FactorUnit[] {
    return factorUnits.map(
      (fu) =>
        new FactorUnit(
          Qudt.unscale(
            fu.unit,
            treatKiloGMAsUnscaled,
            treatPrefixlessAsUnscaled
          ),
          fu.exponent
        )
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
    toUnit: Unit | string,
    quantityKind?: QuantityKind | string
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
    const qk: QuantityKind | undefined = isNullish(quantityKind)
      ? undefined
      : typeof quantityKind === "string"
      ? Qudt.quantityKindRequired(quantityKind)
      : quantityKind;
    return from.convert(value, to, qk);
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
    toUnit: Unit | string,
    quantityKind?: QuantityKind | string
  ): QuantityValue {
    if (!from) {
      throw "Parameter 'from' is required";
    }
    if (!toUnit) {
      throw "Parameter 'toUnit' is required";
    }
    const to = typeof toUnit === "string" ? Qudt.unitRequired(toUnit) : toUnit;
    const qk: QuantityKind | undefined = isNullish(quantityKind)
      ? undefined
      : typeof quantityKind === "string"
      ? Qudt.quantityKindRequired(quantityKind)
      : quantityKind;
    return from.convert(to, qk);
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
      return { unit: unit, factor: ONE };
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

  /**
   * Returns the first unit obtained using {@link #correspondingUnitsInSystem(Unit,
   * SystemOfUnits)}.
   *
   * @return the unit corresponding to the specified unit in the specified systemOfUnits.
   */
  static correspondingUnitInSystem(
    unit: Unit,
    systemOfUnits: SystemOfUnits
  ): Unit | undefined {
    const correspondingUnits = Qudt.correspondingUnitsInSystem(
      unit,
      systemOfUnits
    );
    if (
      typeof correspondingUnits !== "undefined" &&
      correspondingUnits.length > 0
    ) {
      return correspondingUnits[0];
    }
    return undefined;
  }

  /**
   * Gets units that correspond to the specified unit are allowed in the specified systemOfUnits.
   * The resulting units have to
   *
   * <ol>
   *   <li>have the same dimension vector as the unit
   *   <li>share at least one quantityKind with unit
   * </ol>
   *
   * and they are ascending sorted by dissimilarity in magnitude to the magnitude of the specified
   * unit, i.e. the first unit returned is the closest in magnitude.
   *
   * <p>If two resulting units have the same magnitude difference from the specified one, the
   * following comparisons are made consecutively until a difference is found:
   *
   * <ol>
   *   <li>the base unit of the specified system is ranked first
   *   <li>conversion offset closer to the one of the specified unit is ranked first
   *   <li>the unscaled unit is ranked first
   *   <li>the unit that has a symbol is ranked first
   *   <li>the unit with more quantityKinds is ranked first
   *   <li>the units are ranked by their IRIs lexicographically
   * </ol>
   *
   * that is a base unit of the system is ranked first. If none or both are base units, the one
   * with a conversion offset closer to the specified unit's conversion offset is ranked first.
   *
   * @param unit
   * @param systemOfUnits
   * @return
   */
  static correspondingUnitsInSystem(
    unit: Unit,
    systemOfUnits: SystemOfUnits
  ): Unit[] {
    if (systemOfUnits.allowsUnit(unit)) {
      return [unit];
    }
    const elegible = Array.from(config.units.values())
      .filter((u) => systemOfUnits.allowsUnit(u))
      .filter((u) => u.dimensionVectorIri === unit.dimensionVectorIri);

    if (elegible.length === 1) {
      return elegible;
    }
    let candidates = [...elegible];
    // get the unit that is closest in magnitude (conversionFactor)
    // recursively check for factor units
    candidates = candidates.filter((u) =>
      u.quantityKinds.some((q) => arrayContains(unit.quantityKinds, q))
    );
    if (candidates.length === 1) {
      return candidates;
    }
    candidates.sort((l: Unit, r: Unit) => {
      const scaleDiffL = Math.abs(Qudt.scaleDifference(l, unit));
      const scaleDiffR = Math.abs(Qudt.scaleDifference(r, unit));
      const diff = Math.sign(scaleDiffL - scaleDiffR);
      if (diff !== 0) {
        return diff;
      }
      // tie breaker: base unit ranked before non-base unit
      let cmp = BooleanComparator(
        systemOfUnits.hasBaseUnit(r),
        systemOfUnits.hasBaseUnit(l)
      );
      if (cmp !== 0) {
        return cmp;
      }
      // tie breaker: closer offset
      const offsetDiffL = Math.abs(Qudt.offsetDifference(l, unit));
      const offsetDiffR = Math.abs(Qudt.offsetDifference(r, unit));
      cmp = Math.sign(offsetDiffL - offsetDiffR);
      if (cmp != 0) {
        return cmp;
      }
      // tie breaker: perfer unit that is not scaled
      cmp = BooleanComparator(l.isScaled(), r.isScaled());
      if (cmp != 0) {
        return cmp;
      }
      // tie breaker prefer the unit that has a symbol (it's more likely to be
      // commonly used):
      cmp = BooleanComparator(r.hasSymbol(), l.hasSymbol());
      if (cmp != 0) {
        return cmp;
      }
      // tie breaker: prefer unit with more quantity kinds (it's less specific)
      cmp = NumberComparator(l.quantityKinds.length, r.quantityKinds.length);
      if (cmp != 0) {
        return cmp;
      }
      // tie breaker: lexicographically compare iris.
      return StringComparator(l.iri, r.iri);
    });
    return candidates;
  }

  private static scaleDifference(u1: Unit, u2: Unit): number {
    const u1Log10 = u1.conversionMultiplier.log(10);
    const u2Log10 = u2.conversionMultiplier.log(10);
    return u1Log10.toNumber() - u2Log10.toNumber();
  }

  private static offsetDifference(u1: Unit, u2: Unit) {
    const u1Log10 = Qudt.logOrZeroRequireNonNegative(u1.conversionOffset.abs());
    const u2Log10 = Qudt.logOrZeroRequireNonNegative(u2.conversionOffset.abs());
    return u1Log10.toNumber() - u2Log10.toNumber();
  }

  private static logOrZeroRequireNonNegative(val: Decimal): Decimal {
    if (val.isNegative()) {
      throw `Cannot get logarithm of negative value ${val}`;
    }
    if (val.isZero()) {
      return ZERO;
    }
    return val.log(10);
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
