import { Decimal } from "decimal.js";
import {
  DerivedUnitSearchMode,
  FactorUnit,
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
  let myUnits: Unit[] = Qudt.derivedUnitsFromExponentUnitPairs(
    DerivedUnitSearchMode.EXACT,
    Units.KiloGM,
    1,
    Units.M,
    -3
  );
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
});
/**


    @Test
    public void testScaledUnit() {
        Unit unit = Qudt.scaledUnit("Nano", "Meter");
        Assertions.assertEquals(Qudt.Units.NanoM, unit);
        unit = Qudt.scaledUnit("Giga", "Hertz");
        Assertions.assertEquals(Qudt.Units.GigaHZ, unit);
        unit = Qudt.scaledUnit("Kilo", "Gram");
        Assertions.assertEquals(Qudt.Units.KiloGM, unit);
        unit = Qudt.scaledUnit(Qudt.Prefixes.Nano, Qudt.Units.M);
        Assertions.assertEquals(Qudt.Units.NanoM, unit);
    }

    @Test
    public void testGetUnitFactors() {
        Unit unit = Qudt.unitFromLabel("newton meter");
        List<FactorUnit> unitFactors = Qudt.factorUnits(unit);
        Assertions.assertTrue(unitFactors.contains(new FactorUnit(Qudt.unitFromLabel("meter"), 2)));
        Assertions.assertTrue(
                unitFactors.contains(new FactorUnit(Qudt.unitFromLabel("kilogram"), 1)));
        Assertions.assertTrue(
                unitFactors.contains(new FactorUnit(Qudt.unitFromLabel("second"), -2)));
        unit = Qudt.unitFromLabel("newton meter per square meter");
        unitFactors = Qudt.factorUnits(unit);
        Assertions.assertTrue(unitFactors.contains(new FactorUnit(Qudt.unitFromLabel("meter"), 2)));
        Assertions.assertTrue(
                unitFactors.contains(new FactorUnit(Qudt.unitFromLabel("meter"), -2)));
        Assertions.assertTrue(
                unitFactors.contains(new FactorUnit(Qudt.unitFromLabel("kilogram"), 1)));
        Assertions.assertTrue(
                unitFactors.contains(new FactorUnit(Qudt.unitFromLabel("second"), -2)));
        unit = Qudt.Units.KiloN__M;
        unitFactors = Qudt.factorUnits(unit);
        Assertions.assertTrue(unitFactors.contains(new FactorUnit(Qudt.Units.KiloN, 1)));
        Assertions.assertTrue(unitFactors.contains(new FactorUnit(Qudt.Units.M, 1)));
    }

    @Test
    public void testGetUnitFactorsUnscaled() {
        Unit unit = Qudt.Units.KiloN__M;
        List<FactorUnit> unitFactors = Qudt.factorUnits(unit);
        Assertions.assertTrue(unitFactors.contains(new FactorUnit(Qudt.Units.KiloN, 1)));
        Assertions.assertTrue(unitFactors.contains(new FactorUnit(Qudt.Units.M, 1)));
        unitFactors = Qudt.unscaleFactorUnits(unitFactors);
        Assertions.assertTrue(unitFactors.contains(new FactorUnit(Qudt.Units.N, 1)));
        Assertions.assertTrue(unitFactors.contains(new FactorUnit(Qudt.Units.M, 1)));
    }

    @Test
    public void testUnitless() {
        Assertions.assertEquals(
                new QuantityValue(new BigDecimal("1.1234"), Qudt.Units.UNITLESS),
                Qudt.convert(
                        new BigDecimal("1.1234"), Qudt.Units.KiloGM__PER__M3, Qudt.Units.UNITLESS));
        Assertions.assertEquals(
                new QuantityValue(new BigDecimal("1.1234"), Qudt.Units.KiloGM__PER__M3),
                Qudt.convert(
                        new BigDecimal("1.1234"), Qudt.Units.UNITLESS, Qudt.Units.KiloGM__PER__M3));
        Assertions.assertEquals(
                new QuantityValue(new BigDecimal("1.1234"), Qudt.Units.UNITLESS),
                Qudt.convert(new BigDecimal("1.1234"), Qudt.Units.UNITLESS, Qudt.Units.UNITLESS));
    }

    @Test
    public void testConvert_N_to_kN() {
        QuantityValue converted = Qudt.convert(BigDecimal.ONE, Qudt.Units.N, Qudt.Units.KiloN);
        MatcherAssert.assertThat(
                converted.getValue(), Matchers.comparesEqualTo(new BigDecimal("0.001")));
    }

    @Test
    public void testInconvertible() {
        assertThrows(
                InconvertibleQuantitiesException.class,
                () -> Qudt.convert(BigDecimal.ONE, Qudt.Units.SEC, Qudt.Units.M));
    }

    @Test
    public void testConvert_L_to_GAL_US() {
        QuantityValue converted = Qudt.convert(BigDecimal.ONE, Qudt.Units.L, Qudt.Units.GAL_US);
        MatcherAssert.assertThat(
                converted.getValue(),
                Matchers.comparesEqualTo(new BigDecimal("0.2641720372841846541406853467997671")));
    }

    @Test
    public void testConvert_Celsius_to_Fahrenheit() {
        QuantityValue celsius100 =
                new QuantityValue(new BigDecimal("100"), Qudt.unitFromLocalname("DEG_C"));
        QuantityValue fahrenheit = Qudt.convert(celsius100, Qudt.unitIriFromLocalname("DEG_F"));
        Assertions.assertNotNull(fahrenheit);
        MatcherAssert.assertThat(
                fahrenheit.getValue(),
                Matchers.comparesEqualTo(new BigDecimal("212.0003929999999462664000000000043")));
        Assertions.assertEquals(Qudt.unitIriFromLocalname("DEG_F"), fahrenheit.getUnit().getIri());
    }

    @Test
    public void testConvert_Celsius_to_Fahrenheit_2() {
        MatcherAssert.assertThat(
                Qudt.convert(new BigDecimal("100"), Units.DEG_C, Units.DEG_F).getValue(),
                Matchers.comparesEqualTo(new BigDecimal("212.0003929999999462664000000000043")));
    }

    @Test
    public void testConvert_Fahrenheit_to_Celsius() {
        MatcherAssert.assertThat(
                Qudt.convert(new BigDecimal("100"), Units.DEG_F, Units.DEG_C).getValue(),
                Matchers.comparesEqualTo(new BigDecimal("37.7775594444444693186492")));
    }

    @Test
    public void testConvert_byte_to_megabyte() {
        MatcherAssert.assertThat(
                Qudt.convert(new BigDecimal("1048576"), Units.BYTE, Units.MegaBYTE).getValue(),
                Matchers.comparesEqualTo(new BigDecimal("1.000000000000000000000000000000003")));
    }

    @Test
    public void testConvert_megabyte_to_byte() {
        MatcherAssert.assertThat(
                Qudt.convert(new BigDecimal("1"), Units.MegaBYTE, Units.BYTE).getValue(),
                Matchers.comparesEqualTo(new BigDecimal("1048575.999999999999999999999999997")));
    }

    @Test
    public void testGetConversionMultiplier() {
        MatcherAssert.assertThat(
                Units.CentiM.getConversionMultiplier(Units.MilliM),
                Matchers.comparesEqualTo(new BigDecimal("10")));
        MatcherAssert.assertThat(
                Units.MilliM.getConversionMultiplier(Units.KiloM),
                Matchers.comparesEqualTo(new BigDecimal("0.000001")));
        assertThrows(
                IllegalArgumentException.class,
                () -> Qudt.Units.DEG_F.getConversionMultiplier(Qudt.Units.DEG_C));
    }

    @Test
    public void testConvert_FemtoGM_to_KiloGM() {
        QuantityValue converted =
                Qudt.convert(BigDecimal.ONE, Qudt.Units.FemtoGM, Qudt.Units.KiloGM);
        MatcherAssert.assertThat(
                converted.getValue(),
                Matchers.comparesEqualTo(new BigDecimal("0.000000000000000001")));
    }

    @Test
    public void testConvert_Metric_to_Imperial() {
        QuantityValue converted = Qudt.convert(BigDecimal.ONE, Qudt.Units.LB, Qudt.Units.KiloGM);
        MatcherAssert.assertThat(
                converted.getValue(), Matchers.comparesEqualTo(new BigDecimal("0.45359237")));
        converted = Qudt.convert(BigDecimal.ONE, Qudt.Units.BTU_IT__PER__LB, Qudt.Units.J__PER__GM);
        MatcherAssert.assertThat(
                converted.getValue(), Matchers.comparesEqualTo(new BigDecimal("2.326")));
    }


 */
