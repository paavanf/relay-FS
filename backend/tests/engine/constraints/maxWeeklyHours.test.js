// maxWeeklyHours.test.js
// The weekly hours limit: exactly the limit is fine, an hour over is not,
// and the week is a rolling seven days, not a calendar week.

import { describe, it, expect } from 'vitest';
import { checkMaxWeeklyHours } from '../../../src/engine/constraints/hard/maxWeeklyHours.js';
import { context, localShift, codesOf } from '../helpers/build.js';

const ctx = context({ rules: { maxHoursPerWeek: 40 } });
function eightHourDays(count, from = 2) {
  return Array.from({ length: count }, (_, i) =>
    localShift({
      id: `a${i}`,
      date: `2026-03-${String(from + i).padStart(2, '0')}`,
      start: '09:00',
      end: '17:00',
    }),
  );
}

describe('checkMaxWeeklyHours', () => {
  it('finds nothing in an empty set', () => {
    expect(checkMaxWeeklyHours([], ctx)).toEqual([]);
  });

  it('allows exactly the limit', () => {
    // Five eight-hour days is exactly 40.
    expect(checkMaxWeeklyHours(eightHourDays(5), ctx)).toEqual([]);
  });

  it('rejects an hour over the limit', () => {
    const shifts = [
      ...eightHourDays(5),
      localShift({ id: 'extra', date: '2026-03-07', start: '09:00', end: '10:00' }),
    ];

    const violations = checkMaxWeeklyHours(shifts, ctx);
    expect(codesOf(violations)).toEqual(['MAX_WEEKLY_HOURS']);
    expect(violations[0].details.totalHours).toBe(41);
  });

  it('uses a rolling window, not a calendar week', () => {
    // Four days late one week and four days early the next: no calendar week
    // exceeds 40, but a Thursday-to-Wednesday window hits 64.
    const shifts = [...eightHourDays(4, 5), ...eightHourDays(4, 9)];
    expect(codesOf(checkMaxWeeklyHours(shifts, ctx))).toEqual(['MAX_WEEKLY_HOURS']);
  });

  it('allows the same hours spread beyond seven days', () => {
    // Six eight-hour days, one every other day, spans 11 days - so no single
    // 7-day window holds more than 32 hours.
    const shifts = Array.from({ length: 6 }, (_, i) =>
      localShift({
        id: `a${i}`,
        date: `2026-03-${String(2 + i * 2).padStart(2, '0')}`,
        start: '09:00',
        end: '17:00',
      }),
    );
    expect(checkMaxWeeklyHours(shifts, ctx)).toEqual([]);
  });
});
