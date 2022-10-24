# QUDTLib: JS Unit Conversion Library based on QUDT

Package of [qudtlib-js](https://github.com/qudtlib/qudtlib-js)

[Changelog](https://github.com/qudtlib/qudtlib-js/blob/main/CHANGELOG.md)

Provides unit conversion and related functionality for Javascript (Typescript).

Based on the excellent [QUDT ontology](https://qudt.org), available in
a js package without any RDF manipulation needed.

This package is a port of [qudtlib-java](https://github.com/qudtlib/qudtlib-java/). The major version of this package is the same as that of `qudtlib-java`.

This package offers the core functionality, but defines no units/quantitykinds/prefixes. It is meant to be
imported and re-exported by packages providing such data. At the time of this writing, there is only one package
that provides units, `@qudtlib/allunits`.

Most users will want to use `@qudtlib/allunits` (which re-exports everything in this package).

##Usage

`Qudt` is your friend. All functionality is accessed through static methods of that class. You can explore the API from that starting point.
The main Model classes are:

    Unit: encapsulates IRI, label, dimension vector, multiplier/offset, factor units (if any). Descriptions are omitted (create an issue if you want them.)
    QuantityKind: IRI, label, applicable units, broader quantity kinds
    QuantityValue: value and unit.

Values are always Decimal (from [Decimal.js](https://mikemcl.github.io/decimal.js/)) and there are no convenience methods allowing you to provide other numeric types. This is intentiaonal so as not to mask any conversion problems. You'll be fine. When you need a value, use `new Decimal(number|string)`.

All units, quantityKinds and prefixes are avalable as constants (exported by the package providing the units, such as `@qudtlib/allunits`):

    Units: all units, such as Units.KiloM__PER__SEC
    QuantityKinds:: all quantityKinds, such as QuantityKinds.BloodGlucoseLevel
    Prefixes: all prefixes, such as Prefixes.Atto

The functionality comprises:

    Qudt.convert(...): Convert a value
    Qudt.scaleUnit(...): Scale a unit (e.g., make KiloM from M and kilo)
    Qudt.unscaleUnit(..): Unscale a unit:
    Qudt.unit(...): Get Unit by IRI
    Qudt.quantityKind(...): Get QuantityKind by IRI
    Qudt.unitFromLocalName(...): Get Unit by local name (i.e., last part of IRI)
    Qudt.quantityKindFromLocalName(...): Get QuantityKind by local name (i.e., last part of IRI)
    Qudt.derivedUnitsFrom...(...): Get Units by 'factor units', e.g. find N for factors m, kg, and s^-2. Different matching modes available for broader or narrower matching.
    Qudt.unitFromLabel(...): Get Unit by label

## Acknowledgments

This project has been developed at the [Research Studio Smart Application Technologies](https://sat.researchstudio.at) in the project ‘BIM-Interoperables Merkmalservice’, funded by the
Austrian Research Promotion Agency and Österreichische Bautechnik Veranstaltungs GmbH.
