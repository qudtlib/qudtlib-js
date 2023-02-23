import { SupportsEquals } from "./baseTypes.js";
import { Unit } from "./unit.js";
import { Decimal } from "decimal.js";

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
