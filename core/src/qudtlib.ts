import { Decimal } from "decimal.js" ;

console.log("loading module '@qudtlib/core'");

export class QudtlibConfig {
    readonly units: Map<string, Unit>;
    readonly quantityKinds: Map<string, QuantityKind>;
    readonly prefixes: Map<string, Prefix>;

    constructor() {
        this.units = new Map<string, Unit>();
        this.quantityKinds = new Map<string, QuantityKind>();
        this.prefixes = new Map<string, Prefix>();
    }

}

export const config = new QudtlibConfig();

interface SupportsEquals<Type> {
    equals(other?: Type): boolean
}


export class LangString implements SupportsEquals<LangString> {
    readonly text: string;
    readonly languageTag?: string;


    constructor(text: string, languageTag?: string) {
        this.text = text;
        this.languageTag = languageTag;
    }

    equals(other?: LangString): boolean {
        return !!other && this.text === other.text && this.languageTag === other.languageTag;
    }

    toString(): string {
        return this.text + (this.languageTag ? `@${this.languageTag}` : "");
    }

}


export class ScaleFactor implements SupportsEquals<ScaleFactor> {
    readonly factor: Decimal

    constructor(factor: Decimal = new Decimal(1)) {
        this.factor = factor;
    }

    copy(): ScaleFactor {
        return new ScaleFactor(this.factor);
    }

    multiplyBy(by: Decimal): ScaleFactor {
        return new ScaleFactor(this.factor.mul(by));
    }

    toString(): string {
        return `SF{${this.factor.toString()}}`;
    }

    equals(other?: ScaleFactor): boolean {
        return !!other && this.factor === other.factor;
    }

}


export class Prefix implements SupportsEquals<Prefix> {
    iri: string;
    multiplier: Decimal;
    symbol: string;
    ucumCode?: string;
    labels: LangString[];

    constructor(iri: string, multiplier: Decimal, symbol: string, ucumCode?: string, labels?: LangString[]) {
        this.iri = iri;
        this.multiplier = multiplier;
        this.symbol = symbol;
        this.ucumCode = ucumCode;
        if (typeof labels === "undefined") {
            this.labels = [];
        } else {
            this.labels = labels;
        }
    }

    equals(other?: Prefix): boolean {
        return !!other &&
            this.iri === other.iri
            && this.multiplier.equals(other.multiplier)
            && this.symbol === other.symbol
            && this.ucumCode === other.ucumCode
            && this.labels.length == other.labels.length
            && arrayEquals(this.labels, other.labels, compareUsingEquals);
    }

    toString(): string {
        if (this.symbol) {
            return this.symbol;
        }
        return "prefix:" + getLastIriElement(this.iri);
    }

    addLabel(label: LangString): void {
        this.labels.push(label);
    }
}


export class QuantityValue implements SupportsEquals<QuantityValue> {
    quantity: Decimal;
    unit: Unit;

    constructor(quantity: Decimal, unit: Unit) {
        this.quantity = quantity;
        this.unit = unit;
    }

    equals(other?: QuantityValue): boolean {
        return !!other && this.quantity.equals(other.quantity) && this.unit.equals(other.unit);
    }

    toString(): string {
        return this.quantity.toString() + this.unit.toString();
    }
}


export class QuantityKind implements SupportsEquals<QuantityKind> {
    readonly iri: string;
    readonly labels: LangString[];
    readonly applicableUnits: string[];
    readonly broaderQuantityKinds: string[];
    readonly dimensionVector?: string;
    readonly symbol?: string;


    constructor(iri: string, dimensionVector?: string, symbol?: string, labels?: LangString[]) {
        this.iri = iri;
        this.applicableUnits = [];
        this.broaderQuantityKinds = [];
        this.dimensionVector = dimensionVector;
        this.symbol = symbol;
        if (typeof labels === 'undefined') {
            this.labels = [];
        } else {
            this.labels = labels;
        }
    }

    addLabel(label: LangString): void {
        this.labels.push(label);
    }

    addApplicableUnit(unit: string): void {
        this.applicableUnits.push(unit);
    }

    addBroaderQuantityKind(quantityKind: string): void {
        this.broaderQuantityKinds.push(quantityKind);
    }

    equals(other?: QuantityKind): boolean {
        return !!other && this.iri === other.iri;
    }

    toString(): string {
        if (this.symbol) {
            return this.symbol;
        }
        return "quantityKind:" + getLastIriElement(this.iri);
    }
}


export class FactorUnit implements SupportsEquals<FactorUnit> {
    readonly exponent: Decimal;
    readonly unit: Unit

    constructor(unit: Unit, exponent: Decimal) {
        this.exponent = exponent;
        this.unit = unit;
    }

    getExponentCumulated(cumulatedExponent: Decimal): Decimal {
        return this.exponent.mul(cumulatedExponent);
    }

    equals(other?: FactorUnit): boolean {
        return !!other && this.exponent.equals(other.exponent) && this.unit.equals(other.unit);
    }

    toString(): string {
        return "FU{" + this.unit.toString() + "^" + this.exponent.toString() + "}";
    }

    static combine(left: FactorUnit, right: FactorUnit): FactorUnit {
        if (left.getKind() !== right.getKind()) {
            throw `Cannot combine UnitFactors of different kind (left: ${left}, right: ${right}`;
        }
        return new FactorUnit(left.unit, left.exponent.add(right.exponent))
    }

    /**
     * Combines unit IRI and sign of exponent in one string.
     */
    getKind(): string {
        return this.unit.iri
            + (
                this.exponent.isZero()
                    ? "0"
                    : this.exponent.isPositive()
                        ? "1"
                        : "-1");
    }

    isMatched(selection: FactorUnitSelection, checkedPath: Unit[]): boolean {
        if (selection.isSelected(this, checkedPath)) {
            return true;
        }
        return this.unit.isMatched(selection, checkedPath);
    }

    match(
        factorUnitSelection: FactorUnitSelection[],
        cumulativeExponent: Decimal,
        matchedPath: Unit[],
        scaleFactor: ScaleFactor): FactorUnitSelection[] {
        let mySelection: FactorUnitSelection[] = [];
        factorUnitSelection.forEach(fus => mySelection.push(fus));
        mySelection = this.unit.match(mySelection, this.getExponentCumulated(cumulativeExponent), matchedPath, scaleFactor);
        const ret: FactorUnitSelection[] = [];
        for (const sel of mySelection) {
            const processedSelection: FactorUnitSelection = sel.forMatch(this, cumulativeExponent, matchedPath, scaleFactor);
            if (!processedSelection.equals(sel)) {
                // if there was a match, (i.e, we modified the selection),
                // it's a new partial solution - return it
                ret.push(processedSelection);
            }
            // also regard the selection without the match as a possible partial solution
            ret.push(sel);
        }
        return ret;
    }

}

export class FactorUnitMatch implements SupportsEquals<FactorUnitMatch> {
    readonly matchedFactorUnit: FactorUnit;
    readonly matchedPath: Unit[];
    readonly matchedMultiplier: Decimal;
    readonly scaleFactor: ScaleFactor;


    constructor(matchedFactorUnit: FactorUnit, matchedMultiplier: Decimal, matchedPath: Unit[], scaleFactor: ScaleFactor) {
        this.matchedFactorUnit = matchedFactorUnit;
        this.matchedMultiplier = matchedMultiplier;
        this.matchedPath = [...matchedPath];
        this.scaleFactor = scaleFactor;
    }

    equals(other?: FactorUnitMatch): boolean {
        return !!other
            && this.matchedFactorUnit.equals(other.matchedFactorUnit)
            && arrayEquals(this.matchedPath, other.matchedPath, compareUsingEquals)
            && this.matchedMultiplier.eq(other.matchedMultiplier)
            && this.scaleFactor.equals(other.scaleFactor);
    }

    toString(): string {
        return "FUM{at "
            + this.matchedPath.reduce((prev, cur) => prev + "/" + cur, "")
            + ", MM{"
            + this.matchedMultiplier
            + "}, "
            + this.scaleFactor
            + '}';
    }
}

export class FactorUnitSelector implements SupportsEquals<FactorUnitSelector> {
    readonly unit: Unit;
    readonly exponent: Decimal;
    readonly factorUnitMatch?: FactorUnitMatch;


    constructor(unit: Unit, exponent: Decimal, factorUnitMatch?: FactorUnitMatch) {
        this.unit = unit;
        this.exponent = exponent;
        this.factorUnitMatch = factorUnitMatch;
    }

    equals(other?: FactorUnitSelector): boolean {
        return !!other
            && this.exponent.equals(other.exponent)
            && this.unit.equals(other.unit)
            && (this.factorUnitMatch === other.factorUnitMatch
                || (!!this.factorUnitMatch && this.factorUnitMatch.equals(other.factorUnitMatch)));
    }

    isAvailable(): boolean {
        return !this.isBound();
    }

    isBound(): boolean {
        return !!this.factorUnitMatch
    }

    copy(): FactorUnitSelector {
        return new FactorUnitSelector(this.unit, this.exponent, this.factorUnitMatch);
    }

    matched(factorUnitMatch: FactorUnitMatch): FactorUnitSelector {
        return new FactorUnitSelector(this.unit, this.exponent, factorUnitMatch);
    }

    matches(factorUnit: FactorUnit, cumulativeExponent: Decimal) {
        return this.exponentMatches(factorUnit, cumulativeExponent) && this.unit.isSameScaleAs(factorUnit.unit);
    }

    exponentMatches(factorUnit: FactorUnit, cumulativeExponent: Decimal): boolean {
        const cumulatedFactorUnitExponent = factorUnit.getExponentCumulated(cumulativeExponent);
        return this.exponent.abs().isPositive()
            && this.exponent.abs() >= cumulatedFactorUnitExponent.abs()
            && Decimal.sign(this.exponent) === Decimal.sign(cumulatedFactorUnitExponent);
    }

    forMatch(
        factorUnit: FactorUnit,
        cumulativeExponent: Decimal,
        matchedPath: Unit[],
        scaleFactor: ScaleFactor
    ): FactorUnitSelector[] {
        if (!this.isAvailable()) {
            throw "not available - selector is already bound";
        }
        if (!this.exponentMatches(factorUnit, cumulativeExponent)) {
            throw "exponents do not match";
        }
        const matchedPower = factorUnit.getExponentCumulated(cumulativeExponent);
        const matchedMultiplier = this.calculateMatchedMultiplier(factorUnit, matchedPower);
        if (!matchedMultiplier) {
            throw "units do not match";
        }
        const remainingPower = this.exponent.minus(matchedPower);
        const ret: FactorUnitSelector[] = [];
        ret.push(this.matched(new FactorUnitMatch(factorUnit, matchedMultiplier, matchedPath, scaleFactor)));
        if (!remainingPower.eq(new Decimal("0"))) {
            ret.push(new FactorUnitSelector(this.unit, remainingPower));
        }
        return ret;
    }


    private calculateMatchedMultiplier(factorUnit: FactorUnit, matchedExponent: Decimal): Decimal {
        if (!this.unit.isConvertible(factorUnit.unit)) {
            throw `Not convertible: ${this.unit} -> ${factorUnit.unit}!`;
        }
        const conversionMultiplier = factorUnit.unit.getConversionMultiplier(this.unit);
        return conversionMultiplier.pow(matchedExponent);
    }
}

export class FactorUnitSelection implements SupportsEquals<FactorUnitSelection> {
    readonly selectors: FactorUnitSelector[];

    constructor(selectors: FactorUnitSelector[]) {
        this.selectors = selectors;
    }

    equals(other: FactorUnitSelection): boolean {
        return !!other && arrayEquals(this.selectors, other.selectors, compareUsingEquals);
    }

    toString() {
        return "FUSel{" + this.selectors + "}";
    }

    isSelected(factorUnit: FactorUnit, checkedPath: Unit[]): boolean {
        return this.selectors.some(s =>
            s.factorUnitMatch
            && factorUnit.equals(s.factorUnitMatch.matchedFactorUnit)
            && arrayEquals(checkedPath, s.factorUnitMatch.matchedPath)
        )
    }

    isCompleteMatch(): boolean {
        if (!this.selectors.every(s => s.isBound())) {
            return false;
        }
        const accumulatedScaleFactors = this.selectors.reduce(
            (prev, cur) => !!cur.factorUnitMatch ? cur.factorUnitMatch.scaleFactor.factor.mul(prev) : prev,
            new Decimal("1")
        );
        const accumulatedMatchedMultipliers = this.selectors.reduce(
            (prev, cur) => !!cur.factorUnitMatch ? cur.factorUnitMatch.matchedMultiplier.mul(prev) : prev,
            new Decimal("1")
        );
        const cumulativeScale = accumulatedScaleFactors.mul(accumulatedMatchedMultipliers);
        return cumulativeScale.eq(new Decimal("1"));
    }

    forMatch(factorUnit: FactorUnit, cumulativeExponent: Decimal, matchedPath: Unit[], scaleFactor: ScaleFactor): FactorUnitSelection {
        const newSelectors: FactorUnitSelector[] = [];
        let matched = false;
        for (const sel of this.selectors) {
            if (!matched && sel.isAvailable() && sel.matches(factorUnit, cumulativeExponent)) {
                matched = true;
                sel.forMatch(factorUnit, cumulativeExponent, matchedPath, scaleFactor).forEach(s => newSelectors.push(s));
            } else {
                newSelectors.push(sel.copy());
            }
        }
        return new FactorUnitSelection(newSelectors);
    }
}


export class Unit implements SupportsEquals<Unit> {
    readonly iri: string;
    readonly labels: LangString[];
    readonly prefixIri?: string;
    prefix?: Prefix;
    readonly conversionMultiplier?: Decimal;
    readonly conversionOffset?: Decimal;
    readonly quantityKindIris: string[];
    readonly quantityKinds: QuantityKind[] = [];
    readonly symbol?: string;
    readonly scalingOfIri?: string;
    scalingOf?: Unit;
    readonly dimensionVectorIri?: string;
    readonly factorUnits: FactorUnit[] = [];


    constructor(
        iri: string,
        quantityKindIris?: string[],
        dimensionVectorIri?: string,
        conversionMultiplier?: Decimal,
        conversionOffset?: Decimal,
        prefixIri?: string,
        scalingOfIri?: string,
        scalingOf?: Unit,
        symbol?: string,
        labels?: LangString[],
    ) {
        this.iri = iri;
        this.prefixIri = prefixIri;
        this.conversionMultiplier = conversionMultiplier;
        this.conversionOffset = conversionOffset;
        this.symbol = symbol;
        this.scalingOfIri = scalingOfIri;
        this.scalingOf = scalingOf;
        this.dimensionVectorIri = dimensionVectorIri;
        this.prefix = undefined;
        if (typeof quantityKindIris === 'undefined') {
            this.quantityKindIris = [];
        } else {
            this.quantityKindIris = quantityKindIris;
        }
        if (typeof labels === 'undefined') {
            this.labels = [];
        } else {
            this.labels = labels;
        }
    }

    equals(other?: Unit): boolean {
        return !!other && this.iri === other.iri;
    }

    toString(): string {
        if (this.symbol) {
            return this.symbol;
        }
        if (this.scalingOf?.symbol && this.prefix?.symbol) {
            return this.prefix.symbol + this.scalingOf.symbol;
        }
        return "unit:" + getLastIriElement(this.iri);
    }

    isMatched(selection: FactorUnitSelection, checkedPath: Unit[]): boolean {
        checkedPath.push(this);
        let match = false;
        if (this.hasFactorUnits()) {
            match = this.factorUnits.every(fu => fu.isMatched(selection, checkedPath));
        }
        if (!match) {
            if (typeof this.scalingOf === "undefined") {
                match = false;
            } else {
                match = this.scalingOf.isMatched(selection, checkedPath);
            }
        }
        checkedPath.pop();
        return match;
    }

    match(
        selections: FactorUnitSelection[],
        cumulativeExponent: Decimal,
        matchedPath: Unit[],
        scaleFactor: ScaleFactor): FactorUnitSelection[] {
        const results: FactorUnitSelection[] = [];
        matchedPath.push(this);
        if (this.scalingOf && this.prefix) {
            this.scalingOf
                .match(selections, cumulativeExponent, matchedPath, scaleFactor.multiplyBy(this.prefix.multiplier))
                .forEach(s => results.push(s));
        }
        if (this.hasFactorUnits()){
            for (const factorUnit of this.factorUnits) {
                selections = factorUnit.match(selections, cumulativeExponent, matchedPath, scaleFactor);
            }
        }
        selections.forEach(s => results.push(s));
        matchedPath.pop();
        return results;
    }

    matches(...factorUnitSpec:any[]): boolean {
        if (factorUnitSpec.length % 2 !== 0){
            throw "An even number of arguments is required";
        }
        if (factorUnitSpec.length > 14) {
            throw "No more than 14 arguments (7 factor units) are supported";
        }
        const selectors = [];
        for (let i = 0; i < factorUnitSpec.length; i += 2) {
            const requestedUnit = factorUnitSpec[i];
            let requestedExponent = factorUnitSpec[i + 1];
            if (! (requestedUnit instanceof Unit)){
                throw `argument at 0-based position ${i} is not of type Unit. The input must be between 1 and 7 Unit, exponent pairs`;
            }
            if (typeof requestedExponent === "number") {
                requestedExponent = new Decimal(requestedExponent);
            } else if (! (requestedExponent instanceof Decimal) ){
                throw `argument at 0-based position ${i+1} is not of type Decimal or number. The input must be between 1 and 7 Unit, exponent pairs`;
            }
            selectors.push(new FactorUnitSelector(requestedUnit, requestedExponent));
        }
        let selections = [new FactorUnitSelection(selectors)];
        selections = this.match(selections, new Decimal(1), [], new ScaleFactor());
        if (!selections || selections.length == 0) {
            return false;
        }
        return selections
            .filter(sel => sel.isCompleteMatch())
            .some(sel => this.isMatched(sel, []));
    }

    hasFactorUnits():boolean {
        return this.factorUnits && this.factorUnits.length > 0;
    }

    isScaled(): boolean {
        return !!this.scalingOfIri
    }

    isConvertible(toUnit: Unit): boolean {
        return this.dimensionVectorIri === toUnit.dimensionVectorIri;
    }

    getConversionMultiplier(toUnit: Unit): Decimal {
        if (this.equals(toUnit)) {
            return new Decimal(1);
        }
        if (this.conversionOffset || toUnit.conversionOffset) {
            throw `Cannot convert from ${this} to ${toUnit} just by multiplication, one of them has a conversion offset!`;
        }
        const fromMultiplier = this.conversionMultiplier ? this.conversionMultiplier : new Decimal(1);
        const toMultiplier = toUnit.conversionMultiplier ? toUnit.conversionMultiplier : new Decimal(1);
        return fromMultiplier.div(toMultiplier);
    }


    private findInBasesRecursively(toFind: Unit): boolean {
        if (!this.isScaled()) {
            return this.equals(toFind);
        }
        if (this.scalingOf) {
            return this.findInBasesRecursively(toFind);
        } else {
            throw `No base unit found for ${this} - this is a bug`;
        }
    }

    isSameScaleAs(other: Unit): boolean {
        if (this.equals(other)) {
            return true;
        }
        if (this.scalingOfIri === other.scalingOfIri) {
            return true;
        }
        return this.findInBasesRecursively(other) || other.findInBasesRecursively(this);
    }

    convert(value:Decimal, toUnit:Unit) {
        throw "TODO";
    }

    addLabel(label: LangString): void{
        this.labels.push(label);
    }

    addQuantityKindIri(quantityKindIri: string): void {
        this.quantityKindIris.push(quantityKindIri);
    }

    addQuantityKind(quantityKind: QuantityKind): void {
        this.quantityKinds.push(quantityKind);
    }

    addFactorUnit(factorUnit: FactorUnit): void {
        this.factorUnits.push(factorUnit);
    }

    setPrefix(prefix: Prefix): void {
        if (prefix.iri !== this.prefixIri)
            throw "prefix.iri does not equal this.prefixIri";
        this.prefix = prefix;
    }

    setScalingOf(scalingOf: Unit): void {
        if (scalingOf.iri !== this.scalingOfIri)
            throw "scalingOf.iri does not equal this.scalingOfIri";
        this.scalingOf = scalingOf;
    }
}

export const QUDT_UNIT_BASE_IRI = "http://qudt.org/vocab/unit/";
export const QUDT_QUANTITYKIND_BASE_IRI = "http://qudt.org/vocab/quantitykind/";
export const QUDT_PREFIX_BASE_IRI = "http://qudt.org/vocab/prefix/";

export class Qudt {
    //TODO implement akin to qudtlib-java, checking that the configuration has been provided by a units package

    derivedUnitFromFactors(factorUnitSpecs: any[]): Unit[] {
        return [];
    }

    static unitFromLocalname(localname:string):Unit {
        return Qudt.unit(Qudt.unitIriFromLocalname(localname));
    }

    static quantityKindFromLocalname(localname:string):QuantityKind {
        return Qudt.quantityKind(Qudt.quantityKindIriFromLocalname(localname));
    }

    static prefixFromLocalname(localname:string):Prefix {
        return Qudt.prefix(Qudt.prefixIriFromLocalname(localname));
    }
    
    static unitIriFromLocalname(localname:string): string{
        return QUDT_UNIT_BASE_IRI + localname;
    }

    static quantityKindIriFromLocalname(localname:string): string{
        return QUDT_QUANTITYKIND_BASE_IRI + localname;
    }

    static prefixIriFromLocalname(localname:string): string{
        return QUDT_PREFIX_BASE_IRI + localname;
    }

    static unit(unitIri:string): Unit {
        const ret = config.units.get(unitIri);
        if (typeof ret === "undefined"){
            throw `Unit ${unitIri} not found`;
        }
        return ret;
    }
    
    static quantityKind(quantityKindIri:string): QuantityKind {
        const ret = config.quantityKinds.get(quantityKindIri);
        if (typeof ret === "undefined") {
            throw `QuantityKind ${quantityKindIri} not found`;
        }
        return ret;
    }

    static prefix(prefixIri:string): Prefix {
        const ret = config.prefixes.get(prefixIri);
        if (typeof ret === "undefined") {
            throw `Prefix ${prefixIri} not found`;
        }
        return ret;
    }

}

function getLastIriElement(iri: string) {
    return iri.replaceAll(/.+\/([^\/]+)/g, "$1");
}

interface EqualsComparator<Type> {
    (left: Type, right: Type): boolean
}

function compareUsingEquals<Type extends SupportsEquals<Type>>(a: Type, b: Type) {
    return a.equals(b);
}

function arrayEquals<Type>(left?: Type[], right?: Type[], cmp: EqualsComparator<Type> = (a, b) => a === b) {
    return !!left
        && !!right
        && left.length === right.length
        && left.every((e, i) => cmp(e, right[i]));
}