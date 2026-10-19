// index.js
// The engine's public API. Everything outside src/engine/ imports from here
// and from nowhere else inside it - internal files stay internal, so the
// constraint set can be reorganised without breaking callers.
//
// The engine is pure: plain objects in, plain objects out, no database, no
// config, no clock, no logging. That is enforced by an ESLint rule on
// src/engine/**, and it is what lets the whole suite run in milliseconds and
// the engine move into a worker thread later.

export { evaluate, canAssign } from './constraints/evaluate.js';

// Roster generation (Milestone 4). Pure and deterministic given a seed - the
// caller injects the clock, so the engine still reads nothing of its own.
export { generateRoster } from './scheduling/generateRoster.js';
export { DEFAULT_WEIGHTS, resolveWeights } from './scheduling/weights.js';
export { expandDemand, shiftInstants } from './scheduling/expandDemand.js';
export { scoreRoster } from './scheduling/objective.js';

// The fairness ledger (Milestone 6). Published assignments in, one row per
// worker out, plus the debt map the generator reads - the window end is
// passed in, so this reads no clock either.
export {
  burdenOf,
  isWeekendShift,
  fairnessWindow,
  windowBefore,
  clampWindowStart,
  computeLedger,
  toFairnessDebt,
} from './fairness/index.js';

// The swap chain finder (Milestone 7). Open offers in, direct swaps and
// multi-person chains out - every candidate checked whole by the same
// constraints as above, ranked, and explained when there are none.
export { findSwapOptions, SWAP_SEARCH_DEFAULTS, RANKING_WEIGHTS, applyCycle, legsOf, canonicalKey } from './swaps/index.js';

// Proposed chains (Milestone 8): the pure state machine that decides every
// status change, and the per-person verdict the commit re-checks. Services
// do the reserving and writing; nothing here touches a database.
export { transition, CHAIN_STATUS, CHAIN_STATUSES, TERMINAL_CHAIN_STATUSES, readyToCommit, cycleVerdicts } from './swaps/index.js';

// Type definitions (JSDoc only - no runtime code).
export * from './types.js';
