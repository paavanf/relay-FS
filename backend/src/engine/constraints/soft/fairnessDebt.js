// fairnessDebt.js
// Stops the roster piling more unpleasant work onto whoever is already
// carrying more than their share.
//
// This is a deliberate seam rather than the finished feature. The real ledger
// arrives in Milestone 6; what exists now is the interface it will plug into,
// so M6 becomes "compute the numbers" instead of "refactor the engine".
//
// `context.fairnessDebt` is a map of membershipId -> number, where a positive
// value means the worker is already over their fair share of burden. When it
// is absent - which is every caller today - this returns nothing at all.
//
// The penalty scales with the shift's own burdenWeight, so handing a night to
// someone already in debt costs more than handing them a quiet day.

import { indexBy } from '../../grouping.js';

/**
 * @param {import('../../types.js').EngineAssignment[]} assignments
 * @param {import('../../types.js').EngineContext} context
 * @returns {import('../../types.js').SoftPenalty[]}
 */
export function scoreFairnessDebt(assignments, context) {
  const debts = context.fairnessDebt;
  if (!debts || typeof debts !== 'object') return [];

  const templates = indexBy(context.shiftTemplates, 'id');
  const penalties = [];

  for (const assignment of assignments) {
    const debt = debts[assignment.membershipId];
    if (!Number.isFinite(debt) || debt <= 0) continue;

    const burdenWeight = templates.get(assignment.shiftTemplateId)?.burdenWeight ?? 1;
    const penalty = debt * burdenWeight;
    if (penalty <= 0) continue;

    penalties.push({
      code: 'FAIRNESS_DEBT',
      membershipId: assignment.membershipId,
      assignmentIds: [assignment.id],
      penalty,
      message: 'Adds burden to someone already above their fair share.',
    });
  }

  return penalties;
}
