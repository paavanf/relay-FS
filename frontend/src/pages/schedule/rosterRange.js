// rosterRange.js
// What makes a roster date range acceptable.
//
// Mirrors the server's rule exactly. The cap is real rather than arbitrary:
// coverage rules expand per day, so a year-long range would produce tens of
// thousands of slots and a generation run nobody would wait for.

export const MAX_ROSTER_DAYS = 42;

export function daysInRange(startDate, endDate) {
  const days = Math.round((Date.parse(endDate) - Date.parse(startDate)) / 86_400_000) + 1;
  return Number.isFinite(days) ? days : 0;
}

export function validateRange({ name, startDate, endDate }) {
  const errors = {};

  if (!name || name.trim().length < 2) errors.name = 'Give the roster a name.';
  if (!startDate) errors.startDate = 'Pick a first day.';
  if (!endDate) errors.endDate = 'Pick a last day.';

  if (startDate && endDate) {
    if (endDate < startDate) {
      errors.endDate = 'The last day cannot be before the first.';
    } else if (daysInRange(startDate, endDate) > MAX_ROSTER_DAYS) {
      errors.endDate = `A roster can cover at most ${MAX_ROSTER_DAYS} days.`;
    }
  }

  return errors;
}
