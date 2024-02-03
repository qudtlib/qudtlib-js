# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This Changelog contains the changes for all packages of this monorepo, which all use the same version at all times.

## Unreleased

## 6.2.1 - 2024-02-03

## 6.1.0 - 2024-01-11

### Changed

- Simplified BEST_MATCH algorithm for obtaining a unit from a set of factor units. Recent additions to the data model (isScalingOf and factorUnit relationships) led to a larger set of candidates and the complexity of the previous algorithm led to very high computation time.
- Changed the behaviour of Unit.hasFactorUnits() such that for a FactorUnits object with only one top-level factor unit (such as [N^1]), the method returns false.

## 6.0.0 - 2023-12-15

### Fixed

- Implement a not so recent change in QUDTLib whereby quantitykinds are no longer skos:broader but
  qudt:exactMatch in certain conditions. See https://github.com/qudtlib/qudtlib-java/issues/61. The change
  adds an `exactMatch` property to the `QuantityKind` and `Unit` classes and uses the exactMatch property
  where appropriate in algorithms.

## 5.0.1 - 2023-09-21

### Fixed

- `quantitykind:Currency` was missing in 5.0.0. Its definition was moved to the currencies file in the QUDT repo
  which used to be ingested only for units code generation. Now it is also used for quantity kinds code generation.

## 5.0.0 - 2023-09-15

## 5.0.0-beta.0 - 2023-09-15

### Added

- `Qudt.currencyFromLocalName*` methods to obtain currency units

### Changed

- Breaking change: special handling for currencies (cannot be instantiated by localname as before)
- Changes to the system of unit handling likely to produce different results in some cases

## 4.3.0 - 2023-03-10

## 4.2.0 - 2023-03-03

### Added

- Add qudt namespace to Qudt.NAMESPACES
- Added currency symbols for major currencies

### Changed

- Updated QUDT to [v2.1.25](https://github.com/qudt/qudt-public-repo/releases/tag/v2.1.25)

## 4.1.1 - 2023-02-23

### Added

- `npm run run-examples` now conveniently runs the examples. This script is also triggered in the complete build.

### Fixed

- Fix 'module not found' error: splitting the one big `qudtlib.ts` file into many smaller ones in 4.0 actually did not work as the imports could not be resolved. Fixed that.
- Adapt jest config to the fix above.

## 4.1.0 - 2023-02-13

### Added

- Corresponding unit in system functionality - finds the best matching units to a given unit in a desired unit system, such as the corresponding unit for inch in the SI system (centimeter).

## 4.0.0 - 2023-02-06

### Added

- SystemOfUnits as a model class
- Several manual links from units to their base units or factor units

### Changed

- BREAKING: Made QUDTlib data model immutable, changed instantiation to force use of builders.

## 3.2.0 - 2023-01-20

### Added

- Temporarily added quantitykinds `PositivePlaneAngle, NonNegativeLength, PositiveLength and Count` until upstream [upstream PR 630](https://github.com/qudt/qudt-public-repo/pull/630) and [upstream PR 631](https://github.com/qudt/qudt-public-repo/pull/631) are released.

### Changed

- Updated QUDT to [v2.1.24](https://github.com/qudt/qudt-public-repo/releases/tag/v2.1.24)

## 3.1.2 - 2022-12-06

### Added

- Add quantity kinds for positive dimensionless ratio and normalized dimensionless ratio temporarily until the canges from the [upstream PR](https://github.com/qudt/qudt-public-repo/pull/619) are released.

## 3.1.1 - 2022-12-01

### Changed

- Changed scoring algorithm for determining best matching unit

## 3.1.0 - 2022-11-24

### Added

- `Unit.getAllPossibleFactorUnitCombinations()`, required for finding the best matching unit for a set of factor units.

### Changed

- Improved algorithm for scoring unit matches in `Qudt.matchScore`.

## 3.0.0 - 2022-11-22

### Added

- support for currency code and currency number, accessible for instantiation via `Qudt.unitFromLabel`.

### Changed

- Refactoring of derived unit calculation (breaking)

## 2.4.0-beta.0 - 2022-11-21

### Added

- Support non-base units in derived unit specs. For example, derive N**PER**M3 from [N, 1, M3, -1].

### Changed

- Refactoring of factor unit matching

## 2.3.0-beta.0 - 2022-11-14

### Added

- Add units and quantitykinds required for mapping QUDT to IFC (alpha).

### Changed

- Re-export Decimal from [decimal.js](https://mikemcl.github.io/decimal.js/) so clients do not need to install a separate dependency.
- Improve JSDoc for Qudt.scale() and Qudt.scaleUnitFromLabels().

## 2.2.0 - 2022-10-28

### Changed

- Updated QUDT to [v2.1.21](https://github.com/qudt/qudt-public-repo/releases/tag/v2.1.21)

## 2.1.0 - 2022-10-25

### Added

- New `examples` package (not published to npm) for documentation purposes
- New convenience methods for obtaining a `FactorUnitSelecion` for deriving units when you already have `FactorUnits[]`.

### Changed

- Updated QUDT to [v2.1.20](https://github.com/qudt/qudt-public-repo/releases/tag/v2.1.20)
- Generated [allunits/src/units.ts](allunits/src/units.ts) with [qudtlib-java:2.1.1](https://github.com/qudtlib/qudtlib-java/releases/tag/v2.1.1)
- Improved the `README.md` files with examples

## 2.0.0 - 2022-10-21

### Changed

- Initial release.
