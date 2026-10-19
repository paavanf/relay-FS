// swapRoleProperties.test.js
// Roles and filters, on random wards and rosters:
//
//   1. applying any returned chain leaves every shift's qualified coverage,
//      role by role, exactly as it was - the charge nurse's place is still
//      held by a charge nurse
//   2. everyone receives only shifts whose role they hold
//   3. every candidate edge, and every hand-over returned, respects what the
//      taker said they would take in return
//
// Property 1 is the one that catches a swap leaving a shift without its
// charge nurse, and it fails if the engine's exact-role check is taken out.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { findSwapOptions, applyCycle } from '../../../src/engine/index.js';
import { buildGraph } from '../../../src/engine/swaps/buildGraph.js';
import { acceptsShift } from '../../../src/engine/swaps/acceptsShift.js';
import { swapCaseArb, filteredCaseArb } from './swapArbitraries.js';

const RUNS = 200;

// For each shift and role: how many of its places are held by someone who holds that role.
function qualifiedCoverage(assignments, workers) {
  const held = new Map(workers.map((w) => [w.membershipId, w.qualificationIds ?? []]));
  const counts = {};
  for (const a of assignments) {
    const key = `${a.date}|${a.shiftTemplateId}|${a.slotQualificationId}`;
    counts[key] = (counts[key] ?? 0) + (held.get(a.membershipId)?.includes(a.slotQualificationId) ? 1 : 0);
  }
  return counts;
}

const optionsFor = (c) =>
  findSwapOptions({ request: c.request, offers: c.offers, assignments: c.assignments, context: c.context, maxLength: c.maxLength, topN: 100 });
const everyChain = (result) => [...result.direct, ...result.chains];

describe('swaps and roles', () => {
  it('keep every shift covered role by role, and hand people only roles they hold', () => {
    fc.assert(
      fc.property(swapCaseArb, (c) => {
        fc.pre(c.offers.length >= 2);
        const offersById = new Map(c.offers.map((o) => [o.id, o]));
        const roleOf = new Map(c.assignments.map((a) => [a.id, a.slotQualificationId]));
        const held = new Map(c.context.workers.map((w) => [w.membershipId, w.qualificationIds]));
        const before = qualifiedCoverage(c.assignments, c.context.workers);

        for (const chain of everyChain(optionsFor(c))) {
          const after = applyCycle(c.assignments, chain.offerIds.map((id) => offersById.get(id)));
          expect(qualifiedCoverage(after, c.context.workers)).toEqual(before); // 1
          for (const leg of chain.legs) expect(held.get(leg.to)).toContain(roleOf.get(leg.assignmentId)); // 2
        }
      }),
      { numRuns: RUNS },
    );
  });
});

describe('swaps and filters', () => {
  it('only ever draw an edge, or return a hand-over, that the taker said they would take', () => {
    fc.assert(
      fc.property(filteredCaseArb, (c) => {
        fc.pre(c.offers.length >= 2);
        const offersById = new Map(c.offers.map((o) => [o.id, o]));
        const shiftOf = new Map(c.assignments.map((a) => [a.id, a]));
        const takes = (takerId, offerId) => acceptsShift(offersById.get(takerId).filters, shiftOf.get(offersById.get(offerId).assignmentId), c.context);

        const graph = buildGraph({ offers: c.offers, assignmentsById: shiftOf, context: c.context });
        for (const [takerId, targets] of graph.edges) for (const offerId of targets) expect(takes(takerId, offerId)).toBe(true); // 3

        for (const { offerIds } of everyChain(optionsFor(c))) {
          offerIds.forEach((takerId, i) => expect(takes(takerId, offerIds[(i + 1) % offerIds.length])).toBe(true));
        }
      }),
      { numRuns: RUNS },
    );
  });
});
