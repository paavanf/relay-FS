// preferenceScope.js
// Which shifts a preference is about, for preferenceMatch.js: the entry's
// shift template (or every shift), its date or weekday - and whether a
// recurring preference's weekday falls inside the period being rostered at
// all, so a short roster is not marked down for days it never covers.

import { localDayOfWeek, daysBetween, addDays } from '../../time.js';

// Also how the swap ranking reads "did they mark this shift avoid or
// prefer" - through this one rule rather than a copy of it.
export function appliesTo(entry, assignment, date, dayOfWeek) {
  const scoped = entry.shiftTemplateId == null || entry.shiftTemplateId === assignment.shiftTemplateId;
  if (!scoped) return false;
  if (entry.type === 'exception') return entry.date === date;
  return entry.dayOfWeek === dayOfWeek;
}

// An exception counts only on its own date. A recurring preference counts only
// if its weekday actually falls inside the roster - otherwise a Tuesday
// preference would be marked unmet on a roster with no Tuesday in it.
export function fallsInPeriod(entry, periodStart, periodEnd, weekdaysInPeriod) {
  if (entry.type === 'exception') return entry.date >= periodStart && entry.date <= periodEnd;
  return weekdaysInPeriod.has(entry.dayOfWeek);
}

// Which days of the week the roster period touches. Seven days or more covers
// all of them, so there is no need to walk a long period day by day.
export function weekdaysCovered(periodStart, periodEnd) {
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
