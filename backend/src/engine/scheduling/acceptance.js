// acceptance.js
// The two questions improve.js asks on every step of its search: is this
// candidate roster better than the best so far - legal AND lower scoring -
// and has the deadline passed? The deadline is read through an injected
// now(); the engine reads no clock of its own.

import { scoreRoster } from './objective.js';

// A candidate is only better if it is both legal AND lower scoring. Legality
// is asked of the constraint engine, never inferred from the move.
//
// scoreRoster already evaluates the roster and reports isValid, so both
// questions come from one evaluation rather than two - which halves the cost
// of the hot loop.
export function isBetter(candidate, bestScore, context, weights) {
  const scored = scoreRoster({ ...candidate, context, weights });
  return scored.isValid && scored.score < bestScore;
}

export function outOfTime(now, deadlineAt) {
  if (typeof now !== 'function' || !Number.isFinite(deadlineAt)) return false;
  return now() >= deadlineAt;
}
