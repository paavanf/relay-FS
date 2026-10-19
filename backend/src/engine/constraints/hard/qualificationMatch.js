// qualificationMatch.js
// A worker can only be assigned to a shift they are qualified for.
//
// Every assignment made since roles were recorded knows which place on the
// shift it fills - its slotQualificationId, "the charge nurse's place" - and
// then the assignee must hold exactly that qualification. Holding some other
// qualification the shift happens to need is not enough. This is what stops
// a swap or a hand edit from leaving a shift without its charge nurse: the
// role travels with the assignment, so whoever receives it must hold it.
//
// An assignment with no role recorded - one made before roles existed - falls
// back to the older, looser rule: does this worker hold AT LEAST ONE of the
// qualifications the shift's coverage rule calls for? Without a role there is
// no saying which place the person was filling, so the most that can be
// asked is whether they could fill any of them. The rule is found by the
// shift template and the weekday, computed in the org's timezone, and no
// coverage data (or a rule asking for nothing) leaves it nothing to enforce.
//
// Whether the counts are met is a different question about the roster as a
// whole, and belongs to the generator rather than to a per-assignment check.

import { localDayOfWeek } from '../../time.js';
import { indexBy } from '../../grouping.js';

// The qualifications that would let someone hold this assignment.
function acceptedFor(assignment, context) {
  if (assignment.slotQualificationId) return [assignment.slotQualificationId];

  const dayOfWeek = localDayOfWeek(assignment.startsAt, context.timezone);
  const rule = context.coverage.find((c) => c.shiftTemplateId === assignment.shiftTemplateId && c.dayOfWeek === dayOfWeek);
  return rule?.requirements?.map((r) => r.qualificationId) ?? [];
}

/**
 * @param {import('../../types.js').EngineAssignment[]} assignments
 * @param {import('../../types.js').EngineContext} context
 * @returns {import('../../types.js').Violation[]}
 */
export function checkQualificationMatch(assignments, context) {
  const workersById = indexBy(context.workers, 'membershipId');
  const violations = [];

  for (const assignment of assignments) {
    const accepted = acceptedFor(assignment, context);
    if (accepted.length === 0) continue;

    // A worker the context does not know about is treated as holding nothing.
    // We cannot show they are qualified, so the safe answer is that they are
    // not - better a false rejection than an unqualified person on a ward.
    const held = workersById.get(assignment.membershipId)?.qualificationIds ?? [];
    if (accepted.some((qualificationId) => held.includes(qualificationId))) continue;

    violations.push({
      code: 'QUALIFICATION_MISMATCH',
      severity: 'hard',
      membershipId: assignment.membershipId,
      assignmentIds: [assignment.id],
      message: assignment.slotQualificationId ? 'Not qualified for this role on the shift.' : 'Not qualified for this shift.',
      details: { requiredOneOf: accepted, held, role: assignment.slotQualificationId ?? null },
    });
  }

  return violations;
}
