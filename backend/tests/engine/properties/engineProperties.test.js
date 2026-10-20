// engineProperties.test.js
// Invariants that must hold for EVERY structurally valid input, checked
// against hundreds of randomly generated cases each (engineArbitraries.js):
// determinism, never throwing, isValid meaning exactly "no hard violations",
// and an empty roster always valid. How the answer behaves as a roster
// changes is engineChanges.test.js.
//
// These catch the cases nobody thinks to write by hand: the shift that starts
// exactly when another ends, in a half-hour timezone, on the night the clocks
// change, for a worker who also has three other shifts that week.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { evaluate } from '../../../src/engine/index.js';
import { RUNS, assignmentsArb, contextArb } from './engineArbitraries.js';

describe('engine properties', () => {
  it('is deterministic - the same input always gives the same output', () => {
    fc.assert(
      fc.property(assignmentsArb, contextArb, (assignments, context) => {
        expect(evaluate(assignments, context)).toEqual(evaluate(assignments, context));
      }),
      { numRuns: RUNS },
    );
  });

  it('never throws on structurally valid input', () => {
    fc.assert(
      fc.property(assignmentsArb, contextArb, (assignments, context) => {
        expect(() => evaluate(assignments, context)).not.toThrow();
      }),
      { numRuns: RUNS },
    );
  });

  it('reports isValid if and only if there are no hard violations', () => {
    fc.assert(
      fc.property(assignmentsArb, contextArb, (assignments, context) => {
        const result = evaluate(assignments, context);
        expect(result.isValid).toBe(result.hardViolations.length === 0);
      }),
      { numRuns: RUNS },
    );
  });

  it('always calls an empty assignment set valid', () => {
    fc.assert(
      fc.property(contextArb, (context) => {
        const result = evaluate([], context);
        expect(result.isValid).toBe(true);
        expect(result.hardViolations).toEqual([]);
        expect(result.softScore).toBe(0);
      }),
      { numRuns: RUNS },
    );
  });
});
