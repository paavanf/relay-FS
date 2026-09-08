// weights.js
// Every tunable number the generator uses, in one object.
//
// These get changed constantly while tuning, so they are data rather than
// constants scattered through the scoring code - `npm run evaluate` compares
// two of these objects side by side, which is only possible because a whole
// configuration is one value you can pass around.
//
// Scores are COSTS: lower is better, everywhere.

export const DEFAULT_WEIGHTS = Object.freeze({
  // An unfilled slot is a shift with nobody on it. Raising this makes the
  // generator accept almost any amount of unfairness or preference-breaking
  // to fill a hole. It must stay far larger than any realistic sum of the
  // soft terms below, or the objective would prefer a tidy roster with gaps
  // in it over a slightly messy one that is fully covered.
  UNFILLED_PENALTY: 10_000,

  // Cost of giving more burden to someone already carrying more than their
  // share. Scaled by the shift's burdenWeight, so a night costs more than a
  // day. Raise it to spread the unpleasant shifts harder, at the cost of
  // ignoring people's stated preferences more often.
  fairnessDebt: 40,

  // How uneven the burden is across the whole team, measured as variance.
  // fairnessDebt above reacts to history; this reacts to the roster in hand.
  // Raise it to make every roster internally even.
  fairnessVariance: 8,

  // Rostering someone on a shift they marked "avoid". Raise it to respect
  // stated preferences more; too high and coverage suffers.
  avoidPenalty: 30,

  // Reward for giving someone a shift they asked for. Subtracted, so it pulls
  // the score down. Raise it to hand out more of what people asked for.
  preferBonus: 20,

  // Reward for keeping someone on the same kind of shift as the adjacent day.
  // People want runs of nights, not night-day-night. Raise it for stabler
  // patterns, at the cost of flexibility in filling awkward slots.
  continuityBonus: 15,

  // Cost of switching someone's shift category between adjacent days.
  categorySwitchPenalty: 25,

  // Cost proportional to how many OTHER slots this worker could still cover.
  // Someone who can cover a lot is worth saving for the slots nobody else can
  // take, so using them here is charged more. Raise it to hoard flexible
  // workers harder; too high and the generator hesitates to use anyone.
  flexibility: 2,
});

/** Caller weights layered over the defaults, so a partial override works. */
export function resolveWeights(overrides) {
  return overrides ? { ...DEFAULT_WEIGHTS, ...overrides } : DEFAULT_WEIGHTS;
}
