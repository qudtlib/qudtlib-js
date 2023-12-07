import { arrayContains } from "./utils.js";
export class AssignmentProblem {
  static instance(weights: number[][]) {
    const rows = weights.length;
    if (!rows) {
      throw "Cannot create instance with 0x0 weights matrix";
    }
    const cols = weights[0].length;
    if (rows > cols) {
      throw "The weights matrix may not have more rows than columns";
    }
    return new NaiveAlgorithmInstance(AssignmentProblem.copy(weights));
  }

  private static copy(weights: number[][]): number[][] {
    const ret: number[][] = [];
    weights.forEach((row) => ret.push(row));
    return ret;
  }
}

export abstract class Instance {
  readonly weights: number[][];
  readonly rows: number;
  readonly cols: number;

  constructor(weights: number[][]) {
    if (!weights?.length || !weights[0]?.length) {
      throw "Not a valid weights matrix: " + weights;
    }
    this.weights = weights;
    this.rows = weights.length;
    this.cols = weights[0].length;
  }

  public weightOfAssignment(assignment: number[]): number | undefined {
    if (!assignment) {
      throw "Not a valid assignment: " + assignment;
    }
    if (assignment?.length === 0) {
      return undefined;
    }
    const sum = assignment
      .map((col, row) => this.weights[row][col])
      .reduce((a, b) => a + b);
    return sum;
  }

  public abstract solve(): Solution;
}

export class Solution {
  readonly assignment: number[];
  readonly weight: number | undefined;
  readonly instance: Instance;

  constructor(instance: Instance, assignment?: number[]) {
    this.instance = instance;
    this.assignment = assignment || [];
    this.weight = instance.weightOfAssignment(this.assignment);
  }

  isComplete(): boolean {
    return this.assignment.length >= this.instance.rows;
  }

  isEmpty(): boolean {
    return this.assignment.length === 0;
  }

  assignColumnInNextRow(col: number): Solution {
    if (this.isComplete()) {
      throw "Solution is already complete";
    }
    return new Solution(this.instance, [...this.assignment, col]);
  }

  isBetterSolutionThan(other: Solution): boolean {
    if (!(this.isComplete() && other.isComplete())) {
      throw "Cannot compare incomplete solutions";
    }
    if (
      typeof this.weight === "undefined" ||
      typeof other.weight === "undefined"
    ) {
      throw "Cannot compare empty solutions";
    }
    return this.weight < other.weight;
  }
}

class ValueWithIndex {
  readonly value: number;
  readonly index: number;

  constructor(value: number, index: number) {
    this.value = value;
    this.index = index;
  }
}

export class NaiveAlgorithmInstance extends Instance {
  private currentBestSolution?: Solution;

  constructor(weights: number[][]) {
    super(weights);
  }

  isLowerThanBestWeight(weightToTest: number): boolean {
    if (!this.currentBestSolution) {
      return true;
    }
    if (!this.currentBestSolution.isComplete()) {
      return true;
    }
    if (!this.currentBestSolution.weight) {
      return true;
    }
    return this.currentBestSolution.weight > weightToTest;
  }

  updateBestSolutionIfPossible(candidate: Solution) {
    if (
      !this.currentBestSolution ||
      candidate.isBetterSolutionThan(this.currentBestSolution)
    ) {
      this.currentBestSolution = candidate;
    }
  }

  solve(): Solution {
    this.doSolve(0, new Solution(this));
    if (!this.currentBestSolution) {
      return new Solution(this);
    }
    return this.currentBestSolution;
  }

  doSolve(row: number, solution: Solution) {
    if (row >= this.rows) {
      this.updateBestSolutionIfPossible(solution);
      return;
    }
    if (solution.weight) {
      const bestAttainableScore = this.sum(
        this.minPerRow(row, solution.assignment),
      );
      if (!this.isLowerThanBestWeight(solution.weight + bestAttainableScore)) {
        return;
      }
    }
    const nMin = this.rowSortedAscending(row, solution.assignment);
    for (let i = 0; i < nMin.length; i++) {
      if (
        !solution.weight ||
        this.isLowerThanBestWeight(solution.weight + nMin[i].value)
      ) {
        this.doSolve(row + 1, solution.assignColumnInNextRow(nMin[i].index));
      }
    }
  }

  private minPerRow(startRow: number, skipCols: number[]): number[] {
    const ret = [];
    for (let r = startRow; r < this.rows; r++) {
      let min = Number.MAX_VALUE;
      for (let c = 0; c < this.cols; c++) {
        if (!arrayContains(skipCols, c)) {
          const val = this.weights[r][c];
          if (min > val) {
            min = val;
          }
        }
      }
      ret.push(min);
    }
    return ret;
  }

  private sum(arr: number[]) {
    return arr.reduce((a, b) => a + b);
  }

  private rowSortedAscending(
    row: number,
    skipCols: number[],
  ): ValueWithIndex[] {
    const sorted: ValueWithIndex[] = [];
    for (let i = 0; i < this.cols; i++) {
      if (!arrayContains(skipCols, i)) {
        sorted.push(new ValueWithIndex(this.weights[row][i], i));
      }
    }
    sorted.sort((l, r) => l.value - r.value);
    return sorted;
  }
}
