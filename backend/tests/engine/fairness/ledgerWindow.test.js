// ledgerWindow.test.js
// Which shifts a ledger counts, and how it measures them.
//
// The documented rule: a shift counts when the LOCAL date it starts on is on
// or after window.startDate and on or before window.endDate - both inclusive.

import { describe, it, expect } from 'vitest';
import { ledgerOf, rowOf, person, shift, shifts, TWO_WEEKS } from './helpers.js';

describe('the window', () => {
  it('includes both end dates and excludes the days just outside them', () => {
    const ledger = ledgerOf({
      assignments: shifts('a', ['2026-03-01', '2026-03-02', '2026-03-15', '2026-03-16']),
      workers: [person('a')],
    });

    expect(rowOf(ledger, 'a').shiftsWorked).toBe(2); // the 2nd and the 15th
  });

  it('decides the boundary by the local start date, not the UTC date', () => {
    const KOLKATA = 'Asia/Kolkata'; // UTC+05:30
    const at = (startsAt, endsAt) => ({ membershipId: 'a', shiftTemplateId: 't-day', startsAt, endsAt });

    // 19:30 UTC on the 15th is 01:00 on the 16th in Kolkata: after the window.
    const afterLocally = at('2026-03-15T19:30:00.000Z', '2026-03-16T03:30:00.000Z');
    // 19:00 UTC on the 1st is 00:30 on the 2nd in Kolkata: inside the window.
    const insideLocally = at('2026-03-01T19:00:00.000Z', '2026-03-02T03:00:00.000Z');

    const ledger = ledgerOf({ assignments: [afterLocally, insideLocally], workers: [person('a')], timezone: KOLKATA });

    expect(rowOf(ledger, 'a').shiftsWorked).toBe(1);
    expect(rowOf(ledger, 'a').hoursWorked).toBe(8);
  });

  it('counts a night that starts on the last day, even though it ends after the window', () => {
    const ledger = ledgerOf({ assignments: [shift('a', '2026-03-15', 'night')], workers: [person('a')] });

    expect(rowOf(ledger, 'a').shiftsWorked).toBe(1);
  });
});

describe('measuring the shifts', () => {
  it('takes hours from the real instants: the night the clocks go forward is 7 hours', () => {
    // UK clocks go forward at 01:00 on Sunday 29 March 2026.
    const window = { startDate: '2026-03-23', endDate: '2026-03-29', days: 7 };
    const ledger = ledgerOf({ assignments: [shift('a', '2026-03-28', 'night')], workers: [person('a')], window });

    expect(rowOf(ledger, 'a').hoursWorked).toBe(7);
  });

  it('counts shifts by category, and weekends separately', () => {
    const ledger = ledgerOf({
      assignments: [
        shift('a', '2026-03-02', 'day'),
        shift('a', '2026-03-03', 'eve'),
        shift('a', '2026-03-13', 'night'), // a Friday night: not a weekend shift
        shift('a', '2026-03-14', 'night'), // Saturday
        shift('a', '2026-03-15', 'day'), // Sunday
      ],
      workers: [person('a')],
    });

    expect(rowOf(ledger, 'a').shiftCounts).toEqual({ day: 2, evening: 1, night: 2, weekend: 2 });
    // 1 + 1.3 + 1.8 + 1.8 x 1.5 + 1 x 1.5
    expect(rowOf(ledger, 'a').totalBurden).toBeCloseTo(8.3);
  });

  it('ignores shifts worked by someone no longer in the team', () => {
    const ledger = ledgerOf({
      assignments: [...shifts('left', ['2026-03-02']), ...shifts('stayed', ['2026-03-02'])],
      workers: [person('stayed')],
    });

    expect(ledger.rows.map((row) => row.membershipId)).toEqual(['stayed']);
  });

  it('returns the window it measured', () => {
    expect(ledgerOf({ assignments: [], workers: [person('a')] }).window).toEqual(TWO_WEEKS);
  });
});
