// fairness.js
// The fairness ledger's fixed settings.
//
// No organisation stores a fairness policy yet, so every organisation uses
// these. Services pass them into the engine - src/engine/ may not import
// config, which keeps it pure and testable with any policy.

// The ledger looks back over this many days, both ends inclusive: 12 weeks.
export const FAIRNESS_WINDOW_DAYS = 84;

// Below this many measured people, a worker is not shown the team average. With
// two, knowing your own figure and the average gives away the other person's
// exactly; with three or more it no longer pins anyone down.
export const MIN_COMPARED_TEAM = 3;

export const DEFAULT_FAIRNESS_POLICY = Object.freeze({
  // A shift that starts on a Saturday or Sunday counts this much heavier. Night
  // shifts are not multiplied here: their template's burdenWeight already says
  // how much heavier a night is.
  weekendMultiplier: 1.5,

  // Only sets the scale of normalisedBurden - "burden per 40 hours of work" -
  // so a week of day shifts reads about 5. Deviations and debts ignore it.
  referenceHours: 40,
});
