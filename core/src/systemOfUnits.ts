import { SupportsEquals } from "./baseTypes.js";
import { LangString } from "./langString.js";
import { Unit } from "./unit.js";
import { QudtNamespaces } from "./qudtNamespaces.js";
import { isNullish } from "./utils";

export class SystemOfUnits implements SupportsEquals<SystemOfUnits> {
  readonly iri: string;
  readonly labels: LangString[];
  readonly baseUnitIris: string[];
  readonly abbreviation?: string;

  private static readonly GM_iri = QudtNamespaces.unit.makeIriInNamespace("GM");
  private static readonly KiloGM_iri =
    QudtNamespaces.unit.makeIriInNamespace("KiloGM");

  constructor(
    iri: string,
    labels: LangString[],
    abbreviation?: string,
    baseUnitIris?: string[]
  ) {
    this.iri = iri;
    this.labels = labels;
    this.baseUnitIris = baseUnitIris || [];
    this.abbreviation = abbreviation;
  }

  equals(other?: SystemOfUnits): boolean {
    return !!other && this.iri === other.iri;
  }

  public hasBaseUnit(unit: Unit): boolean {
    return this.baseUnitIris.includes(unit.iri);
  }

  public allowsUnit(unit: Unit): boolean {
    if (this.hasBaseUnit(unit)) {
      return true;
    }
    if (unit.unitOfSystemIris.includes(this.iri)) {
      return true;
    }
    if (unit.iri === SystemOfUnits.GM_iri) {
      // we use gram as the base unit, but SI uses KiloGM, so if we fail for GM, try KiloGM
      return this.baseUnitIris.includes(SystemOfUnits.KiloGM_iri);
    }
    if (unit.scalingOf && unit.prefix) {
      return this.allowsUnit(unit.scalingOf);
    }
    return false;
  }
}
