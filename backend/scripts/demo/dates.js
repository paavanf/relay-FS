// dates.js
// The calendar the demo is built on.
//
// Everything is placed relative to one date, the anchor: the Monday of the
// current week in the ward's timezone. Five weeks are published - the two
// before this one, this one, and the next two, since wards publish ahead -
// and the draft covers the two weeks after that. The weeks ahead are what
// people offer shifts from for swaps, so there are always shifts still to
// come, whatever day the seed runs. The demo looks like a ward in the middle
// of its rota, never one frozen on the day the script was written. Every run
// in the same week produces identical data; the tests pass a fixed anchor,
// so theirs never changes at all.

import { DateTime } from 'luxon';

export const WEEKS_BEFORE = 2;
export const WEEKS_AHEAD = 2;
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

/** Every date of the published weeks ahead (next week and the one after) - where swap requests come from. */
export function datesAhead(anchor) {
  return Array.from({ length: 7 * WEEKS_AHEAD }, (_, i) => addDays(anchor, 7 + i));
}

/** The rosters to build, oldest first: the published weeks, then the draft. */
export function rosterPlan(anchor) {
  const published = Array.from({ length: WEEKS_BEFORE + 1 + WEEKS_AHEAD }, (_, i) => {
    const startDate = addDays(anchor, 7 * (i - WEEKS_BEFORE));
    return { startDate, endDate: addDays(startDate, 6), status: 'published' };
  });

  const draftStart = addDays(anchor, 7 * (WEEKS_AHEAD + 1));
  const draft = { startDate: draftStart, endDate: addDays(draftStart, DRAFT_DAYS - 1), status: 'draft' };

  return [...published, draft];
}
