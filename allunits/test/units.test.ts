import { Decimal } from "decimal.js";
import {
  DerivedUnitSearchMode,
  FactorUnit,
  FactorUnitSelection,
  Prefix,
  Prefixes,
  QuantityKind,
  QuantityKinds,
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

test("Qudt.unitFromLabel(string)", () => {
  expect(Qudt.unitFromLabel("Newton")).toBe(Units.N);
  expect(Qudt.unitFromLabel("Metre")).toBe(Units.M);
  expect(Qudt.unitFromLabel("SQUARE_METRE")).toBe(Units.M2);
  expect(Qudt.unitFromLabel("SQUARE METRE")).toBe(Units.M2);
  expect(Qudt.unitFromLabel("Cubic Metre")).toBe(Units.M3);
  expect(Qudt.unitFromLabel("Gram")).toBe(Units.GM);
  expect(Qudt.unitFromLabel("second")).toBe(Units.SEC);
  expect(Qudt.unitFromLabel("Hertz")).toBe(Units.HZ);
  expect(Qudt.unitFromLabel("degree celsius")).toBe(Units.DEG_C);
  expect(Qudt.unitFromLabel("degree fahrenheit")).toBe(Units.DEG_F);
  expect(Qudt.unitFromLabel("ampere")).toBe(Units.A);
  expect(Qudt.unitFromLabel("volt")).toBe(Units.V);
  expect(Qudt.unitFromLabel("Watt")).toBe(Units.W);
  expect(Qudt.unitFromLabel("Lux")).toBe(Units.LUX);
  expect(Qudt.unitFromLabel("Lumen")).toBe(Units.LM);
  expect(Qudt.unitFromLabel("Candela")).toBe(Units.CD);
  expect(Qudt.unitFromLabel("Pascal")).toBe(Units.PA);
  expect(Qudt.unitFromLabel("Radian")).toBe(Units.RAD);
  expect(Qudt.unitFromLabel("Joule")).toBe(Units.J);
  expect(Qudt.unitFromLabel("Kelvin")).toBe(Units.K);
  expect(Qudt.unitFromLabel("Steradian")).toBe(Units.SR);
});

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

test("Qudt.derivedUnitsFromExponentUnitPairs(Mode, Unit, number, Unit, number)", () => {
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.KiloGM,
      1,
      Units.M,
      -3
    )
  ).toStrictEqual([Units.KiloGM__PER__M3]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.N,
      1,
      Units.M,
      -2
    )
  ).toStrictEqual([Units.N__PER__M2, Units.PA]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.J,
      1,
      Units.GM,
      -1
    )
  ).toStrictEqual([Units.J__PER__GM]);
});

test("Qudt.derivedUnitsFromExponentUnitPairs(Mode, Unit, number, Unit, number, Unit, number)", () => {
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.M,
      1,
      Units.N,
      1,
      Units.SEC,
      -2
    )
  ).toStrictEqual([]);
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
});

test("Qudt.derivedUnitsFromExponentUnitPairs(Mode, Unit, number, Unit, number, Unit, number, Unit, number)", () => {
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
      Units.M,
      1,
      Units.KiloGM,
      1,
      Units.SEC,
      -2,
      Units.M,
      -2
    )
  ).toStrictEqual([Units.N__PER__M2, Units.PA]);
});

test("Qudt.derivedUnitsFromExponentUnitPairs(Mode, Unit, number, Unit, number, Unit, number, Unit, number, Unit, number)", () => {
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
  const units = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.EXACT,
    Units.M,
    1,
    Units.KiloGM,
    1,
    Units.SEC,
    -2,
    Units.M,
    -2,
    Units.M,
    1
  );
  expect(units).toStrictEqual([
    Units.J__PER__M2,
    Units.N__M__PER__M2,
    Units.PA__M,
  ]);
  expect(
    Qudt.derivedUnitsFromExponentUnitPairs(
      DerivedUnitSearchMode.EXACT,
      Units.M,
      2,
      Units.KiloGM,
      1,
      Units.SEC,
      -2,
      Units.M,
      -2
    )
  ).toStrictEqual([Units.J__PER__M2, Units.N__M__PER__M2, Units.PA__M]);
});

test("Qudt.scaledUnitFromLabels(String, String)", () => {
  expect(Qudt.scaledUnitFromLabels("Nano", "Meter")).toStrictEqual(Units.NanoM);
  expect(Qudt.scaledUnitFromLabels("Giga", "Hertz")).toStrictEqual(
    Units.GigaHZ
  );
  expect(Qudt.scaledUnitFromLabels("NANO", "METER")).toStrictEqual(Units.NanoM);
  expect(Qudt.scaledUnitFromLabels("kilo", "GRAM")).toStrictEqual(Units.KiloGM);
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
test("Qudt.unscaledUnit(Unit)", () => {
  expect(Qudt.unscaledUnit(Units.YoctoC)).toBe(Units.C);
  expect(Qudt.unscaledUnit(Units.TeraBYTE)).toBe(Units.BYTE);
  expect(Qudt.unscaledUnit(Units.KiloGM)).toBe(Units.GM);
  expect(Qudt.unscaledUnit(Units.MilliGM)).toBe(Units.GM);
  expect(Qudt.unscaledUnit(Units.MegaGM)).toBe(Units.GM);
  expect(Qudt.unscaledUnit(Units.TON_Metric)).toBe(Units.GM);
  expect(Qudt.unscaledUnit(Units.TONNE)).toBe(Units.GM);
  expect(Qudt.unscaledUnit(Units.KiloM)).toBe(Units.M);
  expect(Qudt.unscaledUnit(Units.KiloN)).toBe(Units.N);
});
test("Qudt.unscaledFactorUnits(FactorUnit[])", () => {
  const units = Qudt.unscaledFactorUnits(Qudt.factorUnits(Units.KiloN__M));
  expect(units).toStrictEqual([
    new FactorUnit(Units.N, 1),
    new FactorUnit(Units.M, 1),
  ]);
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
});
/**
  TODO: port these unit tests from qudtlib-java
 @Test
 public void testMatchingModeAllowScaled() {
        assertTrue(
                Qudt.Units.GM__PER__DeciM3.matches(
                        FactorUnitSelection.fromFactorUnitSpec(
                                Qudt.Units.KiloGM, 1, Qudt.Units.M, -3),
                        FactorUnitMatchingMode.ALLOW_SCALED));
        assertFalse(
                Qudt.Units.KiloGM__PER__M3.matches(
                        FactorUnitSelection.fromFactorUnitSpec(Qudt.Units.GM, 1, Qudt.Units.M, -3),
                        FactorUnitMatchingMode.ALLOW_SCALED));
    }

 @Test
 public void testMatchingModeExact() {
        assertFalse(Qudt.Units.GM__PER__DeciM3.matches(Qudt.Units.KiloGM, 1, Qudt.Units.M, -3));
        assertFalse(Qudt.Units.KiloGM__PER__M3.matches(Qudt.Units.GM, 1, Qudt.Units.M, -3));
    }

 @Test
 public void testSearchModeExactOnlyOne() {
        Set<Unit> units =
                Qudt.derivedUnitsFromUnitExponentPairs(
                        DerivedUnitSearchMode.EXACT_ONLY_ONE, Qudt.Units.N, 1, Qudt.Units.M, 1);
        assertEquals(1, units.size());
        assertTrue(units.contains(Qudt.Units.J));
    }

 @Test
 public void testSearchModeExact_2Results() {
        Set<Unit> units =
                Qudt.derivedUnitsFromUnitExponentPairs(
                        DerivedUnitSearchMode.EXACT, Qudt.Units.N, 1, Qudt.Units.M, 1);
        assertEquals(2, units.size());
        assertTrue(units.contains(Qudt.Units.J));
        assertTrue(units.contains(Qudt.Units.N__M));
    }

 @Test
 public void testSearchModeBestEffortOnlyOne() {
        Set<Unit> units =
                Qudt.derivedUnitsFromUnitExponentPairs(
                        DerivedUnitSearchMode.BEST_EFFORT_ONLY_ONE, "KiloGM", 1, "M", -3);
        assertEquals(1, units.size());
        assertTrue(units.contains(Qudt.Units.KiloGM__PER__M3));
        units =
                Qudt.derivedUnitsFromUnitExponentPairs(
                        DerivedUnitSearchMode.BEST_EFFORT_ONLY_ONE, "KiloN", 1, "MilliM", 1);
        assertEquals(1, units.size());
        assertTrue(units.contains(Qudt.Units.J));
    }

 @Test
 public void testSearchModeAllowScaled() {
        Set<Unit> units =
                Qudt.derivedUnitsFromUnitExponentPairs(
                        DerivedUnitSearchMode.ALLOW_SCALED, "KiloGM", 1, "M", -3);
        assertEquals(2, units.size());
        assertTrue(units.contains(Qudt.Units.KiloGM__PER__M3));
        assertTrue(units.contains(Qudt.Units.GM__PER__DeciM3));
    }

 @Test
 public void testDeepFactorUnitWithDuplicateUnitExponentCombination() {
        Unit du = Qudt.Units.N__M__PER__KiloGM;
        boolean matches = du.matches(Qudt.Units.N, 1, Qudt.Units.KiloGM, -1, Qudt.Units.M, 1);
        assertTrue(matches);
        assertFalse(
                du.matches(
                        Qudt.Units.KiloGM,
                        -1,
                        Qudt.Units.M,
                        1,
                        Qudt.Units.KiloGM,
                        1,
                        Qudt.Units.SEC,
                        -2,
                        Qudt.Units.M,
                        1,
                        Qudt.Units.N,
                        1));
        assertFalse(
                du.matches(
                        Qudt.Units.KiloGM,
                        -1,
                        Qudt.Units.M,
                        1,
                        Qudt.Units.KiloGM,
                        1,
                        Qudt.Units.SEC,
                        -2,
                        Qudt.Units.N,
                        1));
        assertFalse(
                du.matches(
                        Qudt.Units.KiloGM,
                        -1,
                        Qudt.Units.M,
                        1,
                        Qudt.Units.KiloGM,
                        1,
                        Qudt.Units.SEC,
                        -2,
                        Qudt.Units.N,
                        1,
                        Qudt.Units.KiloGM,
                        -1));
        assertTrue(
                du.matches(
                        Qudt.Units.KiloGM, 1,
                        Qudt.Units.M, 1,
                        Qudt.Units.SEC, -2,
                        Qudt.Units.M, 1,
                        Qudt.Units.KiloGM, -1));
        assertFalse(du.matches(Qudt.Units.M, -2, Qudt.Units.KiloGM, 2));
        assertFalse(du.matches(Qudt.Units.M, -2));
        assertFalse(du.matches(Qudt.Units.KiloGM, 1));
        assertFalse(du.matches(Qudt.Units.N, 1, Qudt.Units.KiloGM, -1));
    }

 @Test
 public void
 testDeepFactorUnitWithDuplicateUnitExponentCombination_matchWithAggregatedExpression() {
        Unit du = Qudt.Units.N__M__PER__KiloGM;

        // now simplify: aggregate the M^1, M^1 to M^2: should still work.
        assertTrue(
                du.matches(
                        Qudt.Units.KiloGM, 1,
                        Qudt.Units.M, 2,
                        Qudt.Units.SEC, -2,
                        Qudt.Units.KiloGM, -1));
        // now simplify: wrongly aggregate the KiloGM^1, KiloGM^-1 to KiloGM^0: should not work
        assertFalse(
                du.matches(
                        Qudt.Units.M, 2,
                        Qudt.Units.SEC, -2,
                        Qudt.Units.KiloGM, 0));
    }

 @Test
 public void testScaledFactors() {

        // mJoule =
        //               new IfcDerivedUnit(100, IfcUnitType.ENERGYUNIT, Map.of(kg, 1, sec, -2, km,
        // 2), false);
        Object[] factors =
                new Object[] {
                    Qudt.Units.SEC, -2, Qudt.Units.KiloGM, 1, Qudt.Units.M, 1, Qudt.Units.KiloM, 1
                };
        assertTrue(
                Qudt.Units.KiloN__M.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
        factors =
                new Object[] {
                    Qudt.Units.KiloGM, 1, Qudt.Units.SEC, -2, Qudt.Units.M, 1, Qudt.Units.KiloM, 1
                };
        assertTrue(
                Qudt.Units.KiloN__M.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
        assertTrue(
                Qudt.Units.KiloJ.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
        assertFalse(
                Qudt.Units.MilliOHM.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
        assertFalse(
                Qudt.Units.MilliS.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));

        factors = new Object[] {Qudt.Units.KiloGM, 1, Qudt.Units.K, -1, Qudt.Units.SEC, -3};
        assertFalse(
                Qudt.Units.W__PER__K.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
        assertFalse(
                Qudt.Units.V__PER__K.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
    }

 @Test
 public void testScaledFactors_negExpFirst() {
        // mJoule =
        //               new IfcDerivedUnit(100, IfcUnitType.ENERGYUNIT, Map.of(kg, 1, sec, -2, km,
        // 2), false);
        Object[] factors =
                new Object[] {
                    Qudt.Units.SEC, -2, Qudt.Units.KiloGM, 1, Qudt.Units.M, 1, Qudt.Units.KiloM, 1
                };
        assertTrue(
                Qudt.Units.KiloN__M.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
        factors =
                new Object[] {
                    Qudt.Units.KiloGM, 1, Qudt.Units.SEC, -2, Qudt.Units.M, 1, Qudt.Units.KiloM, 1
                };
        assertTrue(
                Qudt.Units.KiloN__M.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
    }

 @Test
 public void test_squareInNominator() {
        Object[] factors = new Object[] {Qudt.Units.MilliM, 2, Qudt.Units.SEC, -1};
        assertTrue(
                Qudt.Units.MilliM2__PER__SEC.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
        factors = new Object[] {Qudt.Units.KiloGM, 2, Qudt.Units.SEC, -2};
        assertTrue(
                Qudt.Units.KiloGM2__PER__SEC2.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
    }

 @Test
 public void test_squareInDenominator() {
        Object[] factors =
                new Object[] {
                    Qudt.Units.KiloGM, 1, Qudt.Units.M, 1, Qudt.Units.M, -2, Qudt.Units.SEC, -2
                };
        assertTrue(Qudt.Units.N__PER__M2.matches(factors));
        factors =
                new Object[] {
                    Qudt.Units.M, -2, Qudt.Units.SEC, -2, Qudt.Units.KiloGM, 1, Qudt.Units.M, 1
                };
        assertTrue(Qudt.Units.N__PER__M2.matches(factors));
    }

 @Test
 public void testScale_squareInDenominator1() {
        Object[] factors =
                new Object[] {
                    Qudt.Units.KiloGM,
                    1,
                    Qudt.Units.M,
                    1,
                    Qudt.Units.MilliM,
                    -2,
                    Qudt.Units.KiloSEC,
                    -2
                };
        assertTrue(
                Qudt.Units.N__PER__M2.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
        assertFalse(Qudt.Units.N__PER__M2.matches(FactorUnitSelection.fromFactorUnitSpec(factors)));
    }

 @Test
 public void testScale_squareInDenominator2() {
        Object[] factors =
                new Object[] {
                    Qudt.Units.GM,
                    1,
                    Qudt.Units.MilliM,
                    1,
                    Qudt.Units.M,
                    -2,
                    Qudt.Units.MilliSEC,
                    -2
                };
        assertTrue(
                Qudt.Units.N__PER__M2.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
        assertFalse(
                Qudt.Units.N__PER__M2.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.EXACT));
    }

 @Test
 public void testScaledFactorsWithChangingOrder() {
        // mJoule =
        //               new IfcDerivedUnit(100, IfcUnitType.ENERGYUNIT, Map.of(kg, 1, sec, -2, km,
        // 2), false);
        Object[] factors =
                new Object[] {
                    Qudt.Units.KiloGM, 1, Qudt.Units.SEC, -2, Qudt.Units.M, 1, Qudt.Units.KiloM, 1
                };
        List<List<FactorUnit>> successfulFor = new ArrayList<>();
        List<FactorUnit> factorUnits = new ArrayList<>();
        for (int i = 0; i < factors.length; i += 2) {
            factorUnits.add(new FactorUnit((Unit) factors[i], (Integer) factors[i + 1]));
        }

        try {
            for (int i = 0; i < 20; i++) {
                Collections.shuffle(factorUnits);
                factors =
                        factorUnits.stream()
                                .flatMap(fu -> Stream.of(fu.getUnit(), fu.getExponent()))
                                .toArray();
                assertTrue(
                        Qudt.Units.KiloN__M.matches(
                                FactorUnitSelection.fromFactorUnitSpec(factors),
                                FactorUnitMatchingMode.ALLOW_SCALED),
                        () -> "failed for " + factorUnits);
                assertFalse(
                        Qudt.Units.KiloN__M.matches(
                                FactorUnitSelection.fromFactorUnitSpec(factors)),
                        () -> "failed for " + factorUnits);
                successfulFor.add(new ArrayList<>(factorUnits));
            }
        } catch (AssertionFailedError e) {
            System.err.println("test succeeded for: ");
            successfulFor.forEach(System.err::println);
            System.err.println("test failed for:");
            System.err.println(factorUnits);
            throw e;
        }
        assertTrue(
                Qudt.Units.KiloN__M.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED),
                () -> "failed for " + factorUnits);
        assertTrue(
                Qudt.Units.KiloJ.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED),
                () -> "failed for " + factorUnits);
        assertFalse(
                Qudt.Units.MilliOHM.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED),
                () -> "failed for " + factorUnits);
        assertFalse(
                Qudt.Units.MilliS.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED),
                () -> "failed for " + factorUnits);
        factors = new Object[] {Qudt.Units.KiloGM, 1, Qudt.Units.K, -1, Qudt.Units.SEC, -3};
        assertFalse(
                Qudt.Units.W__PER__K.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
        assertFalse(
                Qudt.Units.V__PER__K.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
    }

 @Test
 public void testMilliJ() {
        Object[] factors =
                new Object[] {
                    Qudt.Units.KiloGM, 1, Qudt.Units.SEC, -2, Qudt.Units.M, 1, Qudt.Units.MilliM, 1
                };
        assertTrue(
                Qudt.Units.MilliN__M.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
        assertFalse(
                Qudt.Units.MilliH__PER__KiloOHM.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
        assertTrue(
                Qudt.Units.MilliJ.matches(
                        FactorUnitSelection.fromFactorUnitSpec(factors),
                        FactorUnitMatchingMode.ALLOW_SCALED));
    }

 @Test
 public void testSimplifyFactorUnits() {
        List<FactorUnit> simplified =
                Qudt.simplifyFactorUnits(
                        List.of(
                                new FactorUnit(Qudt.Units.N, 1),
                                new FactorUnit(Qudt.Units.M, -1),
                                new FactorUnit(Qudt.Units.M, -1)));
        assertEquals(2, simplified.size());
        assertTrue(
                Qudt.derivedUnitsFromFactorUnits(DerivedUnitSearchMode.EXACT, simplified)
                        .contains(Qudt.Units.N__PER__M2));
        assertTrue(
                Qudt.derivedUnitsFromFactorUnits(DerivedUnitSearchMode.EXACT, simplified)
                        .contains(Qudt.Units.PA));
    }

 @Test
 public void testScaleToBaseUnit() {
        Map.Entry<Unit, BigDecimal> base = Qudt.scaleToBaseUnit(Qudt.Units.KiloM);
        assertEquals(Qudt.Units.M, base.getKey());
        MatcherAssert.assertThat(base.getValue(), Matchers.comparesEqualTo(new BigDecimal("1000")));
        base = Qudt.scaleToBaseUnit(Qudt.Units.M);
        MatcherAssert.assertThat(base.getValue(), Matchers.comparesEqualTo(BigDecimal.ONE));
        assertEquals(Qudt.Units.M, base.getKey());
    }

 */
