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
// PERFORMANCE. These are the hottest functions in the codebase - generating a
// fortnight's roster calls them millions of times, and a Luxon parse costs
// tens of microseconds. Two things follow:
//
//   results are memoised, which is safe because every function here is pure
//   and the inputs repeat constantly (the same few hundred instants, over and
//   over, for the whole run);
//
//   anything needing only a UTC instant uses native Date.parse, which is an
//   order of magnitude faster than Luxon, falling back to Luxon for formats
//   it does not accept.
//
// Before this, evaluating a 150-assignment roster took 90ms, which made
// generation take minutes rather than seconds.

import { DateTime } from 'luxon';

// Bounded so a long-lived process cannot grow one of these without limit. The
// working set is tiny - a roster has a few hundred distinct instants - so the
// cap is never reached in practice and exists purely as a safety net.
const CACHE_LIMIT = 20_000;

function memoise(compute) {
  const cache = new Map();

  return (key, ...rest) => {
    if (cache.has(key)) return cache.get(key);

    const value = compute(key, ...rest);
    if (cache.size >= CACHE_LIMIT) cache.clear();
    cache.set(key, value);
    return value;
  };
}

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

export function isValidZone(timezone) {
  // Anchored to the epoch rather than to now(). Zone validity does not depend
  // on the current time, and reading the clock - even here - would be the one
  // impure thing in the engine.
  return typeof timezone === 'string' && DateTime.fromMillis(0, { zone: timezone }).isValid;
}

/** Milliseconds since the epoch, or null when the input will not parse. */
export function toMillis(iso) {
  return millisOf(iso);
}

const zonedOf = memoise((cacheKey, iso, timezone) => {
  const dt = parse(iso)?.setZone(timezone);
  if (!dt || !dt.isValid) return null;
  return { date: dt.toISODate(), dayOfWeek: dt.weekday % 7 };
});

function zoned(iso, timezone) {
  if (typeof iso !== 'string') return null;
  return zonedOf(`${iso}|${timezone}`, iso, timezone);
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

// Same idea as memoise, for the two-argument helpers above.
function memoiseTwo(compute) {
  const cache = new Map();

  return (first, second) => {
    const key = `${first}|${second}`;
    if (cache.has(key)) return cache.get(key);

    const value = compute(first, second);
    if (cache.size >= CACHE_LIMIT) cache.clear();
    cache.set(key, value);
    return value;
  };
}
