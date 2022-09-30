import { Decimal } from "decimal.js";
import { config, Unit, LangString, FactorUnit } from "@qudtlib/core";

const m = new Unit(
  "http://qudt.org/vocab/unit/M",
  [],
  "http://qudt.org/vocab/dimensionvector/A0E0L1I0M0H0T0D0",
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  undefined,
  [new LangString("m", "en")]
);
const degC = new Unit(
  "http://qudt.org/vocab/unit/DEG_C",
  [],
  "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
  new Decimal("1.0"),
  new Decimal("273.15"),
  undefined,
  undefined,
  undefined,
  undefined,
  undefined
);
const degF = new Unit(
  "http://qudt.org/vocab/unit/DEG_F",
  [],
  "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
  new Decimal("0.5555555555555556"),
  new Decimal("459.669607"),
  undefined,
  undefined,
  undefined,
  undefined,
  undefined
);
const degK = new Unit(
  "http://qudt.org/vocab/unit/DEG_F",
  [],
  "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0",
  new Decimal("0.5555555555555556"),
  new Decimal("459.669607"),
  undefined,
  undefined,
  undefined,
  undefined,
  undefined
);
const kiloM = new Unit(
  "http://qudt.org/vocab/unit/KiloM",
  [],
  "http://qudt.org/vocab/dimensionvector/A0E0L1I0M0H0T0D0",
  new Decimal("1000"),
  undefined,
  "http://qudt.org/vocab/prefix/Kilo",
  "http://qudt.org/vocab/unit/M",
  m,
  undefined,
  [new LangString("m", "en")]
);
kiloM.scalingOf = m;
const degC__PER__M = new Unit(
  "http://qudt.org/vocab/unit/DEG_C-PER-M",
  [],
  "http://qudt.org/vocab/dimensionvector/A0E0L-1I0M0H1T0D0",
  new Decimal("1.0")
);
degC__PER__M.addFactorUnit(new FactorUnit(degC, new Decimal(1)));
degC__PER__M.addFactorUnit(new FactorUnit(m, new Decimal("-1")));

config.units.set(m.iri, m);
config.units.set(degC.iri, degC);
config.units.set(degF.iri, degF);
config.units.set(degK.iri, degK);
config.units.set(kiloM.iri, kiloM);
config.units.set(degC__PER__M.iri, degC__PER__M);

export * from "@qudtlib/core";

export const Units: any = {
  M: m,
  DEG_C: degC,
  DEG_F: degF,
  DEG_K: degK,
  Kilo_M: kiloM,
  DEG_C__PER__M: degC__PER__M,
};
