import { SupportsEquals } from "./baseTypes";

export function getLastIriElement(iri: string) {
  return iri.replaceAll(/.+\/([^\/]+)/g, "$1");
}

interface EqualsComparator<Type> {
  (left: Type, right: Type): boolean;
}

/**
 * Compares two instances, `left` and `right`, yielding a negative result if `left` is smaller,
 * a positive result if `left` is greater, and 0 if they are equal.
 */
interface OrderComparator<Type> {
  (left: Type, right: Type): number;
}

export const BooleanComparator: OrderComparator<boolean> = (
  left: boolean,
  right: boolean
) => (left === right ? 0 : left ? 1 : -1);
export const NumberComparator: OrderComparator<number> = (
  left: number,
  right: number
) => (left < right ? -1 : left == right ? 0 : 1);

export const StringComparator: OrderComparator<string> = (
  left: string,
  right: string
) => (left < right ? -1 : left === right ? 0 : 1);

export function compareUsingEquals<Type extends SupportsEquals<Type>>(
  a: Type,
  b: Type
) {
  return a.equals(b);
}

export function arrayDeduplicate<Type>(
  arr: Type[],
  cmp: EqualsComparator<Type> = (a, b) => a === b
): Type[] {
  if (!arr || !arr.length || arr.length === 0) {
    return arr;
  }
  return arr.reduce(
    (prev: Type[], cur: Type) =>
      prev.some((p) => cmp(p, cur)) ? prev : [...prev, cur],
    []
  );
}

export function arrayEquals<Type>(
  left?: Type[],
  right?: Type[],
  cmp: EqualsComparator<Type> = (a, b) => a === b
): boolean {
  return (
    !!left &&
    !!right &&
    left.length === right.length &&
    left.every((e, i) => cmp(e, right[i]))
  );
}

export function arrayEqualsIgnoreOrdering<Type>(
  left?: Type[],
  right?: Type[],
  cmp: EqualsComparator<Type> = (a, b) => a === b
): boolean {
  if (!!left && !!right && left.length === right.length) {
    const unmatched = Array.from({ length: left.length }, (v, i) => i);
    outer: for (let i = 0; i < left.length; i++) {
      for (let j = 0; j < unmatched.length; j++) {
        if (cmp(left[i], right[unmatched[j]])) {
          unmatched.splice(j, 1);
          continue outer;
        }
      }
      return false;
    }
    return true;
  }
  return false;
}

export function arrayCountEqualElements<Type>(
  left?: Type[],
  right?: Type[],
  cmp: EqualsComparator<Type> = (a, b) => a === b
): number {
  if (!!left && !!right) {
    const unmatched = Array.from({ length: left.length }, (v, i) => i);
    outer: for (let i = 0; i < left.length; i++) {
      for (let j = 0; j < unmatched.length; j++) {
        if (cmp(left[i], right[unmatched[j]])) {
          unmatched.splice(j, 1);
          continue outer;
        }
      }
    }
    return left.length - unmatched.length;
  }
  return 0;
}

export function arrayMin<Type>(arr: Type[], cmp: OrderComparator<Type>): Type {
  if (!arr || !arr?.length) {
    throw "array is undefined or empty";
  }
  let min: Type | undefined = undefined;
  for (const elem of arr as Type[]) {
    if (typeof min === "undefined" || cmp(min, elem) > 0) {
      min = elem;
    }
  }
  if (typeof min === "undefined") {
    throw "no minimum found";
  }
  return min;
}

export function arrayMax<Type>(arr: Type[], cmp: OrderComparator<Type>): Type {
  return arrayMin(arr, (left, right) => -1 * cmp(left, right));
}

export function arrayContains<Type>(
  arr: Type[],
  toFind: Type,
  cmp: EqualsComparator<Type> = (a, b) => a === b
) {
  if (!arr) {
    throw "array is undefined";
  }
  for (const elem of arr as Type[]) {
    if (cmp(elem, toFind)) {
      return true;
    }
  }
  return false;
}

export function checkInteger(arg: number, argName: string) {
  if (!Number.isInteger(arg)) {
    throw `${argName} must be integer, ${arg} (type ${typeof arg}) is not`;
  }
}

export function findInIterable<T>(
  iterable: IterableIterator<T>,
  predicate: (value: T) => boolean
): T | undefined {
  for (const elem of iterable) {
    if (predicate(elem)) {
      return elem;
    }
  }
  return undefined;
}
