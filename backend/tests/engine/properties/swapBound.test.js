// swapBound.test.js
// The search skips chains that could never make the list (searchBound.js).
// That is only allowed if it never changes the answer - so on random cases,
// with random fairness debts and avoid/prefer days to rank by, the best few
// options must be exactly the first few of a search that keeps everything.
//
// It must also actually skip something, or this would pass without testing
// the bound at all.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { findSwapOptions } from '../../../src/engine/index.js';
import { rankedCaseArb } from './swapArbitraries.js';
import { report } from './report.js';

const optionsFor = (c, topN) =>
  findSwapOptions({ request: c.request, offers: c.offers, assignments: c.assignments, context: c.context, fairnessDebt: c.fairnessDebt, maxLength: c.maxLength, topN });

describe('the ranking bound', () => {
  it('returns exactly the best options a search of everything would', () => {
    let skippedWork = 0;

    fc.assert(
      fc.property(rankedCaseArb, fc.integer({ min: 1, max: 3 }), (c, topN) => {
        fc.pre(c.offers.length >= 2);
        const everything = optionsFor(c, Infinity); // the list never fills, so nothing is skipped
        const best = optionsFor(c, topN);

        expect(best.direct).toEqual(everything.direct.slice(0, topN));
        expect(best.chains).toEqual(everything.chains.slice(0, topN));
        expect(best.noMatchReasons).toEqual(everything.noMatchReasons);
        if (best.stats.validCycles < everything.stats.validCycles) skippedWork += 1;
      }),
      { numRuns: 300, seed: 20260402 },
    );

    report(`\nRanking bound: skipped work in ${skippedWork} of the cases, without changing an answer`);
    expect(skippedWork).toBeGreaterThan(10);
  }, 120_000);
});
