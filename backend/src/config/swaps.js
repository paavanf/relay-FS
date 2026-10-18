// swaps.js
// The swap chain finder's fixed settings.
//
// An organisation stores only its own chain-length limit (swapPolicy on the
// Organisation model); everything else here belongs to the search itself.
// Services pass these into the pure engine, because src/engine may not
// import config.

export const DEFAULT_SWAP_POLICY = Object.freeze({
  // The longest chain Relay suggests. Every extra person is another person
  // who has to accept before the chain expires, so short is kinder.
  maxChainLength: 4,
});

export const SWAP_CHAIN_LENGTH_RANGE = Object.freeze({ min: 2, max: 5 });

export const SWAP_SEARCH = Object.freeze({
  topN: 5,
  // Keeps one search well inside half a second on the free tier, and stops
  // it there - with the best found so far - if it would run longer.
  limits: Object.freeze({ maxNodes: 200_000, maxCycles: 50_000, budgetMs: 400 }),
  // Weekly hours and consecutive days look up to this far either side of a
  // shift, so everyone's shifts that close to an offer are loaded too.
  contextDays: 14,
});

// Searching is expensive, so the options endpoint gets a tighter budget than
// ordinary reads: per person, per minute.
export const SWAP_OPTIONS_RATE_LIMIT = Object.freeze({ windowMs: 60_000, max: 20 });

export const SWAP_NOTE_MAX_LENGTH = 280;
