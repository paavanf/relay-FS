// numbers.js
// Two tiny helpers the fairness ledger leans on to never produce NaN.

/** The value if it is a finite number above zero, otherwise the fallback. */
export function positiveOr(value, fallback) {
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

/** Sum of a list of numbers; 0 for an empty list. */
export function sum(values) {
  return values.reduce((total, value) => total + value, 0);
}
