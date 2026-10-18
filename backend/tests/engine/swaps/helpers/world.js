// world.js
// Hand-built swap scenarios: a few people, their shifts written in local
// time, and the offers they make. Plain objects, like every engine fixture.
//
// March 2026 in Asia/Kolkata: Monday the 2nd, Tuesday the 3rd, and so on.

import { context, localShift, worker, template } from '../../helpers/build.js';
import { findSwapOptions } from '../../../../src/engine/index.js';

export const TEMPLATES = [
  { ...template('t-day', 'day', 1), startLocal: '07:00', endLocal: '15:00' },
  { ...template('t-eve', 'evening', 1.3), startLocal: '15:00', endLocal: '23:00' },
  { ...template('t-night', 'night', 1.8), startLocal: '23:00', endLocal: '07:00', crossesMidnight: true },
];

const TIMES = { 't-day': ['07:00', '15:00'], 't-eve': ['15:00', '23:00'], 't-night': ['23:00', '07:00'] };

/** shift('a1', 'A', 't-night', '2026-03-02') - A's night shift starting Monday 2 March. */
export function shift(id, membershipId, shiftTemplateId, date) {
  const [start, end] = TIMES[shiftTemplateId];
  return localShift({ id, membershipId, shiftTemplateId, date, start, end });
}

export function offer(id, membershipId, assignmentId) {
  return { id, membershipId, assignmentId };
}

/** An engine context for these people, with whatever rules and availability the test needs. */
export function world({ people, availability = [], coverage = [], rules = {} }) {
  return context({
    workers: people.map((id) => (typeof id === 'string' ? worker(id, ['RN']) : worker(id.id, id.qualificationIds))),
    shiftTemplates: TEMPLATES,
    availability,
    coverage,
    rules: { minRestHours: 11, maxConsecutiveDays: 5, maxHoursPerWeek: 48, ...rules },
  });
}

/** Runs the finder for one request, with everything else defaulted. */
export function search({ request, offers, assignments, ctx, ...rest }) {
  return findSwapOptions({ request, offers, assignments, context: ctx, ...rest });
}

/** The chain as the people in it, in hand-over order: ['A', 'B', 'C'] means A takes B's, B takes C's, C takes A's. */
export const peopleIn = (chain) => chain.legs.map((leg) => leg.to);
