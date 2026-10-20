// engineChanges.test.js
// Invariants about how the engine's answer moves as a roster changes, each
// checked against hundreds of generated cases (engineArbitraries.js):
// removing a shift never adds a hard violation, canAssign agrees with
// evaluate, and the order assignments arrive in changes nothing.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { evaluate, canAssign } from '../../../src/engine/index.js';
import { RUNS, assignmentsArb, contextArb } from './engineArbitraries.js';

// A violation's identity for comparison purposes. The exact assignmentIds can
// legitimately change when a shift is removed - if B sat between A and C, the
// rest check moves from (A,B) to (A,C) - so identity is the rule that was
// broken and who broke it.
const identity = (v) => `${v.code}|${v.membershipId}`;

describe('engine properties', () => {
  it('never introduces a new hard violation when an assignment is removed', () => {
    fc.assert(
      fc.property(assignmentsArb, contextArb, fc.nat(), (assignments, context, seed) => {
        fc.pre(assignments.length > 0);

        const index = seed % assignments.length;
        const fewer = assignments.filter((_, i) => i !== index);

        const before = new Set(evaluate(assignments, context).hardViolations.map(identity));
        const after = evaluate(fewer, context).hardViolations.map(identity);

        for (const violation of after) {
          expect(before.has(violation)).toBe(true);
        }
      }),
      { numRuns: RUNS },
    );
  });

  it('agrees between canAssign and evaluate', () => {
    fc.assert(
      fc.property(assignmentsArb, contextArb, (assignments, context) => {
        fc.pre(assignments.length > 0);

        const candidate = assignments[assignments.length - 1];
        const existing = assignments.slice(0, -1);

        const { allowed } = canAssign(candidate, existing, context);
        const involving = evaluate(assignments, context).hardViolations.filter((v) =>
          v.assignmentIds.includes(candidate.id),
        );

        // Allowed means, precisely, that nothing involving the candidate fired.
        expect(allowed).toBe(involving.length === 0);
      }),
      { numRuns: RUNS },
    );
  });

  it('does not depend on the order the assignments arrive in', () => {
    fc.assert(
      fc.property(
        assignmentsArb.chain((assignments) =>
          fc.tuple(
            fc.constant(assignments),
            fc.shuffledSubarray(assignments, {
              minLength: assignments.length,
              maxLength: assignments.length,
            }),
          ),
        ),
        contextArb,
        ([original, shuffled], context) => {
          const a = evaluate(original, context);
          const b = evaluate(shuffled, context);

          expect(b.isValid).toBe(a.isValid);
          expect(b.hardViolations.map(identity).sort()).toEqual(
            a.hardViolations.map(identity).sort(),
          );
          expect(b.softScore).toBeCloseTo(a.softScore, 9);
        },
      ),
      { numRuns: RUNS },
    );
  });
});
