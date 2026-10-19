// cycleVerdicts.js
// The constraint engine's verdict on a swap after it happens, person by
// person - the commit's last check, and the rule check a manager sees
// before approving.
//
// The same question validateCycle.js asks for the finder: each person's
// own schedule with what they give and what they take applied together,
// evaluated by the M3 engine. No rule of its own. This version keeps each
// broken rule's message as well as its code, because a person reads it.

import { evaluate } from '../constraints/evaluate.js';
import { applyCycle } from './applyCycle.js';
import { createOwnContext } from './ownContext.js';

/**
 * cycle: [{ id, membershipId, assignmentId }] in order - each person takes
 * the next one's shift, and the last takes the first one's.
 * @returns {{ membershipId: string, hardViolations: { code: string, message: string }[] }[]}
 */
export function cycleVerdicts({ assignments, context, cycle }) {
  const after = applyCycle(assignments, cycle);
  const ownContext = createOwnContext(context);

  return cycle.map(({ membershipId }) => {
    const schedule = after.filter((assignment) => assignment.membershipId === membershipId);
    const { hardViolations } = evaluate(schedule, ownContext(membershipId), { skipSoft: true });
    return { membershipId, hardViolations: hardViolations.map(({ code, message }) => ({ code, message })) };
  });
}
