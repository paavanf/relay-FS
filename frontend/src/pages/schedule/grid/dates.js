// dates.js
// Turning a roster's date range into the columns the grid draws.
//
// Everything here works on local calendar dates ("2026-03-02") rather than
// instants, because a column is a day on a wall planner - a night shift
// starting 23:00 belongs to the day it started.

import { DateTime } from 'luxon';

/** Every date in the range, inclusive, as { date, weekday, dayNumber, isWeekend }. */
export function buildColumns(startDate, endDate) {
  let cursor = DateTime.fromISO(startDate, { zone: 'utc' });
  const last = DateTime.fromISO(endDate, { zone: 'utc' });
  if (!cursor.isValid || !last.isValid) return [];

  const columns = [];
  while (cursor <= last && columns.length < 100) {
    columns.push({
      date: cursor.toISODate(),
      weekday: cursor.toFormat('ccc'),
      dayNumber: cursor.toFormat('d'),
      month: cursor.toFormat('LLL'),
      isWeekend: cursor.weekday >= 6,
    });
    cursor = cursor.plus({ days: 1 });
  }

  return columns;
}

/**
 * Assignments keyed by "membershipId|date", so drawing a cell is one map
 * lookup. Filtering the whole array per cell would be 560 scans on a
 * fortnight's ward.
 */
export function indexAssignments(assignments) {
  const index = new Map();
  for (const assignment of assignments) {
    index.set(`${assignment.membershipId}|${assignment.date}`, assignment);
  }
  return index;
}

/** Shift templates by id, for looking up a cell's name and category. */
export function indexTemplates(templates) {
  const index = new Map();
  for (const template of templates) index.set(String(template._id ?? template.id), template);
  return index;
}
