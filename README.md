# QUDTLib: JS Unit Conversion Library based on QUDT

Provides unit conversion and related functionality for Javascript (Typescript).

Makes all conversions and related functionality defined by the excellent [QUDT ontology](https://qudt.org) available in
a js package without any RDF manipulation needed.

The library offers

- 1745 units, such as second, Fahrenheit, or light year
- 881 quantityKinds, such as width, pressure ratio or currency
- 29 prefixes, such as mega, kibi, or atto

## Building

This monorepo project is built with lerna.

At the top level of the project, do

````
npx lerna run build
```np

````
