// fairnessProperties.test.js
// Invariants the fairness ledger must hold for EVERY valid input, each checked
// against hundreds of generated teams, shift patterns and timezones.
//
// fairnessVacuity.test.js proves these runs are not vacuous - that the
// generated cases really contain the situations each property is about.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { toFairnessDebt } from '../../../src/engine/index.js';
import { RUNS, POLICY, TIMEZONES, ledgerInput, ledgerFor, pattern, terms, toAssignment, toWorker, weekendNight } from './fairnessArbitraries.js';

// A seeded shuffle, so a failing case can be replayed exactly.
function shuffled(list, seed) {
  const copy = [...list];
  let state = seed >>> 0;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    const j = state % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const finite = (n) => typeof n === 'number' && Number.isFinite(n);

describe('fairness ledger properties', () => {
  it('1. is deterministic, and independent of the order of its input', () => {
    fc.assert(
      fc.property(ledgerInput, fc.integer(), (input, seed) => {
        const reordered = { ...input, assignments: shuffled(input.assignments, seed), workers: shuffled(input.workers, seed + 1) };
        expect(ledgerFor(input)).toEqual(ledgerFor(input));
        expect(ledgerFor(reordered)).toEqual(ledgerFor(input));
      }),
      { numRuns: RUNS },
    );
  });

  it('2. never produces NaN or Infinity, in the ledger or the debt', () => {
    fc.assert(
      fc.property(ledgerInput, (input) => {
        const ledger = ledgerFor(input);
        const numbers = ledger.rows.flatMap((r) => [
          r.totalBurden, r.hoursWorked, r.basisHours, r.normalisedBurden, r.deviationPercent, ...Object.values(r.shiftCounts),
        ]);
        expect([ledger.teamAverage, ...numbers, ...Object.values(toFairnessDebt(ledger, POLICY))].every(finite)).toBe(true);
      }),
      { numRuns: RUNS },
    );
  });

  it('3. gives every worker a deviation of zero when all carried identical work', () => {
    const identical = fc.record({
      size: fc.integer({ min: 2, max: 5 }),
      shared: terms,
      shifts: fc.array(pattern, { minLength: 1, maxLength: 12 }),
      timezone: fc.constantFrom(...TIMEZONES),
    });
    fc.assert(
      fc.property(identical, ({ size, shared, shifts, timezone }) => {
        const ids = Array.from({ length: size }, (_, i) => `w${i}`);
        const workers = ids.map((id) => toWorker(id, shared));
        const assignments = ids.flatMap((id) => shifts.map((raw) => toAssignment(id, raw)));
        for (const row of ledgerFor({ workers, assignments, timezone }).rows) {
          expect(Math.abs(row.deviationPercent)).toBeLessThan(1e-9);
        }
      }),
      { numRuns: RUNS },
    );
  });

  it('4. never lowers anyone\'s normalised burden when they take an extra heavy shift', () => {
    fc.assert(
      fc.property(ledgerInput, fc.nat(), (input, pick) => {
        const chosen = input.workers[pick % input.workers.length].membershipId;
        const before = ledgerFor(input).rows.find((r) => r.membershipId === chosen);
        const after = ledgerFor({ ...input, assignments: [...input.assignments, weekendNight(chosen, input.timezone)] })
          .rows.find((r) => r.membershipId === chosen);
        expect(after.normalisedBurden).toBeGreaterThanOrEqual(before.normalisedBurden);
      }),
      { numRuns: RUNS },
    );
  });

  it('5. reports deviations consistent with the team average it reports', () => {
    fc.assert(
      fc.property(ledgerInput, (input) => {
        const { rows, teamAverage } = ledgerFor(input);
        const measured = rows.filter((r) => r.measured);
        const mean = measured.length ? measured.reduce((s, r) => s + r.normalisedBurden, 0) / measured.length : 0;
        expect(teamAverage).toBeCloseTo(mean, 9);
        for (const row of rows) {
          const expected = row.measured && teamAverage > 0 ? ((row.normalisedBurden - teamAverage) / teamAverage) * 100 : 0;
          expect(row.deviationPercent).toBeCloseTo(expected, 9);
        }
      }),
      { numRuns: RUNS },
    );
  });
});
