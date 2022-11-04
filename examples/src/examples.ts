import { Decimal, DerivedUnitSearchMode, Qudt, Units } from "@qudtlib/allunits";

let value = new Decimal("1.83");

// All units have a constant in `Units`:
let converted = Qudt.convert(value, Units.M, Units.FT);
console.log("\n# m to ft:");
console.log(`${value}m = ${converted}ft`); // 1.83m = 6.003937007874015748ft

// If you don't know the unit at compile time, but you know the label, do this:
const fromLabel = "Degree Celsius";
const toLabel = "Degree Fahrenheit";
value = new Decimal(38.5);
converted = Qudt.convert(
  value,
  Qudt.unitFromLabelRequired(fromLabel),
  Qudt.unitFromLabelRequired(toLabel)
);
console.log("\n# Celsius to Fahrenheit:");
console.log(`${value}°C = ${converted}°F`); // 38.5°C = 101.30039299999995512°F

// If you know the units' IRI in QUDT, you can use it wherever you can pass a Unit:
const fromIri = Units.KiloGM.iri;
const toIri = Units.LB.iri;
value = new Decimal(98);
converted = Qudt.convert(value, fromIri, toIri);
console.log("\n# kilogram to pound:");
console.log(`${value} kilogram = ${converted} pounds`); // 98 kilogram = 216.05301694118002911 pounds

// all units, quantitykinds and prefixes have `toString` methods that use the units' symbol if possible:
console.log("\n# using Unit.toString():");
console.log(
  `${value}${Units.KiloGM.toString()} = ${converted}${Units.LB.toString()}`
); // 98kg = 216.05301694118002911lbm

// If you have factor units, you can instantiate the derived units:
const derived = Qudt.derivedUnitsFromExponentUnitPairs(
  DerivedUnitSearchMode.EXACT,
  Units.KiloGM,
  1,
  Units.M,
  1,
  Units.SEC,
  -2
);
const newton = derived[0];
value = new Decimal(250);
converted = Qudt.convert(value, newton, Units.KiloP);
console.log("\n# deriving N from (m kg s^-2):");
console.log(
  `${value}${newton.toString()} = ${converted}${Units.KiloP.toString()}`
); // 250N = 25.492905324448206064kp

// if you need the factor units, you can get them from the unit
const factorsN = Units.N.factorUnits.map((f) => f.toString()).join(" ");
console.log(`\n# obtaining factor units`);
console.log(`N =  (${factorsN})`); // N =  (m kg s^-2)

// use `Unit.getLeafFactorUnitsWithCumulativeExponents()` for multiple levels of derived units
const factorsW = Units.W.factorUnits.map((f) => f.toString()).join(" ");
const factorsF = Units.F.factorUnits.map((f) => f.toString()).join(" ");
const leafFactorsW = Units.W.getLeafFactorUnitsWithCumulativeExponents()
  .map((f) => f.toString())
  .join(" ");
const leafFactorsF = Units.F.getLeafFactorUnitsWithCumulativeExponents()
  .map((f) => f.toString())
  .join(" ");
console.log(`\n# derived units, multiiple recursions`);
console.log(`W =  (${factorsW})`); // W =  (J s^-1)
console.log(`W =  (${leafFactorsW})`); // W =  (m kg s^-2 m s^-1)
console.log(`F =  (${factorsF})`); // F =  (C V^-1)
console.log(`F =  (${leafFactorsF})`); // F =  (s A m^-1 kg^-1 s^2 m^-1 s A)

// use `Qudt.simplifyFactorUnits(Unit[])` to aggreagte potential duplicate units
const leafFactorsWsimplified = Qudt.simplifyFactorUnits(
  Units.W.getLeafFactorUnitsWithCumulativeExponents()
)
  .map((f) => f.toString())
  .join(" ");
const leafFactorsFsimplified = Qudt.simplifyFactorUnits(
  Units.F.getLeafFactorUnitsWithCumulativeExponents()
)
  .map((f) => f.toString())
  .join(" ");
console.log(`\n# simplify factor units`);
console.log(`W =  (${leafFactorsW})`); //W =  (m kg s^-2 m s^-1)
console.log(`W =  (${leafFactorsWsimplified})`); // W =  (m^2 kg s^-3)
console.log(`F =  (${leafFactorsF})`); // F =  (s A m^-1 kg^-1 s^2 m^-1 s A)
console.log(`F =  (${leafFactorsFsimplified})`); // F =  (s^4 A^2 m^-2 kg^-1)

// often, you'll get more than one result for derived units (that's why the result is `Unit[]`):
const derivedW = Qudt.derivedUnitsFromFactorUnits(
  DerivedUnitSearchMode.EXACT,
  ...Qudt.simplifyFactorUnits(
    Units.W.getLeafFactorUnitsWithCumulativeExponents()
  )
);
console.log(`\n# Fun with W`);
derivedW.forEach((u) => console.log(`${Units.W.toString()} = ${u.toString()}`));
// W = unit:J-PER-SEC
// W = W
