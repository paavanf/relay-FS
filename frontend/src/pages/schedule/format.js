// format.js
// Shared date and duration formatting for the schedule pages.
// One place, so a shift reads the same way in the grid, the unfilled panel
// and My Shifts.

import { DateTime } from 'luxon';

/** "Monday 2 March" */
export function formatLongDate(isoDate) {
  const dt = DateTime.fromISO(isoDate, { zone: 'utc' });
  return dt.isValid ? dt.toFormat('cccc d LLLL') : isoDate;
}

/** "Mon 2 Mar" */
export function formatShortDate(isoDate) {
  const dt = DateTime.fromISO(isoDate, { zone: 'utc' });
  return dt.isValid ? dt.toFormat('ccc d LLL') : isoDate;
}

/** "07:00", read in the organisation's timezone rather than the browser's. */
export function formatTime(instant, timezone) {
  const dt = DateTime.fromISO(instant).setZone(timezone ?? 'utc');
  return dt.isValid ? dt.toFormat('HH:mm') : '';
}

/** "8h" or "7h 30m" - real elapsed time, so a clock change is counted. */
export function formatDuration(startsAt, endsAt) {
  const start = DateTime.fromISO(startsAt);
  const end = DateTime.fromISO(endsAt);
  if (!start.isValid || !end.isValid) return '';

  const minutes = Math.round(end.diff(start, 'minutes').minutes);
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

/** The ISO week a date falls in, used to group My Shifts. */
export function weekKey(isoDate) {
  const dt = DateTime.fromISO(isoDate, { zone: 'utc' });
  return dt.isValid ? `${dt.weekYear}-W${String(dt.weekNumber).padStart(2, '0')}` : isoDate;
}

/** "Week of Mon 2 Mar" */
export function weekLabel(isoDate) {
  const dt = DateTime.fromISO(isoDate, { zone: 'utc' });
  return dt.isValid ? `Week of ${dt.startOf('week').toFormat('ccc d LLL')}` : isoDate;
}
