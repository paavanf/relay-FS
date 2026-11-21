// scheduleSummary.js
// The figures behind the Schedule summary strip, from what the page already
// has: each day's coverage status (the same rule as the coverage row), how
// many shifts are rostered and to how many people, and how many shifts could
// not be filled. Nothing is estimated or invented.
//
// Days no coverage rule asks for anyone on ('none') have nothing to cover,
// so they are neither counted as covered nor counted against the roster.
import { buildColumns } from './grid/dates.js';
import { coverageOn, coverageStatus } from './grid/coverage.js';

export function summariseRoster({ roster, assignments, unfilledSlots, templates, roles }) {
  const days = buildColumns(roster.startDate, roster.endDate).map((column) => ({
    ...column,
    status: coverageStatus(coverageOn(column.date, { ...roles, templates })),
  }));

  return {
    days,
    ruled: days.filter((day) => day.status !== 'none').length,
    covered: days.filter((day) => day.status === 'covered').length,
    anyShort: days.some((day) => day.status === 'short'),
    shifts: assignments.length,
    people: new Set(assignments.map((assignment) => assignment.membershipId)).size,
    unfilled: unfilledSlots.length,
  };
}

/**
 * What the Unfilled tile says. "Every shift is covered" only when it is true:
 * there are shifts, the generator left no holes, and every day a coverage
 * rule asks for anyone is covered. Otherwise it says honestly what it knows.
 */
export function unfilledTile(summary, { canGenerate }) {
  if (summary.ruled === 0) return { value: '-', tone: 'neutral', detail: 'No coverage rule asks for anyone on these days.' };
  if (summary.shifts === 0) {
    return { value: '-', tone: 'neutral', detail: canGenerate ? 'No shifts yet. Generate this roster to fill it.' : 'No shifts yet.' };
  }
  if (summary.unfilled > 0) return { value: summary.unfilled, tone: 'danger', detail: 'listed below, with the reason' };
  if (summary.covered === summary.ruled) return { value: 0, tone: 'success', detail: 'every shift is covered' };
  return { value: '-', tone: 'neutral', detail: 'Some days are short - see the coverage row.' };
}
