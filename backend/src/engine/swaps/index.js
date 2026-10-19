// index.js
// The swap chain finder's public face inside the engine. engine/index.js
// re-exports from here; nothing outside src/engine/ imports these files
// directly.

export { findSwapOptions, SWAP_SEARCH_DEFAULTS } from './findSwapOptions.js';
export { RANKING_WEIGHTS } from './rankChains.js';
export { applyCycle, legsOf, canonicalKey } from './applyCycle.js';

// Proposed chains (Milestone 8): the state machine every status change goes
// through, and the engine's verdict on a chain after it happens.
export { transition } from './chainStateMachine.js';
export { CHAIN_STATUS, CHAIN_STATUSES, TERMINAL_CHAIN_STATUSES, readyToCommit } from './chainStates.js';
export { cycleVerdicts } from './cycleVerdicts.js';
