// maxConsecutiveDays.test.js
// The subtle case: a night shift starting at 23:00 local belongs to the day it
// started, in the org's timezone. Get that wrong and a run of nights either
// splits in two or counts double.

import { describe, it, expect } from 'vitest';
import { checkMaxConsecutiveDays } from '../../../src/engine/constraints/hard/maxConsecutiveDays.js';
import { context, localShift, codesOf, TZ } from '../helpers/build.js';

const ctx = context({ rules: { maxConsecutiveDays: 3 } });

function daysInARow(count, { start = '09:00', end = '17:00', from = 2 } = {}) {
  return Array.from({ length: count }, (_, i) =>
    localShift({
      id: `a${i}`,
      date: `2026-03-${String(from + i).padStart(2, '0')}`,
      start,
      end,
    }),
  );
}

describe('checkMaxConsecutiveDays', () => {
  it('finds nothing in an empty set', () => {
    expect(checkMaxConsecutiveDays([], ctx)).toEqual([]);
  });

  it('allows exactly the maximum', () => {
    expect(checkMaxConsecutiveDays(daysInARow(3), ctx)).toEqual([]);
  });

  it('rejects one day over the maximum', () => {
    const violations = checkMaxConsecutiveDays(daysInARow(4), ctx);
    expect(codesOf(violations)).toEqual(['MAX_CONSECUTIVE_DAYS']);
    expect(violations[0].details.consecutiveDays).toBe(4);
    expect(violations[0].assignmentIds).toHaveLength(4);
  });

  it('treats a day off as breaking the run', () => {
    // Three on, one off, three on - neither run exceeds the limit.
    const shifts = [...daysInARow(3, { from: 2 }), ...daysInARow(3, { from: 6 })];
    expect(checkMaxConsecutiveDays(shifts, ctx)).toEqual([]);
  });

  it('counts two shifts on one day as a single day', () => {
    const shifts = [
      ...daysInARow(3),
      localShift({ id: 'extra', date: '2026-03-02', start: '18:00', end: '20:00' }),
    ];
    expect(checkMaxConsecutiveDays(shifts, ctx)).toEqual([]);
  });

  it('attributes a night shift to the local day it started on', () => {
    // 23:00 in Kolkata is 17:30 UTC the same day, so this one is only wrong if
    // the code reads the date off the raw instant in the wrong zone. Four
    // consecutive local nights must trip a limit of three.
    const nights = daysInARow(4, { start: '23:00', end: '07:00' });
    const violations = checkMaxConsecutiveDays(nights, ctx);

    expect(codesOf(violations)).toEqual(['MAX_CONSECUTIVE_DAYS']);
    expect(violations[0].details.days).toEqual([
      '2026-03-02',
      '2026-03-03',
      '2026-03-04',
      '2026-03-05',
    ]);
  });

  it('uses the org timezone, not UTC, to decide the day', () => {
    // 01:00 Kolkata on the 3rd is 19:30 UTC on the 2nd. Read in UTC these two
    // shifts land on the same day; read locally they are two days in a row.
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '10:00', end: '18:00' }),
      localShift({ id: 'b', date: '2026-03-03', start: '01:00', end: '05:00' }),
    ];
    const strict = context({ timezone: TZ, rules: { maxConsecutiveDays: 1 } });

    expect(codesOf(checkMaxConsecutiveDays(shifts, strict))).toEqual(['MAX_CONSECUTIVE_DAYS']);
  });

  it('reports each over-long run separately', () => {
    const shifts = [...daysInARow(4, { from: 2 }), ...daysInARow(4, { from: 10 })];
    expect(checkMaxConsecutiveDays(shifts, ctx)).toHaveLength(2);
  });

  it('checks each worker separately', () => {
    const shifts = [
      ...daysInARow(3, { from: 2 }),
      localShift({ id: 'other', membershipId: 'w2', date: '2026-03-05', start: '09:00', end: '17:00' }),
    ];
    expect(checkMaxConsecutiveDays(shifts, ctx)).toEqual([]);
  });

  it('sits out when no limit is configured', () => {
    expect(checkMaxConsecutiveDays(daysInARow(10), context({ rules: {} }))).toEqual([]);
  });
});
