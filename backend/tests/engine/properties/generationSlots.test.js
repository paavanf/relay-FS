// generationSlots.test.js
// Generation properties about the roster's slots, against hundreds of
// randomly generated organisations: improvement never scores worse than
// construction, no slot is filled twice or invented, and every slot left
// unfilled says why.

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { generateRoster } from '../../../src/engine/scheduling/generateRoster.js';
import { construct } from '../../../src/engine/scheduling/construct.js';
import { improve } from '../../../src/engine/scheduling/improve.js';
import { expandDemand } from '../../../src/engine/scheduling/expandDemand.js';
import { scoreRoster } from '../../../src/engine/scheduling/objective.js';
import { resolveWeights } from '../../../src/engine/scheduling/weights.js';
import { createRandom } from '../../../src/engine/scheduling/random.js';
import { scenarioArb, contextOf } from './scenarioArbitraries.js';

const RUNS = 150;
const weights = resolveWeights();

describe('generation properties', () => {
  it('improvement never makes the objective worse than construction', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        const context = contextOf(input);
        const slots = expandDemand(input);
        const built = construct({ slots, context, weights });

        const before = scoreRoster({ ...built, context, weights }).score;
        const after = improve({
          ...built,
          slots,
          context,
          weights,
          random: createRandom(input.seed),
          maxIterations: input.maxIterations,
        });

        expect(after.objectiveScore).toBeLessThanOrEqual(before);
      }),
      { numRuns: RUNS },
    );
  });

  it('never fills a slot twice or invents one', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        const result = generateRoster(input);
        const slotIds = new Set(expandDemand(input).map((s) => s.slotId));

        const assignedIds = result.assignments.map((a) => a.id);
        expect(new Set(assignedIds).size).toBe(assignedIds.length);
        expect(assignedIds.every((id) => slotIds.has(id))).toBe(true);

        // Every slot is either filled or explained; none goes missing.
        expect(result.assignments.length + result.unfilledSlots.length).toBe(slotIds.size);
      }),
      { numRuns: RUNS },
    );
  });

  it('explains every slot it could not fill', () => {
    fc.assert(
      fc.property(scenarioArb, (input) => {
        for (const hole of generateRoster(input).unfilledSlots) {
          expect(typeof hole.reason).toBe('string');
          expect(hole.reason.length).toBeGreaterThan(20);
          expect(hole.slotId).toBeTruthy();
        }
      }),
      { numRuns: RUNS },
    );
  });
});
