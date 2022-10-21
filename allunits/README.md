# All QUDT units for [@qudtlib/core]

[Changelog](https://github.com/qudtlib/qudtlib-js/CHANGELOG.md)

This package provides all units, quantitykinds and prefixes defined by the [QUDT ontology](https://qudt.org),
based on @qudtlib/core.

All units, QuantityKinds and Prefixes are accessible as constants on the `Units`, `QuantityKind` and `Prefixes` objects:

```
const meter = Units.M;
const length = QuantityKinds.Length;
const giga = Prefixes.Giga;
```

The package re-exports `@qudtlib/core`. The package functionality is mainly accessed through the `Qudt` object and
through individual `Unit` and (to a lesser extent) `QuantityKind` and `Prefix` instances. Quick examples:

```
// instantiate unit from its IRI:
let meterUnit = Qudt.unit("http://qudt.org/vocab/unit/M");

// instantiate unit from its label:
meterUnit = Qudt.unitFromLabel("Meter");

// convert Meter to Feet:
const feet = Units.M.convert(new Decimal(1), Units.FT);
```

More examples can be found in the package's unit tests.

For more documentation on the core features, refer to the @qudtlib/core package README.


[@qudtlib/core]: https://github.com/qudtlib/qudtlib-js