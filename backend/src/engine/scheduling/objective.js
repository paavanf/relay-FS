// objective.js
// One number for a whole roster. Lower is better.
//
// This is what local search hill-climbs on, so everything the generator is
// supposed to care about has to be in here - anything left out is something
// it will happily destroy to improve the rest.
//
//   unfilled slots   dominant, see UNFILLED_PENALTY in weights.js
//   soft penalties   preferences, pattern breaks and fairness debt, taken
//                    straight from the constraint engine's evaluate()
//   fairness spread  how unevenly burden is shared across the team
//
// Note there is deliberately no separate pattern-discontinuity term: pattern
// breaks already arrive through evaluate()'s soft score, and adding them
// again here would weight them twice for no stated reason.

import { evaluate } from '../constraints/evaluate.js';
import { indexBy } from '../grouping.js';

/**
 * @returns {{ score: number, softScore: number, unfilledCount: number,
 *             fairnessVariance: number, isValid: boolean }}
 */
export function scoreRoster({ assignments, unfilledSlots, context, weights }) {
  const result = evaluate(assignments, context);
  const variance = burdenVariance(assignments, context);

  const score =
    unfilledSlots.length * weights.UNFILLED_PENALTY +
    result.softScore +
    variance * weights.fairnessVariance;

  return {
    score,
    softScore: result.softScore,
    unfilledCount: unfilledSlots.length,
    fairnessVariance: variance,
    isValid: result.isValid,
  };
}

/**
 * How unevenly the heavy shifts are shared out, as the variance of each
 * worker's total burden. Zero means everyone carries the same load.
 *
 * Every worker counts, including those with nothing assigned - leaving them
 * out would make a roster that overloads two people and ignores eight look
 * perfectly even.
 */
export function burdenVariance(assignments, context) {
  const workers = context.workers ?? [];
  if (workers.length === 0) return 0;

  const templates = indexBy(context.shiftTemplates ?? [], 'id');

  const burdenByWorker = new Map(workers.map((w) => [w.membershipId, 0]));
  for (const assignment of assignments) {
    if (!burdenByWorker.has(assignment.membershipId)) continue;
    const weight = templates.get(assignment.shiftTemplateId)?.burdenWeight ?? 1;
    burdenByWorker.set(
      assignment.membershipId,
      burdenByWorker.get(assignment.membershipId) + weight,
    );
  }

  const totals = [...burdenByWorker.values()];
  const mean = totals.reduce((sum, t) => sum + t, 0) / totals.length;

  return totals.reduce((sum, t) => sum + (t - mean) ** 2, 0) / totals.length;
}
