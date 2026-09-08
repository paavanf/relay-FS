// noDoubleBooking.js
// Nobody can be in two places at once: a worker may not hold two assignments
// whose time ranges overlap.
//
// Comparison is on UTC instants, so timezones and DST never enter into it.
// Two shifts that merely touch - one ends exactly when the next begins - do
// NOT overlap. That is a rest problem, not a double-booking problem, and
// minimumRest is the right place to complain about it.

import { byMembership, sortByStart } from '../../grouping.js';
import { toMillis } from '../../time.js';

/**
 * @param {import('../../types.js').EngineAssignment[]} assignments
 * @param {import('../../types.js').EngineContext} _context
 * @returns {import('../../types.js').Violation[]}
 */
export function checkNoDoubleBooking(assignments, _context) {
  const violations = [];

  for (const [membershipId, own] of byMembership(assignments)) {
    const ordered = sortByStart(own);

    // Sorted by start, so anything overlapping assignment i must begin before
    // i ends. Stop scanning forward as soon as one starts at or after it.
    for (let i = 0; i < ordered.length; i += 1) {
      const endOfFirst = toMillis(ordered[i].endsAt);

      for (let j = i + 1; j < ordered.length; j += 1) {
        const startOfSecond = toMillis(ordered[j].startsAt);
        if (startOfSecond >= endOfFirst) break;

        violations.push({
          code: 'DOUBLE_BOOKED',
          severity: 'hard',
          membershipId,
          assignmentIds: [ordered[i].id, ordered[j].id],
          message: 'Assigned to two shifts that overlap in time.',
          details: {
            first: { startsAt: ordered[i].startsAt, endsAt: ordered[i].endsAt },
            second: { startsAt: ordered[j].startsAt, endsAt: ordered[j].endsAt },
          },
        });
      }
    }
  }

  return violations;
}
