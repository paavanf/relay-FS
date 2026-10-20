// calendarDays.js
// Arithmetic on calendar dates ("2026-03-14"), which have no time of day and
// no timezone: how many days apart two dates are, and the date some days
// later. Re-exported by time.js, where the rest of the engine finds it.

import { DateTime } from 'luxon';
import { memoiseTwo } from './memoise.js';

/** Whole days from one ISO date to another, used to spot consecutive days. */
export const daysBetween = memoiseTwo((fromIsoDate, toIsoDate) => {
  const a = DateTime.fromISO(fromIsoDate, { zone: 'utc' });
  const b = DateTime.fromISO(toIsoDate, { zone: 'utc' });
  if (!a.isValid || !b.isValid) return null;
  return Math.round(b.diff(a, 'days').days);
});

/** Adds whole days to an ISO date string. */
export const addDays = memoiseTwo((isoDate, days) => {
  const dt = DateTime.fromISO(isoDate, { zone: 'utc' });
  return dt.isValid ? dt.plus({ days }).toISODate() : null;
});
