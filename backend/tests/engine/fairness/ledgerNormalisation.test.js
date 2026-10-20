// ledgerNormalisation.test.js
// How burden is made comparable between people contracted for different
// hours: a part-timer against a full-timer, a part-timer on nights shown as
// over despite a smaller total, and no contract measured against 40 hours.

import { describe, it, expect } from 'vitest';
import { ledgerOf, rowOf, person, shifts, WEEKDAYS } from './helpers.js';

const FIVE_WEEKDAYS = WEEKDAYS.slice(0, 5);

describe('normalising burden', () => {
  it('compares a part-timer fairly with a full-timer doing the same kind of work', () => {
    const ledger = ledgerOf({
      assignments: [...shifts('full', WEEKDAYS), ...shifts('part', FIVE_WEEKDAYS)],
      workers: [person('full', 40), person('part', 20)],
    });

    // Raw totals say the part-timer carried half as much...
    expect(rowOf(ledger, 'full').totalBurden).toBe(10);
    expect(rowOf(ledger, 'part').totalBurden).toBe(5);
    // ...but for their contract they carried exactly the same.
    expect(rowOf(ledger, 'full').normalisedBurden).toBe(5);
    expect(rowOf(ledger, 'part').normalisedBurden).toBe(5);
    expect(rowOf(ledger, 'part').deviationPercent).toBe(0);
  });

  it('shows a part-timer on nights as over, despite a smaller raw total', () => {
    const ledger = ledgerOf({
      assignments: [...shifts('full', WEEKDAYS), ...shifts('part', FIVE_WEEKDAYS, 'night')],
      workers: [person('full', 40), person('part', 20)],
    });

    expect(rowOf(ledger, 'part').totalBurden).toBeLessThan(rowOf(ledger, 'full').totalBurden);
    expect(rowOf(ledger, 'part').normalisedBurden).toBeCloseTo(9); // 5 nights x 1.8 per 40h
    expect(rowOf(ledger, 'part').deviationPercent).toBeGreaterThan(0);
    expect(rowOf(ledger, 'full').deviationPercent).toBeLessThan(0);
  });

  it('measures someone with no contract on file against a 40-hour week', () => {
    const ledger = ledgerOf({ assignments: shifts('casual', FIVE_WEEKDAYS), workers: [person('casual', 0)] });
    const row = rowOf(ledger, 'casual');

    expect(row.measured).toBe(true);
    expect(row.basisHours).toBe(80); // 40 hours x 2 weeks
    expect(row.normalisedBurden).toBe(2.5);
  });
});
