// maxWeeklyHoursClocks.test.js
// The DST case is the one worth having: a shift crossing a clock change is
// genuinely 7 or 9 hours, and counting the nominal 8 would let someone slip
// over their limit twice a year. Also: each worker on their own, one
// violation each naming the worst window, and no limit configured.

import { describe, it, expect } from 'vitest';
import { checkMaxWeeklyHours } from '../../../src/engine/constraints/hard/maxWeeklyHours.js';
import { context, localShift, codesOf, DST_TZ } from '../helpers/build.js';

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
  it('counts the real duration of a shift crossing a clock change', () => {
    // 2026-03-08, US clocks jump 02:00 -> 03:00. A 23:00-07:00 night that
    // night is 7 real hours, not the nominal 8.
    const dst = context({ timezone: DST_TZ, rules: { maxHoursPerWeek: 7.5 } });
    const shifts = [
      localShift({ id: 'spring', date: '2026-03-07', start: '23:00', end: '07:00', zone: DST_TZ }),
    ];

    // 7 hours is under 7.5, so nothing fires. Counting the nominal 8 would.
    expect(checkMaxWeeklyHours(shifts, dst)).toEqual([]);
  });

  it('counts the extra hour when the clocks go back', () => {
    // 2026-11-01, US clocks repeat 01:00-02:00, so this night is 9 real hours.
    const dst = context({ timezone: DST_TZ, rules: { maxHoursPerWeek: 8.5 } });
    const shifts = [
      localShift({ id: 'autumn', date: '2026-10-31', start: '23:00', end: '07:00', zone: DST_TZ }),
    ];

    const violations = checkMaxWeeklyHours(shifts, dst);
    expect(codesOf(violations)).toEqual(['MAX_WEEKLY_HOURS']);
    expect(violations[0].details.totalHours).toBe(9);
  });

  it('checks each worker separately', () => {
    const mine = eightHourDays(5);
    const theirs = eightHourDays(5).map((s) => ({ ...s, id: `${s.id}-w2`, membershipId: 'w2' }));
    expect(checkMaxWeeklyHours([...mine, ...theirs], ctx)).toEqual([]);
  });

  it('reports one violation per worker, naming the worst window', () => {
    const shifts = eightHourDays(7);
    const violations = checkMaxWeeklyHours(shifts, ctx);
    expect(violations).toHaveLength(1);
    expect(violations[0].details.totalHours).toBe(56);
  });

  it('sits out when no limit is configured', () => {
    expect(checkMaxWeeklyHours(eightHourDays(7), context({ rules: {} }))).toEqual([]);
  });
});
