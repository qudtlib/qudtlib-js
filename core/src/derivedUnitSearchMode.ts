/**
 * Governs the algorithm used to find units based on their derived units. The DerivedUnitSearchMode
 * is mapped to the {@link FactorUnitMatchingMode} which governs individual unit/factor unit
 * matching.
 */
export enum DerivedUnitSearchMode {
  /** Return all matching units. */
  ALL,
  /**
   * Return the best matching unit.
   */
  BEST_MATCH,
}
