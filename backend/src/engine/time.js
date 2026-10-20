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
//
// Anything needing only a UTC instant uses native Date.parse, an order of
// magnitude faster than Luxon, falling back to Luxon for formats it does not
// accept; results are cached (memoise.js explains why that matters). Plain
// calendar-date arithmetic is calendarDays.js, re-exported here.

import { DateTime } from 'luxon';
import { memoise, memoiseTwo } from './memoise.js';

export { daysBetween, addDays } from './calendarDays.js';

// Luxon returns an invalid DateTime rather than throwing, so every helper here
// is total: bad input yields null, and callers decide what that means.
function parseUncached(iso) {
  if (typeof iso !== 'string') return null;
  const dt = DateTime.fromISO(iso, { zone: 'utc' });
  return dt.isValid ? dt : null;
}

const parse = memoise(parseUncached);

// Native parsing handles the ISO-8601-with-offset strings the engine actually
// produces. Anything else falls through to Luxon.
const millisOf = memoise((iso) => {
  if (typeof iso !== 'string') return null;
  const native = Date.parse(iso);
  if (!Number.isNaN(native)) return native;
  return parseUncached(iso)?.toMillis() ?? null;
});

export function isValidInstant(iso) {
  return millisOf(iso) !== null;
}

// Anchored to the epoch rather than to now(). Zone validity does not depend
// on the current time, and reading the clock - even here - would be the one
// impure thing in the engine. Memoised because evaluate() asks on every call,
// and building a DateTime in a zone is one of the dearer steps there is.
const zoneIsValid = memoise((timezone) => DateTime.fromMillis(0, { zone: timezone }).isValid);

export function isValidZone(timezone) {
  return typeof timezone === 'string' && zoneIsValid(timezone);
}

/** Milliseconds since the epoch, or null when the input will not parse. */
export function toMillis(iso) {
  return millisOf(iso);
}

// Keyed by zone, then instant: see memoiseTwo.
const zonedOf = memoiseTwo((timezone, iso) => {
  const dt = parse(iso)?.setZone(timezone);
  if (!dt || !dt.isValid) return null;
  return { date: dt.toISODate(), dayOfWeek: dt.weekday % 7 };
});

function zoned(iso, timezone) {
  if (typeof iso !== 'string') return null;
  return zonedOf(timezone, iso);
}

/** The local calendar date, "2026-03-14", in the org's timezone. */
export function localDate(iso, timezone) {
  return zoned(iso, timezone)?.date ?? null;
}

/**
 * Day of week in the org's timezone, 0-6 with Sunday as 0 - matching
 * Date.getDay() and the dayOfWeek stored on availability and coverage.
 * Luxon counts 1-7 from Monday, so Sunday (7) wraps to 0.
 */
export function localDayOfWeek(iso, timezone) {
  return zoned(iso, timezone)?.dayOfWeek ?? null;
}

/** Real elapsed hours between two instants. Negative if they are reversed. */
export function durationHours(startsAt, endsAt) {
  const a = millisOf(startsAt);
  const b = millisOf(endsAt);
  if (a === null || b === null) return null;
  return (b - a) / 3_600_000;
}
