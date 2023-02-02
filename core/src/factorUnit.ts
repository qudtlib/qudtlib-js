import { SupportsEquals } from "./baseTypes";
import {
  arrayDeduplicate,
  arrayEqualsIgnoreOrdering,
  checkInteger,
  compareUsingEquals,
} from "./utils";
import { FactorUnits } from "./factorUnits";
import { Unit } from "./unit";
import { Decimal } from "decimal.js";

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
    if (!left) {
      return right;
    }
    if (!right) {
      return left;
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

  getAllPossibleFactorUnitCombinations(): FactorUnit[][] {
    const subResult = this.unit.getAllPossibleFactorUnitCombinations();
    const result = subResult.map((fus) =>
      fus.map((fu) => fu.pow(this.exponent))
    );
    return arrayDeduplicate(result, (left, right) =>
      arrayEqualsIgnoreOrdering(left, right, compareUsingEquals)
    );
  }

  static getAllPossibleFactorUnitCombinations(
    factorUnits: FactorUnit[]
  ): FactorUnit[][] {
    const numFactors = factorUnits.length;
    const subResults: FactorUnit[][][] = factorUnits.map((fu) =>
      fu.getAllPossibleFactorUnitCombinations()
    );
    const subResultLengths = subResults.map((s) => s.length);
    const currentIndices: number[] = [];
    currentIndices.length = numFactors;
    currentIndices.fill(0);
    const results: FactorUnit[][] = [];
    // cycle through all possible combinations of results per factor unit and combine them
    do {
      const curResult: FactorUnit[] = [];
      let countUp = true;
      for (let i = 0; i < numFactors; i++) {
        curResult.push(...subResults[i][currentIndices[i]]);
        if (countUp) {
          currentIndices[i]++;
          if (currentIndices[i] >= subResultLengths[i]) {
            currentIndices[i] = 0;
          } else {
            countUp = false;
          }
        }
      }
      results.push(FactorUnit.contractExponents(curResult));
      results.push(FactorUnit.reduceExponents(curResult));
    } while (!currentIndices.every((val) => val === 0));
    return arrayDeduplicate(results, (left, right) =>
      arrayEqualsIgnoreOrdering(left, right, compareUsingEquals)
    );
  }

  static ofUnit(unit: Unit) {
    return new FactorUnit(unit, 1);
  }
}
