// build.js
// Fixture builders for the engine tests.
//
// Engine tests never touch a database - the engine takes plain objects, so the
// fixtures are plain objects too. That is what lets this whole suite run in
// milliseconds.
//
// `localShift` is the important one: it takes wall-clock times in a timezone
// and works out the real UTC instants, including the roll into the next day.
// Writing the UTC instants by hand is how DST and midnight bugs get baked into
// the tests themselves.

import { DateTime } from 'luxon';

// A zone with no DST at all, and a half-hour offset - so a test that quietly
// assumes UTC, or assumes whole-hour offsets, fails here.
export const TZ = 'Asia/Kolkata';

// Used for the daylight-saving cases. US clocks go forward on 2026-03-08 and
// back on 2026-11-01.
export const DST_TZ = 'America/New_York';

export function context(overrides = {}) {
  return {
    workers: [],
    shiftTemplates: [],
    availability: [],
    coverage: [],
    rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 40 },
    timezone: TZ,
    ...overrides,
  };
}

/**
 * An assignment described the way a human would: "the night shift on the 14th,
 * 23:00 to 07:00". Returns real UTC instants.
 */
export function localShift({
  id = 'a1',
  membershipId = 'w1',
  shiftTemplateId = 't-day',
  date,
  start,
  end,
  zone = TZ,
}) {
  const startsAt = DateTime.fromISO(`${date}T${start}`, { zone });

  let endsAt = DateTime.fromISO(`${date}T${end}`, { zone });
  // An end at or before the start means the shift runs into the next day.
  if (endsAt <= startsAt) endsAt = endsAt.plus({ days: 1 });

  return {
    id,
    membershipId,
    shiftTemplateId,
    date,
    startsAt: startsAt.toUTC().toISO(),
    endsAt: endsAt.toUTC().toISO(),
  };
}

export function worker(membershipId, qualificationIds = [], contractedHoursPerWeek = 37.5) {
  return { membershipId, qualificationIds, contractedHoursPerWeek };
}

export function template(id, category = 'day', burdenWeight = 1) {
  return {
    id,
    startLocal: '09:00',
    endLocal: '17:00',
    crossesMidnight: false,
    category,
    burdenWeight,
  };
}

export function availability(overrides = {}) {
  return {
    membershipId: 'w1',
    type: 'recurring',
    dayOfWeek: null,
    date: null,
    shiftTemplateId: null,
    status: 'unavailable',
    ...overrides,
  };
}

export function coverage(shiftTemplateId, dayOfWeek, requirements) {
  return { shiftTemplateId, dayOfWeek, requirements };
}

/** Just the codes, for asserting what fired without pinning every message. */
export function codesOf(violations) {
  return violations.map((v) => v.code);
}
