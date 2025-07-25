// src/index.ts
// Barrel file exporting all public types, classes, interfaces, enums, and constants from the library.

export {
  AssignmentProblem,
  Instance,
  Solution,
  NaiveAlgorithmInstance,
  ValueWithIndex,
} from "./assignmentProblem.js";
export {
  UnitOrExponent,
  ExponentUnitPairs,
  SupportsEquals,
} from "./baseTypes.js";
export { DerivedUnitSearchMode } from "./derivedUnitSearchMode.js";
export { DimensionVector } from "./dimensionVector.js";
export { FactorUnit } from "./factorUnit.js";
export { FactorUnits } from "./factorUnits.js";
export { LangString } from "./langString.js";
export { Namespace } from "./namespace.js";
export { Prefix } from "./prefix.js";
export { QuantityKind } from "./quantityKind.js";
export { QuantityValue } from "./quantityValue.js";
export { QudtlibConfig, Qudt, config } from "./qudt.js";
export { QudtNamespaces } from "./qudtNamespaces.js";
export { SystemOfUnits } from "./systemOfUnits.js";
export { Unit } from "./unit.js";

// Utils exports (only public interfaces and types, as functions may not be needed in declarations)
export type { OrderComparator, EqualsComparator } from "./utils.js";

// Re-export Decimal as it's a dependency used in types
export { Decimal } from "decimal.js";
