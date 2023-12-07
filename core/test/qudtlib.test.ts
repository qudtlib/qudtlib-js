import {
  arrayEquals,
  arrayEqualsIgnoreOrdering,
  arrayCountEqualElements,
  arrayMin,
  arrayMax,
} from "../src/utils";
import { AssignmentProblem } from "../src/assignmentProblem";
import { Decimal } from "decimal.js";
import { LangString } from "../src/langString";
import { Prefix } from "../src/prefix";
import { QuantityValue } from "../src/quantityValue";
import { QuantityKind } from "../src/quantityKind";
import { FactorUnit } from "../src/factorUnit";
import { FactorUnits } from "../src/factorUnits";
import { Unit } from "../src/unit";

// LangString tests

test("new LangString", () => {
  const x = new LangString("tree", "en");
  expect(x.text).toBe("tree");
  expect(x.languageTag).toBe("en");
});

test("new LangString, no lang", () => {
  const x = new LangString("tree");
  expect(x.text).toBe("tree");
  expect(x.languageTag).toBe(undefined);
});

test("LangString.toString", () => {
  const x = new LangString("tree", "en");
  expect(x.toString()).toBe("tree@en");
});

test("LangString.toString, no lang", () => {
  const x = new LangString("tree");
  expect(x.toString()).toBe("tree");
});

test("LangString.equals", () => {
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

// Prefix tests

test("new Prefix", () => {
  const a = new Prefix(
    "http://qudt.org/vocab/prefix/Kilo",
    new Decimal("1.0E+3"),
    "k",
    "k",
    [new LangString("kilo")],
  );
  expect(a.symbol).toBe("k");
  expect(a.multiplier.equals(new Decimal("1000"))).toBeTruthy();
  expect(a.ucumCode).toBe("k");
  expect(a.symbol).toBe("k");
  const tags = [new LangString("kilo")];
  expect(a.labels.every((a, i) => a.equals(tags[i]))).toBeTruthy();
});

test("new Prefix, no ucumcode", () => {
  const a = new Prefix(
    "http://qudt.org/vocab/prefix/Kilo",
    new Decimal("1000"),
    "k",
    undefined,
    [new LangString("Kilo")],
  );
  expect(a.symbol).toBe("k");
});

test("new Prefix, no ucumcode, no labels", () => {
  const a = new Prefix(
    "http://qudt.org/vocab/prefix/Kilo",
    new Decimal("1.0E+3"),
    "k",
    "k",
    undefined,
  );
  expect(a.symbol).toBe("k");
});

test("Prefix.toString", () => {
  const a = new Prefix(
    "http://qudt.org/vocab/prefix/Kilo",
    new Decimal("1000"),
    "k",
    undefined,
    [new LangString("Kilo")],
  );
  expect(a.toString()).toBe("k");
});

test("Prefix.addLabel", () => {
  const p = new Prefix(
    "http://qudt.org/vocab/prefix/Kilo",
    new Decimal("1000"),
    "k",
    undefined,
    undefined,
  );
  p.addLabel(new LangString("Kilo", "en"));
  const tags = [new LangString("Kilo", "en")];
  expect(p.labels.every((a, i) => a.equals(tags[i]))).toBeTruthy();

  const p2 = new Prefix(
    "http://qudt.org/vocab/prefix/Kilo",
    new Decimal("1000"),
    "k",
    undefined,
    [],
  );
  p2.addLabel(new LangString("Kilo", "en"));
  expect(p2.labels.every((a, i) => a.equals(tags[i]))).toBeTruthy();
});

// QuantityValue tests
test("new QuantityValue", () => {
  const degC = new Unit(
    "http://qudt.org/vocab/unit/DEG_C",
    [],
    [],
    "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
    new Decimal("1.0"),
    new Decimal("273.15"),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  );
  const degF = new Unit(
    "http://qudt.org/vocab/unit/DEG_F",
    [],
    [],
    "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
    new Decimal("0.5555555555555556"),
    new Decimal("459.669607"),
    undefined,
    undefined,
    undefined,
    undefined,
    undefined,
  );
  const value = new Decimal("36");
  const qvC = new QuantityValue(value, degC);
  const qvF = new QuantityValue(value, degF);
  expect(qvC.value).toBe(value);
  expect(qvC.unit).toBe(degC);
  expect(qvF.value).toBe(value);
  expect(qvF.unit).toBe(degF);
  expect(qvC.equals(qvF)).toBe(false);
  expect(qvC.equals(qvC)).toBe(true);
});

//QuantityKind tests

test("new QuantityKind, no symbol, no labels", () => {
  const a = new QuantityKind(
    "http://qudt.org/vocab/quantitykind/Temperature",
    "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
  );
  expect(a.symbol).toBe(undefined);
  expect(a.labels).toStrictEqual([]);
  expect(a.broaderQuantityKindIris).toStrictEqual([]);
  expect(a.dimensionVectorIri).toBe(
    "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
  );
  expect(a.iri).toBe("http://qudt.org/vocab/quantitykind/Temperature");
  expect(a.equals(a)).toBeTruthy();
});

test("new QuantityKind, no labels", () => {
  const a = new QuantityKind(
    "http://qudt.org/vocab/quantitykind/Temperature",
    "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
    "t",
  );
  expect(a.symbol).toBe("t");
});

test("new QuantityKind", () => {
  const a = new QuantityKind(
    "http://qudt.org/vocab/quantitykind/Temperature",
    "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
    "t",
    [new LangString("temperature", "en"), new LangString("Temperatur", "de")],
  );
  expect(a.symbol).toBe("t");
  expect(a.labels).toStrictEqual([
    new LangString("temperature", "en"),
    new LangString("Temperatur", "de"),
  ]);
});

test("QuantityKind.addLabel", () => {
  const a = new QuantityKind(
    "http://qudt.org/vocab/quantitykind/Temperature",
    "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
    "t",
  );
  expect(a.labels).toStrictEqual([]);
  a.addLabel(new LangString("temperature", "en"));
  expect(a.labels).toStrictEqual([new LangString("temperature", "en")]);
  a.addLabel(new LangString("Temperatur", "de"));
  expect(a.labels).toStrictEqual([
    new LangString("temperature", "en"),
    new LangString("Temperatur", "de"),
  ]);
});

test("QuantityKind.addApplicableUnitIri", () => {
  const a = new QuantityKind(
    "http://qudt.org/vocab/quantitykind/Temperature",
    "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
    "t",
    [new LangString("temperature", "en"), new LangString("Temperatur", "de")],
  );
  expect(a.applicableUnitIris).toStrictEqual([]);
  a.addApplicableUnitIri("http://qudt.org/vocab/unit/DEG_R");
  a.addApplicableUnitIri("http://qudt.org/vocab/unit/MilliDEG_C");
  a.addApplicableUnitIri("http://qudt.org/vocab/unit/DEG_C");
  a.addApplicableUnitIri("http://qudt.org/vocab/unit/PlanckTemperature");
  a.addApplicableUnitIri("http://qudt.org/vocab/unit/K");
  a.addApplicableUnitIri("http://qudt.org/vocab/unit/DEG_F");
  expect(a.applicableUnitIris.length).toBe(6);
  expect(a.applicableUnitIris).toStrictEqual([
    "http://qudt.org/vocab/unit/DEG_R",
    "http://qudt.org/vocab/unit/MilliDEG_C",
    "http://qudt.org/vocab/unit/DEG_C",
    "http://qudt.org/vocab/unit/PlanckTemperature",
    "http://qudt.org/vocab/unit/K",
    "http://qudt.org/vocab/unit/DEG_F",
  ]);
});

test("QuantityKind.addBroaderQuantityKindIri", () => {
  const a = new QuantityKind(
    "http://qudt.org/vocab/quantitykind/VacuumThrust",
    "http://qudt.org/vocab/dimensionvector/A0E0L1I0M1H0T-2D0",
  );
  a.addLabel(new LangString("Vacuum Thrust", "en"));
  expect(a.broaderQuantityKindIris).toStrictEqual([]);
  a.addBroaderQuantityKindIri("http://qudt.org/vocab/quantitykind/Thrust");
  expect(a.broaderQuantityKindIris).toStrictEqual([
    "http://qudt.org/vocab/quantitykind/Thrust",
  ]);
});

// FactorUnit tests

test("new FactorUnit", () => {
  const a = new FactorUnit(degC, 2);
  expect(a.unit).toBe(degC);
  expect(a.exponent).toStrictEqual(2);
});

test("FactorUnit.equals", () => {
  const a = new FactorUnit(degC, 2);
  const b = new FactorUnit(degC, 10);
  const c = new FactorUnit(degF, 2);
  expect(a.equals(a)).toBe(true);
  expect(a.equals(b)).toBe(false);
  expect(a.equals(c)).toBe(false);
});

test("FactorUnit.toString", () => {
  const a = new FactorUnit(degC, 2);
  expect(a.toString()).toStrictEqual("unit:DEG_C^2");
});

test("FactorUnit.combine positive", () => {
  const fu1 = new FactorUnit(degC, 2);
  const fu2 = new FactorUnit(degC, 1);
  const cmb = FactorUnit.combine(fu1, fu2);
  expect(cmb.unit).toBe(degC);
  expect(cmb.exponent).toStrictEqual(3);
});

test("FactorUnit.combine negative", () => {
  const fu1 = new FactorUnit(degC, -2);
  const fu2 = new FactorUnit(degC, -2);
  const cmb = FactorUnit.combine(fu1, fu2);
  expect(cmb.unit).toBe(degC);
  expect(cmb.exponent).toStrictEqual(-4);
});

test("FactorUnit.combine exponents that cancel each other out", () => {
  const fu1 = new FactorUnit(degC, 2);
  const fu2 = new FactorUnit(degC, -2);
  expect(FactorUnit.combine(fu1, fu2).equals(new FactorUnit(degC, 0))).toBe(
    true,
  );
});

test("FactorUnits.toString", () => {
  const fus = FactorUnits.ofFactorUnitSpec(degC, -2, degC, 1);
  expect(fus.toString()).toBe("[unit:DEG_C^-2, unit:DEG_C]");
});

// tests for class 'Unit'

test("Unit.isScaled", () => {
  expect(m.isScaled()).toBe(false);
  expect(kiloM.isScaled()).toBe(true);
});

test("Unit.isConvertible", () => {
  expect(m.isConvertible(kiloM)).toBe(true);
  expect(kiloM.isConvertible(m)).toBe(true);
  expect(degC.isConvertible(degF)).toBe(true);
  expect(degC.isConvertible(m)).toBe(false);
  expect(m.isConvertible(degC)).toBe(false);
});

test("Unit.getConversionMultiplier", () => {
  expect(m.getConversionMultiplier(kiloM)).toStrictEqual(new Decimal("0.001"));
  expect(kiloM.getConversionMultiplier(m)).toStrictEqual(new Decimal("1000"));
  expect(degC.getConversionMultiplier(degC)).toStrictEqual(new Decimal(1));
  expect(() => degF.getConversionMultiplier(degC)).toThrow(
    /Cannot convert.+/gi,
  );
});

test("Unit.matches", () => {
  expect(m.matches(FactorUnits.ofFactorUnitSpec(m, 1)));
  expect(() =>
    degC__PER__M.matches(FactorUnits.ofFactorUnitSpec(m)),
  ).toThrowError();
  expect(() =>
    degC__PER__M.matches(
      FactorUnits.ofFactorUnitSpec(
        m,
        1,
        degC,
        2,
        degK,
        -1,
        kiloM,
        4,
        m,
        3,
        degK,
        1,
        degC,
        -3,
        m,
        1,
      ),
    ),
  ).toThrowError();
  expect(() =>
    degC__PER__M.matches(FactorUnits.ofFactorUnitSpec(m, m)),
  ).toThrowError();
  expect(
    degC__PER__M.matches(FactorUnits.ofFactorUnitSpec(m, -1, degC, 1)),
  ).toBe(true);
  expect(
    degC__PER__M.matches(FactorUnits.ofFactorUnitSpec(degC, 1, m, -1)),
  ).toBe(true);
  expect(
    degC__PER__M.matches(FactorUnits.ofFactorUnitSpec(degC, 1, m, -1)),
  ).toBe(true);
  expect(
    degC__PER__M.matches(
      FactorUnits.ofFactorUnitSpec(m, -1, degC, 1, degF, -1),
    ),
  ).toBe(false);
});

test("Unit.getLeafFactorUnitsWithCumulativeExponents", () => {
  expect(
    degC__PER__M.getLeafFactorUnitsWithCumulativeExponents(),
  ).toStrictEqual([new FactorUnit(degC, 1), new FactorUnit(m, -1)]);
});

const degC = new Unit(
  "http://qudt.org/vocab/unit/DEG_C",
  [],
  [],
  "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
  new Decimal("1.0"),
  new Decimal("273.15"),
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
);
const degF = new Unit(
  "http://qudt.org/vocab/unit/DEG_F",
  [],
  [],
  "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
  new Decimal("0.5555555555555556"),
  new Decimal("459.669607"),
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
);
const degK = new Unit(
  "http://qudt.org/vocab/unit/DEG_F",
  [],
  [],
  "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
  new Decimal("0.5555555555555556"),
  new Decimal("459.669607"),
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
);
const m = new Unit(
  "http://qudt.org/vocab/unit/M",
  [],
  [],
  "http://qudt.org/vocab/dimensionvector/A0E0L1I0M0H0T0D0",
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  "m",
  [new LangString("m", "en")],
);
const kiloM = new Unit(
  "http://qudt.org/vocab/unit/KiloM",
  [],
  [],
  "http://qudt.org/vocab/dimensionvector/A0E0L1I0M0H0T0D0",
  new Decimal("1000"),
  undefined,
  "http://qudt.org/vocab/prefix/Kilo",
  "http://qudt.org/vocab/unit/M",
  m,
  undefined,
  [new LangString("m", "en")],
);
kiloM.scalingOf = m;
const degC__PER__M = new Unit(
  "http://qudt.org/vocab/unit/DEG_C-PER-M",
  [],
  [],
  "http://qudt.org/vocab/dimensionvector/A0E0L-1I0M0H1T0D0",
  new Decimal("1.0"),
);

degC__PER__M.addFactorUnit(new FactorUnit(degC, 1));
degC__PER__M.addFactorUnit(new FactorUnit(m, -1));

describe.each([
  [[1, 2, 3], [1, 2, 3], true],
  [["a", "b", "c"], ["a", "b", "c"], true],
  [["a", "b", "c"], ["a", "b"], false],
  [["a", "b", "c"], [], false],
  [["a", "b", "c"], [2], false],
  [[], [], true],
  [["a", "b", "c"], ["a", "b", "c", "d"], false],
])(
  "arrayEquals",
  (
    left: Array<number | string>,
    right: Array<number | string>,
    expectedResult: boolean,
  ) =>
    test(`arrayEquals([${left}], [${right}]) = ${expectedResult}`, () =>
      expect(arrayEquals(left, right)).toBe(expectedResult)),
);

function cmpNumOrString(a: string | number, b: string | number) {
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  } else if (typeof a === "string" && typeof b === "string") {
    return a.localeCompare(b);
  }
  throw "cannot handle this type";
}

describe.each([
  [[1, 2, 3], 1],
  [["a", "b", "c"], "a"],
])("arrayMin", (arr: Array<number | string>, expectedResult: number | string) =>
  test(`arrayMin([${arr}]) = ${expectedResult}`, () =>
    expect(arrayMin(arr, cmpNumOrString)).toBe(expectedResult)),
);

describe.each([
  [[1, 2, 3], 3],
  [["a", "b", "c"], "c"],
])(
  "arrayMaxn",
  (arr: Array<number | string>, expectedResult: number | string) =>
    test(`arrayMax([${arr}]) = ${expectedResult}`, () =>
      expect(arrayMax(arr, cmpNumOrString)).toBe(expectedResult)),
);

describe.each([
  [[1, 2, 3], [1, 2, 3], true],
  [["a", "b", "c"], ["a", "b", "c"], true],
  [["a", "b", "c"], ["a", "b"], false],
  [["a", "b", "c"], [], false],
  [["a", "b", "c"], [2], false],
  [[], [], true],
  [["a", "b", "c"], ["a", "b", "c", "d"], false],
  [[1, 2, 3], [1, 3, 2], true],
  [[1, 2, 3], [3, 2, 1], true],
  [[1, 2, 3], [3, 2, 3], false],
  [[1, 1, 3], [1, 1, 3], true],
  [[1, 1, 1], [1, 1, 1], true],
  [[1, 1, 2], [2, 1, 1], true],
  [["a", "b", "c"], ["a", "c", "b"], true],
  [["a", "b", "c"], ["a", "b"], false],
  [["a", "b", "c"], [], false],
  [["a", "b", "c"], [2], false],
  [[], [], true],
  [["a", "b", "c"], ["a", "b", "c", "d"], false],
])(
  "arrayEqualsIgnoreOrdering",
  (
    left: Array<number | string>,
    right: Array<number | string>,
    expectedResult: boolean,
  ) =>
    test(`arrayEqualsIgnoreOrdering([${left}], [${right}]) = ${expectedResult}`, () =>
      expect(arrayEqualsIgnoreOrdering(left, right)).toBe(expectedResult)),
);

describe.each([
  [[1, 2, 3], [1, 2, 3], 3],
  [["a", "b", "c"], ["a", "b", "c"], 3],
  [["a", "b", "c"], ["a", "b"], 2],
  [["a", "b", "c"], [], 0],
  [["a", "b", "c"], [2], 0],
  [[], [], 0],
  [["a", "b", "c"], ["a", "b", "c", "d"], 3],
  [[1, 2, 3], [1, 3, 2], 3],
  [[1, 2, 3], [3, 2, 1], 3],
  [[1, 2, 3], [3, 2, 3], 2],
  [[1, 1, 3], [1, 1, 3], 3],
  [[1, 1, 1], [1, 1, 1], 3],
  [[1, 1, 2], [2, 1, 1], 3],
  [["a", "b", "c"], ["a", "c", "b"], 3],
  [["a", "b", "c"], ["a", "b"], 2],
  [["a", "b", "c"], [], 0],
  [["a", "b", "c"], [2], 0],
  [[], [], 0],
  [["a", "b", "c"], ["a", "b", "c", "d"], 3],
])(
  "arrayCountEqualElements",
  (
    left: Array<number | string>,
    right: Array<number | string>,
    expectedResult: number,
  ) =>
    test(`arrayCountEqualElements([${left}], [${right}]) = ${expectedResult}`, () =>
      expect(arrayCountEqualElements(left, right)).toBe(expectedResult)),
);

describe.each([
  [
    1,
    [
      [0, 1],
      [1, 0],
    ],
    [0, 1],
  ],
  [
    2,
    [
      [1, 0],
      [0, 1],
    ],
    [1, 0],
  ],
  [
    3,
    [
      [0, 0],
      [0, 0],
    ],
    [0, 1],
  ],
  [
    4,
    [
      [0, 1, 0],
      [2, 5, 3],
    ],
    [2, 0],
  ],
  [
    5,
    [
      [0, 1, 0, 2],
      [1, 0, 2, 3],
      [2, 4, 0, 0],
    ],
    [0, 1, 2],
  ],
  [
    6,
    [
      [0, 1, 0, 2],
      [1, 4, 3, 3],
      [4, 5, 4, 6],
    ],
    [2, 0, 1],
  ],
  [
    7,
    [
      [0, 1, 0, 2],
      [1, 4, 3, 3],
      [5, 10, 5, 10],
    ],
    [1, 0, 2],
  ],
])("solve assignment problem", (testId, mat, expectedResult) => {
  test(`Test case ${testId}: [${mat.join(
    "],[",
  )}] should yield [${expectedResult}]`, () => {
    const instance = AssignmentProblem.instance(mat);
    const solution = instance.solve();
    expect(solution.assignment).toStrictEqual(expectedResult);
  });
});
