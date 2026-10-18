// swapProperties.test.js
// What must hold for every swap the finder ever returns, checked against
// randomly generated wards and rosters:
//
//   1. applied to the roster, the chain leaves it legal - checked on the
//      WHOLE roster, not just the participants the finder looked at
//   2. no shift is lost or duplicated: same number of assignments, each
//      still held by exactly one person
//   3. everyone in it gives exactly one shift and receives exactly one
//   4. the requester is in it, it is no longer than allowed, and no two
//      results are the same chain rotated
//   5. the answer is deterministic and ignores the order offers arrive in
//   6. if a direct swap exists, a direct swap is returned

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { findSwapOptions, applyCycle, canonicalKey, evaluate } from '../../../src/engine/index.js';
import { swapCaseArb } from './swapArbitraries.js';

const RUNS = 200;

const optionsFor = (c, offers = c.offers) =>
  findSwapOptions({ request: c.request, offers, assignments: c.assignments, context: c.context, maxLength: c.maxLength, topN: 100 });

describe('swap properties', () => {
  it('returns only legal chains that keep every shift held once and give everyone one and take one', () => {
    fc.assert(
      fc.property(swapCaseArb, (c) => {
        fc.pre(c.offers.length >= 2);
        const result = optionsFor(c);
        const offersById = new Map(c.offers.map((o) => [o.id, o]));
        const all = [...result.direct, ...result.chains];

        for (const chain of all) {
          const after = applyCycle(c.assignments, chain.offerIds.map((id) => offersById.get(id)));

          expect(evaluate(after, c.context).hardViolations.map((v) => v.code)).toEqual([]); // 1
          expect(after).toHaveLength(c.assignments.length); // 2
          expect(new Set(after.map((a) => a.id)).size).toBe(c.assignments.length);
          for (const leg of chain.legs) expect(after.find((a) => a.id === leg.assignmentId).membershipId).toBe(leg.to);

          const givers = chain.legs.map((leg) => leg.from).sort(); // 3
          expect(chain.legs.map((leg) => leg.to).sort()).toEqual(givers);
          expect(new Set(givers).size).toBe(chain.size);

          expect(chain.offerIds[0]).toBe(c.request.id); // 4
          expect(chain.size).toBeLessThanOrEqual(c.maxLength);
        }
        const keys = all.map((chain) => canonicalKey(chain.offerIds.map((id) => ({ id }))));
        expect(new Set(keys).size).toBe(keys.length);
      }),
      { numRuns: RUNS },
    );
  });

  it('gives the same answer every time, whatever order the offers come in', () => {
    fc.assert(
      fc.property(swapCaseArb, fc.boolean(), (c, reverse) => {
        fc.pre(c.offers.length >= 2);
        const shuffled = reverse ? [...c.offers].reverse() : [...c.offers.slice(1), c.offers[0]];
        expect(optionsFor(c, shuffled)).toEqual(optionsFor(c));
      }),
      { numRuns: RUNS },
    );
  });

  it('finds a direct swap whenever one exists', () => {
    fc.assert(
      fc.property(swapCaseArb, (c) => {
        fc.pre(c.offers.length >= 2);
        const others = c.offers.filter((o) => o.membershipId !== c.request.membershipId);
        // Brute force: try every pair on the whole roster.
        const exists = others.some((o) => evaluate(applyCycle(c.assignments, [c.request, o]), c.context).isValid);
        if (exists) expect(optionsFor(c).direct.length).toBeGreaterThan(0);
      }),
      { numRuns: RUNS },
    );
  });
});
