import { Decimal } from "decimal.js";
import {
  DerivedUnitSearchMode,
  FactorUnit,
  FactorUnitMatchingMode,
  FactorUnitSelection,
  Prefix,
  Prefixes,
  QuantityKind,
  QuantityKinds,
  QuantityValue,
  Qudt,
  QUDT_PREFIX_BASE_IRI,
  QUDT_QUANTITYKIND_BASE_IRI,
  QUDT_UNIT_BASE_IRI,
  Unit,
  Units,
} from "../src/units";

test("Qudt.unit()", () => {
  expect(Qudt.unit(QUDT_UNIT_BASE_IRI + "M")).toBe(Units.M);
});

test("Qudt.unitFromLocalname()", () => {
  expect(Qudt.unitFromLocalname("M")).toBe(Units.M);
});

test("Qudt.quantityKind()", () => {
  expect(Qudt.quantityKind(QUDT_QUANTITYKIND_BASE_IRI + "Length")).toBe(
    QuantityKinds.Length
  );
});

test("Qudt.quantityKindFromLocalname()", () => {
  expect(Qudt.quantityKindFromLocalname("Length")).toBe(QuantityKinds.Length);
});

test("Qudt.prefix()", () => {
  expect(Qudt.prefix(QUDT_PREFIX_BASE_IRI + "Kilo")).toBe(Prefixes.Kilo);
});

test("Qudt.prefixFromLocalname()", () => {
  expect(Qudt.prefixFromLocalname("Kilo")).toBe(Prefixes.Kilo);
});

test("Prefixes", () => {
  const kilo: Prefix = Prefixes.Kilo;
  expect(kilo.multiplier).toStrictEqual(new Decimal(1000));
  expect(kilo.iri).toEqual(QUDT_PREFIX_BASE_IRI + "Kilo");
});

test("Units", () => {
  const meter: Unit = Units.M;
  expect(meter.iri).toEqual(QUDT_UNIT_BASE_IRI + "M");
  expect(meter.hasLabel("Meter")).toBe(true);
  expect(meter.hasLabel("Metre")).toBe(true);
  expect(meter.getLabelForLanguageTag("en")).toBe("Metre");
});

test("QuantityKinds", () => {
  const length: QuantityKind = QuantityKinds.Length;
  expect(length.hasLabel("Length")).toBe(true);
  expect(length.iri).toBe(QUDT_QUANTITYKIND_BASE_IRI + "Length");
});

test("Qudt.testUnitFromLabel()", () => {
  expect(Qudt.unitFromLabel("Newton Meter")).toBe(Units.N__M);
  expect(Qudt.unitFromLabel("NEWTON_METER")).toBe(Units.N__M);
});

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

test("Qudt.derivedUnitsFromFactors(...Unit|number|Decimal[])", () => {
  expect(() =>
    Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode.EXACT, Units.M)
  ).toThrowError();
  expect(() =>
    Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode.EXACT, 1)
  ).toThrowError();
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.M,
      3
    )
  ).toStrictEqual([Units.M3]);
  const units = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.EXACT,
    Units.KiloGM,
    1,
    Units.M,
    -3
  );
  expect(units.includes(Units.KiloGM__PER__M3)).toBe(true);
  expect(units.includes(Units.GM__PER__DeciM3)).toBe(false);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.MOL,
      1,
      Units.M,
      -2,
      Units.SEC,
      -1
    )
  ).toStrictEqual([Units.MOL__PER__M2__SEC]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.K,
      1,
      Units.M,
      2,
      Units.KiloGM,
      -1,
      Units.SEC,
      -1
    )
  ).toStrictEqual([Units.K__M2__PER__KiloGM__SEC]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.BTU_IT,
      1,
      Units.FT,
      1,
      Units.FT,
      -2,
      Units.HR,
      -1,
      Units.DEG_F,
      -1
    )
  ).toStrictEqual([Units.BTU_IT__FT__PER__FT2__HR__DEG_F]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.KiloGM,
      1,
      Units.M,
      1,
      Units.SEC,
      -2
    )
  ).toStrictEqual([Units.N]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.KiloGM,
      1
    )
  ).toStrictEqual([Units.KiloGM]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.KiloGM,
      1,
      Units.A,
      -1
    ).length
  ).toBe(0);
  const derived = Qudt.derivedUnitsFromFactorUnits(
    DerivedUnitSearchMode.EXACT,
    ...Qudt.simplifyFactorUnits(
      Units.W.getLeafFactorUnitsWithCumulativeExponents()
    )
  );
  expect(derived.length).toBe(2);
  expect(derived.some((u) => u.equals(Units.W))).toBe(true);
  expect(derived.some((u) => u.equals(Units.J__PER__SEC))).toBe(true);
});

test("Qudt.derivedUnitsFromFactorUnits(...FactorUnit[]", () => {
  expect(
    Qudt.derivedUnitsFromFactorUnits(
      DerivedUnitSearchMode.EXACT,
      new FactorUnit(Units.M, 3)
    )
  ).toStrictEqual([Units.M3]);
  expect(
    Qudt.derivedUnitsFromFactorUnits(
      DerivedUnitSearchMode.EXACT,
      new FactorUnit(Units.MOL, 1),
      new FactorUnit(Units.M, -2),
      new FactorUnit(Units.SEC, -1)
    )
  ).toStrictEqual([Units.MOL__PER__M2__SEC]);
});

test("Qudt.derivedUnitsFromMap(Map<Unit, number))", () => {
  const spec = new Map<Unit, number>();
  spec.set(Units.M, 3);
  expect(
    Qudt.derivedUnitsFromMap(DerivedUnitSearchMode.EXACT, spec)
  ).toStrictEqual([Units.M3]);
  spec.clear();
  spec.set(Units.MOL, 1);
  spec.set(Units.M, -2);
  spec.set(Units.SEC, -1);
  expect(
    Qudt.derivedUnitsFromMap(DerivedUnitSearchMode.EXACT, spec)
  ).toStrictEqual([Units.MOL__PER__M2__SEC]);
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
      DerivedUnitSearchMode.EXACT,
      Units.M,
      3
    )
  ).toStrictEqual([Units.M3]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.M,
      2
    )
  ).toStrictEqual([Units.M2]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.K,
      -1
    )
  ).toStrictEqual([Units.PER__K]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.M,
      1
    )
  ).toStrictEqual([Units.M]);
});

test("Qudt.derivedUnitsFromExponentUnitPairs(string, number)[using Iris]", () => {
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.M.iri,
      3
    )
  ).toStrictEqual([Units.M3]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.M.iri,
      2
    )
  ).toStrictEqual([Units.M2]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.K.iri,
      -1
    )
  ).toStrictEqual([Units.PER__K]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.M.iri,
      1
    )
  ).toStrictEqual([Units.M]);
});

test("Qudt.derivedUnitsFromExponentUnitPairs(string, number)[using localnames]", () => {
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode.EXACT, "M", 3)
  ).toStrictEqual([Units.M3]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode.EXACT, "M", 2)
  ).toStrictEqual([Units.M2]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode.EXACT, "K", -1)
  ).toStrictEqual([Units.PER__K]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode.EXACT, "M", 1)
  ).toStrictEqual([Units.M]);
});

test("Qudt.derivedUnitsFromExponentUnitPairs(string, number)[using labels]", () => {
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      "Metre",
      3
    )
  ).toStrictEqual([Units.M3]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      "Meter",
      2
    )
  ).toStrictEqual([Units.M2]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      "KELVIN",
      -1
    )
  ).toStrictEqual([Units.PER__K]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      "METER",
      1
    )
  ).toStrictEqual([Units.M]);
});

describe.each([
  [[Units.KiloGM__PER__M3], Units.KiloGM, 1, Units.M, -3],
  [[Units.N__PER__M2, Units.PA], Units.N, 1, Units.M, -2],
  [[Units.J__PER__GM], Units.J, 1, Units.GM, -1],
  [[], Units.M, 1, Units.N, 1, Units.SEC, -2],
  [[Units.MOL__PER__M2__SEC], Units.MOL, 1, Units.M, -2, Units.SEC, -1],
  [
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
    [Units.N__PER__M2, Units.PA],
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
    [Units.BTU_IT__FT__PER__FT2__HR__DEG_F],
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
    [Units.J__PER__M2, Units.N__M__PER__M2, Units.PA__M],
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
    [Units.J__PER__M2, Units.N__M__PER__M2, Units.PA__M],
    Units.M,
    2,
    Units.KiloGM,
    1,
    Units.SEC,
    -2,
    Units.M,
    -2,
  ],
])(
  "Qudt.derivedUnitsFromExponentUnitPairs(Mode, (Unit | number)...)",
  (expected, ...spec) =>
    test(`Qudt.derivedUnitsFromExponentUnitPairs(EXACT, ${spec.map((s) =>
      typeof s === "number" ? s : s.toString()
    )}) = ${expected}`, () =>
      expect(
        Qudt.derivedUnitsFromExponentUnitPairs(
          DerivedUnitSearchMode.EXACT,
          ...(spec as (number | Unit)[])
        )
      ).toStrictEqual(expected))
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
  [new Decimal(1048576), Units.BYTE, Units.MegaBYTE, 1, 2],
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
    Units.BYTE.convert(new Decimal(1048576), Units.MegaBYTE).toNumber()
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

test("Unit.matches(FactorUnitSelection) (single factor unit)", () => {
  expect(
    Units.M.matches(FactorUnitSelection.fromFactorUnitSpec(Units.M, 1))
  ).toBe(true);
  expect(
    Units.PER__M.matches(FactorUnitSelection.fromFactorUnitSpec(Units.M, -1))
  ).toBe(true);
  expect(
    Units.PER__M.matches(
      FactorUnitSelection.fromFactorUnitSpec(Units.M, -1, Units.KiloGM, 1)
    )
  ).toBe(false);
  expect(
    Units.PER__M.matches(
      FactorUnitSelection.fromFactorUnitSpec(Units.KiloGM, -1)
    )
  ).toBe(false);
});

test("Unit.matches(FactorUnitSelection) (multiple levels of factor units)", () => {
  expect(
    Units.N__PER__KiloGM.matches(
      FactorUnitSelection.fromFactorUnitSpec(
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
      FactorUnitSelection.fromFactorUnitSpec(Units.N, 1, Units.KiloGM, -1)
    )
  ).toBe(true);
  expect(
    Units.N__PER__KiloGM.matches(
      FactorUnitSelection.fromFactorUnitSpec(
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
      FactorUnitSelection.fromFactorUnitSpec(
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
      FactorUnitSelection.fromFactorUnitSpec(Units.M, -2, Units.KiloGM, 2)
    )
  ).toBe(false);
  expect(
    Units.N__PER__KiloGM.matches(
      FactorUnitSelection.fromFactorUnitSpec(Units.M, -2)
    )
  ).toBe(false);
  expect(
    Units.N__PER__KiloGM.matches(
      FactorUnitSelection.fromFactorUnitSpec(Units.KiloGM, 1)
    )
  ).toBe(false);
  const wattFactors = FactorUnitSelection.fromFactorUnits(Units.W.factorUnits);
  expect(Units.TeraW.matches(wattFactors, FactorUnitMatchingMode.EXACT)).toBe(
    false
  );
  expect(Units.KiloW.matches(wattFactors, FactorUnitMatchingMode.EXACT)).toBe(
    false
  );
  expect(Units.MegaW.matches(wattFactors, FactorUnitMatchingMode.EXACT)).toBe(
    false
  );
  expect(Units.MilliW.matches(wattFactors, FactorUnitMatchingMode.EXACT)).toBe(
    false
  );
});

test("Unit.matches(FactorUnitMatchingMode, Unit...) (mode=ALLOW_SCALED)", () => {
  expect(
    Units.GM__PER__DeciM3.matches(
      FactorUnitSelection.fromFactorUnitSpec(Units.KiloGM, 1, Units.M, -3),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true);
  expect(
    Units.KiloGM__PER__M3.matches(
      FactorUnitSelection.fromFactorUnitSpec(Units.GM, 1, Units.DeciM, -3),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true);
});

test("Unit.matches(FactorUnitMatchingMode, Unit...) (mode=EXACT)", () => {
  expect(
    Units.GM__PER__DeciM3.matches(
      FactorUnitSelection.fromFactorUnitSpec(Units.KiloGM, 1, Units.M, -3),
      FactorUnitMatchingMode.EXACT
    )
  ).toBe(false);
  expect(
    Units.KiloGM__PER__M3.matches(
      FactorUnitSelection.fromFactorUnitSpec(Units.GM, 1, Units.M, -3),
      FactorUnitMatchingMode.EXACT
    )
  ).toBe(false);
});

test("Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode, (Unit| number )...) (mode=EXACT_ONLY_ONE)", () => {
  const units = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.EXACT_ONLY_ONE,
    Units.N,
    1,
    Units.M,
    1
  );
  expect(units).toStrictEqual([Units.J]);
});

test("Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode, (Unit| number )...) (mode=EXACT, multiple results)", () => {
  const units = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.EXACT,
    Units.N,
    1,
    Units.M,
    1
  );
  expect(units.length).toBe(2);
  expect(units.includes(Units.J)).toBe(true);
  expect(units.includes(Units.N__M)).toBe(true);
});

test("Qudt.derivedUnitsFromExponentUnitPairs(DerivedUnitSearchMode, (Unit| number )...) (mode=BEST_EFFORT_ONLY_ONE)", () => {
  let units = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.BEST_EFFORT_ONLY_ONE,
    "KiloGM",
    1,
    "M",
    -3
  );
  expect(units.length).toBe(1);
  expect(units.includes(Units.KiloGM__PER__M3)).toBe(true);
  units = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.BEST_EFFORT_ONLY_ONE,
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
    DerivedUnitSearchMode.ALLOW_SCALED,
    "KiloGM",
    1,
    "M",
    -3
  );
  expect(units.length).toBe(2);
  expect(units.includes(Units.KiloGM__PER__M3)).toBe(true);
  expect(units.includes(Units.GM__PER__DeciM3)).toBe(true);
});

test("Unit.matches((Unit|number)...) (deep factor units, duplicated exponent-unit combination)", () => {
  const du = Units.N__M__PER__KiloGM;
  expect(
    du.matches(
      FactorUnitSelection.fromFactorUnitSpec(
        Units.N,
        1,
        Units.KiloGM,
        -1,
        Units.M,
        1
      )
    )
  ).toBe(true);
  expect(
    du.matches(
      FactorUnitSelection.fromFactorUnitSpec(
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
      FactorUnitSelection.fromFactorUnitSpec(
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
      FactorUnitSelection.fromFactorUnitSpec(
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
      FactorUnitSelection.fromFactorUnitSpec(
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
    du.matches(
      FactorUnitSelection.fromFactorUnitSpec(Units.M, -2, Units.KiloGM, 2)
    )
  ).toBe(false);
  expect(du.matches(FactorUnitSelection.fromFactorUnitSpec(Units.M, -2))).toBe(
    false
  );
  expect(
    du.matches(FactorUnitSelection.fromFactorUnitSpec(Units.KiloGM, 1))
  ).toBe(false);
  expect(
    du.matches(
      FactorUnitSelection.fromFactorUnitSpec(Units.N, 1, Units.KiloGM, -1)
    )
  ).toBe(false);
});

test("Unit.matches((Unit|number)...) (deep factor units, duplicate exponent-unit combination, match with aggregated expression)", () => {
  const du = Units.N__M__PER__KiloGM;

  // now simplify: aggregate the M^1, M^1 to M^2: should still work.
  expect(
    du.matches(
      FactorUnitSelection.fromFactorUnitSpec(
        Units.KiloGM,
        1,
        Units.M,
        2,
        Units.SEC,
        -2,
        Units.KiloGM,
        -1
      )
    )
  ).toBe(true);
  // now simplify: wrongly aggregate the KiloGM^1, KiloGM^-1 to KiloGM^0: should not work
  expect(
    du.matches(
      FactorUnitSelection.fromFactorUnitSpec(
        Units.M,
        2,
        Units.SEC,
        -2,
        Units.KiloGM,
        0
      )
    )
  ).toBe(false);
});

test("Unit.matches(FactorUnitSelection, FactorUnitMatchingMode) (scaled factors)", () => {
  expect(
    Units.KiloN__M.matches(
      FactorUnitSelection.fromFactorUnitSpec(
        Units.SEC,
        -2,
        Units.KiloGM,
        1,
        Units.M,
        1,
        Units.KiloM,
        1
      ),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true);
  let factors = [Units.KiloGM, 1, Units.SEC, -2, Units.M, 1, Units.KiloM, 1];
  expect(
    Units.KiloN__M.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true);
  expect(
    Units.KiloJ.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true);
  expect(
    Units.MilliOHM.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(false);
  expect(
    Units.MilliS.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(false);

  factors = [Units.KiloGM, 1, Units.K, -1, Units.SEC, -3];
  expect(
    Units.W__PER__K.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(false);
  expect(
    Units.V__PER__K.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(false);
});

test("Unit.matches(FactorUnitSelection, FactorUnitMatchingMode) (scaled factors, negative first)", () => {
  let factors = [Units.SEC, -2, Units.KiloGM, 1, Units.M, 1, Units.KiloM, 1];
  expect(
    Units.KiloN__M.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true);
  factors = [Units.KiloGM, 1, Units.SEC, -2, Units.M, 1, Units.KiloM, 1];
  expect(
    Units.KiloN__M.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true);
});

test("Unit.matches(FactorUnitSelection, FactorUnitMatchingMode) (square in nominator)", () => {
  let factors = [Units.MilliM, 2, Units.SEC, -1];
  expect(
    Units.MilliM2__PER__SEC.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true);
  factors = [Units.KiloGM, 2, Units.SEC, -2];
  expect(
    Units.KiloGM2__PER__SEC2.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true);
});
test("Unit.matches(FactorUnitSelection, FactorUnitMatchingMode) (square in denominator)", () => {
  let factors = [Units.KiloGM, 1, Units.M, 1, Units.M, -2, Units.SEC, -2];
  expect(
    Units.N__PER__M2.matches(FactorUnitSelection.fromFactorUnitSpec(...factors))
  ).toBe(true);
  factors = [Units.M, -2, Units.SEC, -2, Units.KiloGM, 1, Units.M, 1];
  expect(
    Units.N__PER__M2.matches(FactorUnitSelection.fromFactorUnitSpec(...factors))
  ).toBe(true);
});

test("Unit.matches(FactorUnitSelection, FactorUnitMatchingMode) (square in denominator [2])", () => {
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
    Units.N__PER__M2.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true);
  expect(
    Units.N__PER__M2.matches(FactorUnitSelection.fromFactorUnitSpec(...factors))
  ).toBe(false);
});

test("Unit.matches(FactorUnitSelection, FactorUnitMatchingMode) (square in denominator [3])", () => {
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
    Units.N__PER__M2.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true);
  expect(
    Units.N__PER__M2.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.EXACT
    )
  ).toBe(false);
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
  "Unit.matches(FactorUnitSelection, FactorUnitMatchingMode) (scaled factors, changing order)",
  (...factorUnits) => {
    const factors = factorUnits.flatMap((fu) => [fu.unit, fu.exponent]);
    test(`Units.KiloN__M should match([${factorUnits.map((f) =>
      f.toString()
    )}] under matching mode ALLOW_SCALED `, () =>
      expect(
        Units.KiloN__M.matches(
          FactorUnitSelection.fromFactorUnitSpec(...factors),
          FactorUnitMatchingMode.ALLOW_SCALED
        )
      ).toBe(true));
    test(`Units.KiloN__M should match([${factorUnits.map((f) =>
      f.toString()
    )}] under matching mode EXACT`, () =>
      expect(
        Units.KiloN__M.matches(
          FactorUnitSelection.fromFactorUnitSpec(...factors)
        )
      ).toBe(true));
  }
);

test("Unit.matches(FactorUnitSelection, FactorUnitMatchingMode) (scaled factors, various matches for one spec)", () => {
  let factors = [Units.KiloGM, 1, Units.SEC, -2, Units.M, 1, Units.KiloM, 1];
  expect(
    Units.KiloN__M.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true),
    expect(
      Units.KiloJ.matches(
        FactorUnitSelection.fromFactorUnitSpec(...factors),
        FactorUnitMatchingMode.ALLOW_SCALED
      )
    ).toBe(true);

  expect(
    Units.MilliOHM.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(false);
  expect(
    Units.MilliS.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(false);
  factors = [Units.KiloGM, 1, Units.K, -1, Units.SEC, -3];
  expect(
    Units.W__PER__K.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(false);
  expect(
    Units.V__PER__K.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(false);
});

test("Unit.matches(FactorUnitSelection, FactorUnitMatchingMode) (MilliJ)", () => {
  const factors = [Units.KiloGM, 1, Units.SEC, -2, Units.M, 1, Units.MilliM, 1];
  expect(
    Units.MilliN__M.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true);
  expect(
    Units.MilliH__PER__KiloOHM.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(false);
  expect(
    Units.MilliJ.matches(
      FactorUnitSelection.fromFactorUnitSpec(...factors),
      FactorUnitMatchingMode.ALLOW_SCALED
    )
  ).toBe(true);
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
      DerivedUnitSearchMode.EXACT,
      ...simplified
    ).includes(Units.N__PER__M2)
  ).toBe(true);
  expect(
    Qudt.derivedUnitsFromFactorUnits(
      DerivedUnitSearchMode.EXACT,
      ...simplified
    ).includes(Units.PA)
  ).toBe(true);
  simplified = Qudt.simplifyFactorUnits(
    Units.F.getLeafFactorUnitsWithCumulativeExponents()
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
  expect(base.factor).toStrictEqual(new Decimal("1000"));
  base = Qudt.scaleToBaseUnit(Units.M);
  expect(base.unit).toBe(Units.M);
  expect(base.factor).toStrictEqual(new Decimal("1"));
});
