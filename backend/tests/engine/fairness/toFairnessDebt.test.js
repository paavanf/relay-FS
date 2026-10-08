// toFairnessDebt.test.js
// The ledger turned into the map the generator reads - in the sign and scale
// its existing consumers expect, checked against those consumers themselves.

import { describe, it, expect } from 'vitest';
import { toFairnessDebt, generateRoster } from '../../../src/engine/index.js';
import { scoreFairnessDebt } from '../../../src/engine/constraints/soft/fairnessDebt.js';
import { ledgerOf, person, shift, shifts, POLICY, TEMPLATES, WEEKDAYS } from './helpers.js';
import { scenario, everyDay } from '../scheduling/helpers/build.js';

const daysAndNights = () =>
  ledgerOf({
    assignments: [...shifts('days', WEEKDAYS), ...shifts('nights', WEEKDAYS, 'night')],
    workers: [person('days', 40), person('nights', 40)],
  });

describe('toFairnessDebt', () => {
  it('is positive for whoever is over their share, in burden points', () => {
    // Normalised 5 and 9, average 7, basis 80 hours each: 2 per 40h, x 2.
    const debt = toFairnessDebt(daysAndNights(), POLICY);

    expect(debt.nights).toBeCloseTo(4);
    expect(debt.days).toBeCloseTo(-4);
  });

  it('is {} when the window holds no published work at all', () => {
    expect(toFairnessDebt(ledgerOf({ assignments: [], workers: [person('a'), person('b')] }), POLICY)).toEqual({});
  });

  it('leaves out members who were not measured', () => {
    const ledger = ledgerOf({ assignments: shifts('nurse', WEEKDAYS), workers: [person('owner', 0), person('nurse')] });

    expect(Object.keys(toFairnessDebt(ledger, POLICY))).toEqual(['nurse']);
  });

  it('fits the existing consumer: only the over-share worker is penalised', () => {
    const debt = toFairnessDebt(daysAndNights(), POLICY);
    const context = { shiftTemplates: TEMPLATES, fairnessDebt: debt };
    const nights = [shift('days', '2026-03-17', 'night'), shift('nights', '2026-03-17', 'night')];
    const penalties = scoreFairnessDebt(nights, context);

    expect(penalties.map((p) => p.membershipId)).toEqual(['nights']);
    expect(penalties[0].penalty).toBeCloseTo(4 * 1.8); // debt x the night's burdenWeight
  });
});

describe('feeding the generator', () => {
  const input = scenario({
    coverageRequirements: [
      ...everyDay('t-day', [{ qualificationId: 'RN', count: 2 }]),
      ...everyDay('t-night', [{ qualificationId: 'RN', count: 2 }]),
    ],
  });
  const nightsOf = (result, id) =>
    result.assignments.filter((a) => a.membershipId === id && a.shiftTemplateId === 't-night').length;

  it('generates exactly the same roster from {} as from no map at all', () => {
    expect(generateRoster({ ...input, fairnessDebt: {} })).toEqual(generateRoster(input));
  });

  it('steers nights away from someone already carrying more than their share', () => {
    const without = generateRoster(input);
    const busiest = input.workers
      .map((w) => w.membershipId)
      .sort((a, b) => nightsOf(without, b) - nightsOf(without, a))[0];

    const withDebt = generateRoster({ ...input, fairnessDebt: { [busiest]: 6 } });

    expect(nightsOf(without, busiest)).toBeGreaterThan(0);
    expect(nightsOf(withDebt, busiest)).toBeLessThan(nightsOf(without, busiest));
    expect(withDebt.unfilledSlots).toHaveLength(without.unfilledSlots.length);
  });
});
