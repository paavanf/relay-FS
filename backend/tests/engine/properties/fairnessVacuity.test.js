// fairnessVacuity.test.js
// A property is only as good as the cases it runs on. This samples the same
// generators fairnessProperties.test.js uses and checks that the situations
// each property is about really occur, and often. A generator change that
// quietly made a property vacuous fails here instead of passing silently.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { ledgerInput, ledgerFor, weekendNight, WINDOW } from './fairnessArbitraries.js';

const SAMPLES = fc.sample(fc.tuple(ledgerInput, fc.nat()), { numRuns: 500, seed: 6 });

function share(predicate) {
  return SAMPLES.filter(([input, pick]) => predicate(input, pick)).length / SAMPLES.length;
}

const measuredRows = (input) => ledgerFor(input).rows.filter((row) => row.measured);

describe('the fairness properties are not vacuous', () => {
  it('most cases have two or more measured workers, and real differences between them', () => {
    expect(share((input) => measuredRows(input).length >= 2)).toBeGreaterThan(0.5);
    expect(share((input) => measuredRows(input).some((r) => Math.abs(r.deviationPercent) > 1))).toBeGreaterThan(0.5);
  });

  it('shifts fall both inside and outside the window', () => {
    const counted = (input) => ledgerFor(input).rows.reduce((total, row) => total + row.shiftsWorked, 0);
    const ofTeam = (input) => input.assignments.filter((a) => input.workers.some((w) => w.membershipId === a.membershipId));

    expect(share((input) => counted(input) > 0)).toBeGreaterThan(0.7);
    expect(share((input) => counted(input) < ofTeam(input).length)).toBeGreaterThan(0.2);
  });

  it('exercises both the no-contract basis and the joined-mid-window basis', () => {
    const joinedInside = (w) => w.joinedAt && w.joinedAt.slice(0, 10) > WINDOW.startDate && w.joinedAt.slice(0, 10) <= WINDOW.endDate;

    expect(share((input) => measuredRows(input).some((r) => r.contractedHoursPerWeek === 0))).toBeGreaterThan(0.3);
    expect(share((input) => input.workers.some(joinedInside))).toBeGreaterThan(0.3);
  });

  it('property 4 bites: the extra heavy shift strictly raises the burden in most cases', () => {
    const raises = (input, pick) => {
      const chosen = input.workers[pick % input.workers.length].membershipId;
      const of = (ledger) => ledger.rows.find((r) => r.membershipId === chosen).normalisedBurden;
      const after = ledgerFor({ ...input, assignments: [...input.assignments, weekendNight(chosen, input.timezone)] });
      return of(after) > of(ledgerFor(input));
    };

    expect(share(raises)).toBeGreaterThan(0.8);
  });
});
