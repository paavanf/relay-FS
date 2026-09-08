// qualificationMatch.js
// A worker can only be assigned to a shift they are qualified for.
//
// What a slot needs comes from the coverage rule for that (shiftTemplate,
// dayOfWeek) pair, with the weekday computed in the org's timezone.
//
// The check is: does this worker hold AT LEAST ONE of the qualifications that
// slot calls for? If Sunday night needs 2 Registered Nurses and 1 Care Nurse,
// then everyone rostered onto Sunday night must be an RN or a CN - but no
// single person has to be both. Whether the counts are actually met is a
// different question about the roster as a whole, and belongs to the
// generator rather than to a per-assignment legality check.
//
// No coverage data, or a rule with no requirements, means there is nothing to
// enforce yet and the check passes.

import { localDayOfWeek } from '../../time.js';
import { indexBy } from '../../grouping.js';

/**
 * @param {import('../../types.js').EngineAssignment[]} assignments
 * @param {import('../../types.js').EngineContext} context
 * @returns {import('../../types.js').Violation[]}
 */
export function checkQualificationMatch(assignments, context) {
  if (context.coverage.length === 0) return [];

  const workersById = indexBy(context.workers, 'membershipId');
  const violations = [];

  for (const assignment of assignments) {
    const dayOfWeek = localDayOfWeek(assignment.startsAt, context.timezone);

    const rule = context.coverage.find(
      (c) => c.shiftTemplateId === assignment.shiftTemplateId && c.dayOfWeek === dayOfWeek,
    );

    const required = rule?.requirements?.map((r) => r.qualificationId) ?? [];
    if (required.length === 0) continue;

    // A worker the context does not know about is treated as holding nothing.
    // We cannot show they are qualified, so the safe answer is that they are
    // not - better a false rejection than an unqualified person on a ward.
    const held = workersById.get(assignment.membershipId)?.qualificationIds ?? [];
    if (required.some((qualificationId) => held.includes(qualificationId))) continue;

    violations.push({
      code: 'QUALIFICATION_MISMATCH',
      severity: 'hard',
      membershipId: assignment.membershipId,
      assignmentIds: [assignment.id],
      message: 'Not qualified for this shift.',
      details: { requiredOneOf: required, held },
    });
  }

  return violations;
}
