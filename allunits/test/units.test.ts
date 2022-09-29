import {
Qudt, Units
} from "../src/units";
import {QUDT_UNIT_BASE_IRI} from "@qudtlib/core";

test("unit()", () => {
   expect(Qudt.unit(QUDT_UNIT_BASE_IRI + "M")).toBe(Units.M);
});