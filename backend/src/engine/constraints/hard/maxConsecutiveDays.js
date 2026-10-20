// maxConsecutiveDays.js
// A worker cannot work more than `rules.maxConsecutiveDays` calendar days in
// a row.
//
// "Calendar day" is the day in the ORGANISATION'S timezone, taken from when
// the shift starts. A night shift beginning 23:00 local on Saturday counts as
// Saturday, which is what the person working it would say - even though the
// same instant is already Sunday in UTC.

import { byMembership, sortByStart, isUsableLimit } from '../../grouping.js';
import { localDate, daysBetween } from '../../time.js';

/**
 * @param {import('../../types.js').EngineAssignment[]} assignments
 * @param {import('../../types.js').EngineContext} context
 * @returns {import('../../types.js').Violation[]}
 */
export function checkMaxConsecutiveDays(assignments, context) {
  const limit = context.rules.maxConsecutiveDays;
  if (!isUsableLimit(limit)) return [];

  const violations = [];

  for (const [membershipId, own] of byMembership(assignments)) {
    // Several shifts can fall on one day; a day is worked or it is not.
    // Taken in chronological order (start, end, id) so the shifts a run
    // reports are listed the same way whatever order they arrived in.
    const byDay = new Map();
    for (const assignment of sortByStart(own)) {
      const day = localDate(assignment.startsAt, context.timezone);
      const ids = byDay.get(day);
      if (ids) ids.push(assignment.id);
      else byDay.set(day, [assignment.id]);
    }

    const days = [...byDay.keys()].sort();

    // Walk the sorted days, extending the current run while each day is
    // exactly one after the last, and reporting a run when it ends.
    let runStart = 0;
    for (let i = 1; i <= days.length; i += 1) {
      const stillConsecutive = i < days.length && daysBetween(days[i - 1], days[i]) === 1;
      if (stillConsecutive) continue;

      const run = days.slice(runStart, i);
      if (run.length > limit) {
        violations.push({
          code: 'MAX_CONSECUTIVE_DAYS',
          severity: 'hard',
          membershipId,
          assignmentIds: run.flatMap((day) => byDay.get(day)),
          message: `${run.length} days in a row, maximum is ${limit}.`,
          details: { days: run, consecutiveDays: run.length, maxConsecutiveDays: limit },
        });
      }

      runStart = i;
    }
  }

  return violations;
}
