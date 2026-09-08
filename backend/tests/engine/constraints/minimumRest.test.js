// minimumRest.test.js
// The boundary is the whole point here: exactly minRestHours must pass, and a
// minute under it must fail.

import { describe, it, expect } from 'vitest';
import { checkMinimumRest } from '../../../src/engine/constraints/hard/minimumRest.js';
import { context, localShift, codesOf, DST_TZ } from '../helpers/build.js';

const ctx = context({ rules: { minRestHours: 11 } });

describe('checkMinimumRest', () => {
  it('finds nothing in an empty set', () => {
    expect(checkMinimumRest([], ctx)).toEqual([]);
  });

  it('finds nothing when there is only one shift', () => {
    const shifts = [localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' })];
    expect(checkMinimumRest(shifts, ctx)).toEqual([]);
  });

  it('allows a comfortable gap', () => {
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-03', start: '09:00', end: '17:00' }),
    ];
    expect(checkMinimumRest(shifts, ctx)).toEqual([]);
  });

  it('allows exactly the minimum', () => {
    // 17:00 to 04:00 next day is 11 hours on the nose.
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-03', start: '04:00', end: '10:00' }),
    ];
    expect(checkMinimumRest(shifts, ctx)).toEqual([]);
  });

  it('rejects one minute under the minimum', () => {
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-03', start: '03:59', end: '10:00' }),
    ];

    const violations = checkMinimumRest(shifts, ctx);
    expect(codesOf(violations)).toEqual(['MIN_REST']);
    expect(violations[0].assignmentIds).toEqual(['a', 'b']);
    expect(violations[0].details.restHours).toBeCloseTo(10.98, 2);
  });

  it('rejects back-to-back shifts that merely touch', () => {
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-02', start: '17:00', end: '22:00' }),
    ];
    expect(codesOf(checkMinimumRest(shifts, ctx))).toEqual(['MIN_REST']);
  });

  it('measures rest across a clock change in real elapsed time', () => {
    // US clocks go forward at 02:00 on 2026-03-08, so 22:00 to 08:00 local is
    // only 9 real hours - under an 11-hour rule despite looking like 10.
    const dst = context({ timezone: DST_TZ, rules: { minRestHours: 10 } });
    const shifts = [
      localShift({ id: 'a', date: '2026-03-07', start: '14:00', end: '22:00', zone: DST_TZ }),
      localShift({ id: 'b', date: '2026-03-08', start: '08:00', end: '16:00', zone: DST_TZ }),
    ];

    const violations = checkMinimumRest(shifts, dst);
    expect(codesOf(violations)).toEqual(['MIN_REST']);
    expect(violations[0].details.restHours).toBe(9);
  });

  it('checks each worker separately', () => {
    const shifts = [
      localShift({ id: 'a', membershipId: 'w1', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', membershipId: 'w2', date: '2026-03-02', start: '17:00', end: '22:00' }),
    ];
    expect(checkMinimumRest(shifts, ctx)).toEqual([]);
  });

  it('sits out when no rest rule is configured', () => {
    const noRule = context({ rules: {} });
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-02', start: '17:00', end: '22:00' }),
    ];
    expect(checkMinimumRest(shifts, noRule)).toEqual([]);
  });

  it('does not depend on the order it was handed the shifts', () => {
    const a = localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' });
    const b = localShift({ id: 'b', date: '2026-03-02', start: '17:00', end: '22:00' });

    expect(checkMinimumRest([a, b], ctx)).toEqual(checkMinimumRest([b, a], ctx));
  });
});
