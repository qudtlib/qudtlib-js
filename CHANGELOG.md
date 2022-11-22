# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

This Changelog contains the changes for all packages of this monorepo, which all use the same version at all times.

## Unreleased

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
