// tiedStartTimes.test.js
// A regression test: fast-check's counterexample to "does not depend on the
// order the assignments arrive in" (properties/engineChanges.test.js), kept
// as fixed data. One worker in Pacific/Chatham (UTC+13:45) holds two shifts
// that start and end at the same instant - a double booking - and a third
// that starts at midnight local time the next day. Every order of the three
// must give the same verdict, the same violations naming the same shifts in
// the same order, and the same soft score. Before the tie-break fix, the
// soft score was 3 in one order and 0 in another: the shift that set a day's
// character was whichever of the tied two came first.
//
// Then the order that fixes it (grouping.js compareByTime): start instant,
// then end instant, then id in plain code-point order.

import { describe, it, expect } from 'vitest';
import { evaluate } from '../../src/engine/index.js';
import { compareByTime } from '../../src/engine/grouping.js';

const shift = (id, shiftTemplateId, startsAt, endsAt) => ({ id, membershipId: 'w3', shiftTemplateId, date: '2026-03-01', startsAt, endsAt });
const a0 = shift('a0', 't-eve', '2026-03-01T00:10:00.000Z', '2026-03-01T00:40:00.000Z');
const a1 = shift('a1', 't-day', '2026-03-01T00:10:00.000Z', '2026-03-01T00:40:00.000Z');
const a2 = shift('a2', 't-day', '2026-03-01T10:15:00.000Z', '2026-03-01T10:45:00.000Z');

const template = (id, category, burdenWeight) => ({ id, startLocal: '09:00', endLocal: '17:00', crossesMidnight: false, category, burdenWeight });
const context = {
  workers: ['w1', 'w2', 'w3'].map((membershipId) => ({ membershipId, qualificationIds: [], contractedHoursPerWeek: 37.5 })),
  shiftTemplates: [template('t-day', 'day', 1), template('t-eve', 'evening', 1.5), template('t-night', 'night', 2)],
  availability: [],
  coverage: [],
  rules: { minRestHours: 0, maxConsecutiveDays: 1, maxHoursPerWeek: 8 },
  timezone: 'Pacific/Chatham',
};

const ORDERS = [
  [a0, a1, a2],
  [a0, a2, a1],
  [a1, a0, a2],
  [a1, a2, a0],
  [a2, a0, a1],
  [a2, a1, a0],
];

// Everything evaluate() says, written down so two answers compare whole.
const answerFor = (assignments) => {
  const result = evaluate(assignments, context);
  return {
    isValid: result.isValid,
    softScore: result.softScore,
    hard: result.hardViolations.map((v) => `${v.code} ${v.assignmentIds.join(',')}`).sort(),
    soft: result.softPenalties.map((p) => `${p.code} ${p.assignmentIds.join(',')}`).sort(),
  };
};

describe('two shifts starting at the same instant', () => {
  it('get one answer whatever order the assignments arrive in', () => {
    const answers = ORDERS.map(answerFor);
    for (const answer of answers) expect(answer).toEqual(answers[0]);

    // a0 and a1 tie on start and end, so id decides: a0, an evening, sets
    // the day's character, and a2 the next day is a day shift - one switch.
    expect(answers[0]).toMatchObject({ isValid: false, softScore: 3, soft: ['CATEGORY_SWITCH a0,a2'] });
    expect(answers[0].hard).toEqual(['DOUBLE_BOOKED a0,a1', 'MAX_CONSECUTIVE_DAYS a0,a1,a2', 'MIN_REST a0,a1']);
  });
});

describe('the engine order of things in time', () => {
  const at = (id, startsAt, endsAt) => ({ id, startsAt, endsAt });

  it('goes by start, then end, then id', () => {
    const early = at('z', '2026-03-01T08:00:00Z', '2026-03-01T20:00:00Z');
    const short = at('y', '2026-03-01T09:00:00Z', '2026-03-01T12:00:00Z');
    const long = at('x', '2026-03-01T09:00:00Z', '2026-03-01T17:00:00Z');
    const twin = at('w', '2026-03-01T09:00:00Z', '2026-03-01T17:00:00Z');
    expect([twin, long, short, early].sort(compareByTime).map((a) => a.id)).toEqual(['z', 'y', 'w', 'x']);
  });

  it('compares instants, not text, and ids by code point - the same on every machine', () => {
    const utc = at('a', '2026-03-01T04:00:00Z', '2026-03-01T05:00:00Z');
    const kolkata = at('b', '2026-03-01T08:00:00+05:30', '2026-03-01T09:00:00+05:30'); // 02:30Z
    expect([utc, kolkata].sort(compareByTime).map((a) => a.id)).toEqual(['b', 'a']);
    const lower = at('a1', '2026-03-01T04:00:00Z', '2026-03-01T05:00:00Z');
    const upper = at('B1', '2026-03-01T04:00:00Z', '2026-03-01T05:00:00Z');
    expect(compareByTime(lower, upper)).toBeGreaterThan(0);
  });

  it('takes the stable id from elsewhere when asked, as for slots', () => {
    const slot = (slotId) => ({ slotId, startsAt: '2026-03-01T09:00:00Z', endsAt: '2026-03-01T17:00:00Z' });
    expect([slot('s2'), slot('s1')].sort((a, b) => compareByTime(a, b, (s) => s.slotId)).map((s) => s.slotId)).toEqual(['s1', 's2']);
  });
});
