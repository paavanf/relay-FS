// preferenceMatch.js
// Preferences are advisory. Working a shift someone asked to avoid is legal,
// just worse - so this scores rather than blocks.
//
// Two penalties, weighted differently on purpose:
//   assigned to a shift marked `avoid`   - the heavier one, we did something
//                                          they actively asked us not to
//   a `prefer` that went unmet           - lighter, we merely failed to give
//                                          them something nice
//
// An unmet `prefer` only counts inside the period actually being rostered.
// Penalising a Tuesday preference when the roster does not include a Tuesday
// would make every short roster look bad for no reason.

import { localDate, localDayOfWeek, daysBetween, addDays } from '../../time.js';

const AVOID_PENALTY = 5;
const UNMET_PREFERENCE_PENALTY = 2;

/**
 * @param {import('../../types.js').EngineAssignment[]} assignments
 * @param {import('../../types.js').EngineContext} context
 * @returns {import('../../types.js').SoftPenalty[]}
 */
export function scorePreferenceMatch(assignments, context) {
  const penalties = [];

  const worked = assignments.map((assignment) => ({
    assignment,
    date: localDate(assignment.startsAt, context.timezone),
    dayOfWeek: localDayOfWeek(assignment.startsAt, context.timezone),
  }));

  const dates = worked.map((w) => w.date).filter(Boolean).sort();
  const periodStart = dates[0];
  const periodEnd = dates[dates.length - 1];
  const weekdaysInPeriod = weekdaysCovered(periodStart, periodEnd);

  for (const entry of context.availability) {
    if (entry.status === 'avoid') {
      for (const { assignment, date, dayOfWeek } of worked) {
        if (assignment.membershipId !== entry.membershipId) continue;
        if (!appliesTo(entry, assignment, date, dayOfWeek)) continue;

        penalties.push({
          code: 'AVOIDED_SHIFT',
          membershipId: entry.membershipId,
          assignmentIds: [assignment.id],
          penalty: AVOID_PENALTY,
          message: `Rostered on ${date}, which they asked to avoid.`,
        });
      }
      continue;
    }

    if (entry.status !== 'prefer') continue;
    if (!periodStart) continue;
    if (!fallsInPeriod(entry, periodStart, periodEnd, weekdaysInPeriod)) continue;

    const met = worked.some(
      ({ assignment, date, dayOfWeek }) =>
        assignment.membershipId === entry.membershipId &&
        appliesTo(entry, assignment, date, dayOfWeek),
    );
    if (met) continue;

    penalties.push({
      code: 'UNMET_PREFERENCE',
      membershipId: entry.membershipId,
      assignmentIds: [],
      penalty: UNMET_PREFERENCE_PENALTY,
      message: 'A shift they asked for was not given to them.',
    });
  }

  return penalties;
}

function appliesTo(entry, assignment, date, dayOfWeek) {
  const scoped = entry.shiftTemplateId == null || entry.shiftTemplateId === assignment.shiftTemplateId;
  if (!scoped) return false;
  if (entry.type === 'exception') return entry.date === date;
  return entry.dayOfWeek === dayOfWeek;
}

// An exception counts only on its own date. A recurring preference counts only
// if its weekday actually falls inside the roster - otherwise a Tuesday
// preference would be marked unmet on a roster with no Tuesday in it.
function fallsInPeriod(entry, periodStart, periodEnd, weekdaysInPeriod) {
  if (entry.type === 'exception') return entry.date >= periodStart && entry.date <= periodEnd;
  return weekdaysInPeriod.has(entry.dayOfWeek);
}

// Which days of the week the roster period touches. Seven days or more covers
// all of them, so there is no need to walk a long period day by day.
function weekdaysCovered(periodStart, periodEnd) {
  if (!periodStart) return new Set();

  const span = daysBetween(periodStart, periodEnd);
  if (span === null || span >= 6) return new Set([0, 1, 2, 3, 4, 5, 6]);

  const covered = new Set();
  for (let offset = 0; offset <= span; offset += 1) {
    // These are plain calendar dates, so UTC is the right frame to step in.
    covered.add(localDayOfWeek(`${addDays(periodStart, offset)}T00:00:00Z`, 'utc'));
  }
  return covered;
}
