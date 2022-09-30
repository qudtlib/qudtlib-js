import {
    ScaleFactor,
    LangString,
    Prefix,
    QuantityValue,
    Unit,
    QuantityKind,
    FactorUnit,
    FactorUnitSelector, FactorUnitSelection, FactorUnitMatch
} from "../src/qudtlib";
import {Decimal} from "decimal.js";

// LangString tests

test('new LangString', () => {
    const x = new LangString("tree", "en");
    expect(x.text).toBe("tree");
    expect(x.languageTag).toBe("en");
});

test('new LangString, no lang', () => {
    const x = new LangString("tree");
    expect(x.text).toBe("tree");
    expect(x.languageTag).toBe(undefined);
});


test('LangString.toString', () => {
    const x = new LangString("tree", "en");
    expect(x.toString()).toBe("tree@en");
});

test('LangString.toString, no lang', () => {
    const x = new LangString("tree");
    expect(x.toString()).toBe("tree");
});

test('LangString.equals', () => {
    const a = new LangString("tree");
    expect(a.equals(a)).toBe(true);
    const b = new LangString("tree");
    expect(a.equals(b)).toBe(true);
    expect(b.equals(a)).toBe(true);
    const c = new LangString("tree", "en");
    expect(a.equals(c)).toBe(false);
    expect(c.equals(a)).toBe(false);
    const d = new LangString("tree", "en");
    expect(c.equals(d)).toBe(true);
    expect(d.equals(c)).toBe(true);
    const e = new LangString("water");
    expect(e.equals(d)).toBe(false);
    expect(d.equals(e)).toBe(false);
    expect(e.equals(a)).toBe(false);
    expect(a.equals(e)).toBe(false);
});


// ScaleFactor tests
test('ScaleFactor.toString()', () => {
    const sf = new ScaleFactor(new Decimal("1.5"));
    expect(sf.toString()).toBe("SF{1.5}")
});

test('ScaleFactor.copy()', () => {
    const sf = new ScaleFactor(new Decimal("1.5"));
    const cpy = sf.copy();
    expect(sf).toEqual(cpy);
    expect(sf.factor).toBe(cpy.factor);
});

test('ScaleFactor.multiplyBy()', () => {
    const sf = new ScaleFactor(new Decimal("1.5"));
    const mult = sf.multiplyBy(new Decimal("10"));
    expect(mult.factor.equals(new Decimal("15"))).toBe(true);
    expect(mult === sf).toBe(false);
});

// Prefix tests

test('new Prefix', () => {
    const a = new Prefix("http://qudt.org/vocab/prefix/Kilo", new Decimal("1.0E+3"), "k", "k", [new LangString("kilo")]);
    expect(a.symbol).toBe("k");
    expect(a.multiplier.equals(new Decimal("1000"))).toBeTruthy();
    expect(a.ucumCode).toBe("k");
    expect(a.symbol).toBe("k");
    const tags = [new LangString("kilo")];
    expect(a.labels.every((a, i) => a.equals(tags[i]))).toBeTruthy();
});

test('new Prefix, no ucumcode', () => {
    const a = new Prefix("http://qudt.org/vocab/prefix/Kilo", new Decimal("1000"), "k", undefined, [new LangString("Kilo")]);
    expect(a.symbol).toBe("k");
});

test('new Prefix, no ucumcode, no labels', () => {
    const a = new Prefix("http://qudt.org/vocab/prefix/Kilo", new Decimal("1.0E+3"), "k", "k", undefined);
    expect(a.symbol).toBe("k");
});

test('Prefix.toString', () => {
    const a = new Prefix("http://qudt.org/vocab/prefix/Kilo", new Decimal("1000"), "k", undefined, [new LangString("Kilo")]);
    expect(a.toString()).toBe("k");
});

test('Prefix.addLabel', () => {
    const p = new Prefix("http://qudt.org/vocab/prefix/Kilo", new Decimal("1000"), "k", undefined, undefined);
    p.addLabel(new LangString("Kilo", "en"));
    const tags = [new LangString("Kilo", "en")];
    expect(p.labels.every((a, i) => a.equals(tags[i]))).toBeTruthy();

    const p2 = new Prefix("http://qudt.org/vocab/prefix/Kilo", new Decimal("1000"), "k", undefined, []);
    p2.addLabel(new LangString("Kilo", "en"));
    expect(p2.labels.every((a, i) => a.equals(tags[i]))).toBeTruthy();
});

// QuantityValue tests
test("new QuantityValue", () => {
    const degC = new Unit("http://qudt.org/vocab/unit/DEG_C", [], "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0", new Decimal("1.0"), new Decimal("273.15"), undefined, undefined, undefined, undefined, undefined);
    const degF = new Unit("http://qudt.org/vocab/unit/DEG_F", [], "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0", new Decimal("0.5555555555555556"), new Decimal("459.669607"), undefined, undefined, undefined, undefined, undefined);
    const value = new Decimal("36");
    const qvC = new QuantityValue(value, degC);
    const qvF = new QuantityValue(value, degF);
    expect(qvC.quantity).toBe(value);
    expect(qvC.unit).toBe(degC);
    expect(qvF.quantity).toBe(value);
    expect(qvF.unit).toBe(degF);
    expect(qvC.equals(qvF)).toBe(false);
    expect(qvC.equals(qvC)).toBe(true);
});

//QuantityKind tests

test('new QuantityKind, no symbol, no labels', () => {
    const a = new QuantityKind("http://qudt.org/vocab/quantitykind/Temperature", "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0");
    expect(a.symbol).toBe(undefined);
    expect(a.labels).toStrictEqual([]);
    expect(a.broaderQuantityKindIris).toStrictEqual([]);
    expect(a.dimensionVectorIri).toBe("http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0");
    expect(a.iri).toBe("http://qudt.org/vocab/quantitykind/Temperature");
    expect(a.equals(a)).toBeTruthy();
});

test('new QuantityKind, no labels', () => {
    const a = new QuantityKind("http://qudt.org/vocab/quantitykind/Temperature", "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0", "t");
    expect(a.symbol).toBe("t");
});

test('new QuantityKind', () => {
    const a = new QuantityKind("http://qudt.org/vocab/quantitykind/Temperature", "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0", "t", [new LangString("temperature", "en"), new LangString("Temperatur", "de")]);
    expect(a.symbol).toBe("t");
    expect(a.labels).toStrictEqual([new LangString("temperature", "en"), new LangString("Temperatur", "de")]);
});

test('QuantityKind.addLabel', () => {
    const a = new QuantityKind("http://qudt.org/vocab/quantitykind/Temperature", "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0", "t");
    expect(a.labels).toStrictEqual([]);
    a.addLabel(new LangString("temperature", "en"));
    expect(a.labels).toStrictEqual([new LangString("temperature", "en")]);
    a.addLabel(new LangString("Temperatur", "de"));
    expect(a.labels).toStrictEqual([new LangString("temperature", "en"), new LangString("Temperatur", "de")]);
});

test('QuantityKind.addApplicableUnit', () => {
    const a = new QuantityKind("http://qudt.org/vocab/quantitykind/Temperature", "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0", "t", [new LangString("temperature", "en"), new LangString("Temperatur", "de")]);
    expect(a.applicableUnitIris).toStrictEqual([]);
    a.addApplicableUnit("http://qudt.org/vocab/unit/DEG_R");
    a.addApplicableUnit("http://qudt.org/vocab/unit/MilliDEG_C");
    a.addApplicableUnit("http://qudt.org/vocab/unit/DEG_C");
    a.addApplicableUnit("http://qudt.org/vocab/unit/PlanckTemperature");
    a.addApplicableUnit("http://qudt.org/vocab/unit/K");
    a.addApplicableUnit("http://qudt.org/vocab/unit/DEG_F");
    expect(a.applicableUnitIris.length).toBe(6);
    expect(a.applicableUnitIris).toStrictEqual(["http://qudt.org/vocab/unit/DEG_R", "http://qudt.org/vocab/unit/MilliDEG_C", "http://qudt.org/vocab/unit/DEG_C", "http://qudt.org/vocab/unit/PlanckTemperature", "http://qudt.org/vocab/unit/K", "http://qudt.org/vocab/unit/DEG_F"]);
});

test('QuantityKind.addBroaderQuantityKind', () => {
    const a = new QuantityKind("http://qudt.org/vocab/quantitykind/VacuumThrust", "http://qudt.org/vocab/dimensionvector/A0E0L1I0M1H0T-2D0");
    a.addLabel(new LangString("Vacuum Thrust", "en"));
    expect(a.broaderQuantityKindIris).toStrictEqual([]);
    a.addBroaderQuantityKind("http://qudt.org/vocab/quantitykind/Thrust");
    expect(a.broaderQuantityKindIris).toStrictEqual(["http://qudt.org/vocab/quantitykind/Thrust"]);
});

// FactorUnit tests

test('new FactorUnit', () => {
    const a = new FactorUnit(degC, new Decimal(2));
    expect(a.unit).toBe(degC);
    expect(a.exponent).toStrictEqual(new Decimal("2"));
});

test ('FactorUnit.equals', () => {
    const a = new FactorUnit(degC, new Decimal(2));
    const b = new FactorUnit(degC, new Decimal(10));
    const c = new FactorUnit(degF, new Decimal(2))
    expect(a.equals(a)).toBe(true);
    expect(a.equals(b)).toBe(false);
    expect(a.equals(c)).toBe(false);
});

test ('FactorUnit.toString', () => {
    const a = new FactorUnit(degC, new Decimal(2));
    expect(a.toString()).toStrictEqual("FU{unit:DEG_C^2}")
});


test ('FactorUnit.combine positive', () => {
    const fu1 = new FactorUnit(degC, new Decimal(2));
    const fu2 = new FactorUnit(degC, new Decimal(1));
    const cmb = FactorUnit.combine(fu1, fu2);
    expect(cmb.unit).toBe(degC);
    expect(cmb.exponent).toStrictEqual(new Decimal(3));
});

test ('FactorUnit.combine negative', () => {
    const fu1 = new FactorUnit(degC, new Decimal(-2));
    const fu2 = new FactorUnit(degC, new Decimal(-2));
    const cmb = FactorUnit.combine(fu1, fu2);
    expect(cmb.unit).toBe(degC);
    expect(cmb.exponent).toStrictEqual(new Decimal(-4));
});

test ('FactorUnit.combine incompatible', () => {
    const fu1 = new FactorUnit(degC, new Decimal(2));
    const fu2 = new FactorUnit(degC, new Decimal(-2));
    expect(() => FactorUnit.combine(fu1, fu2)).toThrowError();
});

// FactorUnitSelector tests
test ('FactorUnitSelector.isBound', () => {
    const fu = new FactorUnit(degC, new Decimal(-2));
    const fus1 = new FactorUnitSelector(degC, new Decimal(-2), new FactorUnitMatch(fu, new Decimal(-2), [degC], new ScaleFactor(new Decimal(1))));
    const fus2 = new FactorUnitSelector(degC, new Decimal(-2));
    expect(fus1.isBound()).toBe(true);
    expect(fus2.isBound()).toBe(false);
});

test ('FactorUnitSelector.isAvailable', () => {
    const fu = new FactorUnit(degC, new Decimal(-2));
    const fus1 = new FactorUnitSelector(degC, new Decimal(-2), new FactorUnitMatch(fu, new Decimal(-2), [degC], new ScaleFactor(new Decimal(1))));
    const fus2 = new FactorUnitSelector(degC, new Decimal(-2));
    expect(fus1.isAvailable()).toBe(false);
    expect(fus2.isAvailable()).toBe(true);
});

// FactorUnitSelecion tests
test ('FactorUnitSelecion.isSelected', () => {
   const fu = new FactorUnit(degC,new Decimal(-2));
   const fus = new FactorUnitSelector(degC, new Decimal(-2), new FactorUnitMatch(fu, new Decimal(-2), [degC], new ScaleFactor(new Decimal(1))));
   const fusn = new FactorUnitSelection([fus]);
   expect(fusn.isSelected(fu, [degC])).toBeTruthy();
});

test ('FactorUnitSelection.isCompleteMatch', () => {
    const fu = new FactorUnit(degC,new Decimal(-2));
    const fus = new FactorUnitSelector(degC, new Decimal(-2), new FactorUnitMatch(fu, new Decimal(1), [degC], new ScaleFactor(new Decimal(1))));
    const fusn = new FactorUnitSelection([fus]);
    expect(fusn.isCompleteMatch()).toBe(true);
});

// tests for class 'Unit'

test ('Unit.isScaled', () => {
    expect(m.isScaled()).toBe(false);
    expect(kiloM.isScaled()).toBe(true);
});

test ('Unit.isConvertible', () => {
    expect(m.isConvertible(kiloM)).toBe(true);
    expect(kiloM.isConvertible(m)).toBe(true);
    expect(degC.isConvertible(degF)).toBe(true);
    expect(degC.isConvertible(m)).toBe(false);
    expect(m.isConvertible(degC)).toBe(false);
});

test ('Unit.getConversionMultiplier', () => {
   expect(m.getConversionMultiplier(kiloM)).toStrictEqual(new Decimal("0.001"));
   expect(kiloM.getConversionMultiplier(m)).toStrictEqual(new Decimal("1000"));
   expect(degC.getConversionMultiplier(degC)).toStrictEqual(new Decimal(1));
   expect(() => degF.getConversionMultiplier(degC)).toThrow(/Cannot convert.+/gi);
});

test ('Unit.matches', () => {
    expect(() => degC__PER__M.matches(m)).toThrowError();
    expect(() => degC__PER__M.matches(m,1, degC, 2, degK, -1, kiloM, 4, m, 3, degK, 1, degC, -3, m, 1)).toThrowError();
    expect(() => degC__PER__M.matches(m, m)).toThrowError();
    expect(degC__PER__M.matches(m, -1, degC, 1)).toBe(true);
    expect(degC__PER__M.matches(degC, 1, m, -1)).toBe(true);
    expect(degC__PER__M.matches(degC, new Decimal(1), m, -1)).toBe(true);
    expect(degC__PER__M.matches(m, -1, degC, 1, degF, -1)).toBe(false);
});

test ('Unit.convert', () => {
    //expect(m.convert)
});


const degC = new Unit("http://qudt.org/vocab/unit/DEG_C", [], "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0", new Decimal("1.0"), new Decimal("273.15"), undefined, undefined, undefined, undefined, undefined);
const degF = new Unit("http://qudt.org/vocab/unit/DEG_F", [], "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0", new Decimal("0.5555555555555556"), new Decimal("459.669607"), undefined, undefined, undefined, undefined, undefined);
const degK = new Unit("http://qudt.org/vocab/unit/DEG_F", [], "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0", new Decimal("0.5555555555555556"), new Decimal("459.669607"), undefined, undefined, undefined, undefined, undefined);
const m = new Unit("http://qudt.org/vocab/unit/M", [], "http://qudt.org/vocab/dimensionvector/A0E0L1I0M0H0T0D0", undefined, undefined, undefined, undefined, undefined, undefined, [new LangString("m", "en")]);
const kiloM = new Unit("http://qudt.org/vocab/unit/KiloM", [], "http://qudt.org/vocab/dimensionvector/A0E0L1I0M0H0T0D0", new Decimal("1000"), undefined, "http://qudt.org/vocab/prefix/Kilo", "http://qudt.org/vocab/unit/M", m, undefined, [new LangString("m", "en")]);
kiloM.scalingOf = m;
const degC__PER__M = new Unit("http://qudt.org/vocab/unit/DEG_C-PER-M", [],  "http://qudt.org/vocab/dimensionvector/A0E0L-1I0M0H1T0D0", new Decimal("1.0"));
degC__PER__M.addFactorUnit(new FactorUnit(degC, new Decimal(1)));
degC__PER__M.addFactorUnit(new FactorUnit(m, new Decimal("-1")));

