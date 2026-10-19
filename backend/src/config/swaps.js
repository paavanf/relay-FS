// swaps.js
// Swap settings: an organisation's swap rules (their defaults and bounds),
// and the swap chain finder's fixed settings.
//
// An organisation stores its own rules (swapPolicy on the Organisation
// model); everything else here belongs to the search itself. Services pass
// these into the pure engine, because src/engine may not import config.

export const DEFAULT_SWAP_POLICY = Object.freeze({
  // The longest chain Relay suggests. Every extra person is another person
  // who has to accept before the chain expires, so short is kinder.
  maxChainLength: 4,
  // How long the people in a proposed swap have to accept it. A proposal
  // also ends when the earliest of its shifts starts.
  acceptanceWindowHours: 48,
  // Whether a manager approves a swap everyone has accepted before it
  // happens. On unless an organisation turns it off: on a ward, someone
  // usually wants to know who is covering what.
  requireManagerApproval: true,
});

export const SWAP_CHAIN_LENGTH_RANGE = Object.freeze({ min: 2, max: 4 });
export const SWAP_ACCEPTANCE_WINDOW_RANGE = Object.freeze({ min: 1, max: 168 });

// The newest notifications the Swaps page lists (the full notification
// centre is Milestone 9).
export const NOTIFICATION_LIST_LIMIT = 30;

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

// The kinds of shift an offer can say it would take in return - the shift
// template categories (models/ShiftTemplate.js).
export const SHIFT_CATEGORIES = Object.freeze(['day', 'evening', 'night']);
