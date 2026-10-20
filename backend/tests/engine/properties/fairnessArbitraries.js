// fairnessArbitraries.js
// fast-check generators for the fairness ledger properties.
//
// Shifts are built from a start offset and a duration in minutes, so every
// instant is real and every shift has a positive length. Offsets reach a day
// past both ends of the window, so the boundary is exercised in every run.
// Workers mix contracted hours with "no contract on file", and some join
// part-way through the window.

import fc from 'fast-check';
import { DateTime } from 'luxon';
import { computeLedger } from '../../../src/engine/index.js';
import { template } from '../helpers/build.js';

export const RUNS = 300;
export const POLICY = { weekendMultiplier: 1.5, referenceHours: 40 };
export const WINDOW = { startDate: '2026-03-02', endDate: '2026-03-29', days: 28 };
export const TEMPLATES = [template('t-day', 'day', 1), template('t-eve', 'evening', 1.3), template('t-night', 'night', 1.8)];

const BASE = DateTime.fromISO('2026-03-01T00:00:00Z', { zone: 'utc' });
const MEMBERS = ['w1', 'w2', 'w3', 'w4', 'w5'];
// 't-unknown' has no template: it must count as a neutral weight, not crash.
const TEMPLATE_IDS = ['t-day', 't-eve', 't-night', 't-unknown'];
// A half-hour offset, two DST zones in opposite hemispheres, and plain UTC.
export const TIMEZONES = ['UTC', 'Europe/London', 'Asia/Kolkata', 'America/New_York', 'Australia/Sydney'];

export const pattern = fc.record({
  shiftTemplateId: fc.constantFrom(...TEMPLATE_IDS),
  startOffsetMinutes: fc.integer({ min: 0, max: 60 * 24 * 30 }),
  durationMinutes: fc.integer({ min: 30, max: 60 * 14 }),
});

export function toAssignment(membershipId, raw) {
  const startsAt = BASE.plus({ minutes: raw.startOffsetMinutes });
  return {
    membershipId,
    shiftTemplateId: raw.shiftTemplateId,
    startsAt: startsAt.toISO(),
    endsAt: startsAt.plus({ minutes: raw.durationMinutes }).toISO(),
  };
}

export const terms = fc.record({
  contractedHoursPerWeek: fc.oneof(fc.constant(0), fc.integer({ min: 4, max: 60 })),
  joinedOffsetDays: fc.option(fc.integer({ min: -20, max: 32 }), { nil: undefined }),
});

export function toWorker(membershipId, { contractedHoursPerWeek, joinedOffsetDays }) {
  const joinedAt = joinedOffsetDays === undefined ? undefined : BASE.plus({ days: joinedOffsetDays }).toISO();
  return { membershipId, contractedHoursPerWeek, joinedAt };
}

const team = fc
  .uniqueArray(fc.constantFrom(...MEMBERS), { minLength: 1, maxLength: MEMBERS.length })
  .chain((ids) => fc.tuple(...ids.map(() => terms)).map((all) => ids.map((id, i) => toWorker(id, all[i]))));

/** A random team, random shifts for its members (and one outsider), a zone. */
export const ledgerInput = team.chain((workers) =>
  fc.record({
    workers: fc.constant(workers),
    timezone: fc.constantFrom(...TIMEZONES),
    assignments: fc
      .array(fc.tuple(fc.constantFrom(...workers.map((w) => w.membershipId), 'outsider'), pattern), { maxLength: 40 })
      .map((pairs) => pairs.map(([id, raw]) => toAssignment(id, raw))),
  }),
);

export function ledgerFor({ workers, assignments, timezone }) {
  return computeLedger({ assignments, workers, shiftTemplates: TEMPLATES, policy: POLICY, window: WINDOW, timezone });
}

/** A night starting 23:00 on Saturday 14 March in `timezone`: the heaviest kind of shift. */
export function weekendNight(membershipId, timezone) {
  const startsAt = DateTime.fromISO('2026-03-14T23:00', { zone: timezone });
  return { membershipId, shiftTemplateId: 't-night', startsAt: startsAt.toUTC().toISO(), endsAt: startsAt.plus({ hours: 8 }).toUTC().toISO() };
}

// A seeded shuffle, so a failing case can be replayed exactly.
export function shuffled(list, seed) {
  const copy = [...list];
  let state = seed >>> 0;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    const j = state % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
