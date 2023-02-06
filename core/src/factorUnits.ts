import { SupportsEquals } from "./baseTypes";
import { FactorUnit } from "./factorUnit";
import { arrayEqualsIgnoreOrdering, compareUsingEquals } from "./utils";
import { Unit } from "./unit";
import { Decimal } from "decimal.js";

/**
 * Class representing a set of FactorUnits and a conversionMultiplier, so the units can be
 * used to replace any other unit of the same dimensionality.
 */
export class FactorUnits implements SupportsEquals<FactorUnits> {
  readonly factorUnits: FactorUnit[];
  readonly scaleFactor: Decimal;

  constructor(
    factorUnits: FactorUnit[],
    scaleFactor: Decimal = new Decimal(1)
  ) {
    this.factorUnits = factorUnits;
    this.scaleFactor = scaleFactor;
  }

  static ofUnit(unit: Unit) {
    return new FactorUnits([FactorUnit.ofUnit(unit)]);
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

  normalize(): FactorUnits {
    const normalized = FactorUnit.normalizeFactorUnits(this.factorUnits);
    return new FactorUnits(
      normalized.factorUnits,
      normalized.scaleFactor.mul(this.scaleFactor)
    );
  }

  getAllPossibleFactorUnitCombinations(): FactorUnit[][] {
    return FactorUnit.getAllPossibleFactorUnitCombinations(this.factorUnits);
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
      (this.scaleFactor.eq(new Decimal(1))
        ? ""
        : this.scaleFactor.toString() + "*") +
      "[" +
      this.factorUnits.map((s) => s.toString()).reduce((p, n) => p + ", " + n) +
      "]"
    );
  }
}
