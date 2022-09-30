import { Qudt, QUDT_UNIT_BASE_IRI, Units } from "@qudtlib/allunits";
test("unit()", () => {
  expect(Qudt.unit(QUDT_UNIT_BASE_IRI + "M")).toBe(Units.M);
});
