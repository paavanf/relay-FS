// burdenOf.test.js
// The weight of one shift, and the weekend rule: a shift is a weekend shift
// when it STARTS on a Saturday or Sunday in the organisation's own timezone.
//
// Calendar used throughout: Monday 2 March 2026, so Friday the 13th, Saturday
// the 14th, Sunday the 15th.

import { describe, it, expect } from 'vitest';
import { burdenOf, isWeekendShift } from '../../../src/engine/index.js';
import { localShift, template } from '../helpers/build.js';

const POLICY = { weekendMultiplier: 1.5, referenceHours: 40 };
const LONDON = 'Europe/London';
const night = template('t-night', 'night', 1.8);

const londonShift = (date, start, end) => localShift({ date, start, end, zone: LONDON });

describe('isWeekendShift', () => {
  it('counts a Friday night running into Saturday as a Friday shift', () => {
    expect(isWeekendShift(londonShift('2026-03-13', '23:00', '07:00').startsAt, LONDON)).toBe(false);
  });

  it('counts a Sunday night running into Monday as a weekend shift', () => {
    expect(isWeekendShift(londonShift('2026-03-15', '23:00', '07:00').startsAt, LONDON)).toBe(true);
  });

  it('counts Saturday and Sunday day shifts, and not Monday', () => {
    expect(isWeekendShift(londonShift('2026-03-14', '07:00', '15:00').startsAt, LONDON)).toBe(true);
    expect(isWeekendShift(londonShift('2026-03-15', '07:00', '15:00').startsAt, LONDON)).toBe(true);
    expect(isWeekendShift(londonShift('2026-03-16', '07:00', '15:00').startsAt, LONDON)).toBe(false);
  });

  it('decides the day in the organisation timezone: 01:00 Saturday in Kolkata is Friday in UTC', () => {
    const shift = localShift({ date: '2026-03-14', start: '01:00', end: '09:00', zone: 'Asia/Kolkata' });

    expect(new Date(shift.startsAt).getUTCDay()).toBe(5); // Friday, in UTC
    expect(isWeekendShift(shift.startsAt, 'Asia/Kolkata')).toBe(true);
  });

  it('and the other way round: 22:00 Friday in New York is already Saturday in UTC', () => {
    const shift = localShift({ date: '2026-03-13', start: '22:00', end: '06:00', zone: 'America/New_York' });

    expect(new Date(shift.startsAt).getUTCDay()).toBe(6); // Saturday, in UTC
    expect(isWeekendShift(shift.startsAt, 'America/New_York')).toBe(false);
  });
});

describe('burdenOf', () => {
  it('is the template weight on a weekday', () => {
    expect(burdenOf(londonShift('2026-03-11', '23:00', '07:00'), night, POLICY, LONDON)).toBe(1.8);
  });

  it('multiplies a weekend shift by the policy multiplier', () => {
    expect(burdenOf(londonShift('2026-03-14', '23:00', '07:00'), night, POLICY, LONDON)).toBeCloseTo(2.7);
  });

  it('does not multiply the Friday night that ends on Saturday morning', () => {
    expect(burdenOf(londonShift('2026-03-13', '23:00', '07:00'), night, POLICY, LONDON)).toBe(1.8);
  });

  it('treats an unknown template as a neutral weight of 1', () => {
    expect(burdenOf(londonShift('2026-03-11', '07:00', '15:00'), undefined, POLICY, LONDON)).toBe(1);
  });

  it('ignores a weekend multiplier that is not a positive number', () => {
    const shift = londonShift('2026-03-14', '07:00', '15:00');

    expect(burdenOf(shift, night, { weekendMultiplier: 0 }, LONDON)).toBe(1.8);
    expect(burdenOf(shift, night, { weekendMultiplier: Number.NaN }, LONDON)).toBe(1.8);
  });
});
