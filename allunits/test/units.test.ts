import {
  DerivedUnitSearchMode,
  FactorUnit,
  FactorUnits,
  Prefix,
  QuantityKind,
  QuantityValue,
  Qudt,
  Unit,
  Prefixes,
  Units,
  QuantityKinds,
  SystemsOfUnits,
} from "../src/units";
import { expect } from "@jest/globals";
import { Decimal } from "decimal.js";

import {
  arrayEqualsIgnoreOrdering,
  compareUsingEquals,
} from "../../core/src/utils";

function areDecimalsEqual(a: Decimal, b: Decimal): boolean | undefined {
  const isADecimal = a.constructor.name === "Decimal";
  const isBDecimal = b.constructor.name === "Decimal";

  if (isADecimal && isBDecimal) {
    return a.equals(b);
  } else if (isADecimal === isBDecimal) {
    return undefined;
  } else {
    return false;
  }
}
function areUnitsEqual(a: Unit, b: Unit): boolean | undefined {
  const isAUnit = a.constructor.name === "Unit";
  const isBUnit = b.constructor.name === "Unit";

  if (isAUnit && isBUnit) {
    return a.iri === b.iri;
  } else if (isAUnit === isBUnit) {
    return undefined;
  } else {
    return false;
  }
}
function areQuantityKindsEqual(
  a: QuantityKind,
  b: QuantityKind
): boolean | undefined {
  const isAQuantityKind = a.constructor.name === "QuantityKind";
  const isBQuantityKind = b.constructor.name === "QuantityKind";

  if (isAQuantityKind && isBQuantityKind) {
    return a.iri === b.iri;
  } else if (isAQuantityKind === isBQuantityKind) {
    return undefined;
  } else {
    return false;
  }
}
expect.addEqualityTesters([
  areDecimalsEqual,
  areUnitsEqual,
  areQuantityKindsEqual,
]);

function modeToString(mode: DerivedUnitSearchMode): string {
  if (mode === DerivedUnitSearchMode.BEST_MATCH) {
    return "BEST_MATCH";
  } else if (mode === DerivedUnitSearchMode.ALL) {
    return "ALL";
  }
  throw "not a valid mode: " + mode;
}

function toSortedIriList(unitList: Array<Unit>): Array<string> {
  return unitList.map((u) => u.iri).sort();
}

const ALL_QUDT_UNITS = Qudt.allUnits();

test("Qudt.unit()", () => {
  expect(Qudt.unit(Qudt.NAMESPACES.unit.makeIriInNamespace("M"))).toBe(Units.M);
});

test("Qudt.unitFromLocalname()", () => {
  expect(Qudt.unitFromLocalname("M")).toBe(Units.M);
});

test("Qudt.quantityKind()", () => {
  expect(
    Qudt.quantityKind(Qudt.NAMESPACES.quantityKind.makeIriInNamespace("Length"))
  ).toBe(QuantityKinds.Length);
});

test("Qudt.quantityKindFromLocalname()", () => {
  expect(Qudt.quantityKindFromLocalname("Length")).toBe(QuantityKinds.Length);
});

test("Qudt.prefix()", () => {
  expect(Qudt.prefix(Qudt.NAMESPACES.prefix.makeIriInNamespace("Kilo"))).toBe(
    Prefixes.Kilo
  );
});

test("Qudt.prefixFromLocalname()", () => {
  expect(Qudt.prefixFromLocalname("Kilo")).toBe(Prefixes.Kilo);
});

test("Prefixes", () => {
  const kilo: Prefix = Prefixes.Kilo;
  expect(kilo.multiplier).toEqual(new Decimal(1000));
  expect(kilo.iri).toEqual(Qudt.NAMESPACES.prefix.makeIriInNamespace("Kilo"));
});

test("Units", () => {
  const meter: Unit = Units.M;
  expect(meter.iri).toEqual(Qudt.NAMESPACES.unit.makeIriInNamespace("M"));
  expect(meter.hasLabel("Meter")).toBe(true);
  expect(meter.getLabelForLanguageTag("en")).toBe("metre");
});

test("QuantityKinds", () => {
  const length: QuantityKind = QuantityKinds.Length;
  expect(length.hasLabel("length")).toBe(true);
  expect(length.iri).toBe(
    Qudt.NAMESPACES.quantityKind.makeIriInNamespace("Length")
  );
});

describe.each([
  ["Newton Meter", Units.N__M],
  ["NEWTON_METER", Units.N__M],
  ["EUR", Units.EUR_Currency],
])("Qudt.unitFromLabel()", (label, expected) =>
  test(`Qudt.unitFromLabel(${label}) == ${expected}`, () =>
    expect(Qudt.unitFromLabel(label)).toBe(expected))
);

test("Qudt.QuantityKinds(Unit)", () => {
  const quantityKinds: QuantityKind[] = Qudt.quantityKinds(Units.N__M);
  expect(quantityKinds.includes(QuantityKinds.Torque)).toBe(true);
  expect(quantityKinds.includes(QuantityKinds.MomentOfForce)).toBe(true);
  expect(quantityKinds.length).toBe(2);
});

test("Qudt.QuantityKindsBroad(Unit)", () => {
  const broad: QuantityKind[] = Qudt.quantityKindsBroad(Units.PA__PER__BAR);
  expect(broad.includes(QuantityKinds.PressureRatio)).toBe(true);
  expect(broad.includes(QuantityKinds.DimensionlessRatio)).toBe(true);
  expect(broad.includes(QuantityKinds.Dimensionless)).toBe(true);
  expect(broad.length).toBe(3);
});

describe.each([
  [Units.KiloGM__PER__M3, [Units.KiloGM, 1, Units.M3, -1], true],
  [Units.N__M, [Units.N, 1, Units.M, 1], true],
])(
  "Unit.matches(FactorUnits.ofFactorUnitSpec(Unit|number|Decimal)[]), non-base units",
  (unit: Unit, spec: (Unit | number)[], expectedResult: boolean) =>
    test(`${unit.toString()}.matches(${exponentOrUnitToString(
      spec
    )}) == ${expectedResult}`, () =>
      expect(unit.matches(FactorUnits.ofFactorUnitSpec(...spec))).toBe(true))
);

describe.each([
  [Units.KiloGM__PER__M3, [Units.KiloGM, 1, Units.M3, -1], true],
  [Units.N__M, [Units.N, 1, Units.M, 1], true],
])(
  "Qudt.derivedUnitsFromExponentUnitPairs((Unit|number|Decimal)[]), non-base units",
  (unit: Unit, spec: (Unit | number)[], expectedResult: boolean) =>
    test(`${unit.toString()}.matches(${exponentOrUnitToString(
      spec
    )}) == ${expectedResult}`, () =>
      expect(unit.matches(FactorUnits.ofFactorUnitSpec(...spec))).toBe(true))
);

test("Qudt.derivedUnitsFromFactors(...Unit|number|Decimal[]) (error cases)", () => {
  expect(() =>
    Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode.ALL, Units.M)
  ).toThrowError();
  expect(() =>
    Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode.ALL, 1)
  ).toThrowError();
});

test("Qudt.derivedUnitsFromFactorUnits(...FactorUnit[]", () => {
  expect(
    Qudt.derivedUnitsFromFactorUnits(
      DerivedUnitSearchMode.ALL,
      new FactorUnit(Units.M, 3)
    )
      .map((u) => u.iri)
      .sort()
  ).toStrictEqual([
    "http://qudt.org/vocab/unit/AC-FT",
    "http://qudt.org/vocab/unit/ANGSTROM3",
    "http://qudt.org/vocab/unit/BBL_UK_PET",
    "http://qudt.org/vocab/unit/BBL_US",
    "http://qudt.org/vocab/unit/BBL_US_DRY",
    "http://qudt.org/vocab/unit/BU_UK",
    "http://qudt.org/vocab/unit/BU_US",
    "http://qudt.org/vocab/unit/CORD",
    "http://qudt.org/vocab/unit/CUP",
    "http://qudt.org/vocab/unit/CUP_US",
    "http://qudt.org/vocab/unit/CentiL",
    "http://qudt.org/vocab/unit/CentiM3",
    "http://qudt.org/vocab/unit/DecaL",
    "http://qudt.org/vocab/unit/DecaM3",
    "http://qudt.org/vocab/unit/DeciL",
    "http://qudt.org/vocab/unit/DeciM3",
    "http://qudt.org/vocab/unit/FBM",
    "http://qudt.org/vocab/unit/FT3",
    "http://qudt.org/vocab/unit/FemtoL",
    "http://qudt.org/vocab/unit/GAL_IMP",
    "http://qudt.org/vocab/unit/GAL_UK",
    "http://qudt.org/vocab/unit/GAL_US",
    "http://qudt.org/vocab/unit/GAL_US_DRY",
    "http://qudt.org/vocab/unit/GI_UK",
    "http://qudt.org/vocab/unit/GI_US",
    "http://qudt.org/vocab/unit/HectoL",
    "http://qudt.org/vocab/unit/IN3",
    "http://qudt.org/vocab/unit/Kilo-FT3",
    "http://qudt.org/vocab/unit/KiloL",
    "http://qudt.org/vocab/unit/L",
    "http://qudt.org/vocab/unit/M3",
    "http://qudt.org/vocab/unit/MI3",
    "http://qudt.org/vocab/unit/MegaL",
    "http://qudt.org/vocab/unit/MicroL",
    "http://qudt.org/vocab/unit/MicroM3",
    "http://qudt.org/vocab/unit/MilliL",
    "http://qudt.org/vocab/unit/MilliM3",
    "http://qudt.org/vocab/unit/NanoL",
    "http://qudt.org/vocab/unit/OZ_VOL_UK",
    "http://qudt.org/vocab/unit/OZ_VOL_US",
    "http://qudt.org/vocab/unit/PINT",
    "http://qudt.org/vocab/unit/PINT_UK",
    "http://qudt.org/vocab/unit/PINT_US",
    "http://qudt.org/vocab/unit/PINT_US_DRY",
    "http://qudt.org/vocab/unit/PK_UK",
    "http://qudt.org/vocab/unit/PK_US_DRY",
    "http://qudt.org/vocab/unit/PicoL",
    "http://qudt.org/vocab/unit/PlanckVolume",
    "http://qudt.org/vocab/unit/QT_UK",
    "http://qudt.org/vocab/unit/QT_US",
    "http://qudt.org/vocab/unit/QT_US_DRY",
    "http://qudt.org/vocab/unit/RT",
    "http://qudt.org/vocab/unit/STR",
    "http://qudt.org/vocab/unit/Standard",
    "http://qudt.org/vocab/unit/TBSP",
    "http://qudt.org/vocab/unit/TON_SHIPPING_US",
    "http://qudt.org/vocab/unit/TSP",
    "http://qudt.org/vocab/unit/YD3",
  ]);
  expect(
    Qudt.derivedUnitsFromFactorUnits(
      DerivedUnitSearchMode.ALL,
      new FactorUnit(Units.MOL, 1),
      new FactorUnit(Units.M, -2),
      new FactorUnit(Units.SEC, -1)
    )
      .map((u) => u.iri)
      .sort()
  ).toStrictEqual([Units.MOL__PER__M2__SEC]);
});

test("Qudt.derivedUnitsFromMap(Map<Unit, number))", () => {
  const spec = new Map<Unit, number>();
  spec.set(Units.M, 3);
  expect(
    Qudt.derivedUnitsFromMap(DerivedUnitSearchMode.ALL, spec)
      .map((u) => u.iri)
      .sort()
  ).toStrictEqual([
    "http://qudt.org/vocab/unit/AC-FT",
    "http://qudt.org/vocab/unit/ANGSTROM3",
    "http://qudt.org/vocab/unit/BBL_UK_PET",
    "http://qudt.org/vocab/unit/BBL_US",
    "http://qudt.org/vocab/unit/BBL_US_DRY",
    "http://qudt.org/vocab/unit/BU_UK",
    "http://qudt.org/vocab/unit/BU_US",
    "http://qudt.org/vocab/unit/CORD",
    "http://qudt.org/vocab/unit/CUP",
    "http://qudt.org/vocab/unit/CUP_US",
    "http://qudt.org/vocab/unit/CentiL",
    "http://qudt.org/vocab/unit/CentiM3",
    "http://qudt.org/vocab/unit/DecaL",
    "http://qudt.org/vocab/unit/DecaM3",
    "http://qudt.org/vocab/unit/DeciL",
    "http://qudt.org/vocab/unit/DeciM3",
    "http://qudt.org/vocab/unit/FBM",
    "http://qudt.org/vocab/unit/FT3",
    "http://qudt.org/vocab/unit/FemtoL",
    "http://qudt.org/vocab/unit/GAL_IMP",
    "http://qudt.org/vocab/unit/GAL_UK",
    "http://qudt.org/vocab/unit/GAL_US",
    "http://qudt.org/vocab/unit/GAL_US_DRY",
    "http://qudt.org/vocab/unit/GI_UK",
    "http://qudt.org/vocab/unit/GI_US",
    "http://qudt.org/vocab/unit/HectoL",
    "http://qudt.org/vocab/unit/IN3",
    "http://qudt.org/vocab/unit/Kilo-FT3",
    "http://qudt.org/vocab/unit/KiloL",
    "http://qudt.org/vocab/unit/L",
    "http://qudt.org/vocab/unit/M3",
    "http://qudt.org/vocab/unit/MI3",
    "http://qudt.org/vocab/unit/MegaL",
    "http://qudt.org/vocab/unit/MicroL",
    "http://qudt.org/vocab/unit/MicroM3",
    "http://qudt.org/vocab/unit/MilliL",
    "http://qudt.org/vocab/unit/MilliM3",
    "http://qudt.org/vocab/unit/NanoL",
    "http://qudt.org/vocab/unit/OZ_VOL_UK",
    "http://qudt.org/vocab/unit/OZ_VOL_US",
    "http://qudt.org/vocab/unit/PINT",
    "http://qudt.org/vocab/unit/PINT_UK",
    "http://qudt.org/vocab/unit/PINT_US",
    "http://qudt.org/vocab/unit/PINT_US_DRY",
    "http://qudt.org/vocab/unit/PK_UK",
    "http://qudt.org/vocab/unit/PK_US_DRY",
    "http://qudt.org/vocab/unit/PicoL",
    "http://qudt.org/vocab/unit/PlanckVolume",
    "http://qudt.org/vocab/unit/QT_UK",
    "http://qudt.org/vocab/unit/QT_US",
    "http://qudt.org/vocab/unit/QT_US_DRY",
    "http://qudt.org/vocab/unit/RT",
    "http://qudt.org/vocab/unit/STR",
    "http://qudt.org/vocab/unit/Standard",
    "http://qudt.org/vocab/unit/TBSP",
    "http://qudt.org/vocab/unit/TON_SHIPPING_US",
    "http://qudt.org/vocab/unit/TSP",
    "http://qudt.org/vocab/unit/YD3",
  ]);
  spec.clear();
  spec.set(Units.MOL, 1);
  spec.set(Units.M, -2);
  spec.set(Units.SEC, -1);
  expect(
    Qudt.derivedUnitsFromMap(DerivedUnitSearchMode.ALL, spec)
      .map((u) => u.iri)
      .sort()
  ).toStrictEqual([
    "http://qudt.org/vocab/unit/MOL-PER-M2-DAY",
    "http://qudt.org/vocab/unit/MOL-PER-M2-SEC",
    "http://qudt.org/vocab/unit/MicroMOL-PER-M2-DAY",
    "http://qudt.org/vocab/unit/MicroMOL-PER-M2-HR",
    "http://qudt.org/vocab/unit/MicroMOL-PER-M2-SEC",
    "http://qudt.org/vocab/unit/MilliMOL-PER-M2-DAY",
    "http://qudt.org/vocab/unit/MilliMOL-PER-M2-SEC",
    "http://qudt.org/vocab/unit/NanoMOL-PER-M2-DAY",
    "http://qudt.org/vocab/unit/PicoMOL-PER-M2-DAY",
  ]);
});

describe.each([
  ["Newton", Units.N],
  ["Metre", Units.M],
  ["SQUARE_METRE", Units.M2],
  ["SQUARE METRE", Units.M2],
  ["Cubic Metre", Units.M3],
  ["Gram", Units.GM],
  ["second", Units.SEC],
  ["Hertz", Units.HZ],
  ["degree celsius", Units.DEG_C],
  ["degree fahrenheit", Units.DEG_F],
  ["ampere", Units.A],
  ["volt", Units.V],
  ["Watt", Units.W],
  ["Lux", Units.LUX],
  ["Lumen", Units.LM],
  ["Candela", Units.CD],
  ["Pascal", Units.PA],
  ["Radian", Units.RAD],
  ["Joule", Units.J],
  ["Kelvin", Units.K],
  ["Steradian", Units.SR],
])("Qudt.unitFromLabel(string)", (label, expected) =>
  test(`Qudt.unitFromLabel("${label}") = ${expected.toString()}`, () =>
    expect(Qudt.unitFromLabel(label)).toBe(expected))
);

test("Qudt.derivedUnitsFromExponentUnitPairs(Unit, number)", () => {
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.ALL,
      Units.M,
      3
    )
      .map((u) => u.iri)
      .sort()
  ).toStrictEqual([
    "http://qudt.org/vocab/unit/AC-FT",
    "http://qudt.org/vocab/unit/ANGSTROM3",
    "http://qudt.org/vocab/unit/BBL_UK_PET",
    "http://qudt.org/vocab/unit/BBL_US",
    "http://qudt.org/vocab/unit/BBL_US_DRY",
    "http://qudt.org/vocab/unit/BU_UK",
    "http://qudt.org/vocab/unit/BU_US",
    "http://qudt.org/vocab/unit/CORD",
    "http://qudt.org/vocab/unit/CUP",
    "http://qudt.org/vocab/unit/CUP_US",
    "http://qudt.org/vocab/unit/CentiL",
    "http://qudt.org/vocab/unit/CentiM3",
    "http://qudt.org/vocab/unit/DecaL",
    "http://qudt.org/vocab/unit/DecaM3",
    "http://qudt.org/vocab/unit/DeciL",
    "http://qudt.org/vocab/unit/DeciM3",
    "http://qudt.org/vocab/unit/FBM",
    "http://qudt.org/vocab/unit/FT3",
    "http://qudt.org/vocab/unit/FemtoL",
    "http://qudt.org/vocab/unit/GAL_IMP",
    "http://qudt.org/vocab/unit/GAL_UK",
    "http://qudt.org/vocab/unit/GAL_US",
    "http://qudt.org/vocab/unit/GAL_US_DRY",
    "http://qudt.org/vocab/unit/GI_UK",
    "http://qudt.org/vocab/unit/GI_US",
    "http://qudt.org/vocab/unit/HectoL",
    "http://qudt.org/vocab/unit/IN3",
    "http://qudt.org/vocab/unit/Kilo-FT3",
    "http://qudt.org/vocab/unit/KiloL",
    "http://qudt.org/vocab/unit/L",
    "http://qudt.org/vocab/unit/M3",
    "http://qudt.org/vocab/unit/MI3",
    "http://qudt.org/vocab/unit/MegaL",
    "http://qudt.org/vocab/unit/MicroL",
    "http://qudt.org/vocab/unit/MicroM3",
    "http://qudt.org/vocab/unit/MilliL",
    "http://qudt.org/vocab/unit/MilliM3",
    "http://qudt.org/vocab/unit/NanoL",
    "http://qudt.org/vocab/unit/OZ_VOL_UK",
    "http://qudt.org/vocab/unit/OZ_VOL_US",
    "http://qudt.org/vocab/unit/PINT",
    "http://qudt.org/vocab/unit/PINT_UK",
    "http://qudt.org/vocab/unit/PINT_US",
    "http://qudt.org/vocab/unit/PINT_US_DRY",
    "http://qudt.org/vocab/unit/PK_UK",
    "http://qudt.org/vocab/unit/PK_US_DRY",
    "http://qudt.org/vocab/unit/PicoL",
    "http://qudt.org/vocab/unit/PlanckVolume",
    "http://qudt.org/vocab/unit/QT_UK",
    "http://qudt.org/vocab/unit/QT_US",
    "http://qudt.org/vocab/unit/QT_US_DRY",
    "http://qudt.org/vocab/unit/RT",
    "http://qudt.org/vocab/unit/STR",
    "http://qudt.org/vocab/unit/Standard",
    "http://qudt.org/vocab/unit/TBSP",
    "http://qudt.org/vocab/unit/TON_SHIPPING_US",
    "http://qudt.org/vocab/unit/TSP",
    "http://qudt.org/vocab/unit/YD3",
  ]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.ALL,
      Units.M,
      2
    )
      .map((u) => u.iri)
      .sort()
  ).toStrictEqual([""]);
  let result = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.ALL,
    Units.K,
    -1
  );
  let expected = [Units.PER__DEG_C, Units.PER__K].map((u) => u.iri).sort();
  expect(result.map((u) => u.iri).sort()).toStrictEqual(expected);
  result = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.ALL,
    Units.M,
    1
  );
  expected = [Units.M, Units.M3__PER__M2, Units.M2__PER__M]
    .map((u) => u.iri)
    .sort();
  expect(result.map((u) => u.iri).sort()).toStrictEqual(expected);
});

test("Qudt.derivedUnitsFromExponentUnitPairs(string, number)[using Iris]", () => {
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.ALL,
      Units.M.iri,
      3
    )
      .map((u) => u.iri)
      .sort()
  ).toStrictEqual([Units.KiloL, Units.M3].map((u) => u.iri).sort());
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.ALL,
      Units.M.iri,
      2
    )
  ).toStrictEqual([Units.M2]);
  expect(
    toSortedIriList(
      Qudt.derivedUnitsFromExponentUnitPairs(
        DerivedUnitSearchMode.ALL,
        Units.K.iri,
        -1
      )
    )
  ).toStrictEqual(toSortedIriList([Units.PER__K, Units.PER__DEG_C]));
  const result = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.ALL,
    Units.M.iri,
    1
  );
  expect(toSortedIriList(result)).toStrictEqual(
    toSortedIriList([Units.M, Units.M3__PER__M2, Units.M2__PER__M])
  );
});

test("Qudt.derivedUnitsFromExponentUnitPairs(string, number)[using localnames]", () => {
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode.ALL, "M", 3)
  ).toStrictEqual([Units.KiloL, Units.M3]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode.ALL, "M", 2)
  ).toStrictEqual([Units.M2]);
  expect(
    toSortedIriList(
      Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode.ALL, "K", -1)
    )
  ).toStrictEqual(toSortedIriList([Units.PER__K, Units.PER__DEG_C]));
  expect(
    toSortedIriList(
      Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode.ALL, "M", 1)
    )
  ).toStrictEqual(
    toSortedIriList([Units.M, Units.M3__PER__M2, Units.M2__PER__M])
  );
});

test("Qudt.derivedUnitsFromExponentUnitPairs(string, number)[using labels]", () => {
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.ALL,
      "Metre",
      3
    )
      .map((u) => u.iri)
      .sort()
  ).toStrictEqual([Units.KiloL, Units.M3].map((u) => u.iri).sort());
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.ALL,
      "Meter",
      2
    )
  ).toStrictEqual([Units.M2]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.ALL,
      "KELVIN",
      -1
    )
      .map((u) => u.iri)
      .sort()
  ).toStrictEqual([Units.PER__K, Units.PER__DEG_C].map((u) => u.iri).sort());
  expect(
    toSortedIriList(
      Qudt.derivedUnitsFromExponentUnitPairs(
        DerivedUnitSearchMode.ALL,
        "METER",
        1
      )
    )
  ).toStrictEqual(
    toSortedIriList([Units.M, Units.M3__PER__M2, Units.M2__PER__M])
  );
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.BEST_MATCH,
      "METER",
      1
    )
  ).toStrictEqual([Units.M]);
});

function exponentOrUnitToString(
  spec: Array<number | { toString: () => string }>
) {
  return spec.map((s) => (typeof s === "number" ? s : s.toString()));
}

describe.each([
  [
    15.5,
    DerivedUnitSearchMode.BEST_MATCH,
    [Units.KiloGM__PER__M2__SEC2],
    Units.KiloGM,
    1,
    Units.M,
    -2,
    Units.SEC,
    -2,
  ], // friction loss
  [
    0.1,
    DerivedUnitSearchMode.BEST_MATCH,
    [Units.N__PER__M2],
    Units.N,
    1,
    Units.M,
    -2,
  ],
  [
    0.8,
    DerivedUnitSearchMode.BEST_MATCH,
    [Units.KiloGM__PER__M3],
    Units.KiloGM,
    1,
    Units.M,
    -3,
  ],
  [
    1,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/FemtoGM-PER-L",
      "http://qudt.org/vocab/unit/GM-PER-CentiM3",
      "http://qudt.org/vocab/unit/GM-PER-DeciL",
      "http://qudt.org/vocab/unit/GM-PER-DeciM3",
      "http://qudt.org/vocab/unit/GM-PER-L",
      "http://qudt.org/vocab/unit/GM-PER-M3",
      "http://qudt.org/vocab/unit/GM-PER-MilliL",
      "http://qudt.org/vocab/unit/GRAIN-PER-GAL_US",
      "http://qudt.org/vocab/unit/GRAIN-PER-M3",
      "http://qudt.org/vocab/unit/KiloGM-PER-CentiM3",
      "http://qudt.org/vocab/unit/KiloGM-PER-DeciM3",
      "http://qudt.org/vocab/unit/KiloGM-PER-L",
      "http://qudt.org/vocab/unit/KiloGM-PER-M3",
      "http://qudt.org/vocab/unit/LB-PER-FT3",
      "http://qudt.org/vocab/unit/LB-PER-GAL_UK",
      "http://qudt.org/vocab/unit/LB-PER-GAL_US",
      "http://qudt.org/vocab/unit/LB-PER-IN3",
      "http://qudt.org/vocab/unit/LB-PER-M3",
      "http://qudt.org/vocab/unit/LB-PER-YD3",
      "http://qudt.org/vocab/unit/MegaGM-PER-M3",
      "http://qudt.org/vocab/unit/MicroGM-PER-DeciL",
      "http://qudt.org/vocab/unit/MicroGM-PER-L",
      "http://qudt.org/vocab/unit/MicroGM-PER-M3",
      "http://qudt.org/vocab/unit/MicroGM-PER-MilliL",
      "http://qudt.org/vocab/unit/MilliGM-PER-DeciL",
      "http://qudt.org/vocab/unit/MilliGM-PER-L",
      "http://qudt.org/vocab/unit/MilliGM-PER-M3",
      "http://qudt.org/vocab/unit/MilliGM-PER-MilliL",
      "http://qudt.org/vocab/unit/NanoGM-PER-DeciL",
      "http://qudt.org/vocab/unit/NanoGM-PER-L",
      "http://qudt.org/vocab/unit/NanoGM-PER-M3",
      "http://qudt.org/vocab/unit/NanoGM-PER-MicroL",
      "http://qudt.org/vocab/unit/NanoGM-PER-MilliL",
      "http://qudt.org/vocab/unit/OZ-PER-GAL_UK",
      "http://qudt.org/vocab/unit/OZ-PER-GAL_US",
      "http://qudt.org/vocab/unit/OZ-PER-IN3",
      "http://qudt.org/vocab/unit/OZ-PER-YD3",
      "http://qudt.org/vocab/unit/PicoGM-PER-L",
      "http://qudt.org/vocab/unit/PicoGM-PER-MilliL",
      "http://qudt.org/vocab/unit/PlanckDensity",
      "http://qudt.org/vocab/unit/SLUG-PER-FT3",
      "http://qudt.org/vocab/unit/TONNE-PER-M3",
      "http://qudt.org/vocab/unit/TON_LONG-PER-YD3",
      "http://qudt.org/vocab/unit/TON_Metric-PER-M3",
      "http://qudt.org/vocab/unit/TON_SHORT-PER-YD3",
      "http://qudt.org/vocab/unit/TON_UK-PER-YD3",
      "http://qudt.org/vocab/unit/TON_US-PER-YD3",
    ],
    Units.KiloGM,
    1,
    Units.M,
    -3,
  ],

  [
    2,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/ATM",
      "http://qudt.org/vocab/unit/ATM_T",
      "http://qudt.org/vocab/unit/BAR",
      "http://qudt.org/vocab/unit/BARAD",
      "http://qudt.org/vocab/unit/BARYE",
      "http://qudt.org/vocab/unit/BTU_IT-PER-FT3",
      "http://qudt.org/vocab/unit/BTU_TH-PER-FT3",
      "http://qudt.org/vocab/unit/CM_H2O",
      "http://qudt.org/vocab/unit/CentiBAR",
      "http://qudt.org/vocab/unit/CentiM_H2O",
      "http://qudt.org/vocab/unit/CentiM_HG",
      "http://qudt.org/vocab/unit/DYN-PER-CentiM2",
      "http://qudt.org/vocab/unit/DecaPA",
      "http://qudt.org/vocab/unit/DeciBAR",
      "http://qudt.org/vocab/unit/ERG-PER-CentiM3",
      "http://qudt.org/vocab/unit/FT_H2O",
      "http://qudt.org/vocab/unit/FT_HG",
      "http://qudt.org/vocab/unit/GM_F-PER-CentiM2",
      "http://qudt.org/vocab/unit/GigaPA",
      "http://qudt.org/vocab/unit/HectoBAR",
      "http://qudt.org/vocab/unit/HectoPA",
      "http://qudt.org/vocab/unit/IN_H2O",
      "http://qudt.org/vocab/unit/IN_HG",
      "http://qudt.org/vocab/unit/J-PER-M3",
      "http://qudt.org/vocab/unit/KIP_F-PER-IN2",
      "http://qudt.org/vocab/unit/KiloBAR",
      "http://qudt.org/vocab/unit/KiloGM-PER-M-SEC2",
      "http://qudt.org/vocab/unit/KiloGM_F-PER-CentiM2",
      "http://qudt.org/vocab/unit/KiloGM_F-PER-M2",
      "http://qudt.org/vocab/unit/KiloGM_F-PER-MilliM2",
      "http://qudt.org/vocab/unit/KiloLB_F-PER-IN2",
      "http://qudt.org/vocab/unit/KiloN-PER-M2",
      "http://qudt.org/vocab/unit/KiloPA",
      "http://qudt.org/vocab/unit/KiloPA_A",
      "http://qudt.org/vocab/unit/LB_F-PER-FT2",
      "http://qudt.org/vocab/unit/LB_F-PER-IN2",
      "http://qudt.org/vocab/unit/MegaBAR",
      "http://qudt.org/vocab/unit/MegaJ-PER-M3",
      "http://qudt.org/vocab/unit/MegaPA",
      "http://qudt.org/vocab/unit/MegaPSI",
      "http://qudt.org/vocab/unit/MicroATM",
      "http://qudt.org/vocab/unit/MicroBAR",
      "http://qudt.org/vocab/unit/MicroPA",
      "http://qudt.org/vocab/unit/MicroTORR",
      "http://qudt.org/vocab/unit/MilliBAR",
      "http://qudt.org/vocab/unit/MilliM_H2O",
      "http://qudt.org/vocab/unit/MilliM_HG",
      "http://qudt.org/vocab/unit/MilliM_HGA",
      "http://qudt.org/vocab/unit/MilliPA",
      "http://qudt.org/vocab/unit/MilliTORR",
      "http://qudt.org/vocab/unit/N-PER-CentiM2",
      "http://qudt.org/vocab/unit/N-PER-M2",
      "http://qudt.org/vocab/unit/N-PER-MilliM2",
      "http://qudt.org/vocab/unit/PA",
      "http://qudt.org/vocab/unit/PDL-PER-FT2",
      "http://qudt.org/vocab/unit/PSI",
      "http://qudt.org/vocab/unit/PicoPA",
      "http://qudt.org/vocab/unit/PlanckPressure",
      "http://qudt.org/vocab/unit/TORR",
      "http://qudt.org/vocab/unit/W-HR-PER-M3",
    ],
    Units.N,
    1,
    Units.M,
    -2,
  ],
  [
    3,
    DerivedUnitSearchMode.BEST_MATCH,
    [Units.J__PER__GM],
    Units.J,
    1,
    Units.GM,
    -1,
  ],
  [
    3.5,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/BTU_IT-PER-LB",
      "http://qudt.org/vocab/unit/BTU_TH-PER-LB",
      "http://qudt.org/vocab/unit/CAL_IT-PER-GM",
      "http://qudt.org/vocab/unit/CAL_TH-PER-GM",
      "http://qudt.org/vocab/unit/ERG-PER-GM",
      "http://qudt.org/vocab/unit/GRAY",
      "http://qudt.org/vocab/unit/J-PER-GM",
      "http://qudt.org/vocab/unit/J-PER-KiloGM",
      "http://qudt.org/vocab/unit/KiloCAL-PER-GM",
      "http://qudt.org/vocab/unit/KiloJ-PER-KiloGM",
      "http://qudt.org/vocab/unit/KiloLB_F-FT-PER-LB",
      "http://qudt.org/vocab/unit/M2-HZ2",
      "http://qudt.org/vocab/unit/M2-PER-SEC2",
      "http://qudt.org/vocab/unit/MegaJ-PER-KiloGM",
      "http://qudt.org/vocab/unit/MicroGRAY",
      "http://qudt.org/vocab/unit/MicroSV",
      "http://qudt.org/vocab/unit/MilliGRAY",
      "http://qudt.org/vocab/unit/MilliJ-PER-GM",
      "http://qudt.org/vocab/unit/MilliRAD_R",
      "http://qudt.org/vocab/unit/MilliR_man",
      "http://qudt.org/vocab/unit/MilliSV",
      "http://qudt.org/vocab/unit/N-M-PER-KiloGM",
      "http://qudt.org/vocab/unit/RAD_R",
      "http://qudt.org/vocab/unit/REM",
      "http://qudt.org/vocab/unit/SV",
    ],
    Units.J,
    1,
    Units.GM,
    -1,
  ],
  [4, DerivedUnitSearchMode.ALL, [], Units.M, 1, Units.N, 1, Units.SEC, -2],
  [
    5,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/MOL-PER-M2-DAY",
      "http://qudt.org/vocab/unit/MOL-PER-M2-SEC",
      "http://qudt.org/vocab/unit/MicroMOL-PER-M2-DAY",
      "http://qudt.org/vocab/unit/MicroMOL-PER-M2-HR",
      "http://qudt.org/vocab/unit/MicroMOL-PER-M2-SEC",
      "http://qudt.org/vocab/unit/MilliMOL-PER-M2-DAY",
      "http://qudt.org/vocab/unit/MilliMOL-PER-M2-SEC",
      "http://qudt.org/vocab/unit/NanoMOL-PER-M2-DAY",
      "http://qudt.org/vocab/unit/PicoMOL-PER-M2-DAY",
    ],
    Units.MOL,
    1,
    Units.M,
    -2,
    Units.SEC,
    -1,
  ],
  [
    6,
    DerivedUnitSearchMode.ALL,
    [Units.K__M2__PER__KiloGM__SEC],
    Units.K,
    1,
    Units.M,
    2,
    Units.KiloGM,
    -1,
    Units.SEC,
    -1,
  ],
  [
    7,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/ATM",
      "http://qudt.org/vocab/unit/ATM_T",
      "http://qudt.org/vocab/unit/BAR",
      "http://qudt.org/vocab/unit/BARAD",
      "http://qudt.org/vocab/unit/BARYE",
      "http://qudt.org/vocab/unit/BTU_IT-PER-FT3",
      "http://qudt.org/vocab/unit/BTU_TH-PER-FT3",
      "http://qudt.org/vocab/unit/CM_H2O",
      "http://qudt.org/vocab/unit/CentiBAR",
      "http://qudt.org/vocab/unit/CentiM_H2O",
      "http://qudt.org/vocab/unit/CentiM_HG",
      "http://qudt.org/vocab/unit/DYN-PER-CentiM2",
      "http://qudt.org/vocab/unit/DecaPA",
      "http://qudt.org/vocab/unit/DeciBAR",
      "http://qudt.org/vocab/unit/ERG-PER-CentiM3",
      "http://qudt.org/vocab/unit/FT_H2O",
      "http://qudt.org/vocab/unit/FT_HG",
      "http://qudt.org/vocab/unit/GM_F-PER-CentiM2",
      "http://qudt.org/vocab/unit/GigaPA",
      "http://qudt.org/vocab/unit/HectoBAR",
      "http://qudt.org/vocab/unit/HectoPA",
      "http://qudt.org/vocab/unit/IN_H2O",
      "http://qudt.org/vocab/unit/IN_HG",
      "http://qudt.org/vocab/unit/J-PER-M3",
      "http://qudt.org/vocab/unit/KIP_F-PER-IN2",
      "http://qudt.org/vocab/unit/KiloBAR",
      "http://qudt.org/vocab/unit/KiloGM-PER-M-SEC2",
      "http://qudt.org/vocab/unit/KiloGM_F-PER-CentiM2",
      "http://qudt.org/vocab/unit/KiloGM_F-PER-M2",
      "http://qudt.org/vocab/unit/KiloGM_F-PER-MilliM2",
      "http://qudt.org/vocab/unit/KiloLB_F-PER-IN2",
      "http://qudt.org/vocab/unit/KiloN-PER-M2",
      "http://qudt.org/vocab/unit/KiloPA",
      "http://qudt.org/vocab/unit/KiloPA_A",
      "http://qudt.org/vocab/unit/LB_F-PER-FT2",
      "http://qudt.org/vocab/unit/LB_F-PER-IN2",
      "http://qudt.org/vocab/unit/MegaBAR",
      "http://qudt.org/vocab/unit/MegaJ-PER-M3",
      "http://qudt.org/vocab/unit/MegaPA",
      "http://qudt.org/vocab/unit/MegaPSI",
      "http://qudt.org/vocab/unit/MicroATM",
      "http://qudt.org/vocab/unit/MicroBAR",
      "http://qudt.org/vocab/unit/MicroPA",
      "http://qudt.org/vocab/unit/MicroTORR",
      "http://qudt.org/vocab/unit/MilliBAR",
      "http://qudt.org/vocab/unit/MilliM_H2O",
      "http://qudt.org/vocab/unit/MilliM_HG",
      "http://qudt.org/vocab/unit/MilliM_HGA",
      "http://qudt.org/vocab/unit/MilliPA",
      "http://qudt.org/vocab/unit/MilliTORR",
      "http://qudt.org/vocab/unit/N-PER-CentiM2",
      "http://qudt.org/vocab/unit/N-PER-M2",
      "http://qudt.org/vocab/unit/N-PER-MilliM2",
      "http://qudt.org/vocab/unit/PA",
      "http://qudt.org/vocab/unit/PDL-PER-FT2",
      "http://qudt.org/vocab/unit/PSI",
      "http://qudt.org/vocab/unit/PicoPA",
      "http://qudt.org/vocab/unit/PlanckPressure",
      "http://qudt.org/vocab/unit/TORR",
      "http://qudt.org/vocab/unit/W-HR-PER-M3",
    ],
    Units.M,
    1,
    Units.KiloGM,
    1,
    Units.SEC,
    -2,
    Units.M,
    -2,
  ],
  [
    8,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/BTU_IT-FT-PER-FT2-HR-DEG_F",
      "http://qudt.org/vocab/unit/BTU_IT-IN-PER-FT2-HR-DEG_F",
      "http://qudt.org/vocab/unit/BTU_IT-IN-PER-FT2-SEC-DEG_F",
      "http://qudt.org/vocab/unit/BTU_IT-IN-PER-HR-FT2-DEG_F",
      "http://qudt.org/vocab/unit/BTU_IT-IN-PER-SEC-FT2-DEG_F",
      "http://qudt.org/vocab/unit/BTU_IT-PER-SEC-FT-DEG_R",
      "http://qudt.org/vocab/unit/BTU_TH-FT-PER-FT2-HR-DEG_F",
      "http://qudt.org/vocab/unit/BTU_TH-FT-PER-HR-FT2-DEG_F",
      "http://qudt.org/vocab/unit/BTU_TH-IN-PER-FT2-HR-DEG_F",
      "http://qudt.org/vocab/unit/BTU_TH-IN-PER-FT2-SEC-DEG_F",
      "http://qudt.org/vocab/unit/CAL_IT-PER-SEC-CentiM-K",
      "http://qudt.org/vocab/unit/CAL_TH-PER-CentiM-SEC-DEG_C",
      "http://qudt.org/vocab/unit/CAL_TH-PER-SEC-CentiM-K",
      "http://qudt.org/vocab/unit/KiloCAL-PER-CentiM-SEC-DEG_C",
      "http://qudt.org/vocab/unit/KiloCAL_IT-PER-HR-M-DEG_C",
      "http://qudt.org/vocab/unit/W-PER-M-K",
    ],
    Units.BTU_IT,
    1,
    Units.FT,
    1,
    Units.FT,
    -2,
    Units.HR,
    -1,
    Units.DEG_F,
    -1,
  ],
  [
    9,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/BTU_IT-PER-FT2",
      "http://qudt.org/vocab/unit/DYN-PER-CentiM",
      "http://qudt.org/vocab/unit/FT-LB_F-PER-FT2",
      "http://qudt.org/vocab/unit/FT-LB_F-PER-M2",
      "http://qudt.org/vocab/unit/GigaJ-PER-M2",
      "http://qudt.org/vocab/unit/J-PER-CentiM2",
      "http://qudt.org/vocab/unit/J-PER-M2",
      "http://qudt.org/vocab/unit/KiloBTU_IT-PER-FT2",
      "http://qudt.org/vocab/unit/KiloCAL-PER-CentiM2",
      "http://qudt.org/vocab/unit/KiloGM-PER-SEC2",
      "http://qudt.org/vocab/unit/KiloGM_F-M-PER-CentiM2",
      "http://qudt.org/vocab/unit/KiloLB_F-PER-FT",
      "http://qudt.org/vocab/unit/KiloN-PER-M",
      "http://qudt.org/vocab/unit/KiloW-HR-PER-M2",
      "http://qudt.org/vocab/unit/LB_F-PER-FT",
      "http://qudt.org/vocab/unit/LB_F-PER-IN",
      "http://qudt.org/vocab/unit/MegaJ-PER-M2",
      "http://qudt.org/vocab/unit/MilliN-PER-M",
      "http://qudt.org/vocab/unit/N-M-PER-M2",
      "http://qudt.org/vocab/unit/N-PER-CentiM",
      "http://qudt.org/vocab/unit/N-PER-M",
      "http://qudt.org/vocab/unit/N-PER-MilliM",
      "http://qudt.org/vocab/unit/PA-M",
      "http://qudt.org/vocab/unit/W-HR-PER-M2",
      "http://qudt.org/vocab/unit/W-SEC-PER-M2",
    ],
    Units.M,
    1,
    Units.KiloGM,
    1,
    Units.SEC,
    -2,
    Units.M,
    -2,
    Units.M,
    1,
  ],
  [
    10,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/BTU_IT-PER-FT2",
      "http://qudt.org/vocab/unit/DYN-PER-CentiM",
      "http://qudt.org/vocab/unit/FT-LB_F-PER-FT2",
      "http://qudt.org/vocab/unit/FT-LB_F-PER-M2",
      "http://qudt.org/vocab/unit/GigaJ-PER-M2",
      "http://qudt.org/vocab/unit/J-PER-CentiM2",
      "http://qudt.org/vocab/unit/J-PER-M2",
      "http://qudt.org/vocab/unit/KiloBTU_IT-PER-FT2",
      "http://qudt.org/vocab/unit/KiloCAL-PER-CentiM2",
      "http://qudt.org/vocab/unit/KiloGM-PER-SEC2",
      "http://qudt.org/vocab/unit/KiloGM_F-M-PER-CentiM2",
      "http://qudt.org/vocab/unit/KiloLB_F-PER-FT",
      "http://qudt.org/vocab/unit/KiloN-PER-M",
      "http://qudt.org/vocab/unit/KiloW-HR-PER-M2",
      "http://qudt.org/vocab/unit/LB_F-PER-FT",
      "http://qudt.org/vocab/unit/LB_F-PER-IN",
      "http://qudt.org/vocab/unit/MegaJ-PER-M2",
      "http://qudt.org/vocab/unit/MilliN-PER-M",
      "http://qudt.org/vocab/unit/N-M-PER-M2",
      "http://qudt.org/vocab/unit/N-PER-CentiM",
      "http://qudt.org/vocab/unit/N-PER-M",
      "http://qudt.org/vocab/unit/N-PER-MilliM",
      "http://qudt.org/vocab/unit/PA-M",
      "http://qudt.org/vocab/unit/W-HR-PER-M2",
      "http://qudt.org/vocab/unit/W-SEC-PER-M2",
    ],
    Units.M,
    2,
    Units.KiloGM,
    1,
    Units.SEC,
    -2,
    Units.M,
    -2,
  ],
  [
    11,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/AttoJ",
      "http://qudt.org/vocab/unit/BTU_IT",
      "http://qudt.org/vocab/unit/BTU_MEAN",
      "http://qudt.org/vocab/unit/BTU_TH",
      "http://qudt.org/vocab/unit/CAL_15_DEG_C",
      "http://qudt.org/vocab/unit/CAL_IT",
      "http://qudt.org/vocab/unit/CAL_MEAN",
      "http://qudt.org/vocab/unit/CAL_TH",
      "http://qudt.org/vocab/unit/CentiN-M",
      "http://qudt.org/vocab/unit/DYN-CentiM",
      "http://qudt.org/vocab/unit/DeciN-M",
      "http://qudt.org/vocab/unit/ERG",
      "http://qudt.org/vocab/unit/EV",
      "http://qudt.org/vocab/unit/E_h",
      "http://qudt.org/vocab/unit/ExaJ",
      "http://qudt.org/vocab/unit/FT-LB_F",
      "http://qudt.org/vocab/unit/FT-PDL",
      "http://qudt.org/vocab/unit/FemtoJ",
      "http://qudt.org/vocab/unit/GigaEV",
      "http://qudt.org/vocab/unit/GigaJ",
      "http://qudt.org/vocab/unit/GigaW-HR",
      "http://qudt.org/vocab/unit/J",
      "http://qudt.org/vocab/unit/KiloBTU_IT",
      "http://qudt.org/vocab/unit/KiloBTU_TH",
      "http://qudt.org/vocab/unit/KiloCAL",
      "http://qudt.org/vocab/unit/KiloCAL_IT",
      "http://qudt.org/vocab/unit/KiloCAL_Mean",
      "http://qudt.org/vocab/unit/KiloCAL_TH",
      "http://qudt.org/vocab/unit/KiloEV",
      "http://qudt.org/vocab/unit/KiloGM_F-M",
      "http://qudt.org/vocab/unit/KiloJ",
      "http://qudt.org/vocab/unit/KiloN-M",
      "http://qudt.org/vocab/unit/KiloV-A-HR",
      "http://qudt.org/vocab/unit/KiloW-HR",
      "http://qudt.org/vocab/unit/LB_F-FT",
      "http://qudt.org/vocab/unit/LB_F-IN",
      "http://qudt.org/vocab/unit/MegaEV",
      "http://qudt.org/vocab/unit/MegaJ",
      "http://qudt.org/vocab/unit/MegaN-M",
      "http://qudt.org/vocab/unit/MegaTOE",
      "http://qudt.org/vocab/unit/MegaV-A-HR",
      "http://qudt.org/vocab/unit/MegaW-HR",
      "http://qudt.org/vocab/unit/MicroJ",
      "http://qudt.org/vocab/unit/MicroN-M",
      "http://qudt.org/vocab/unit/MilliJ",
      "http://qudt.org/vocab/unit/MilliN-M",
      "http://qudt.org/vocab/unit/N-CentiM",
      "http://qudt.org/vocab/unit/N-M",
      "http://qudt.org/vocab/unit/OZ_F-IN",
      "http://qudt.org/vocab/unit/PetaJ",
      "http://qudt.org/vocab/unit/PlanckEnergy",
      "http://qudt.org/vocab/unit/QUAD",
      "http://qudt.org/vocab/unit/THM_US",
      "http://qudt.org/vocab/unit/TOE",
      "http://qudt.org/vocab/unit/TON_FG-HR",
      "http://qudt.org/vocab/unit/TeraJ",
      "http://qudt.org/vocab/unit/TeraW-HR",
      "http://qudt.org/vocab/unit/TonEnergy",
      "http://qudt.org/vocab/unit/V-A-HR",
      "http://qudt.org/vocab/unit/W-HR",
      "http://qudt.org/vocab/unit/W-SEC",
    ],
    Units.N,
    1,
    Units.M,
    1,
  ],
  [
    12,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/AttoJ",
      "http://qudt.org/vocab/unit/BTU_IT",
      "http://qudt.org/vocab/unit/BTU_MEAN",
      "http://qudt.org/vocab/unit/BTU_TH",
      "http://qudt.org/vocab/unit/CAL_15_DEG_C",
      "http://qudt.org/vocab/unit/CAL_IT",
      "http://qudt.org/vocab/unit/CAL_MEAN",
      "http://qudt.org/vocab/unit/CAL_TH",
      "http://qudt.org/vocab/unit/CentiN-M",
      "http://qudt.org/vocab/unit/DYN-CentiM",
      "http://qudt.org/vocab/unit/DeciN-M",
      "http://qudt.org/vocab/unit/ERG",
      "http://qudt.org/vocab/unit/EV",
      "http://qudt.org/vocab/unit/E_h",
      "http://qudt.org/vocab/unit/ExaJ",
      "http://qudt.org/vocab/unit/FT-LB_F",
      "http://qudt.org/vocab/unit/FT-PDL",
      "http://qudt.org/vocab/unit/FemtoJ",
      "http://qudt.org/vocab/unit/GigaEV",
      "http://qudt.org/vocab/unit/GigaJ",
      "http://qudt.org/vocab/unit/GigaW-HR",
      "http://qudt.org/vocab/unit/J",
      "http://qudt.org/vocab/unit/KiloBTU_IT",
      "http://qudt.org/vocab/unit/KiloBTU_TH",
      "http://qudt.org/vocab/unit/KiloCAL",
      "http://qudt.org/vocab/unit/KiloCAL_IT",
      "http://qudt.org/vocab/unit/KiloCAL_Mean",
      "http://qudt.org/vocab/unit/KiloCAL_TH",
      "http://qudt.org/vocab/unit/KiloEV",
      "http://qudt.org/vocab/unit/KiloGM_F-M",
      "http://qudt.org/vocab/unit/KiloJ",
      "http://qudt.org/vocab/unit/KiloN-M",
      "http://qudt.org/vocab/unit/KiloV-A-HR",
      "http://qudt.org/vocab/unit/KiloW-HR",
      "http://qudt.org/vocab/unit/LB_F-FT",
      "http://qudt.org/vocab/unit/LB_F-IN",
      "http://qudt.org/vocab/unit/MegaEV",
      "http://qudt.org/vocab/unit/MegaJ",
      "http://qudt.org/vocab/unit/MegaN-M",
      "http://qudt.org/vocab/unit/MegaTOE",
      "http://qudt.org/vocab/unit/MegaV-A-HR",
      "http://qudt.org/vocab/unit/MegaW-HR",
      "http://qudt.org/vocab/unit/MicroJ",
      "http://qudt.org/vocab/unit/MicroN-M",
      "http://qudt.org/vocab/unit/MilliJ",
      "http://qudt.org/vocab/unit/MilliN-M",
      "http://qudt.org/vocab/unit/N-CentiM",
      "http://qudt.org/vocab/unit/N-M",
      "http://qudt.org/vocab/unit/OZ_F-IN",
      "http://qudt.org/vocab/unit/PetaJ",
      "http://qudt.org/vocab/unit/PlanckEnergy",
      "http://qudt.org/vocab/unit/QUAD",
      "http://qudt.org/vocab/unit/THM_US",
      "http://qudt.org/vocab/unit/TOE",
      "http://qudt.org/vocab/unit/TON_FG-HR",
      "http://qudt.org/vocab/unit/TeraJ",
      "http://qudt.org/vocab/unit/TeraW-HR",
      "http://qudt.org/vocab/unit/TonEnergy",
      "http://qudt.org/vocab/unit/V-A-HR",
      "http://qudt.org/vocab/unit/W-HR",
      "http://qudt.org/vocab/unit/W-SEC",
    ],
    Units.J,
    1,
  ],
  [
    13,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/FemtoGM-PER-L",
      "http://qudt.org/vocab/unit/GM-PER-CentiM3",
      "http://qudt.org/vocab/unit/GM-PER-DeciL",
      "http://qudt.org/vocab/unit/GM-PER-DeciM3",
      "http://qudt.org/vocab/unit/GM-PER-L",
      "http://qudt.org/vocab/unit/GM-PER-M3",
      "http://qudt.org/vocab/unit/GM-PER-MilliL",
      "http://qudt.org/vocab/unit/GRAIN-PER-GAL_US",
      "http://qudt.org/vocab/unit/GRAIN-PER-M3",
      "http://qudt.org/vocab/unit/KiloGM-PER-CentiM3",
      "http://qudt.org/vocab/unit/KiloGM-PER-DeciM3",
      "http://qudt.org/vocab/unit/KiloGM-PER-L",
      "http://qudt.org/vocab/unit/KiloGM-PER-M3",
      "http://qudt.org/vocab/unit/LB-PER-FT3",
      "http://qudt.org/vocab/unit/LB-PER-GAL_UK",
      "http://qudt.org/vocab/unit/LB-PER-GAL_US",
      "http://qudt.org/vocab/unit/LB-PER-IN3",
      "http://qudt.org/vocab/unit/LB-PER-M3",
      "http://qudt.org/vocab/unit/LB-PER-YD3",
      "http://qudt.org/vocab/unit/MegaGM-PER-M3",
      "http://qudt.org/vocab/unit/MicroGM-PER-DeciL",
      "http://qudt.org/vocab/unit/MicroGM-PER-L",
      "http://qudt.org/vocab/unit/MicroGM-PER-M3",
      "http://qudt.org/vocab/unit/MicroGM-PER-MilliL",
      "http://qudt.org/vocab/unit/MilliGM-PER-DeciL",
      "http://qudt.org/vocab/unit/MilliGM-PER-L",
      "http://qudt.org/vocab/unit/MilliGM-PER-M3",
      "http://qudt.org/vocab/unit/MilliGM-PER-MilliL",
      "http://qudt.org/vocab/unit/NanoGM-PER-DeciL",
      "http://qudt.org/vocab/unit/NanoGM-PER-L",
      "http://qudt.org/vocab/unit/NanoGM-PER-M3",
      "http://qudt.org/vocab/unit/NanoGM-PER-MicroL",
      "http://qudt.org/vocab/unit/NanoGM-PER-MilliL",
      "http://qudt.org/vocab/unit/OZ-PER-GAL_UK",
      "http://qudt.org/vocab/unit/OZ-PER-GAL_US",
      "http://qudt.org/vocab/unit/OZ-PER-IN3",
      "http://qudt.org/vocab/unit/OZ-PER-YD3",
      "http://qudt.org/vocab/unit/PicoGM-PER-L",
      "http://qudt.org/vocab/unit/PicoGM-PER-MilliL",
      "http://qudt.org/vocab/unit/PlanckDensity",
      "http://qudt.org/vocab/unit/SLUG-PER-FT3",
      "http://qudt.org/vocab/unit/TONNE-PER-M3",
      "http://qudt.org/vocab/unit/TON_LONG-PER-YD3",
      "http://qudt.org/vocab/unit/TON_Metric-PER-M3",
      "http://qudt.org/vocab/unit/TON_SHORT-PER-YD3",
      "http://qudt.org/vocab/unit/TON_UK-PER-YD3",
      "http://qudt.org/vocab/unit/TON_US-PER-YD3",
    ],
    Units.KiloGM,
    1,
    Units.M3,
    -1,
  ],
  [
    13.5,
    DerivedUnitSearchMode.BEST_MATCH,
    [Units.KiloGM__PER__M3],
    Units.KiloGM,
    1,
    Units.M3,
    -1,
  ],
  [
    14,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/BTU_IT-PER-FT2-HR-DEG_F",
      "http://qudt.org/vocab/unit/BTU_IT-PER-FT2-SEC-DEG_F",
      "http://qudt.org/vocab/unit/BTU_IT-PER-HR-FT2-DEG_R",
      "http://qudt.org/vocab/unit/BTU_IT-PER-SEC-FT2-DEG_R",
      "http://qudt.org/vocab/unit/CAL_IT-PER-SEC-CentiM2-K",
      "http://qudt.org/vocab/unit/CAL_TH-PER-SEC-CentiM2-K",
      "http://qudt.org/vocab/unit/KiloGM-PER-SEC3-K",
      "http://qudt.org/vocab/unit/W-PER-M2-K",
    ],
    Units.KiloGM,
    1,
    Units.K,
    -1,
    Units.SEC,
    -3,
  ],
  [
    15,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/J-PER-M4",
      "http://qudt.org/vocab/unit/KiloGM-PER-M2-SEC2",
      "http://qudt.org/vocab/unit/KiloN-PER-M3",
      "http://qudt.org/vocab/unit/KiloPA-PER-MilliM",
      "http://qudt.org/vocab/unit/N-PER-M3",
      "http://qudt.org/vocab/unit/PA-PER-M",
      "http://qudt.org/vocab/unit/PicoPA-PER-KiloM",
    ],
    Units.KiloGM,
    1,
    Units.M,
    -2,
    Units.SEC,
    -2,
  ], // friction loss
  [
    16,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/AC-FT",
      "http://qudt.org/vocab/unit/ANGSTROM3",
      "http://qudt.org/vocab/unit/BBL_UK_PET",
      "http://qudt.org/vocab/unit/BBL_US",
      "http://qudt.org/vocab/unit/BBL_US_DRY",
      "http://qudt.org/vocab/unit/BU_UK",
      "http://qudt.org/vocab/unit/BU_US",
      "http://qudt.org/vocab/unit/CORD",
      "http://qudt.org/vocab/unit/CUP",
      "http://qudt.org/vocab/unit/CUP_US",
      "http://qudt.org/vocab/unit/CentiL",
      "http://qudt.org/vocab/unit/CentiM3",
      "http://qudt.org/vocab/unit/DecaL",
      "http://qudt.org/vocab/unit/DecaM3",
      "http://qudt.org/vocab/unit/DeciL",
      "http://qudt.org/vocab/unit/DeciM3",
      "http://qudt.org/vocab/unit/FBM",
      "http://qudt.org/vocab/unit/FT3",
      "http://qudt.org/vocab/unit/FemtoL",
      "http://qudt.org/vocab/unit/GAL_IMP",
      "http://qudt.org/vocab/unit/GAL_UK",
      "http://qudt.org/vocab/unit/GAL_US",
      "http://qudt.org/vocab/unit/GAL_US_DRY",
      "http://qudt.org/vocab/unit/GI_UK",
      "http://qudt.org/vocab/unit/GI_US",
      "http://qudt.org/vocab/unit/HectoL",
      "http://qudt.org/vocab/unit/IN3",
      "http://qudt.org/vocab/unit/Kilo-FT3",
      "http://qudt.org/vocab/unit/KiloL",
      "http://qudt.org/vocab/unit/L",
      "http://qudt.org/vocab/unit/M3",
      "http://qudt.org/vocab/unit/MI3",
      "http://qudt.org/vocab/unit/MegaL",
      "http://qudt.org/vocab/unit/MicroL",
      "http://qudt.org/vocab/unit/MicroM3",
      "http://qudt.org/vocab/unit/MilliL",
      "http://qudt.org/vocab/unit/MilliM3",
      "http://qudt.org/vocab/unit/NanoL",
      "http://qudt.org/vocab/unit/OZ_VOL_UK",
      "http://qudt.org/vocab/unit/OZ_VOL_US",
      "http://qudt.org/vocab/unit/PINT",
      "http://qudt.org/vocab/unit/PINT_UK",
      "http://qudt.org/vocab/unit/PINT_US",
      "http://qudt.org/vocab/unit/PINT_US_DRY",
      "http://qudt.org/vocab/unit/PK_UK",
      "http://qudt.org/vocab/unit/PK_US_DRY",
      "http://qudt.org/vocab/unit/PicoL",
      "http://qudt.org/vocab/unit/PlanckVolume",
      "http://qudt.org/vocab/unit/QT_UK",
      "http://qudt.org/vocab/unit/QT_US",
      "http://qudt.org/vocab/unit/QT_US_DRY",
      "http://qudt.org/vocab/unit/RT",
      "http://qudt.org/vocab/unit/STR",
      "http://qudt.org/vocab/unit/Standard",
      "http://qudt.org/vocab/unit/TBSP",
      "http://qudt.org/vocab/unit/TON_SHIPPING_US",
      "http://qudt.org/vocab/unit/TSP",
      "http://qudt.org/vocab/unit/YD3",
    ],
    Units.M,
    3,
  ],
  [
    17,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/FemtoGM-PER-L",
      "http://qudt.org/vocab/unit/GM-PER-CentiM3",
      "http://qudt.org/vocab/unit/GM-PER-DeciL",
      "http://qudt.org/vocab/unit/GM-PER-DeciM3",
      "http://qudt.org/vocab/unit/GM-PER-L",
      "http://qudt.org/vocab/unit/GM-PER-M3",
      "http://qudt.org/vocab/unit/GM-PER-MilliL",
      "http://qudt.org/vocab/unit/GRAIN-PER-GAL_US",
      "http://qudt.org/vocab/unit/GRAIN-PER-M3",
      "http://qudt.org/vocab/unit/KiloGM-PER-CentiM3",
      "http://qudt.org/vocab/unit/KiloGM-PER-DeciM3",
      "http://qudt.org/vocab/unit/KiloGM-PER-L",
      "http://qudt.org/vocab/unit/KiloGM-PER-M3",
      "http://qudt.org/vocab/unit/LB-PER-FT3",
      "http://qudt.org/vocab/unit/LB-PER-GAL_UK",
      "http://qudt.org/vocab/unit/LB-PER-GAL_US",
      "http://qudt.org/vocab/unit/LB-PER-IN3",
      "http://qudt.org/vocab/unit/LB-PER-M3",
      "http://qudt.org/vocab/unit/LB-PER-YD3",
      "http://qudt.org/vocab/unit/MegaGM-PER-M3",
      "http://qudt.org/vocab/unit/MicroGM-PER-DeciL",
      "http://qudt.org/vocab/unit/MicroGM-PER-L",
      "http://qudt.org/vocab/unit/MicroGM-PER-M3",
      "http://qudt.org/vocab/unit/MicroGM-PER-MilliL",
      "http://qudt.org/vocab/unit/MilliGM-PER-DeciL",
      "http://qudt.org/vocab/unit/MilliGM-PER-L",
      "http://qudt.org/vocab/unit/MilliGM-PER-M3",
      "http://qudt.org/vocab/unit/MilliGM-PER-MilliL",
      "http://qudt.org/vocab/unit/NanoGM-PER-DeciL",
      "http://qudt.org/vocab/unit/NanoGM-PER-L",
      "http://qudt.org/vocab/unit/NanoGM-PER-M3",
      "http://qudt.org/vocab/unit/NanoGM-PER-MicroL",
      "http://qudt.org/vocab/unit/NanoGM-PER-MilliL",
      "http://qudt.org/vocab/unit/OZ-PER-GAL_UK",
      "http://qudt.org/vocab/unit/OZ-PER-GAL_US",
      "http://qudt.org/vocab/unit/OZ-PER-IN3",
      "http://qudt.org/vocab/unit/OZ-PER-YD3",
      "http://qudt.org/vocab/unit/PicoGM-PER-L",
      "http://qudt.org/vocab/unit/PicoGM-PER-MilliL",
      "http://qudt.org/vocab/unit/PlanckDensity",
      "http://qudt.org/vocab/unit/SLUG-PER-FT3",
      "http://qudt.org/vocab/unit/TONNE-PER-M3",
      "http://qudt.org/vocab/unit/TON_LONG-PER-YD3",
      "http://qudt.org/vocab/unit/TON_Metric-PER-M3",
      "http://qudt.org/vocab/unit/TON_SHORT-PER-YD3",
      "http://qudt.org/vocab/unit/TON_UK-PER-YD3",
      "http://qudt.org/vocab/unit/TON_US-PER-YD3",
    ],
    Units.KiloGM,
    1,
    Units.M,
    -3,
  ],

  [
    18,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/MOL-PER-M2-DAY",
      "http://qudt.org/vocab/unit/MOL-PER-M2-SEC",
      "http://qudt.org/vocab/unit/MicroMOL-PER-M2-DAY",
      "http://qudt.org/vocab/unit/MicroMOL-PER-M2-HR",
      "http://qudt.org/vocab/unit/MicroMOL-PER-M2-SEC",
      "http://qudt.org/vocab/unit/MilliMOL-PER-M2-DAY",
      "http://qudt.org/vocab/unit/MilliMOL-PER-M2-SEC",
      "http://qudt.org/vocab/unit/NanoMOL-PER-M2-DAY",
      "http://qudt.org/vocab/unit/PicoMOL-PER-M2-DAY",
    ],
    Units.MOL,
    1,
    Units.M,
    -2,
    Units.SEC,
    -1,
  ],
  [
    19,
    DerivedUnitSearchMode.ALL,
    [Units.K__M2__PER__KiloGM__SEC],
    Units.K,
    1,
    Units.M,
    2,
    Units.KiloGM,
    -1,
    Units.SEC,
    -1,
  ],
  [
    20,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/BTU_IT-FT-PER-FT2-HR-DEG_F",
      "http://qudt.org/vocab/unit/BTU_IT-IN-PER-FT2-HR-DEG_F",
      "http://qudt.org/vocab/unit/BTU_IT-IN-PER-FT2-SEC-DEG_F",
      "http://qudt.org/vocab/unit/BTU_IT-IN-PER-HR-FT2-DEG_F",
      "http://qudt.org/vocab/unit/BTU_IT-IN-PER-SEC-FT2-DEG_F",
      "http://qudt.org/vocab/unit/BTU_IT-PER-SEC-FT-DEG_R",
      "http://qudt.org/vocab/unit/BTU_TH-FT-PER-FT2-HR-DEG_F",
      "http://qudt.org/vocab/unit/BTU_TH-FT-PER-HR-FT2-DEG_F",
      "http://qudt.org/vocab/unit/BTU_TH-IN-PER-FT2-HR-DEG_F",
      "http://qudt.org/vocab/unit/BTU_TH-IN-PER-FT2-SEC-DEG_F",
      "http://qudt.org/vocab/unit/CAL_IT-PER-SEC-CentiM-K",
      "http://qudt.org/vocab/unit/CAL_TH-PER-CentiM-SEC-DEG_C",
      "http://qudt.org/vocab/unit/CAL_TH-PER-SEC-CentiM-K",
      "http://qudt.org/vocab/unit/KiloCAL-PER-CentiM-SEC-DEG_C",
      "http://qudt.org/vocab/unit/KiloCAL_IT-PER-HR-M-DEG_C",
      "http://qudt.org/vocab/unit/W-PER-M-K",
    ],
    Units.BTU_IT,
    1,
    Units.FT,
    1,
    Units.FT,
    -2,
    Units.HR,
    -1,
    Units.DEG_F,
    -1,
  ],
  [
    21,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/CentiN",
      "http://qudt.org/vocab/unit/DYN",
      "http://qudt.org/vocab/unit/DeciN",
      "http://qudt.org/vocab/unit/ERG-PER-CentiM",
      "http://qudt.org/vocab/unit/EV-PER-ANGSTROM",
      "http://qudt.org/vocab/unit/EV-PER-M",
      "http://qudt.org/vocab/unit/GM_F",
      "http://qudt.org/vocab/unit/J-PER-M",
      "http://qudt.org/vocab/unit/KIP_F",
      "http://qudt.org/vocab/unit/KiloEV-PER-MicroM",
      "http://qudt.org/vocab/unit/KiloGM_F",
      "http://qudt.org/vocab/unit/KiloLB_F",
      "http://qudt.org/vocab/unit/KiloN",
      "http://qudt.org/vocab/unit/KiloN-M-PER-M",
      "http://qudt.org/vocab/unit/KiloP",
      "http://qudt.org/vocab/unit/KiloPOND",
      "http://qudt.org/vocab/unit/LB_F",
      "http://qudt.org/vocab/unit/MegaEV-PER-CentiM",
      "http://qudt.org/vocab/unit/MegaLB_F",
      "http://qudt.org/vocab/unit/MegaN",
      "http://qudt.org/vocab/unit/MicroN",
      "http://qudt.org/vocab/unit/MilliN",
      "http://qudt.org/vocab/unit/N",
      "http://qudt.org/vocab/unit/N-M-PER-M",
      "http://qudt.org/vocab/unit/OZ_F",
      "http://qudt.org/vocab/unit/PDL",
      "http://qudt.org/vocab/unit/PlanckForce",
      "http://qudt.org/vocab/unit/TON_F_US",
    ],
    Units.KiloGM,
    1,
    Units.M,
    1,
    Units.SEC,
    -2,
  ],
  [
    21.5,
    DerivedUnitSearchMode.ALL,
    [
      "http://qudt.org/vocab/unit/AMU",
      "http://qudt.org/vocab/unit/CARAT",
      "http://qudt.org/vocab/unit/CWT_LONG",
      "http://qudt.org/vocab/unit/CWT_SHORT",
      "http://qudt.org/vocab/unit/CentiGM",
      "http://qudt.org/vocab/unit/DRAM_UK",
      "http://qudt.org/vocab/unit/DRAM_US",
      "http://qudt.org/vocab/unit/DWT",
      "http://qudt.org/vocab/unit/Da",
      "http://qudt.org/vocab/unit/DecaGM",
      "http://qudt.org/vocab/unit/DeciGM",
      "http://qudt.org/vocab/unit/DeciTONNE",
      "http://qudt.org/vocab/unit/DeciTON_Metric",
      "http://qudt.org/vocab/unit/EarthMass",
      "http://qudt.org/vocab/unit/FemtoGM",
      "http://qudt.org/vocab/unit/GM",
      "http://qudt.org/vocab/unit/GRAIN",
      "http://qudt.org/vocab/unit/HectoGM",
      "http://qudt.org/vocab/unit/Hundredweight_UK",
      "http://qudt.org/vocab/unit/Hundredweight_US",
      "http://qudt.org/vocab/unit/KiloGM",
      "http://qudt.org/vocab/unit/KiloTONNE",
      "http://qudt.org/vocab/unit/KiloTON_Metric",
      "http://qudt.org/vocab/unit/LB",
      "http://qudt.org/vocab/unit/LB_M",
      "http://qudt.org/vocab/unit/LB_T",
      "http://qudt.org/vocab/unit/LunarMass",
      "http://qudt.org/vocab/unit/MegaGM",
      "http://qudt.org/vocab/unit/MicroGM",
      "http://qudt.org/vocab/unit/MilliGM",
      "http://qudt.org/vocab/unit/NanoGM",
      "http://qudt.org/vocab/unit/OZ",
      "http://qudt.org/vocab/unit/OZ_M",
      "http://qudt.org/vocab/unit/OZ_TROY",
      "http://qudt.org/vocab/unit/Pennyweight",
      "http://qudt.org/vocab/unit/PicoGM",
      "http://qudt.org/vocab/unit/PlanckMass",
      "http://qudt.org/vocab/unit/Quarter_UK",
      "http://qudt.org/vocab/unit/SLUG",
      "http://qudt.org/vocab/unit/SolarMass",
      "http://qudt.org/vocab/unit/Stone_UK",
      "http://qudt.org/vocab/unit/TONNE",
      "http://qudt.org/vocab/unit/TON_Assay",
      "http://qudt.org/vocab/unit/TON_LONG",
      "http://qudt.org/vocab/unit/TON_Metric",
      "http://qudt.org/vocab/unit/TON_SHORT",
      "http://qudt.org/vocab/unit/TON_UK",
      "http://qudt.org/vocab/unit/TON_US",
      "http://qudt.org/vocab/unit/U",
    ],
    Units.KiloGM,
    1,
  ],
  [22, DerivedUnitSearchMode.ALL, [], Units.KiloGM, 1, Units.A, -1],
  [
    23,
    DerivedUnitSearchMode.BEST_MATCH,
    [Units.KiloN],
    Units.TONNE,
    1,
    Units.M,
    1,
    Units.SEC,
    -2,
  ],
  [
    24,
    DerivedUnitSearchMode.BEST_MATCH,
    [Units.KiloN],
    Units.KiloGM,
    1,
    Units.KiloM,
    1,
    Units.SEC,
    -2,
  ],
  [
    25,
    DerivedUnitSearchMode.BEST_MATCH,
    [Units.N__M__PER__M2],
    Units.M,
    2,
    Units.KiloGM,
    1,
    Units.SEC,
    -2,
    Units.M,
    -2,
  ],
  [
    26,
    DerivedUnitSearchMode.BEST_MATCH,
    [Units.N__M__PER__M2],
    Units.M,
    1,
    Units.N,
    1,
    Units.M,
    -2,
  ],
  [27, DerivedUnitSearchMode.BEST_MATCH, [Units.RAD], Units.RAD, 1],
])(
  "Qudt.derivedUnitsFromExponentUnitPairs(Mode, (Unit | number)...)",
  (caseId, mode, expected: Unit[] | string[], ...spec: (number | Unit)[]) => {
    const actual: Unit[] = Qudt.derivedUnitsFromExponentUnitPairs(
      mode,
      ...spec
    );
    let expectedAsStringArray = expected;
    if (expected.length > 0 && expected[0] instanceof Unit) {
      expectedAsStringArray = expectedAsStringArray
        .map((u) => (u as Unit).iri)
        .sort();
    }
    test(`Case${caseId}: Qudt.derivedUnitsFromExponentUnitPairs(${modeToString(
      mode
    )}`, () => {
      expect(actual.map((u) => u.iri).sort()).toStrictEqual(
        expectedAsStringArray
      );
    });
  }
);

describe.each([
  [
    1,
    Units.N,
    [
      [Units.N, 1],
      [Units.GM, 1, Units.M, 1, Units.SEC, -2],
    ],
  ],
  [
    2,
    Units.N__M,
    [
      [Units.N__M, 1],
      [Units.GM, 1, Units.M, 2, Units.SEC, -2],
      [Units.N, 1, Units.M, 1],
    ],
  ],
  [
    3,
    Units.N__M__PER__M2,
    [
      [Units.N__M__PER__M2, 1],
      [Units.N, 1, Units.M, -1],
      [Units.GM, 1, Units.SEC, -2],
      [Units.N, 1, Units.M, 1, Units.M, -2],
      [Units.M, -2, Units.M, 2, Units.GM, 1, Units.SEC, -2],
    ],
  ],
  [
    4,
    Units.J__PER__KiloGM__K__PA,
    [
      [Units.J__PER__KiloGM__K__PA, 1],
      [Units.J, 1, Units.GM, -1, Units.K, -1, Units.PA, -1],
      [Units.N, 1, Units.M, 1, Units.GM, -1, Units.K, -1, Units.PA, -1],
      [
        Units.GM,
        1,
        Units.M,
        2,
        Units.SEC,
        -2,
        Units.GM,
        -1,
        Units.K,
        -1,
        Units.PA,
        -1,
      ],
      [Units.M, 2, Units.SEC, -2, Units.K, -1, Units.PA, -1],
      [Units.J, 1, Units.GM, -1, Units.K, -1, Units.N, -1, Units.M, 2],
      [
        Units.J,
        1,
        Units.GM,
        -2,
        Units.K,
        -1,
        Units.M,
        -1,
        Units.SEC,
        2,
        Units.M,
        2,
      ],
      [Units.J, 1, Units.GM, -2, Units.K, -1, Units.M, 1, Units.SEC, 2],
      [Units.N, 1, Units.M, 3, Units.GM, -1, Units.K, -1, Units.N, -1],
      [
        Units.N,
        1,
        Units.M,
        3,
        Units.GM,
        -2,
        Units.K,
        -1,
        Units.M,
        -1,
        Units.SEC,
        2,
      ],
      [
        Units.GM,
        1,
        Units.M,
        4,
        Units.SEC,
        -2,
        Units.GM,
        -1,
        Units.K,
        -1,
        Units.N,
        -1,
      ],
      [Units.M, 4, Units.SEC, -2, Units.K, -1, Units.N, -1],
      [
        Units.GM,
        1,
        Units.M,
        4,
        Units.SEC,
        -2,
        Units.GM,
        -2,
        Units.K,
        -1,
        Units.M,
        -1,
        Units.SEC,
        2,
      ],
      [Units.GM, -1, Units.M, 3, Units.K, -1],
      [Units.N, 1, Units.M, 2, Units.GM, -2, Units.K, -1, Units.SEC, 2],
      [
        Units.M,
        3,
        Units.GM,
        1,
        Units.SEC,
        -2,
        Units.GM,
        -2,
        Units.K,
        -1,
        Units.SEC,
        2,
      ],
    ],
  ],
])(
  "Unit.getAllPossibleFactorUnitCombinations()",
  (testId: number, unit: Unit, expectedResultsSpec: (number | Unit)[][]) => {
    const expectedResults: FactorUnit[][] = expectedResultsSpec.map(
      (spec) => FactorUnits.ofFactorUnitSpec(...spec).factorUnits
    );
    const actual = unit.getAllPossibleFactorUnitCombinations();
    test(`Case ${testId}: (${unit}).getAllPossibleFactorUnitCombinations().length == ${expectedResults.length}`, () => {
      expect(actual.length).toBe(expectedResults.length);
    });
    test(`Case ${testId}: (${unit}).getAllPossibleFactorUnitCombinations() contains no duplicate results`, () =>
      expect(
        actual.some((act, indexOfAct) =>
          actual.some(
            (cmp, indexOfCmp) =>
              indexOfCmp !== indexOfAct &&
              arrayEqualsIgnoreOrdering(act, cmp, compareUsingEquals)
          )
        )
      ).toBe(false));
    expectedResults.forEach((expectedResult) => {
      test(`Case ${testId}: (${unit}).getAllPossibleFactorUnitCombinations() contains [${exponentOrUnitToString(
        expectedResult
      )}]`, () => {
        expect(
          actual.some((act) =>
            arrayEqualsIgnoreOrdering(expectedResult, act, compareUsingEquals)
          )
        ).toBe(true);
      });
    });

    actual.forEach((actualResult) => {
      test(`Case ${testId}: [${exponentOrUnitToString(
        actualResult
      )}], found in (${unit}).getAllPossibleFactorUnitCombinations() is expected`, () => {
        expect(
          expectedResults.some((exp) =>
            arrayEqualsIgnoreOrdering(actualResult, exp, compareUsingEquals)
          )
        ).toBe(true);
      });
    });
  }
);

test("Qudt.scaleUnitFromLabels(String, String)", () => {
  expect(Qudt.scaleUnitFromLabels("Nano", "Meter")).toStrictEqual(Units.NanoM);
  expect(Qudt.scaleUnitFromLabels("Giga", "Hertz")).toStrictEqual(Units.GigaHZ);
  expect(Qudt.scaleUnitFromLabels("NANO", "METER")).toStrictEqual(Units.NanoM);
  expect(Qudt.scaleUnitFromLabels("kilo", "GRAM")).toStrictEqual(Units.KiloGM);
});

test("Qudt.factorUnits(Unit)", () => {
  let factorUnits = Qudt.factorUnits(Units.N__M);
  expect(factorUnits).toStrictEqual([
    new FactorUnit(Units.M, 2),
    new FactorUnit(Units.KiloGM, 1),
    new FactorUnit(Units.SEC, -2),
  ]);
  factorUnits = Qudt.factorUnits(Units.J__PER__M2);
  expect(factorUnits).toStrictEqual([
    new FactorUnit(Units.M, 2),
    new FactorUnit(Units.KiloGM, 1),
    new FactorUnit(Units.SEC, -2),
    new FactorUnit(Units.M, -2),
  ]);
  factorUnits = Qudt.factorUnits(Units.KiloN__M);
  expect(factorUnits).toStrictEqual([
    new FactorUnit(Units.KiloN, 1),
    new FactorUnit(Units.M, 1),
  ]);
});

describe.each([
  [Units.YoctoC, Units.C],
  [Units.TeraBYTE, Units.BYTE],
  [Units.KiloGM, Units.GM],
  [Units.MilliGM, Units.GM],
  [Units.MegaGM, Units.GM],
  [Units.TON_Metric, Units.GM],
  [Units.TONNE, Units.GM],
  [Units.KiloM, Units.M],
  [Units.KiloN, Units.N],
])("Qudt.unscale(Unit)", (unit, expected) =>
  test(`Qudt.unscale(${unit.toString()}) = ${expected.toString()}`, () =>
    expect(Qudt.unscale(unit)).toBe(expected))
);

test("Qudt.unscaleFactorUnits(FactorUnit[])", () => {
  const units = Qudt.unscaleFactorUnits(Qudt.factorUnits(Units.KiloN__M));
  expect(units).toStrictEqual([
    new FactorUnit(Units.N, 1),
    new FactorUnit(Units.M, 1),
  ]);
});

test("Qudt.convert(Decimal, Unit, Unit) (missing values handling)", () => {
  expect(() => Qudt.convert(new Decimal(1), Units.M, undefined!)).toThrowError(
    "Parameter 'toUnit' is required"
  );
  expect(() => Qudt.convert(new Decimal(1), undefined!, Units.FT)).toThrowError(
    "Parameter 'fromUnit' is required"
  );
  expect(() => Qudt.convert(undefined!, Units.M, Units.FT)).toThrowError(
    "Parameter 'value' is required"
  );
});

test("Qudt.convert(Decimal, Unit, Unit) (UNITLESS)", () => {
  expect(Qudt.convert(new Decimal(3), Units.M, Units.UNITLESS)).toStrictEqual(
    new Decimal(3)
  );
  expect(Qudt.convert(new Decimal(3), Units.UNITLESS, Units.M)).toStrictEqual(
    new Decimal(3)
  );
  expect(
    Qudt.convert(new Decimal(3), Units.UNITLESS, Units.UNITLESS)
  ).toStrictEqual(new Decimal(3));
});

test("Qudt.convert(Decimal, Unit, Unit) (inconvertible units handling)", () => {
  expect(() => Qudt.convert(new Decimal(1), Units.M, Units.SEC)).toThrowError(
    "Not convertible: m -> s"
  );
});

describe.each([
  [new Decimal(1), Units.M, Units.FT, 3.28, 2],
  [new Decimal(36), Units.DEG_C, Units.DEG_F, 96.8, 2],
  [new Decimal(100), Units.DEG_F, Units.DEG_C, 37.777, 2],
  [new Decimal(10), Units.TONNE, Units.TON_UK, 9.84, 2],
  [new Decimal(1), Units.LB, Units.KiloGM, 0.45359237, 6],
  [new Decimal(1), Units.N, Units.KiloN, 0.001, 2],
  [new Decimal(1), Units.L, Units.GAL_US, 0.264, 2],
  [new Decimal(1000000), Units.BYTE, Units.MegaBYTE, 1, 2],
  [new Decimal(1), Units.BTU_IT__PER__LB, Units.J__PER__GM, 2.326, 3],
  [new Decimal(1), Units.FemtoGM, Units.KiloGM, 0.000000000000000001, 15],
])("Qudt.convert(Decimal, Unit, Unit)", (val, from, to, expected, digits) =>
  test(`Qudt.convert(${val.toString()}, ${from.toString()}, ${to.toString()}) = ${expected}`, () =>
    expect(Qudt.convert(val, from, to).toNumber()).toBeCloseTo(
      expected,
      digits
    ))
);

test.each([
  [new Decimal(1), Units.M, Units.FT.iri, 3.28, 2],
  [new Decimal(36), Units.DEG_C.iri, Units.DEG_F, 96.8, 2],
  [new Decimal(100), Units.DEG_F.iri, Units.DEG_C.iri, 37.777, 2],
])(
  "Qudt.convert(Decimal, Unit|string, Unit|string) (mix types)",
  (val, from, to, expectedVal, decimals) =>
    expect(Qudt.convert(val, from, to).toNumber()).toBeCloseTo(
      expectedVal,
      decimals
    )
);

test.each([
  [new Decimal(10), Units.TONNE.iri + "dontfindme", Units.TON_UK],
  [new Decimal(1), Units.LB, Units.KiloGM.iri + "dontfindme"],
])("throw error for unit that cannot be found", (value, from, to) =>
  expect(() => Qudt.convert(value, from, to)).toThrowError()
);

test("Qudt.convertQuantityValue(QuantityValue, Unit)", () => {
  expect(
    Qudt.convertQuantityValue(
      new QuantityValue(new Decimal(1), Units.M),
      Units.FT
    ).value.toNumber()
  ).toBeCloseTo(3.28, 2);
});

test("Qudt.convertQuantityValue(QuantityValue, string)", () => {
  expect(
    Qudt.convertQuantityValue(
      new QuantityValue(new Decimal(1), Units.M),
      Units.FT.iri
    ).value.toNumber()
  ).toBeCloseTo(3.28, 2);
});

test("Unit.convert(Decimal, Unit) (missing values handling)", () => {
  expect(() => Units.M.convert(new Decimal(1), undefined!)).toThrowError(
    "Parameter 'toUnit' is required"
  );
  expect(() => Units.M.convert(undefined!, Units.FT)).toThrowError(
    "Parameter 'value' is required"
  );
});

test("Unit.convert(Decimal, Unit) (UNITLESS)", () => {
  expect(Units.M.convert(new Decimal(3), Units.UNITLESS)).toStrictEqual(
    new Decimal(3)
  );
  expect(Units.UNITLESS.convert(new Decimal(3), Units.M)).toStrictEqual(
    new Decimal(3)
  );
  expect(Units.UNITLESS.convert(new Decimal(3), Units.UNITLESS)).toStrictEqual(
    new Decimal(3)
  );
});

test("Unit.convert(Decimal, Unit) (inconvertible units handling)", () => {
  expect(() => Units.M.convert(new Decimal(1), Units.SEC)).toThrowError(
    "Not convertible: m -> s"
  );
});

test("Unit.convert(Decimal, Unit)", () => {
  expect(Units.M.convert(new Decimal(1), Units.FT).toNumber()).toBeCloseTo(
    3.28,
    2
  );
  expect(
    Units.DEG_C.convert(new Decimal(36), Units.DEG_F).toNumber()
  ).toBeCloseTo(96.8, 2);
  expect(
    Units.DEG_F.convert(new Decimal(100), Units.DEG_C).toNumber()
  ).toBeCloseTo(37.777, 2);
  expect(
    Units.TONNE.convert(new Decimal(10), Units.TON_UK).toNumber()
  ).toBeCloseTo(9.84, 2);
  expect(Units.LB.convert(new Decimal(1), Units.KiloGM).toNumber()).toBeCloseTo(
    0.45359237,
    6
  );
  expect(Units.N.convert(new Decimal(1), Units.KiloN).toNumber()).toBeCloseTo(
    0.001,
    2
  );
  expect(Units.L.convert(new Decimal(1), Units.GAL_US).toNumber()).toBeCloseTo(
    0.264,
    2
  );
  expect(
    Units.BYTE.convert(new Decimal(1000000), Units.MegaBYTE).toNumber()
  ).toBeCloseTo(1, 2);
  expect(
    Units.BTU_IT__PER__LB.convert(new Decimal(1), Units.J__PER__GM).toNumber()
  ).toBeCloseTo(2.326, 3);
  expect(Units.FemtoGM.convert(new Decimal(1), Units.KiloGM)).toStrictEqual(
    new Decimal("0.000000000000000001")
  );
});

test("Unit.getConversionMultiplier()", () => {
  expect(
    Units.CentiM.getConversionMultiplier(Units.MilliM).toNumber()
  ).toBeCloseTo(10, 1);
  expect(
    Units.MilliM.getConversionMultiplier(Units.KiloM).toNumber()
  ).toBeCloseTo(0.000001, 6);
  expect(() => Units.DEG_F.getConversionMultiplier(Units.DEG_C)).toThrowError();
});

describe.each([
  [
    Units.KiloGM__PER__SEC2,
    [Units.KiloGM, 1, Units.M, 1, Units.M, -2, Units.M, 1, Units.SEC, -2],
    true,
  ],
  [Units.N__M__PER__KiloGM, [Units.N, 1, Units.M, 1, Units.KiloGM, -1], true],
  [Units.N__M__PER__KiloGM, [Units.M, 2, Units.SEC, -2], true],
  [
    Units.N__M__PER__KiloGM,
    [Units.M, 1, Units.KiloGM, 1, Units.SEC, -2, Units.M, 1, Units.KiloGM, -1],
    true,
  ],
  [Units.W__PER__M2__K, [Units.KiloGM, 1, Units.K, -1, Units.SEC, -3], true],
  [Units.GM__PER__CentiM3, [Units.KiloGM, 1, Units.M, -3], false],
  [Units.KiloGM__PER__DeciM3, [Units.M, -3, Units.KiloGM, 1], false],
  [Units.KiloGM__PER__M3, [Units.KiloGM, 1, Units.M, -3], true],
  [Units.KiloGM__PER__M3, [Units.M, -3, Units.KiloGM, 1], true],
  [Units.KiloGM__PER__M3, [Units.M3, -1, Units.KiloGM, 1], true],
  [Units.M2__SR, [Units.M, 2], false],
  [Units.M2, [Units.M, 2, Units.SR, 1], false],
  [Units.M, [Units.M, 1], true],
  [Units.PER__M, [Units.M, -1], true],
  [Units.PER__L, [Units.L, -1], true],
  [Units.PER__M, [Units.M, -1, Units.KiloGM, 1], false],
  [Units.KiloGM, [Units.KiloGM, 1], true],
  [Units.PER__H, [Units.H, -1], true],
])(
  "Unit.matches(FactorUnits)",
  (unit: Unit, spec: (Unit | number)[], expectedResult) =>
    test(`${unit.toString()}.matches([${exponentOrUnitToString(
      spec
    )}]) == ${expectedResult}`, () =>
      expect(unit.matches(FactorUnits.ofFactorUnitSpec(...spec))).toBe(
        expectedResult
      ))
);

test("Unit.matches(FactorUnits) (multiple levels of factor units)", () => {
  expect(
    Units.N__PER__KiloGM.matches(
      FactorUnits.ofFactorUnitSpec(
        Units.KiloGM,
        -1,
        Units.M,
        1,
        Units.KiloGM,
        1,
        Units.SEC,
        -2
      )
    )
  ).toBe(true);
  expect(
    Units.N__PER__KiloGM.matches(
      FactorUnits.ofFactorUnitSpec(Units.N, 1, Units.KiloGM, -1)
    )
  ).toBe(true);
  expect(
    Units.N__PER__KiloGM.matches(
      FactorUnits.ofFactorUnitSpec(
        Units.KiloGM,
        -1,
        Units.M,
        1,
        Units.KiloGM,
        1,
        Units.SEC,
        -2,
        Units.N,
        1
      )
    )
  ).toBe(false);
  expect(
    Units.N__PER__KiloGM.matches(
      FactorUnits.ofFactorUnitSpec(
        Units.KiloGM,
        -1,
        Units.M,
        1,
        Units.KiloGM,
        1,
        Units.SEC,
        -2,
        Units.N,
        1,
        Units.KiloGM,
        -1
      )
    )
  ).toBe(false);
  expect(
    Units.N__PER__KiloGM.matches(
      FactorUnits.ofFactorUnitSpec(Units.M, -2, Units.KiloGM, 2)
    )
  ).toBe(false);
  expect(
    Units.N__PER__KiloGM.matches(FactorUnits.ofFactorUnitSpec(Units.M, -2))
  ).toBe(false);
  expect(
    Units.N__PER__KiloGM.matches(FactorUnits.ofFactorUnitSpec(Units.KiloGM, 1))
  ).toBe(false);
  const wattFactors = new FactorUnits(Units.W.factorUnits);
  expect(Units.TeraW.matches(wattFactors)).toBe(false);
  expect(Units.KiloW.matches(wattFactors)).toBe(false);
  expect(Units.MegaW.matches(wattFactors)).toBe(false);
  expect(Units.MilliW.matches(wattFactors)).toBe(false);
});

test("Unit.matches(FactorUnitMatchingMode, Unit...) (mode=ALLOW_SCALED)", () => {
  expect(
    Units.GM__PER__DeciM3.matches(
      FactorUnits.ofFactorUnitSpec(Units.KiloGM, 1, Units.M, -3)
    )
  ).toBe(true);
  expect(
    Units.KiloGM__PER__M3.matches(
      FactorUnits.ofFactorUnitSpec(Units.GM, 1, Units.DeciM, -3)
    )
  ).toBe(true);
});

test("Unit.matches(FactorUnitMatchingMode, Unit...))", () => {
  expect(
    Units.GM__PER__DeciM3.matches(
      FactorUnits.ofFactorUnitSpec(Units.KiloGM, 1, Units.M, -3)
    )
  ).toBe(true);
  expect(
    Units.KiloGM__PER__M3.matches(
      FactorUnits.ofFactorUnitSpec(Units.GM, 1, Units.DeciM, -3)
    )
  ).toBe(true);
});

test("Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode, (Unit| number )...) (BEST_MATCH)", () => {
  const units = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.BEST_MATCH,
    Units.N,
    1,
    Units.M,
    1
  );
  expect(units).toStrictEqual([Units.N__M]);
});

test("Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode, (Unit| number )...) (mode=EXACT, multiple results)", () => {
  const units = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.ALL,
    Units.N,
    1,
    Units.M,
    1
  );
  expect(units.length).toBe(3);
  expect(units.includes(Units.J)).toBe(true);
  expect(units.includes(Units.N__M)).toBe(true);
  expect(units.includes(Units.W__SEC)).toBe(true);
});

test("Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode, (Unit| number )...) (mode=BEST_MATCH)", () => {
  let units = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.BEST_MATCH,
    "KiloGM",
    1,
    "M",
    -3
  );
  expect(units.length).toBe(1);
  expect(units.includes(Units.KiloGM__PER__M3)).toBe(true);
  units = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.BEST_MATCH,
    "KiloN",
    1,
    "MilliM",
    1
  );
  expect(units.length).toBe(1);
  expect(units.includes(Units.J)).toBe(true);
});

test("Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode, (Unit| number )...) (mode=ALLOW_SCALED)", () => {
  const units = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.ALL,
    "KiloGM",
    1,
    "M",
    -3
  );
  expect(units.length).toBe(4);
  expect(units.includes(Units.KiloGM__PER__M3)).toBe(true);
  expect(units.includes(Units.GM__PER__DeciM3)).toBe(true);
  expect(units.includes(Units.GM__PER__L)).toBe(true);
  expect(units.includes(Units.MilliGM__PER__MilliL)).toBe(true);
});

test("Unit.matches((Unit|number)...) (deep factor units, duplicated exponent-unit combination)", () => {
  const du = Units.N__M__PER__KiloGM;
  expect(
    du.matches(
      FactorUnits.ofFactorUnitSpec(Units.N, 1, Units.KiloGM, -1, Units.M, 1)
    )
  ).toBe(true);
  expect(
    du.matches(
      FactorUnits.ofFactorUnitSpec(
        Units.KiloGM,
        -1,
        Units.M,
        1,
        Units.KiloGM,
        1,
        Units.SEC,
        -2,
        Units.M,
        1,
        Units.N,
        1
      )
    )
  ).toBe(false);
  expect(
    du.matches(
      FactorUnits.ofFactorUnitSpec(
        Units.KiloGM,
        -1,
        Units.M,
        1,
        Units.KiloGM,
        1,
        Units.SEC,
        -2,
        Units.N,
        1
      )
    )
  ).toBe(false);
  expect(
    du.matches(
      FactorUnits.ofFactorUnitSpec(
        Units.KiloGM,
        -1,
        Units.M,
        1,
        Units.KiloGM,
        1,
        Units.SEC,
        -2,
        Units.N,
        1,
        Units.KiloGM,
        -1
      )
    )
  ).toBe(false);
  expect(
    du.matches(
      FactorUnits.ofFactorUnitSpec(
        Units.KiloGM,
        1,
        Units.M,
        1,
        Units.SEC,
        -2,
        Units.M,
        1,
        Units.KiloGM,
        -1
      )
    )
  ).toBe(true);
  expect(
    du.matches(FactorUnits.ofFactorUnitSpec(Units.M, -2, Units.KiloGM, 2))
  ).toBe(false);
  expect(du.matches(FactorUnits.ofFactorUnitSpec(Units.M, -2))).toBe(false);
  expect(du.matches(FactorUnits.ofFactorUnitSpec(Units.KiloGM, 1))).toBe(false);
  expect(
    du.matches(FactorUnits.ofFactorUnitSpec(Units.N, 1, Units.KiloGM, -1))
  ).toBe(false);
});

test("Unit.matches(FactorUnits, FactorUnitMatchingMode) (scaled factors)", () => {
  expect(
    Units.KiloN__M.matches(
      FactorUnits.ofFactorUnitSpec(
        Units.SEC,
        -2,
        Units.KiloGM,
        1,
        Units.M,
        1,
        Units.KiloM,
        1
      )
    )
  ).toBe(true);
  let factors = [Units.KiloGM, 1, Units.SEC, -2, Units.M, 1, Units.KiloM, 1];
  expect(Units.KiloN__M.matches(FactorUnits.ofFactorUnitSpec(...factors))).toBe(
    true
  );
  expect(Units.KiloJ.matches(FactorUnits.ofFactorUnitSpec(...factors))).toBe(
    true
  );
  expect(Units.MilliOHM.matches(FactorUnits.ofFactorUnitSpec(...factors))).toBe(
    false
  );
  expect(Units.MilliS.matches(FactorUnits.ofFactorUnitSpec(...factors))).toBe(
    false
  );

  factors = [Units.KiloGM, 1, Units.K, -1, Units.SEC, -3];
  expect(
    Units.W__PER__K.matches(FactorUnits.ofFactorUnitSpec(...factors))
  ).toBe(false);
  expect(
    Units.V__PER__K.matches(FactorUnits.ofFactorUnitSpec(...factors))
  ).toBe(false);
});

test("Unit.matches(FactorUnits, FactorUnitMatchingMode) (scaled factors, negative first)", () => {
  let factors = [Units.SEC, -2, Units.KiloGM, 1, Units.M, 1, Units.KiloM, 1];
  expect(Units.KiloN__M.matches(FactorUnits.ofFactorUnitSpec(...factors))).toBe(
    true
  );
  factors = [Units.KiloGM, 1, Units.SEC, -2, Units.M, 1, Units.KiloM, 1];
  expect(Units.KiloN__M.matches(FactorUnits.ofFactorUnitSpec(...factors))).toBe(
    true
  );
});

test("Unit.matches(FactorUnits, FactorUnitMatchingMode) (square in nominator)", () => {
  let factors = [Units.MilliM, 2, Units.SEC, -1];
  expect(
    Units.MilliM2__PER__SEC.matches(FactorUnits.ofFactorUnitSpec(...factors))
  ).toBe(true);
  factors = [Units.KiloGM, 2, Units.SEC, -2];
  expect(
    Units.KiloGM2__PER__SEC2.matches(FactorUnits.ofFactorUnitSpec(...factors))
  ).toBe(true);
});
test("Unit.matches(FactorUnits, FactorUnitMatchingMode) (square in denominator)", () => {
  let factors = [Units.KiloGM, 1, Units.M, 1, Units.M, -2, Units.SEC, -2];
  expect(
    Units.N__PER__M2.matches(FactorUnits.ofFactorUnitSpec(...factors))
  ).toBe(true);
  factors = [Units.M, -2, Units.SEC, -2, Units.KiloGM, 1, Units.M, 1];
  expect(
    Units.N__PER__M2.matches(FactorUnits.ofFactorUnitSpec(...factors))
  ).toBe(true);
});

test("Unit.matches(FactorUnits, FactorUnitMatchingMode) (square in denominator [2])", () => {
  const factors = [
    Units.KiloGM,
    1,
    Units.M,
    1,
    Units.MilliM,
    -2,
    Units.KiloSEC,
    -2,
  ];
  expect(
    Units.N__PER__M2.matches(FactorUnits.ofFactorUnitSpec(...factors))
  ).toBe(true);
  expect(Units.PA.matches(FactorUnits.ofFactorUnitSpec(...factors))).toBe(true);
});

test("Unit.matches(FactorUnits, FactorUnitMatchingMode) (square in denominator [3])", () => {
  const factors = [
    Units.GM,
    1,
    Units.MilliM,
    1,
    Units.M,
    -2,
    Units.MilliSEC,
    -2,
  ];
  expect(
    Units.N__PER__M2.matches(FactorUnits.ofFactorUnitSpec(...factors))
  ).toBe(true);
  expect(Units.PA.matches(FactorUnits.ofFactorUnitSpec(...factors))).toBe(true);
  expect(
    Units.J__PER__M3.matches(FactorUnits.ofFactorUnitSpec(...factors))
  ).toBe(true);
});

function combinations<T>(arr: T[]): T[][] {
  if (arr.length == 1) {
    return [arr];
  } else if (arr.length > 1) {
    const ret: T[][] = [];
    for (let i = 0; i < arr.length; i++) {
      const rest = [...arr];
      rest.splice(i, 1);
      const restCombinations = combinations(rest);
      for (const cmb of restCombinations) {
        ret.push([arr[i], ...cmb]);
      }
    }
    return ret;
  }
  throw "cannot handle zero-length array";
}

describe.each(
  (function (): FactorUnit[][] {
    const factors = [
      Units.KiloGM,
      1,
      Units.SEC,
      -2,
      Units.M,
      1,
      Units.KiloM,
      1,
    ];
    const factorUnits: FactorUnit[] = [];
    for (let i = 0; i < factors.length; i += 2) {
      factorUnits.push(
        new FactorUnit(factors[i] as Unit, factors[i + 1] as number)
      );
    }
    return combinations(factorUnits);
  })()
)(
  "Unit.matches(FactorUnits, FactorUnitMatchingMode) (scaled factors, changing order)",
  (...factorUnits) => {
    const factors = factorUnits.flatMap((fu) => [fu.unit, fu.exponent]);
    test(`Units.KiloN__M should match([${factorUnits.map((f) =>
      f.toString()
    )}] under matching mode ALLOW_SCALED `, () =>
      expect(
        Units.KiloN__M.matches(FactorUnits.ofFactorUnitSpec(...factors))
      ).toBe(true));
    test(`Units.KiloN__M should match([${factorUnits.map((f) =>
      f.toString()
    )}] under matching mode EXACT`, () =>
      expect(
        Units.KiloN__M.matches(FactorUnits.ofFactorUnitSpec(...factors))
      ).toBe(true));
  }
);

test("Unit.matches(FactorUnits) (scaled factors, various matches for one spec)", () => {
  let factors = [Units.KiloGM, 1, Units.SEC, -2, Units.M, 1, Units.KiloM, 1];
  expect(Units.KiloN__M.matches(FactorUnits.ofFactorUnitSpec(...factors))).toBe(
    true
  ),
    expect(Units.KiloJ.matches(FactorUnits.ofFactorUnitSpec(...factors))).toBe(
      true
    );

  expect(Units.MilliOHM.matches(FactorUnits.ofFactorUnitSpec(...factors))).toBe(
    false
  );
  expect(Units.MilliS.matches(FactorUnits.ofFactorUnitSpec(...factors))).toBe(
    false
  );
  factors = [Units.KiloGM, 1, Units.K, -1, Units.SEC, -3];
  expect(
    Units.W__PER__K.matches(FactorUnits.ofFactorUnitSpec(...factors))
  ).toBe(false);
  expect(
    Units.V__PER__K.matches(FactorUnits.ofFactorUnitSpec(...factors))
  ).toBe(false);
});

test("Unit.matches(FactorUnits, FactorUnitMatchingMode) (MilliJ)", () => {
  const factors = [Units.KiloGM, 1, Units.SEC, -2, Units.M, 1, Units.MilliM, 1];
  expect(
    Units.MilliN__M.matches(FactorUnits.ofFactorUnitSpec(...factors))
  ).toBe(true);
  expect(
    Units.MilliH__PER__KiloOHM.matches(FactorUnits.ofFactorUnitSpec(...factors))
  ).toBe(false);
  expect(Units.MilliJ.matches(FactorUnits.ofFactorUnitSpec(...factors))).toBe(
    true
  );
});

test("Qudt.testSimplifyFactorUnits()", () => {
  let simplified = Qudt.simplifyFactorUnits([
    new FactorUnit(Units.N, 1),
    new FactorUnit(Units.M, -1),
    new FactorUnit(Units.M, -1),
  ]);
  expect(simplified.length).toBe(2);
  expect(
    Qudt.derivedUnitsFromFactorUnits(
      DerivedUnitSearchMode.ALL,
      ...simplified
    ).includes(Units.N__PER__M2)
  ).toBe(true);
  expect(
    Qudt.derivedUnitsFromFactorUnits(
      DerivedUnitSearchMode.ALL,
      ...simplified
    ).includes(Units.PA)
  ).toBe(true);
  simplified = Qudt.simplifyFactorUnits(
    Units.FARAD.getLeafFactorUnitsWithCumulativeExponents()
  );
  expect(simplified.length).toBe(4);
  expect(
    simplified.some((fu) => fu.equals(new FactorUnit(Units.KiloGM, -1)))
  ).toBe(true);
  expect(simplified.some((fu) => fu.equals(new FactorUnit(Units.M, -2)))).toBe(
    true
  );
  expect(simplified.some((fu) => fu.equals(new FactorUnit(Units.SEC, 4)))).toBe(
    true
  );
  expect(simplified.some((fu) => fu.equals(new FactorUnit(Units.A, 2)))).toBe(
    true
  );
});

test("Qudt.scaleToBaseUnit(Unit)", () => {
  let base = Qudt.scaleToBaseUnit(Units.KiloM);
  expect(base.unit).toBe(Units.M);
  expect(base.factor).toEqual(new Decimal("1000"));
  base = Qudt.scaleToBaseUnit(Units.M);
  expect(base.unit).toBe(Units.M);
  expect(base.factor).toEqual(new Decimal("1"));
});

test("Unit.getUnitOfSystems()", () => {
  expect(Units.M.unitOfSystemIris.length === 0).toBe(false);
  expect(
    Units.M.unitOfSystemIris.includes(
      Qudt.NAMESPACES.systemOfUnits.makeIriInNamespace("SI")
    )
  );
});

test("SystemOfUnits.getBaseUnits()", () => {
  expect(SystemsOfUnits.SI.baseUnitIris.includes(Units.M.iri)).toBe(true);
  expect(SystemsOfUnits.SI.baseUnitIris.includes(Units.KiloGM.iri)).toBe(true);
  expect(SystemsOfUnits.SI.baseUnitIris.includes(Units.A.iri)).toBe(true);
  expect(SystemsOfUnits.SI.baseUnitIris.includes(Units.SEC.iri)).toBe(true);
  expect(SystemsOfUnits.SI.baseUnitIris.includes(Units.CD.iri)).toBe(true);
  expect(SystemsOfUnits.SI.baseUnitIris.includes(Units.MOL.iri)).toBe(true);
  expect(SystemsOfUnits.SI.baseUnitIris.includes(Units.UNITLESS.iri)).toBe(
    true
  );
  expect(SystemsOfUnits.SI.baseUnitIris.includes(Units.K.iri)).toBe(true);
  expect(SystemsOfUnits.SI.baseUnitIris.length).toBe(8);
});

test("SystemOfUnits.allUnitsOfSystem(SystemsOfUnits.SI) ", () => {
  const units = Qudt.allUnitsOfSystem(SystemsOfUnits.SI);
  expect(units.includes(Units.M)).toBe(true);
  expect(units.includes(Units.KiloGM)).toBe(true);
  expect(units.includes(Units.A)).toBe(true);
  expect(units.includes(Units.SEC)).toBe(true);
  expect(units.includes(Units.CD)).toBe(true);
  expect(units.includes(Units.MOL)).toBe(true);
  expect(units.includes(Units.UNITLESS)).toBe(true);
  expect(units.includes(Units.K)).toBe(true);
  expect(units.includes(Units.FT)).toBe(false);
  expect(units.includes(Units.OZ)).toBe(false);
  expect(units.includes(Units.N__PER__M3)).toBe(true);
  expect(units.length).toBe(1058);
});

test("SystemOfUnits.allUnitsOfSystem(SystemsOfUnits.Imperial)", () => {
  const units = Qudt.allUnitsOfSystem(SystemsOfUnits.IMPERIAL);
  expect(units.includes(Units.M)).toBe(false);
  expect(units.includes(Units.KiloGM)).toBe(false);
  expect(units.includes(Units.A)).toBe(false);
  expect(units.includes(Units.SEC)).toBe(true);
  expect(units.includes(Units.CD)).toBe(false);
  expect(units.includes(Units.MOL)).toBe(false);
  expect(units.includes(Units.UNITLESS)).toBe(true);
  expect(units.includes(Units.K)).toBe(false);
  expect(units.includes(Units.FT)).toBe(true);
  expect(units.includes(Units.OZ)).toBe(true);
  expect(units.includes(Units.N__PER__M3)).toBe(false);
  expect(units.length).toBe(427);
});

test("Unit.normalize()", () => {
  for (const unit of Qudt.allUnits()) {
    expect(unit.normalize() instanceof FactorUnits).toBe(true);
  }
});

describe.each([
  [Units.FT, SystemsOfUnits.SI, Units.DeciM],
  [Units.YD, SystemsOfUnits.SI, Units.M],
  [Units.IN, SystemsOfUnits.SI, Units.CentiM],
  [Units.LB, SystemsOfUnits.SI, Units.KiloGM],
  [Units.MI, SystemsOfUnits.SI, Units.KiloM],
  [Units.DEG_F, SystemsOfUnits.SI, Units.K],
  [Units.DEG, SystemsOfUnits.SI, Units.DEG],
  [Units.QT_UK, SystemsOfUnits.SI, Units.L],
  [Units.Stone_UK, SystemsOfUnits.SI, Units.KiloGM],
  [Units.KiloM, SystemsOfUnits.IMPERIAL, Units.MI],
  [Units.KiloGM, SystemsOfUnits.IMPERIAL, Units.LB],
  [Units.NanoM, SystemsOfUnits.IMPERIAL, Units.MicroIN],
  [Units.MegaGM, SystemsOfUnits.IMPERIAL, Units.TON_UK],
])(`Find corresponding unit in given unit system`, (unit, system, expected) => {
  const actual = Qudt.correspondingUnitInSystem(unit, system) || "[no result]";
  const actualString =
    actual === expected ? " (correct)" : `, but was ${actual.toString()}`;
  test(`${unit.toString()} in system '${
    system.abbreviation
  }' is expected to be ${expected.toString()}${actualString}`, () =>
    expect(actual).toStrictEqual(expected));
});
