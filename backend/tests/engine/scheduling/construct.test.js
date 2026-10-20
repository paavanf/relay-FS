// construct.test.js
// The greedy pass. Its one inviolable promise: it would rather leave a shift
// empty than break a rule to fill it - even badly over-constrained, or with
// nobody holding the qualification.

import { describe, it, expect } from 'vitest';
import { construct } from '../../../src/engine/scheduling/construct.js';
import { expandDemand } from '../../../src/engine/scheduling/expandDemand.js';
import { resolveWeights } from '../../../src/engine/scheduling/weights.js';
import { evaluate } from '../../../src/engine/constraints/evaluate.js';
import { scenario, contextOf, workers, everyDay } from './helpers/build.js';

const weights = resolveWeights();
function build(input) {
  const context = contextOf(input);
  const slots = expandDemand(input);
  return { ...construct({ slots, context, weights }), slots, context };
}

describe('construct', () => {
  it('handles having nothing to do', () => {
    const input = scenario({ coverageRequirements: [] });
    const built = build(input);
    expect(built.assignments).toEqual([]);
    expect(built.unfilledSlots).toEqual([]);
  });

  it('fills a comfortably staffed week completely', () => {
    const built = build(scenario({ workers: workers(12) }));
    expect(built.unfilledSlots).toEqual([]);
    expect(built.assignments).toHaveLength(built.slots.length);
  });

  it('never produces a hard violation', () => {
    const built = build(scenario({ workers: workers(12) }));
    expect(evaluate(built.assignments, built.context).isValid).toBe(true);
  });

  it('never produces a hard violation even when badly over-constrained', () => {
    // Three people, three shifts a day, every day - impossible without
    // breaking rest rules. It must leave holes, not break them.
    const input = scenario({
      workers: workers(3),
      coverageRequirements: [
        ...everyDay('t-day', [{ qualificationId: 'RN', count: 2 }]),
        ...everyDay('t-eve', [{ qualificationId: 'RN', count: 2 }]),
        ...everyDay('t-night', [{ qualificationId: 'RN', count: 2 }]),
      ],
    });

    const built = build(input);
    expect(built.unfilledSlots.length).toBeGreaterThan(0);
    expect(evaluate(built.assignments, built.context).isValid).toBe(true);
  });

  it('leaves a slot unfilled when nobody holds the qualification', () => {
    const input = scenario({
      workers: workers(6, ['RN']),
      coverageRequirements: everyDay('t-day', [{ qualificationId: 'CN', count: 1 }]),
    });

    const built = build(input);
    expect(built.assignments).toEqual([]);
    expect(built.unfilledSlots).toHaveLength(7);
  });
});
