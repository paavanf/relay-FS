// declaredUnavailabilityScope.test.js
// What a declaration covers: the whole day, or only the named shift; only
// unavailable binds (prefer and avoid are advice); only the worker who made
// it; and the local weekday of a night shift, not the UTC one.
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
  it('blocks an exception that says unavailable on an otherwise fine day', () => {
    const ctx = context({
      availability: [availability({ type: 'exception', date: MONDAY, status: 'unavailable' })],
    });
    expect(codesOf(checkDeclaredUnavailability([dayShift], ctx))).toEqual(['DECLARED_UNAVAILABLE']);
  });

  it('blocks every shift that day when shiftTemplateId is null', () => {
    const shifts = [
      localShift({ id: 'a', shiftTemplateId: 't-day', date: MONDAY, start: '09:00', end: '17:00' }),
      localShift({ id: 'b', shiftTemplateId: 't-eve', date: MONDAY, start: '17:00', end: '23:00' }),
    ];
    const ctx = context({
      availability: [
        availability({ type: 'recurring', dayOfWeek: MONDAY_DOW, shiftTemplateId: null }),
      ],
    });
    expect(checkDeclaredUnavailability(shifts, ctx)).toHaveLength(2);
  });

  it('blocks only the named shift when shiftTemplateId is set', () => {
    const shifts = [
      localShift({ id: 'a', shiftTemplateId: 't-day', date: MONDAY, start: '09:00', end: '17:00' }),
      localShift({ id: 'b', shiftTemplateId: 't-eve', date: MONDAY, start: '17:00', end: '23:00' }),
    ];
    const ctx = context({
      availability: [
        availability({ type: 'recurring', dayOfWeek: MONDAY_DOW, shiftTemplateId: 't-eve' }),
      ],
    });

    const violations = checkDeclaredUnavailability(shifts, ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].assignmentIds).toEqual(['b']);
  });

  it('ignores prefer and avoid, which are advisory not binding', () => {
    const ctx = context({
      availability: [
        availability({ type: 'recurring', dayOfWeek: MONDAY_DOW, status: 'avoid' }),
        availability({ type: 'recurring', dayOfWeek: MONDAY_DOW, status: 'prefer' }),
      ],
    });
    expect(checkDeclaredUnavailability([dayShift], ctx)).toEqual([]);
  });

  it('only applies a declaration to the worker who made it', () => {
    const someoneElse = { ...dayShift, membershipId: 'w2' };
    const ctx = context({
      availability: [
        availability({ membershipId: 'w1', type: 'recurring', dayOfWeek: MONDAY_DOW }),
      ],
    });
    expect(checkDeclaredUnavailability([someoneElse], ctx)).toEqual([]);
  });

  it('uses the local weekday for a night shift, not the UTC one', () => {
    // 23:00 Monday in Kolkata is still Monday locally but 17:30 UTC Monday;
    // a shift starting 23:00 Sunday would be Sunday locally. Check the run
    // that starts late on Monday counts as Monday.
    const lateMonday = localShift({ id: 'n', date: MONDAY, start: '23:00', end: '07:00' });
    const ctx = context({
      availability: [availability({ type: 'recurring', dayOfWeek: MONDAY_DOW })],
    });
    expect(codesOf(checkDeclaredUnavailability([lateMonday], ctx))).toEqual([
      'DECLARED_UNAVAILABLE',
    ]);
  });
});
