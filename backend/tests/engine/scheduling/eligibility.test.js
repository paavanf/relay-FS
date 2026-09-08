// eligibility.test.js
// Guards the optimisation that makes generation fast enough to be usable.
//
// findEligibleWorkers only shows the constraint engine the candidate's OWN
// assignments, not the whole roster. That is sound only while every hard
// constraint is per-assignment or grouped by worker. If somebody later adds a
// genuinely cross-worker hard rule, the shortcut silently starts returning
// wrong answers - and this file is what catches it.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { findEligibleWorkers } from '../../../src/engine/scheduling/eligibility.js';
import { toAssignment } from '../../../src/engine/scheduling/eligibility.js';
import { canAssign } from '../../../src/engine/constraints/evaluate.js';
import { expandDemand } from '../../../src/engine/scheduling/expandDemand.js';
import { scenario, contextOf, workers } from './helpers/build.js';

// The unfiltered version: what findEligibleWorkers would say if it checked
// each candidate against every assignment in the roster.
function eligibleTheSlowWay(slot, allWorkers, assignments, context) {
  return allWorkers
    .filter((w) => (w.qualificationIds ?? []).includes(slot.qualificationId))
    .filter((w) => canAssign(toAssignment(slot, w.membershipId), assignments, context).allowed)
    .map((w) => w.membershipId);
}

describe('per-worker eligibility shortcut', () => {
  it('agrees with checking against the whole roster', () => {
    const input = scenario({ workers: workers(6) });
    const context = contextOf(input);
    const slots = expandDemand(input);

    // Build up a roster one slot at a time, comparing both answers at every
    // step - so the shortcut is tested against a growing, realistic roster
    // rather than an empty one.
    const assignments = [];

    for (const slot of slots) {
      const fast = findEligibleWorkers(slot, input.workers, assignments, context)
        .eligible.map((w) => w.membershipId)
        .sort();

      const slow = eligibleTheSlowWay(slot, input.workers, assignments, context).sort();

      expect(fast).toEqual(slow);

      if (fast.length > 0) assignments.push(toAssignment(slot, fast[0]));
    }

    expect(assignments.length).toBeGreaterThan(0);
  });

  it('agrees across randomly generated rosters', () => {
    const input = scenario({ workers: workers(5) });
    const context = contextOf(input);
    const slots = expandDemand(input);

    fc.assert(
      fc.property(
        // A random subset of slots, each given to a random worker.
        fc.array(
          fc.tuple(fc.nat({ max: slots.length - 1 }), fc.nat({ max: 4 })),
          { maxLength: 12 },
        ),
        fc.nat({ max: slots.length - 1 }),
        (pairs, targetIndex) => {
          const target = slots[targetIndex];

          // A slot is filled at most once, and the slot being checked is by
          // definition not filled yet. Both matter: an assignment sharing the
          // candidate's id would have its own violations attributed to the
          // candidate, since canAssign matches violations by assignment id.
          const seen = new Set([target.slotId]);
          const assignments = [];
          for (const [slotIndex, workerIndex] of pairs) {
            const slot = slots[slotIndex];
            if (seen.has(slot.slotId)) continue;
            seen.add(slot.slotId);
            assignments.push(toAssignment(slot, `w${workerIndex}`));
          }
          const fast = findEligibleWorkers(target, input.workers, assignments, context)
            .eligible.map((w) => w.membershipId)
            .sort();
          const slow = eligibleTheSlowWay(target, input.workers, assignments, context).sort();

          expect(fast).toEqual(slow);
        },
      ),
      { numRuns: 300 },
    );
  });
});
