// dates.js
// The calendar the demo is built on.
//
// Everything is placed relative to one date, the anchor: the Monday of the
// current week in the ward's timezone. The four published weeks end with
// this one and the draft covers the two after it, so the demo always looks
// like a ward in the middle of its rota, never one frozen on the day the
// script was written. Every run in the same week produces identical data;
// the tests pass a fixed anchor, so theirs never changes at all.

import { DateTime } from 'luxon';

export const PUBLISHED_WEEKS = 4;
export const DRAFT_DAYS = 14;

/** The Monday of this week where the ward is, as YYYY-MM-DD. */
export function currentMonday(timezone) {
  return DateTime.now().setZone(timezone).startOf('week').toISODate();
}

export function addDays(isoDate, days) {
  return DateTime.fromISO(isoDate, { zone: 'utc' }).plus({ days }).toISODate();
}

/** "14 Sep" */
export function shortDate(isoDate) {
  return DateTime.fromISO(isoDate, { zone: 'utc' }).toFormat('d LLL');
}

/** The rosters to build, oldest first: four published weeks, then the draft. */
export function rosterPlan(anchor) {
  const published = Array.from({ length: PUBLISHED_WEEKS }, (_, i) => {
    const startDate = addDays(anchor, 7 * (i - PUBLISHED_WEEKS + 1));
    return { startDate, endDate: addDays(startDate, 6), status: 'published' };
  });

  const draftStart = addDays(anchor, 7);
  const draft = { startDate: draftStart, endDate: addDays(draftStart, DRAFT_DAYS - 1), status: 'draft' };

  return [...published, draft];
}
