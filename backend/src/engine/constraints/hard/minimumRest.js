// minimumRest.js
// There must be at least `rules.minRestHours` between the end of one shift and
// the start of the worker's next one.
//
// Each worker's assignments are sorted by start instant and consecutive pairs
// are compared. Two shifts that touch exactly give a gap of zero, which fails
// any positive rest rule - that is the intended behaviour, and the reason
// noDoubleBooking deliberately leaves touching shifts alone.
//
// The gap is measured between real UTC instants, so a rest period spanning a
// clock change is counted as the time people actually got.

import { byMembership, sortByStart, isUsableLimit, EPSILON } from '../../grouping.js';
import { durationHours } from '../../time.js';

/**
 * @param {import('../../types.js').EngineAssignment[]} assignments
 * @param {import('../../types.js').EngineContext} context
 * @returns {import('../../types.js').Violation[]}
 */
export function checkMinimumRest(assignments, context) {
  const minRestHours = context.rules.minRestHours;
  if (!isUsableLimit(minRestHours)) return [];

  const violations = [];

  for (const [membershipId, own] of byMembership(assignments)) {
    const ordered = sortByStart(own);

    for (let i = 0; i + 1 < ordered.length; i += 1) {
      const previous = ordered[i];
      const next = ordered[i + 1];

      const restHours = durationHours(previous.endsAt, next.startsAt);

      // Exactly minRestHours is legal; a minute less is not.
      if (restHours >= minRestHours - EPSILON) continue;

      violations.push({
        code: 'MIN_REST',
        severity: 'hard',
        membershipId,
        assignmentIds: [previous.id, next.id],
        message: `Only ${round(restHours)}h rest between shifts, minimum is ${minRestHours}h.`,
        details: {
          restHours: round(restHours),
          minRestHours,
          previousEndsAt: previous.endsAt,
          nextStartsAt: next.startsAt,
        },
      });
    }
  }

  return violations;
}

function round(hours) {
  return Math.round(hours * 100) / 100;
}
