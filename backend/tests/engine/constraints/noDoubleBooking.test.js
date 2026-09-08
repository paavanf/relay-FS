// noDoubleBooking.test.js
// Nobody in two places at once. The case that matters most here is the one
// that looks like an overlap but is not: two shifts that touch exactly.

import { describe, it, expect } from 'vitest';
import { checkNoDoubleBooking } from '../../../src/engine/constraints/hard/noDoubleBooking.js';
import { context, localShift, codesOf } from '../helpers/build.js';

const ctx = context();

describe('checkNoDoubleBooking', () => {
  it('finds nothing in an empty set', () => {
    expect(checkNoDoubleBooking([], ctx)).toEqual([]);
  });

  it('allows two shifts on different days', () => {
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-03', start: '09:00', end: '17:00' }),
    ];
    expect(checkNoDoubleBooking(shifts, ctx)).toEqual([]);
  });

  it('flags two shifts that overlap', () => {
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-02', start: '16:00', end: '22:00' }),
    ];

    const violations = checkNoDoubleBooking(shifts, ctx);
    expect(codesOf(violations)).toEqual(['DOUBLE_BOOKED']);
    expect(violations[0].assignmentIds.sort()).toEqual(['a', 'b']);
  });

  it('does NOT flag two shifts that touch exactly', () => {
    // 17:00 end, 17:00 start. Zero gap, but no overlap - minimumRest is the
    // constraint that should complain about this, not this one.
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-02', start: '17:00', end: '22:00' }),
    ];
    expect(checkNoDoubleBooking(shifts, ctx)).toEqual([]);
  });

  it('flags an overlap of a single minute', () => {
    const shifts = [
      localShift({ id: 'a', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', date: '2026-03-02', start: '16:59', end: '22:00' }),
    ];
    expect(codesOf(checkNoDoubleBooking(shifts, ctx))).toEqual(['DOUBLE_BOOKED']);
  });

  it('catches a night shift running into the next morning', () => {
    const shifts = [
      localShift({ id: 'night', date: '2026-03-02', start: '23:00', end: '07:00' }),
      localShift({ id: 'morning', date: '2026-03-03', start: '06:00', end: '14:00' }),
    ];
    expect(codesOf(checkNoDoubleBooking(shifts, ctx))).toEqual(['DOUBLE_BOOKED']);
  });

  it('does not mix up two different workers', () => {
    const shifts = [
      localShift({ id: 'a', membershipId: 'w1', date: '2026-03-02', start: '09:00', end: '17:00' }),
      localShift({ id: 'b', membershipId: 'w2', date: '2026-03-02', start: '09:00', end: '17:00' }),
    ];
    expect(checkNoDoubleBooking(shifts, ctx)).toEqual([]);
  });

  it('reports every overlapping pair when one shift swallows two others', () => {
    const shifts = [
      localShift({ id: 'long', date: '2026-03-02', start: '08:00', end: '20:00' }),
      localShift({ id: 'x', date: '2026-03-02', start: '09:00', end: '10:00' }),
      localShift({ id: 'y', date: '2026-03-02', start: '11:00', end: '12:00' }),
    ];
    // long/x, long/y and, because x ends before y starts, nothing between them.
    expect(checkNoDoubleBooking(shifts, ctx)).toHaveLength(2);
  });
});
