// declaredUnavailability.test.js
// Declared unavailability: recurring weekdays and one-off dates block a
// shift, other days are left alone, and an exception overrides the
// recurring rule for its date only.
//
// Two rules are easy to get backwards: an exception beats a recurring entry
// for the same date, and a null shiftTemplateId means "the whole day" rather
// than "no shift".

import { describe, it, expect } from 'vitest';
import { checkDeclaredUnavailability } from '../../../src/engine/constraints/hard/declaredUnavailability.js';
import { context, localShift, availability, codesOf } from '../helpers/build.js';

// 2026-03-02 is a Monday, so dayOfWeek 1.
const MONDAY = '2026-03-02';
const MONDAY_DOW = 1;
const dayShift = localShift({ id: 'a', date: MONDAY, start: '09:00', end: '17:00' });

describe('checkDeclaredUnavailability', () => {
  it('finds nothing in an empty set', () => {
    expect(checkDeclaredUnavailability([], context())).toEqual([]);
  });

  it('allows a shift when nothing was declared', () => {
    expect(checkDeclaredUnavailability([dayShift], context())).toEqual([]);
  });

  it('blocks a recurring unavailable weekday', () => {
    const ctx = context({
      availability: [availability({ type: 'recurring', dayOfWeek: MONDAY_DOW })],
    });

    const violations = checkDeclaredUnavailability([dayShift], ctx);
    expect(codesOf(violations)).toEqual(['DECLARED_UNAVAILABLE']);
    expect(violations[0].details.date).toBe(MONDAY);
  });

  it('leaves other weekdays alone', () => {
    const ctx = context({
      availability: [availability({ type: 'recurring', dayOfWeek: 4 })],
    });
    expect(checkDeclaredUnavailability([dayShift], ctx)).toEqual([]);
  });

  it('blocks a one-off exception date', () => {
    const ctx = context({
      availability: [availability({ type: 'exception', date: MONDAY })],
    });
    expect(codesOf(checkDeclaredUnavailability([dayShift], ctx))).toEqual(['DECLARED_UNAVAILABLE']);
  });

  it('leaves other dates alone', () => {
    const ctx = context({
      availability: [availability({ type: 'exception', date: '2026-03-09' })],
    });
    expect(checkDeclaredUnavailability([dayShift], ctx)).toEqual([]);
  });

  it('lets an exception override a recurring rule for the same date', () => {
    // Never works Mondays, but made an exception for this one.
    const ctx = context({
      availability: [
        availability({ type: 'recurring', dayOfWeek: MONDAY_DOW, status: 'unavailable' }),
        availability({ type: 'exception', date: MONDAY, status: 'prefer' }),
      ],
    });
    expect(checkDeclaredUnavailability([dayShift], ctx)).toEqual([]);
  });

  it('still applies the recurring rule on other Mondays', () => {
    const nextMonday = localShift({ id: 'b', date: '2026-03-09', start: '09:00', end: '17:00' });
    const ctx = context({
      availability: [
        availability({ type: 'recurring', dayOfWeek: MONDAY_DOW, status: 'unavailable' }),
        availability({ type: 'exception', date: MONDAY, status: 'prefer' }),
      ],
    });
    expect(codesOf(checkDeclaredUnavailability([nextMonday], ctx))).toEqual([
      'DECLARED_UNAVAILABLE',
    ]);
  });
});
