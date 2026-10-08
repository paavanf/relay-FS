// shifts.js
// Counting shifts the way the fairness ledger defines them - re-derived here
// from raw assignments, so the specs check the ledger rather than repeat it:
//
//   a night     is a shift on a template whose category is night
//   a weekend   is a shift that STARTS on a Saturday or Sunday, in the
//               ward's own timezone
//   heavy       nights plus weekends, as the Fairness page lists them

const formats = new Map();

function weekdayIn(timezone, instant) {
  if (!formats.has(timezone)) {
    formats.set(timezone, new Intl.DateTimeFormat('en-GB', { timeZone: timezone, weekday: 'short' }));
  }
  return formats.get(timezone).format(new Date(instant));
}

export function startsOnWeekend(startsAt, timezone) {
  return ['Sat', 'Sun'].includes(weekdayIn(timezone, startsAt));
}

export function hoursOf(assignment) {
  return (Date.parse(assignment.endsAt) - Date.parse(assignment.startsAt)) / 3_600_000;
}

/** Totals for one person's assignments. categoryOf maps a template id to its category. */
export function countShifts(assignments, { categoryOf, timezone }) {
  const nights = assignments.filter((a) => categoryOf.get(a.shiftTemplateId) === 'night').length;
  const weekends = assignments.filter((a) => startsOnWeekend(a.startsAt, timezone)).length;
  const hours = Math.round(assignments.reduce((sum, a) => sum + hoursOf(a), 0) * 100) / 100;
  return { shifts: assignments.length, nights, weekends, heavy: nights + weekends, hours };
}

export function average(values) {
  return values.length === 0 ? 0 : Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) / 100;
}
