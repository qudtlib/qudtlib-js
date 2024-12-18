import { SupportsEquals } from "./baseTypes.js";
import { FactorUnit } from "./factorUnit.js";
import {
  arrayEqualsIgnoreOrdering,
  compareUsingEquals,
  isNullish,
  ONE,
} from "./utils.js";
import { Unit } from "./unit.js";
import { Decimal } from "decimal.js";
import { DimensionVector } from "./dimensionVector";

/**
 * Class representing a set of FactorUnits and a conversionMultiplier, so the units can be
 * used to replace any other unit of the same dimensionality.
 */
export class FactorUnits implements SupportsEquals<FactorUnits> {
  private static readonly EMPTY_FACTOR_UNITS = new FactorUnits([], ONE);
  readonly factorUnits: FactorUnit[];
  readonly scaleFactor: Decimal;
  private normalized?: FactorUnits = undefined;
  private dimensionVector?: DimensionVector = undefined;

  constructor(factorUnits: FactorUnit[], scaleFactor: Decimal = ONE) {
    this.factorUnits = factorUnits;
    this.scaleFactor = scaleFactor;
  }

  static ofUnit(unit: Unit) {
    return new FactorUnits([FactorUnit.ofUnit(unit)]);
  }

  static ofFactorUnitSpecWithScaleFactor(
    scalar: Decimal,
    ...factorUnitSpec: (Unit | number)[]
  ): FactorUnits {
    const withoutScalar = this.ofFactorUnitSpec(...factorUnitSpec);
    return new FactorUnits(withoutScalar.factorUnits, scalar);
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

  static empty(): FactorUnits {
    return FactorUnits.EMPTY_FACTOR_UNITS;
  }

  /**
   * Returns this ScaledFactorUnits object, raised to the specified power.
   * @param power
   */
  pow(power: number) {
    return new FactorUnits(
      this.factorUnits.map((fu) => fu.pow(power)),
      this.scaleFactor.pow(power)
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
      this.scaleFactor.mul(other.scaleFactor)
    );
  }

  /**
   * Returns this ScaledFactorUnits object, with its conversionMultiplier multiplied by the specified value.
   *
   * @param by
   */
  scale(by: Decimal) {
    return new FactorUnits(this.factorUnits, this.scaleFactor.mul(by));
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
      this.scaleFactor
    );
  }

  contractExponents() {
    return new FactorUnits(
      FactorUnit.contractExponents(this.factorUnits),
      this.scaleFactor
    );
  }

  hasFactorUnits(): boolean {
    if (isNullish(this.factorUnits)) {
      return false;
    }
    if (this.factorUnits.length === 0) {
      return false;
    }
    if (
      this.factorUnits.length === 1 &&
      !this.factorUnits[0].unit.factorUnits.equals(this)
    ) {
      return true;
    }
    if (
      this.factorUnits.length === 1 &&
      this.factorUnits[0].exponent === 1 &&
      ONE.equals(this.scaleFactor)
    ) {
      return false;
    }
    return true;
  }

  /**
   * Returns true iff this factorUnits object has exactly one factor unit, which has exponent 1.
   */
  isOneOtherUnitWithExponentOne() {
    if (isNullish(this.factorUnits)) {
      return false;
    }
    if (this.factorUnits.length !== 1) {
      return false;
    }
    const factorUnit = this.factorUnits[0];
    if (factorUnit.exponent !== 1) {
      return false;
    }
    if (factorUnit.unit.factorUnits.equals(this)) {
      return false;
    }
    return true;
  }

  normalize(): FactorUnits {
    if (!isNullish(this.normalized)) {
      return this.normalized as FactorUnits;
    }
    let normalized = null;
    if (this.hasFactorUnits()) {
      const mapped = this.factorUnits.map((fu) =>
        fu.unit.normalize().pow(fu.exponent)
      );
      normalized = mapped.reduce((prev, cur) => prev.combineWith(cur));
    } else {
      normalized = new FactorUnits(this.factorUnits, this.scaleFactor);
    }
    if (!normalized.isRatioOfSameUnits()) {
      normalized = normalized.reduceExponents();
    }
    this.normalized = normalized.scale(this.scaleFactor);
    return this.normalized;
  }

  public expand(): FactorUnit[] {
    return FactorUnits.expandFactors(this);
  }

  public static expandFactors(factorUnits: FactorUnits): FactorUnit[] {
    if (!factorUnits.hasFactorUnits()) {
      return [...factorUnits.factorUnits];
    }
    return factorUnits.factorUnits.flatMap((fu) =>
      FactorUnits.expandFactors(fu.unit.factorUnits)
    );
  }

  getAllPossibleFactorUnitCombinations(): FactorUnit[][] {
    return FactorUnit.getAllPossibleFactorUnitCombinations(this.factorUnits);
  }

  /**
   * Returns a FactorUnits object containing the scaleFactor and the factors in the numerator of
   * this FactorUnits object. Note that any derived units in the numerator are returned without
   * recursive decomposition. For example, for `5.0 * M2-PER-N` a FactorUnit object representing
   * `N` is returned.
   *
   * @return a FactorUnits object representing the scaleFactor and the numerator units of this
   *     unit.
   */
  numerator(): FactorUnits {
    return new FactorUnits(this.numeratorFactors(), this.scaleFactor);
  }

  private numeratorFactors(): FactorUnit[] {
    return this.factorUnits.filter((fu) => fu.exponent > 0);
  }

  /**
   * Returns a FactorUnits object containing the factors in the denominator of this FactorUnits
   * object. Note that any derived units in the denominator are returned without recursive
   * decomposition. For example, for `5.0 * ` a FactorUnit object representing `5.0 * N` is
   * returned.
   *
   * @return a FactorUnits object representing the scaleFactor and the numerator units of this
   *     unit.
   */
  public denominator(): FactorUnits {
    return new FactorUnits(this.denominatorFactors());
  }

  public getDimensionVector(): DimensionVector {
    if (isNullish(this.dimensionVector)) {
      this.dimensionVector = this.computeDimensionVector();
    }
    return this.dimensionVector as DimensionVector;
  }

  private computeDimensionVector(): DimensionVector {
    if (isNullish(this.factorUnits) || this.factorUnits.length == 0) {
      return DimensionVector.DIMENSIONLESS;
    }

    let dv: DimensionVector | undefined = undefined;
    for (const fu of this.factorUnits) {
      const factorUnitFeatureVector = fu.getDimensionVector();
      if (isNullish(factorUnitFeatureVector)) {
        throw new Error(
          `Cannot compute dimension vector of factor units ${this.toString()}: ${fu.unit.getIriAbbreviated()} does not have a dimension vector`
        );
      }
      if (isNullish(dv)) {
        dv = factorUnitFeatureVector;
      } else {
        dv = (dv as DimensionVector).combine(
          factorUnitFeatureVector as DimensionVector
        );
      }
    }
    return dv as DimensionVector;
  }

  private denominatorFactors(): FactorUnit[] {
    return this.factorUnits
      .filter((fu) => fu.exponent < 0)
      .map((fu) => fu.pow(-1));
  }

  public getLocalname(): string {
    return this.generateLocalname(
      this.numeratorFactors()
        .map((fu) => FactorUnits.factorUnitLocalname(fu))
        .join("-"),
      this.denominatorFactors()
        .map((fu) => FactorUnits.factorUnitLocalname(fu))
        .join("-")
    );
  }

  private static isEmptyOrNullish(val?: string): boolean {
    return val === null || typeof val === "undefined" || val.length == 0;
  }

  private generateLocalname(numerator = "", denominator = ""): string {
    let completeString = numerator;
    if (!FactorUnits.isEmptyOrNullish(denominator)) {
      if (!FactorUnits.isEmptyOrNullish(numerator)) {
        completeString += "-";
      }
      completeString += "PER-" + denominator;
    }
    return completeString;
  }

  private static factorUnitLocalname(fu: FactorUnit): string {
    return (
      fu.unit.getIriLocalname() +
      (Math.abs(fu.exponent) > 1 ? Math.abs(fu.exponent) : "")
    );
  }

  private static permutate(strings: string[]): string[][] {
    const ret = [];
    if (strings.length <= 1) {
      ret.push(strings);
      return ret;
    }
    for (let i = 0; i < strings.length; i++) {
      const otherElements = [...strings];
      otherElements.splice(i, 1);
      const othersPermutated = this.permutate(otherElements);
      for (const otherPermutated of othersPermutated) {
        otherPermutated.unshift(strings[i]);
      }
      ret.push(...othersPermutated);
    }
    return ret;
  }

  private permutateFactorUnitLocalnames(
    predicate: (fu: FactorUnit) => boolean
  ): string[] {
    return FactorUnits.permutate(
      this.factorUnits.filter(predicate).map(FactorUnits.factorUnitLocalname)
    ).map((strings) => strings.join("-"));
  }

  public generateAllLocalnamePossibilities(): string[] {
    return this.permutateFactorUnitLocalnames((fu) => fu.exponent > 0).flatMap(
      (numeratorString) =>
        this.permutateFactorUnitLocalnames((fu) => fu.exponent < 0).map(
          (denominatorString) =>
            this.generateLocalname(numeratorString, denominatorString)
        )
    );
  }

  equals(other?: FactorUnits): boolean {
    if (!other) {
      return false;
    }
    return (
      this.scaleFactor.eq(other?.scaleFactor) &&
      arrayEqualsIgnoreOrdering(
        this.factorUnits,
        other?.factorUnits,
        compareUsingEquals
      )
    );
  }

  toString(): string {
    return (
      (this.scaleFactor.eq(ONE) ? "" : this.scaleFactor.toString() + "*") +
      (this.factorUnits.length > 0
        ? "[" +
          this.factorUnits
            .map((s) => s.toString())
            .reduce((p, n) => p + ", " + n) +
          "]"
        : "[no factors]")
    );
  }
}
