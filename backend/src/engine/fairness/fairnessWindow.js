// fairnessWindow.js
// The dates a fairness ledger covers.
//
// A window is a run of whole days ending on `endDate`. BOTH ends are inclusive,
// and they are local calendar dates in the organisation's timezone: a shift
// counts when the day it starts on is on or after startDate and on or before
// endDate. The end is always passed in - the engine never asks what day it is.

import { addDays, daysBetween, localDate } from '../time.js';

function daysInclusive(startDate, endDate) {
  const days = daysBetween(startDate, endDate);
  return Number.isFinite(days) && days >= 0 ? days + 1 : 0;
}

/** e.g. fairnessWindow('2026-10-19', 84) covers 2026-07-28 to 2026-10-19. */
export function fairnessWindow(endDate, days) {
  return { startDate: addDays(endDate, -(days - 1)), endDate, days };
}

/** The window that ends the day before `startDate` - the history before a roster. */
export function windowBefore(startDate, days) {
  return fairnessWindow(addDays(startDate, -1), days);
}

/**
 * The same window, but starting no earlier than `earliestDate` - the day the
 * organisation's published history begins. Weeks nobody was rostered in are
 * not weeks anyone was "under" in.
 */
export function clampWindowStart(window, earliestDate) {
  const startDate = earliestDate && earliestDate > window.startDate ? earliestDate : window.startDate;
  return { startDate, endDate: window.endDate, days: daysInclusive(startDate, window.endDate) };
}

/** True when a local date ("2026-03-14") falls inside the window. */
export function inWindow(date, window) {
  if (typeof date !== 'string') return false;
  return date >= window.startDate && date <= window.endDate;
}

/**
 * Weeks of the window someone was in the team: from the later of the window
 * start and the local day they joined, to the window end. 0 if they joined
 * after it ended.
 */
export function activeWeeks(joinedAt, window, timezone) {
  const joined = joinedAt ? localDate(joinedAt, timezone) : null;
  const from = joined && joined > window.startDate ? joined : window.startDate;
  return daysInclusive(from, window.endDate) / 7;
}
