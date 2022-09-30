import { Decimal } from "decimal.js";
import {config, Unit, LangString } from "@qudtlib/core";


const m = new Unit("http://qudt.org/vocab/unit/M", [], "http://qudt.org/vocab/dimensionvector/A0E0L1I0M0H0T0D0", undefined, undefined, undefined, undefined, undefined, undefined, [new LangString("m", "en")]);
const degC = new Unit("http://qudt.org/vocab/unit/DEG_C", [], "http://qudt.org/vocab/dimensionvector/A0E0L0I0M0H1T0D0", new Decimal("1.0"), new Decimal("273.15"), undefined, undefined, undefined, undefined, undefined);
const kiloM = new Unit("http://qudt.org/vocab/unit/KiloM", [], "http://qudt.org/vocab/dimensionvector/A0E0L1I0M0H0T0D0", new Decimal("1000"), undefined, "http://qudt.org/vocab/prefix/Kilo", "http://qudt.org/vocab/unit/M", m, undefined, [new LangString("m", "en")]);
kiloM.scalingOf = m;

config.units.set(m.iri, m);
config.units.set(degC.iri, degC);
config.units.set(kiloM.iri, kiloM);


export * from "@qudtlib/core";

export const Units:any = {
    M: m,
    DEG_C: degC,
    Kilo_M: kiloM,
}





