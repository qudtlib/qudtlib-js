import { Prefix } from "./prefix.js";
import { QuantityKind } from "./quantityKind.js";
import { Unit } from "./unit.js";

export type UnitOrExponent = Unit | number;
export type ExponentUnitPairs = UnitOrExponent[];

export interface SupportsEquals<Type> {
  equals(other?: Type): boolean;
}
