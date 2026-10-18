// rankChains.js
// Orders valid chains, best first. A lower score is better, and every weight
// lives in RANKING_WEIGHTS so the trade-offs sit in one place.
//
//   people      each extra person is another chance the chain falls
//               through, so size dominates: a direct swap beats a three-way
//               one unless the direct swap is much worse for its people
//   preference  a hand-over onto a shift its receiver marked avoid costs;
//               onto one they asked for is rewarded
//   fairness    burden moving toward whoever carries less than their share
//               (the M6 debt) is rewarded: how much closer the participants
//               together sit to a fair share, after against before
//
// Apart from size, every part of a score belongs to one hand-over
// (handOverTerms.js). So a score is perPerson × size plus the hand-overs'
// costs added up - which also says how good an unfinished chain could still
// turn out to be (lowestTotal), and lets the search drop the ones that could
// never make the list.

import { createHandOverTerms } from './handOverTerms.js';
import { canonicalKey } from './applyCycle.js';

export const RANKING_WEIGHTS = Object.freeze({
  perPerson: 10,
  avoided: 4,
  preferred: -2,
  fairnessGain: -1,
});

// Totals are rounded to cents twice (the fairness part, then the whole), so a
// bound on the unrounded sum is loosened by this much before it is trusted.
const ROUNDING_SLACK = 0.02;

const round2 = (value) => Math.round(value * 100) / 100;

export function createScorer(inputs) {
  const termsFor = createHandOverTerms(inputs);
  const w = RANKING_WEIGHTS;
  const costOf = (t) => w.avoided * t.avoided + w.preferred * t.preferred + w.fairnessGain * t.gain;

  /** { total, people, avoided, preferred, fairnessGain } for one valid cycle. */
  function score(cycle) {
    let avoided = 0;
    let preferred = 0;
    let gain = 0;
    cycle.forEach((taker, i) => {
      const terms = termsFor(taker, cycle[(i + 1) % cycle.length]);
      avoided += terms.avoided;
      preferred += terms.preferred;
      gain += terms.gain;
    });
    const fairnessGain = round2(gain);
    const total = w.perPerson * cycle.length + w.avoided * avoided + w.preferred * preferred + w.fairnessGain * fairnessGain;
    return { total: round2(total), people: cycle.length, avoided, preferred, fairnessGain };
  }

  /**
   * The lowest total any chain of `length` people beginning with `path` could
   * reach: the hand-overs it already has as they are, and each one still to
   * come as good as `bestHandOver`, the lowest cost any hand-over can have.
   */
  function lowestTotal(path, length, bestHandOver) {
    let known = 0;
    for (let i = 0; i + 1 < path.length; i += 1) known += costOf(termsFor(path[i], path[i + 1]));
    return w.perPerson * length + known + (length - (path.length - 1)) * bestHandOver - ROUNDING_SLACK;
  }

  return { score, lowestTotal, handOverCost: (taker, taken) => costOf(termsFor(taker, taken)) };
}

/** Scored and sorted, best first. Ties go by canonical key, so order never depends on the search's. */
export function rankChains(cycles, scorer) {
  return cycles
    .map((cycle) => ({ cycle, key: canonicalKey(cycle), score: scorer.score(cycle) }))
    .sort((a, b) => a.score.total - b.score.total || (a.key < b.key ? -1 : 1));
}
