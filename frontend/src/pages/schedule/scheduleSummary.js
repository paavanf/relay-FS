// scheduleSummary.js
// The figures behind the Schedule summary strip, from what the page already
// has: each day's coverage status (the same rule as the coverage row), how
// many shifts are rostered and to how many people, and how many shifts could
// not be filled. Nothing is estimated or invented.
import { buildColumns } from './grid/dates.js';
import { coverageOn, coverageStatus } from './grid/coverage.js';

export function summariseRoster({ roster, assignments, unfilledSlots, templates, roles }) {
  const days = buildColumns(roster.startDate, roster.endDate).map((column) => ({
    ...column,
    status: coverageStatus(coverageOn(column.date, { ...roles, templates })),
  }));

  return {
    days,
    covered: days.filter((day) => day.status === 'covered').length,
    anyShort: days.some((day) => day.status === 'short'),
    shifts: assignments.length,
    people: new Set(assignments.map((assignment) => assignment.membershipId)).size,
    unfilled: unfilledSlots.length,
  };
}
