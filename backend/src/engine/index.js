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

// Type definitions (JSDoc only - no runtime code).
export * from './types.js';
