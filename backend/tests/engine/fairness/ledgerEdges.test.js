// ledgerEdges.test.js
// The fairness ledger cases that must never divide by zero or invent a
// number: no contract and no shifts, no shifts at all, a team of one, people
// who joined mid-window - and every deviation against the team average.

import { describe, it, expect } from 'vitest';
import { ledgerOf, rowOf, person, shifts, WEEKDAYS } from './helpers.js';

const FIVE_WEEKDAYS = WEEKDAYS.slice(0, 5);

describe('normalising burden', () => {
  it('leaves out a member with no contract and no shifts, without any NaN', () => {
    const ledger = ledgerOf({
      assignments: shifts('nurse', FIVE_WEEKDAYS),
      workers: [person('owner', 0), person('nurse', 40)],
    });
    const owner = rowOf(ledger, 'owner');

    expect(owner).toMatchObject({ measured: false, normalisedBurden: 0, deviationPercent: 0, totalBurden: 0 });
    expect(ledger.teamAverage).toBe(rowOf(ledger, 'nurse').normalisedBurden);
  });

  it('counts a contracted member with no shifts as under, not as missing', () => {
    const ledger = ledgerOf({
      assignments: shifts('busy', WEEKDAYS),
      workers: [person('busy', 40), person('away', 40)],
    });

    expect(rowOf(ledger, 'away')).toMatchObject({ measured: true, normalisedBurden: 0, deviationPercent: -100 });
  });

  it('gives a team of one a deviation of zero', () => {
    const ledger = ledgerOf({ assignments: shifts('solo', WEEKDAYS, 'night'), workers: [person('solo', 40)] });

    expect(rowOf(ledger, 'solo').deviationPercent).toBe(0);
  });

  it('is all zeros, and no NaN, for a team with no shifts at all', () => {
    const ledger = ledgerOf({ assignments: [], workers: [person('a', 0), person('b', 37.5)] });

    expect(ledger.teamAverage).toBe(0);
    for (const row of ledger.rows) expect(row.deviationPercent).toBe(0);
  });

  it('measures someone who joined mid-window only from the day they joined', () => {
    const ledger = ledgerOf({
      assignments: [...shifts('long', WEEKDAYS), ...shifts('new', WEEKDAYS.slice(5))],
      workers: [person('long', 40), person('new', 40, '2026-03-09T09:00:00Z')],
    });

    expect(rowOf(ledger, 'new').basisHours).toBe(40); // one week, not two
    expect(rowOf(ledger, 'new').normalisedBurden).toBe(rowOf(ledger, 'long').normalisedBurden);
  });

  it('measures someone recorded as joining after the window over the whole window, if they worked in it', () => {
    const ledger = ledgerOf({
      assignments: shifts('backdated', FIVE_WEEKDAYS),
      workers: [person('backdated', 40, '2026-10-01T09:00:00Z')],
    });

    expect(rowOf(ledger, 'backdated')).toMatchObject({ measured: true, basisHours: 80, normalisedBurden: 2.5 });
  });

  it('reports each deviation against the team average', () => {
    const ledger = ledgerOf({
      assignments: [...shifts('days', WEEKDAYS), ...shifts('nights', WEEKDAYS, 'night')],
      workers: [person('days', 40), person('nights', 40)],
    });

    expect(ledger.teamAverage).toBeCloseTo(7); // (5 + 9) / 2
    expect(rowOf(ledger, 'nights').deviationPercent).toBeCloseTo((2 / 7) * 100);
    expect(rowOf(ledger, 'days').deviationPercent).toBeCloseTo((-2 / 7) * 100);
  });
});
