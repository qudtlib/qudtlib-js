import { Prefix } from "./prefix";
import { QuantityKind } from "./quantityKind";
import { Unit } from "./unit";

export type UnitOrExponent = Unit | number;
export type ExponentUnitPairs = UnitOrExponent[];

export interface SupportsEquals<Type> {
  equals(other?: Type): boolean;
}
