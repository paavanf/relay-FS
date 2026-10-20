// generationProperties.test.js
// The headline invariant of the whole project, checked against hundreds of
// randomly generated organisations:
//
//   whatever the generator produces is legal.
//
// Not "usually legal", not "legal for the scenarios we thought of". If this
// ever fails, the software is producing rosters that break somebody's rest
// entitlement, and nothing else in Relay matters until it is fixed. With it:
// never throwing, determinism for a seed, and finishing within the cap.
// What happens to the slots is generationSlots.test.js.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateRoster } from '../../../src/engine/scheduling/generateRoster.js';
import { evaluate } from '../../../src/engine/constraints/evaluate.js';
import { scenarioArb, contextOf } from './scenarioArbitraries.js';

const RUNS = 150;

describe('generation properties', () => {
  it('every generated roster is legal', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        const result = generateRoster(input);
        const { isValid, hardViolations } = evaluate(result.assignments, contextOf(input));

        // Named so a failure says which rule was broken, not just "false".
        expect(hardViolations.map((v) => v.code)).toEqual([]);
        expect(isValid).toBe(true);
      }),
      { numRuns: RUNS },
    );
  });

  it('never throws, whatever the staffing', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        expect(() => generateRoster(input)).not.toThrow();
      }),
      { numRuns: RUNS },
    );
  });

  it('is deterministic for a given seed', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        expect(generateRoster(input).assignments).toEqual(generateRoster(input).assignments);
      }),
      { numRuns: RUNS },
    );
  });

  it('always terminates within the iteration cap', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        const result = generateRoster(input);
        expect(result.metrics.iterations).toBeLessThanOrEqual(input.maxIterations);
      }),
      { numRuns: RUNS },
    );
  });
});
