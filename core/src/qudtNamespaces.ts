import { Namespace } from "./namespace.js";

export const QudtNamespaces = Object.freeze({
  quantityKind: new Namespace("http://qudt.org/vocab/quantitykind/", "qk"),
  unit: new Namespace("http://qudt.org/vocab/unit/", "unit"),
  prefix: new Namespace("http://qudt.org/vocab/prefix/", "prefix"),
  systemOfUnits: new Namespace("http://qudt.org/vocab/sou/", "sou"),
});
