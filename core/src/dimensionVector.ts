import { QudtNamespaces } from "./qudtNamespaces.js";
import { isNullish } from "./utils.js";
import { SupportsEquals } from "./baseTypes";

/**
 * Represents the QUDT dimension vector and allows for converting between a dimension vector IRI and
 * the numeric values, as well as for some manipulations.
 *
 * <p>Note that the last value, the 'D' dimension is special: it is only an indicator that the
 * dimension vector represents a ratio (causing all other dimensions to cancel each other out). It
 * never changes by multiplication, and its value is only 1 iff all other dimensions are 0.
 */
export class DimensionVector implements SupportsEquals<DimensionVector> {
  private static readonly DIMENSIONS = ["A", "E", "L", "I", "M", "H", "T", "D"];
  //public static final DecimalFormat FORMAT = new DecimalFormat("0.#");
  private static readonly FORMAT = new Intl.NumberFormat("en-US", {
    useGrouping: false,
  });
  private static readonly PT = "pt";

  public static readonly DIMENSIONLESS = new DimensionVector([
    0, 0, 0, 0, 0, 0, 0, 1,
  ]);

  private static readonly INDEX_AMOUNT_OF_SUBSTANCE = 0;
  private static readonly INDEX_ELECTRIC_CURRENT = 1;
  private static readonly INDEX_LENGTH = 2;
  private static readonly INDEX_LUMINOUS_INTENSITY = 3;
  private static readonly INDEX_MASS = 4;
  private static readonly INDEX_TEMPERATURE = 5;
  private static readonly INDEX_TIME = 6;

  private readonly dimensionVectorIri: string;

  private readonly values: Array<number>;

  public static ofRequired(
    dimensionVectorIri: string | number[]
  ): DimensionVector {
    return new DimensionVector(dimensionVectorIri);
  }

  public static of(
    dimensionValues: string | number[]
  ): DimensionVector | undefined {
    try {
      return new DimensionVector(dimensionValues);
    } catch (e) {
      return undefined;
    }
  }

  constructor(dimensionVector: string | Array<number>) {
    if (typeof dimensionVector === "string") {
      this.dimensionVectorIri = dimensionVector;
      this.values = this.parseDimValues(dimensionVector);
    } else if (Array.isArray(dimensionVector)) {
      this.values = dimensionVector;
      this.dimensionVectorIri =
        this.generateDimensionVectorIri(dimensionVector);
    } else {
      throw new Error(`Cannot handle constructor argument ${dimensionVector}`);
    }
  }

  private parseDimValues(dimensionVectorIri: string): number[] {
    if (
      !QudtNamespaces.dimensionVector.isFullNamespaceIri(dimensionVectorIri)
    ) {
      throw new Error(`Not a dimension vector iri: ${dimensionVectorIri}`);
    }
    const localName =
      QudtNamespaces.dimensionVector.getLocalnameIfFullNamespaceIri(
        dimensionVectorIri
      );
    const dimValues = [0, 0, 0, 0, 0, 0, 0, 0];
    const numbers = localName.split(/[AELIMHTD]/);
    const indicators = localName.split(/-?[0-9]+p?t?[0-9]*/);
    if (indicators.length != 9) {
      throw new Error(
        `Cannot process dimension vector iri ${dimensionVectorIri}: unexpected number of dimensions: ${numbers.length}`
      );
    } else {
      for (let i = 0; i < 8; i++) {
        if (indicators[i].charAt(0) != DimensionVector.DIMENSIONS[i]) {
          throw new Error(
            `Expected dimension indicator '${DimensionVector.DIMENSIONS[i]}', encountered '${indicators[i]}'`
          );
        }
        dimValues[i] = DimensionVector.noNegativeZero(
          Number.parseFloat(numbers[i + 1].replace("pt", "."))
        ); // split produces an empty first array element
      }
    }
    return dimValues;
  }

  private generateDimensionVectorIri(dimensionValues: number[]): string {
    if (dimensionValues.length != 8) {
      throw new Error(
        "wrong dimensionality, expected 8, got " + dimensionValues.length
      );
    }
    let result = "";
    for (let i = 0; i < 8; i++) {
      result +=
        DimensionVector.DIMENSIONS[i] +
        DimensionVector.iriFormat(dimensionValues[i]);
    }
    return "http://qudt.org/vocab/dimensionvector/" + result;
  }

  private static noNegativeZero(f: number): number {
    if (f === -0.0) {
      return 0.0;
    }
    return f;
  }

  private static iriFormat(dimensionValue: number): string {
    // Note: This handles a weird case where you may have "-0" as a value.
    if (Math.abs(dimensionValue) < 0.01) {
      return "0";
    }
    return DimensionVector.FORMAT.format(dimensionValue).replace(".", "pt");
  }

  public isDimensionless(): boolean {
    return this.equals(DimensionVector.DIMENSIONLESS);
  }

  public getDimensionVectorIri(): string {
    return this.dimensionVectorIri;
  }

  public getValues(): number[] {
    return this.values;
  }

  public getAmountOfSubstanceExponent() {
    return this.values[DimensionVector.INDEX_AMOUNT_OF_SUBSTANCE];
  }
  public getElectricCurrentExponent() {
    return this.values[DimensionVector.INDEX_ELECTRIC_CURRENT];
  }

  public getLenghExponent() {
    return this.values[DimensionVector.INDEX_LENGTH];
  }
  public getLuminousIntensityExponent() {
    return this.values[DimensionVector.INDEX_LUMINOUS_INTENSITY];
  }
  public getMassExponent() {
    return this.values[DimensionVector.INDEX_MASS];
  }
  public getTemperatureExponent() {
    return this.values[DimensionVector.INDEX_TEMPERATURE];
  }
  public getTimeExponent() {
    return this.values[DimensionVector.INDEX_TIME];
  }

  public multiply(by: number): DimensionVector {
    const mult: number[] = [];
    let isRatio = true;
    for (let i = 0; i < 7; i++) {
      const multDim = DimensionVector.noNegativeZero(this.values[i] * by);
      mult.push(multDim);
      if (multDim != 0) {
        isRatio = false;
      }
    }
    mult.push(0);
    DimensionVector.setRatio(mult, isRatio);
    return new DimensionVector(mult);
  }

  private static setRatio(values: number[], isRatio: boolean): void {
    values[7] = isRatio ? 1 : 0;
  }

  public combine(other: DimensionVector): DimensionVector {
    const combined: number[] = [];
    let isRatio = true;
    for (let i = 0; i < 7; i++) {
      combined[i] = DimensionVector.noNegativeZero(
        this.values[i] + other.getValues()[i]
      );
      if (combined[i] != 0) {
        isRatio = false;
      }
    }
    DimensionVector.setRatio(combined, isRatio);
    return new DimensionVector(combined);
  }

  public equals(o: unknown): boolean {
    if (isNullish(o)) {
      return false;
    }
    if (this === o) return true;
    if (!(o instanceof DimensionVector)) return false;
    const that = o as DimensionVector;
    return (
      that.getDimensionVectorIri() === this.dimensionVectorIri &&
      this.values.every((v, i) => v === that.getValues()[i])
    );
  }
}
