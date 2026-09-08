// time.js
// The engine's timezone arithmetic, in one place.
//
// Two different questions need two different answers, and mixing them up is
// the classic rostering bug:
//
//   "How long apart are these?"  -> compare UTC instants. Real elapsed time.
//   "Which day is this?"         -> convert to the org's timezone first. A
//                                   night shift starting 23:00 local Saturday
//                                   belongs to Saturday, even though it is
//                                   already Sunday in UTC.
//
// Durations always come from the actual instants, never from a template's
// nominal times, so a shift crossing a DST boundary counts its real 7 or 9
// hours rather than a notional 8.

import { DateTime } from 'luxon';

// Luxon returns an invalid DateTime rather than throwing, so every helper here
// is total: bad input yields null, and callers decide what that means.
function parse(iso) {
  if (typeof iso !== 'string') return null;
  const dt = DateTime.fromISO(iso, { zone: 'utc' });
  return dt.isValid ? dt : null;
}

export function isValidInstant(iso) {
  return parse(iso) !== null;
}

export function isValidZone(timezone) {
  // Anchored to the epoch rather than to now(). Zone validity does not depend
  // on the current time, and reading the clock - even here - would be the one
  // impure thing in the engine.
  return typeof timezone === 'string' && DateTime.fromMillis(0, { zone: timezone }).isValid;
}

/** Milliseconds since the epoch, or null when the input will not parse. */
export function toMillis(iso) {
  return parse(iso)?.toMillis() ?? null;
}

/** The local calendar date, "2026-03-14", in the org's timezone. */
export function localDate(iso, timezone) {
  return parse(iso)?.setZone(timezone).toISODate() ?? null;
}

/**
 * Day of week in the org's timezone, 0-6 with Sunday as 0 - matching
 * Date.getDay() and the dayOfWeek stored on availability and coverage.
 * Luxon counts 1-7 from Monday, so Sunday (7) wraps to 0.
 */
export function localDayOfWeek(iso, timezone) {
  const dt = parse(iso)?.setZone(timezone);
  return dt ? dt.weekday % 7 : null;
}

/** Real elapsed hours between two instants. Negative if they are reversed. */
export function durationHours(startsAt, endsAt) {
  const a = parse(startsAt);
  const b = parse(endsAt);
  if (!a || !b) return null;
  return b.diff(a, 'hours').hours;
}

/** Whole days from one ISO date to another, used to spot consecutive days. */
export function daysBetween(fromIsoDate, toIsoDate) {
  const a = DateTime.fromISO(fromIsoDate, { zone: 'utc' });
  const b = DateTime.fromISO(toIsoDate, { zone: 'utc' });
  if (!a.isValid || !b.isValid) return null;
  return Math.round(b.diff(a, 'days').days);
}

/** Adds whole days to an ISO date string. */
export function addDays(isoDate, days) {
  const dt = DateTime.fromISO(isoDate, { zone: 'utc' });
  return dt.isValid ? dt.plus({ days }).toISODate() : null;
}
