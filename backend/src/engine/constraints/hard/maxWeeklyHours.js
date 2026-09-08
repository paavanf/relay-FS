// maxWeeklyHours.js
// A worker cannot exceed `rules.maxHoursPerWeek` in any rolling 7-day window.
//
// Two things matter here.
//
// Durations come from the real UTC instants, never from the template's
// nominal times. A shift scheduled 23:00-07:00 across a DST boundary is
// genuinely 7 or 9 hours, and counting it as 8 would let someone quietly go
// over their limit twice a year.
//
// The window is rolling rather than a fixed calendar week, so Thursday-to-
// Wednesday is checked just as much as Monday-to-Sunday. The worst window
// always begins at some assignment's start, so those are the only anchors
// worth testing.

import { byMembership, sortByStart, isUsableLimit, EPSILON } from '../../grouping.js';
import { toMillis, durationHours } from '../../time.js';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * @param {import('../../types.js').EngineAssignment[]} assignments
 * @param {import('../../types.js').EngineContext} context
 * @returns {import('../../types.js').Violation[]}
 */
export function checkMaxWeeklyHours(assignments, context) {
  const limit = context.rules.maxHoursPerWeek;
  if (!isUsableLimit(limit)) return [];

  const violations = [];

  for (const [membershipId, own] of byMembership(assignments)) {
    const ordered = sortByStart(own);
    const starts = ordered.map((a) => toMillis(a.startsAt));
    const hours = ordered.map((a) => durationHours(a.startsAt, a.endsAt));

    // Only the worst window is worth reporting: one violation per worker
    // rather than one per overlapping window saying the same thing.
    let worst = null;

    for (let i = 0; i < ordered.length; i += 1) {
      const windowEnd = starts[i] + SEVEN_DAYS_MS;

      let total = 0;
      const inWindow = [];
      for (let j = i; j < ordered.length && starts[j] < windowEnd; j += 1) {
        total += hours[j];
        inWindow.push(ordered[j].id);
      }

      if (total > limit + EPSILON && (!worst || total > worst.total)) {
        worst = { total, ids: inWindow, from: ordered[i].startsAt };
      }
    }

    if (worst) {
      violations.push({
        code: 'MAX_WEEKLY_HOURS',
        severity: 'hard',
        membershipId,
        assignmentIds: worst.ids,
        message: `${round(worst.total)}h in a 7-day window, maximum is ${limit}h.`,
        details: {
          totalHours: round(worst.total),
          maxHoursPerWeek: limit,
          windowStartsAt: worst.from,
        },
      });
    }
  }

  return violations;
}

function round(hours) {
  return Math.round(hours * 100) / 100;
}
