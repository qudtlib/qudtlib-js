import { Decimal } from "decimal.js";
import {
  Qudt,
  Units,
  QuantityKinds,
  Prefixes,
  QUDT_UNIT_BASE_IRI,
  QUDT_QUANTITYKIND_BASE_IRI,
  QUDT_PREFIX_BASE_IRI,
  Prefix,
  Unit,
  QuantityKind,
} from "../src/units";

test("unit()", () => {
  expect(Qudt.unit(QUDT_UNIT_BASE_IRI + "M")).toBe(Units.M);
});

test("unitFromLocalname()", () => {
  expect(Qudt.unitFromLocalname("M")).toBe(Units.M);
});

test("quantityKind()", () => {
  expect(Qudt.quantityKind(QUDT_QUANTITYKIND_BASE_IRI + "Length")).toBe(
    QuantityKinds.Length
  );
});

test("quantityKindFromLocalname()", () => {
  expect(Qudt.quantityKindFromLocalname("Length")).toBe(QuantityKinds.Length);
});

test("prefix()", () => {
  expect(Qudt.prefix(QUDT_PREFIX_BASE_IRI + "Kilo")).toBe(Prefixes.Kilo);
});

test("prefixFromLocalname()", () => {
  expect(Qudt.prefixFromLocalname("Kilo")).toBe(Prefixes.Kilo);
});

test("testPrefix", () => {
  const kilo: Prefix = Prefixes.Kilo;
  expect(kilo.multiplier).toStrictEqual(new Decimal(1000));
  expect(kilo.iri).toEqual(QUDT_PREFIX_BASE_IRI + "Kilo");
});

test("testUnit", () => {
  const meter: Unit = Units.M;
  expect(meter.iri).toEqual(QUDT_UNIT_BASE_IRI + "M");
  expect(meter.hasLabel("Meter")).toBe(true);
  expect(meter.hasLabel("Metre")).toBe(true);
  expect(meter.getLabelForLanguageTag("en")).toBe("Metre");
});

test("testQuantityKind", () => {
  const length: QuantityKind = QuantityKinds.Length;
  expect(length.hasLabel("Length")).toBe(true);
  expect(length.iri).toBe(QUDT_QUANTITYKIND_BASE_IRI + "Length");
});

test("testUnitFromLabel()", () => {
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

/*

    @Test
    public void testQuantityKindForUnit() {
        Unit unit = Qudt.unitFromLabel("Newton Meter");
        Set<QuantityKind> broad = Qudt.quantityKinds(unit);
        Assertions.assertTrue(broad.contains(Qudt.quantityKindFromLocalname("Torque")));
        Assertions.assertTrue(broad.contains(Qudt.quantityKindFromLocalname("MomentOfForce")));
        unit = Qudt.Units.PA__PER__BAR;
        broad = Qudt.quantityKindsBroad(unit);
        Assertions.assertTrue(broad.contains(Qudt.QuantityKinds.PressureRatio));
        Assertions.assertTrue(broad.contains(Qudt.QuantityKinds.DimensionlessRatio));
    }

    @Test
    public void testDerivedUnitFromMap() {
        Assertions.assertTrue(
                Qudt.derivedUnit(List.of(Map.entry(Qudt.Units.M, -3)))
                        .contains(Qudt.Units.PER__M3));
        Assertions.assertTrue(
                Qudt.derivedUnit(Qudt.Units.MilliA, 1, Qudt.Units.IN, -1)
                        .contains(Qudt.Units.MilliA__PER__IN));
        Assertions.assertTrue(
                Qudt.derivedUnit(Qudt.Units.MOL, 1, Qudt.Units.M, -2, Qudt.Units.SEC, -1)
                        .contains(Qudt.Units.MOL__PER__M2__SEC));
    }

    @Test
    public void testUnitFromLabel() {
        Assertions.assertEquals(Qudt.Units.N, Qudt.unitFromLabel("Newton"));
        Assertions.assertEquals(Qudt.Units.M, Qudt.unitFromLabel("Metre"));
        Assertions.assertEquals(Qudt.Units.M2, Qudt.unitFromLabel("SQUARE_METRE"));
        Assertions.assertEquals(Qudt.Units.M2, Qudt.unitFromLabel("SQUARE METRE"));
        Assertions.assertEquals(Qudt.Units.M3, Qudt.unitFromLabel("Cubic Metre"));
        Assertions.assertEquals(Qudt.Units.GM, Qudt.unitFromLabel("Gram"));
        Assertions.assertEquals(Qudt.Units.SEC, Qudt.unitFromLabel("second"));
        Assertions.assertEquals(Qudt.Units.HZ, Qudt.unitFromLabel("Hertz"));
        Assertions.assertEquals(Qudt.Units.DEG_C, Qudt.unitFromLabel("degree celsius"));
        Assertions.assertEquals(Qudt.Units.DEG_F, Qudt.unitFromLabel("degree fahrenheit"));
        Assertions.assertEquals(Qudt.Units.A, Qudt.unitFromLabel("ampere"));
        Assertions.assertEquals(Qudt.Units.V, Qudt.unitFromLabel("volt"));
        Assertions.assertEquals(Qudt.Units.W, Qudt.unitFromLabel("Watt"));
        Assertions.assertEquals(Qudt.Units.LUX, Qudt.unitFromLabel("Lux"));
        Assertions.assertEquals(Qudt.Units.LM, Qudt.unitFromLabel("Lumen"));
        Assertions.assertEquals(Qudt.Units.CD, Qudt.unitFromLabel("Candela"));
        Assertions.assertEquals(Qudt.Units.PA, Qudt.unitFromLabel("Pascal"));
        Assertions.assertEquals(Qudt.Units.RAD, Qudt.unitFromLabel("Radian"));
        Assertions.assertEquals(Qudt.Units.J, Qudt.unitFromLabel("Joule"));
        Assertions.assertEquals(Qudt.Units.K, Qudt.unitFromLabel("Kelvin"));
        Assertions.assertEquals(Qudt.Units.SR, Qudt.unitFromLabel("Steradian"));
    }

    @Test
    public void testUnitFromFactors() {
        Assertions.assertThrows(
                IllegalArgumentException.class, () -> Qudt.derivedUnitFromFactors(Qudt.Units.M));
        Set<Unit> units = Qudt.derivedUnitFromFactors(Qudt.Units.M, 3);
        Assertions.assertTrue(units.contains(Qudt.Units.M3));
        units = Qudt.derivedUnitFromFactors(Qudt.Units.KiloGM, 1, Qudt.Units.M, -3);
        Assertions.assertTrue(units.contains(Qudt.Units.KiloGM__PER__M3));
        units = Qudt.derivedUnit(Qudt.Units.MOL, 1, Qudt.Units.M, -2, Qudt.Units.SEC, -1);
        Assertions.assertTrue(units.contains(Qudt.Units.MOL__PER__M2__SEC));
        units =
                Qudt.derivedUnit(
                        Qudt.Units.K,
                        1,
                        Qudt.Units.M,
                        2,
                        Qudt.Units.KiloGM,
                        -1,
                        Qudt.Units.SEC,
                        -1);
        Assertions.assertTrue(units.contains(Qudt.Units.K__M2__PER__KiloGM__SEC));
        units =
                Qudt.derivedUnit(
                        Qudt.Units.BTU_IT,
                        1,
                        Qudt.Units.FT,
                        1,
                        Qudt.Units.FT,
                        -2,
                        Qudt.Units.HR,
                        -1,
                        Qudt.Units.DEG_F,
                        -1);
        Assertions.assertTrue(units.contains(Qudt.Units.BTU_IT__FT__PER__FT2__HR__DEG_F));
    }

    @Test
    public void testDerivedUnit1() {
        Set<Unit> units = Qudt.derivedUnit(Qudt.Units.M, 3);
        Assertions.assertTrue(units.contains(Qudt.Units.M3));
        units = Qudt.derivedUnit(Qudt.Units.M, 2);
        Assertions.assertTrue(units.contains(Qudt.Units.M2));
        units = Qudt.derivedUnit(Qudt.Units.K, -1);
        Assertions.assertTrue(units.contains(Qudt.Units.PER__K));
        units = Qudt.derivedUnit(Qudt.Units.M, -2);
        Assertions.assertTrue(units.contains(Qudt.Units.PER__M2));
    }

    @Test
    public void testDerivedUnitByIri1() {
        Set<Unit> units = Qudt.derivedUnit(Qudt.Units.M.getIri(), 3);
        Assertions.assertTrue(units.contains(Qudt.Units.M3));
        units = Qudt.derivedUnit(Qudt.Units.M.getIri(), 2);
        Assertions.assertTrue(units.contains(Qudt.Units.M2));
        units = Qudt.derivedUnit(Qudt.Units.K.getIri(), -1);
        Assertions.assertTrue(units.contains(Qudt.Units.PER__K));
        units = Qudt.derivedUnit(Qudt.Units.M.getIri(), -2);
        Assertions.assertTrue(units.contains(Qudt.Units.PER__M2));
    }

    @Test
    public void testDerivedUnit2() {
        Set<Unit> units = Qudt.derivedUnit(Qudt.Units.KiloGM, 1, Qudt.Units.M, -3);
        Assertions.assertTrue(units.contains(Qudt.Units.KiloGM__PER__M3));
        units = Qudt.derivedUnit(Qudt.scaledUnit("Kilo", "Gram"), 1, Qudt.Units.M, -3);
        Assertions.assertTrue(units.contains(Qudt.Units.KiloGM__PER__M3));
        units = Qudt.derivedUnit(Qudt.Units.N, 1, Qudt.Units.M, -2);
        Assertions.assertTrue(units.contains(Qudt.Units.N__PER__M2));
    }

    @Test
    public void testDerivedUnit3() {
        Set<Unit> units = Qudt.derivedUnit(Qudt.Units.MOL, 1, Qudt.Units.M, -2, Qudt.Units.SEC, -1);
        Assertions.assertTrue(units.contains(Qudt.Units.MOL__PER__M2__SEC));
    }

    @Test
    public void testDerivedUnit4() {
        Set<Unit> units =
                Qudt.derivedUnit(
                        Qudt.Units.K,
                        1,
                        Qudt.Units.M,
                        2,
                        Qudt.Units.KiloGM,
                        -1,
                        Qudt.Units.SEC,
                        -1);
        Assertions.assertTrue(units.contains(Qudt.Units.K__M2__PER__KiloGM__SEC));
        units =
                Qudt.derivedUnit(
                        Qudt.Units.M,
                        1,
                        Qudt.Units.KiloGM,
                        1,
                        Qudt.Units.SEC,
                        -2,
                        Qudt.Units.M,
                        -2);
        Assertions.assertTrue(units.contains(Qudt.Units.N__PER__M2));
    }

    @Test
    public void testDerivedUnit5() {
        Set<Unit> units =
                Qudt.derivedUnit(
                        Qudt.Units.BTU_IT,
                        1,
                        Qudt.Units.FT,
                        1,
                        Qudt.Units.FT,
                        -2,
                        Qudt.Units.HR,
                        -1,
                        Qudt.Units.DEG_F,
                        -1);
        Assertions.assertTrue(units.contains(Qudt.Units.BTU_IT__FT__PER__FT2__HR__DEG_F));
        units =
                Qudt.derivedUnit(
                        Qudt.Units.M,
                        1,
                        Qudt.Units.KiloGM,
                        1,
                        Qudt.Units.SEC,
                        -2,
                        Qudt.Units.M,
                        -2,
                        Qudt.Units.M,
                        1);
        Assertions.assertTrue(units.contains(Qudt.Units.N__M__PER__M2));
        units =
                Qudt.derivedUnit(
                        Qudt.Units.M,
                        2,
                        Qudt.Units.KiloGM,
                        1,
                        Qudt.Units.SEC,
                        -2,
                        Qudt.Units.M,
                        -2);
        Assertions.assertTrue(units.contains(Qudt.Units.N__M__PER__M2));
    }

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
