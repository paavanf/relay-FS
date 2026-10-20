// engineArbitraries.js
// The generated cases the engine properties run against: assignments built
// from an offset and a duration in minutes (so every instant is real and
// every shift has a positive length, ids unique by index), availability,
// coverage and rules, across a deliberately awkward set of timezones.

import fc from 'fast-check';
import { DateTime } from 'luxon';

export const RUNS = 500;

const BASE = DateTime.fromISO('2026-03-01T00:00:00Z', { zone: 'utc' });
const MEMBERSHIP_IDS = ['w1', 'w2', 'w3'];
const TEMPLATE_IDS = ['t-day', 't-eve', 't-night'];
const QUALIFICATION_IDS = ['RN', 'CN', 'HCA'];

// A deliberately awkward set: a half-hour offset, two DST zones with opposite
// hemispheres, and one 45-minute offset.
const TIMEZONES = ['UTC', 'Asia/Kolkata', 'America/New_York', 'Australia/Sydney', 'Pacific/Chatham'];

const rawAssignment = fc.record({
  membershipId: fc.constantFrom(...MEMBERSHIP_IDS),
  shiftTemplateId: fc.constantFrom(...TEMPLATE_IDS),
  startOffsetMinutes: fc.integer({ min: 0, max: 60 * 24 * 21 }),
  durationMinutes: fc.integer({ min: 30, max: 60 * 14 }),
});

function toAssignment(raw, index) {
  const startsAt = BASE.plus({ minutes: raw.startOffsetMinutes });
  const endsAt = startsAt.plus({ minutes: raw.durationMinutes });

  return {
    id: `a${index}`,
    membershipId: raw.membershipId,
    shiftTemplateId: raw.shiftTemplateId,
    date: startsAt.toISODate(),
    startsAt: startsAt.toISO(),
    endsAt: endsAt.toISO(),
  };
}

export const assignmentsArb = fc
  .array(rawAssignment, { maxLength: 10 })
  .map((raws) => raws.map(toAssignment));

const availabilityArb = fc.record({
  membershipId: fc.constantFrom(...MEMBERSHIP_IDS),
  type: fc.constantFrom('recurring', 'exception'),
  dayOfWeek: fc.integer({ min: 0, max: 6 }),
  date: fc
    .integer({ min: 0, max: 21 })
    .map((d) => BASE.plus({ days: d }).toISODate()),
  shiftTemplateId: fc.option(fc.constantFrom(...TEMPLATE_IDS), { nil: null }),
  status: fc.constantFrom('unavailable', 'prefer', 'avoid'),
});

const coverageArb = fc.record({
  shiftTemplateId: fc.constantFrom(...TEMPLATE_IDS),
  dayOfWeek: fc.integer({ min: 0, max: 6 }),
  requirements: fc.array(
    fc.record({
      qualificationId: fc.constantFrom(...QUALIFICATION_IDS),
      count: fc.integer({ min: 1, max: 4 }),
    }),
    { maxLength: 3 },
  ),
});

export const contextArb = fc.record({
  workers: fc.constant(
    MEMBERSHIP_IDS.map((membershipId) => ({
      membershipId,
      qualificationIds: [],
      contractedHoursPerWeek: 37.5,
    })),
  ),
  shiftTemplates: fc.constant(
    TEMPLATE_IDS.map((id, i) => ({
      id,
      startLocal: '09:00',
      endLocal: '17:00',
      crossesMidnight: false,
      category: ['day', 'evening', 'night'][i],
      burdenWeight: 1 + i * 0.5,
    })),
  ),
  availability: fc.array(availabilityArb, { maxLength: 6 }),
  coverage: fc.array(coverageArb, { maxLength: 4 }),
  rules: fc.record({
    minRestHours: fc.integer({ min: 0, max: 16 }),
    maxConsecutiveDays: fc.integer({ min: 1, max: 7 }),
    maxHoursPerWeek: fc.integer({ min: 8, max: 60 }),
  }),
  timezone: fc.constantFrom(...TIMEZONES),
});
