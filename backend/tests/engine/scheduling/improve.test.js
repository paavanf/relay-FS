// improve.test.js
// Local search. Two things must never happen: it must never hand back a worse
// roster than it was given, and it must never hand back an illegal one.

import { describe, it, expect } from 'vitest';
import { construct } from '../../../src/engine/scheduling/construct.js';
import { improve } from '../../../src/engine/scheduling/improve.js';
import { expandDemand } from '../../../src/engine/scheduling/expandDemand.js';
import { scoreRoster } from '../../../src/engine/scheduling/objective.js';
import { resolveWeights } from '../../../src/engine/scheduling/weights.js';
import { createRandom } from '../../../src/engine/scheduling/random.js';
import { evaluate } from '../../../src/engine/constraints/evaluate.js';
import { scenario, contextOf, workers, everyDay, fakeClock } from './helpers/build.js';

const weights = resolveWeights();

function setup(overrides = {}, { seed = 5, maxIterations = 500, now, deadlineAt } = {}) {
  const input = scenario(overrides);
  const context = contextOf(input);
  const slots = expandDemand(input);
  const built = construct({ slots, context, weights });

  const before = scoreRoster({ ...built, context, weights }).score;
  const after = improve({
    ...built,
    slots,
    context,
    weights,
    random: createRandom(seed),
    maxIterations,
    now,
    deadlineAt,
  });

  return { input, context, built, before, after };
}

describe('improve', () => {
  it('never returns a worse objective score than it started with', () => {
    const { before, after } = setup({ workers: workers(10) });
    expect(after.objectiveScore).toBeLessThanOrEqual(before);
  });

  it('never returns a worse score on a tight problem either', () => {
    const { before, after } = setup({
      workers: workers(4),
      coverageRequirements: [
        ...everyDay('t-day', [{ qualificationId: 'RN', count: 2 }]),
        ...everyDay('t-night', [{ qualificationId: 'RN', count: 1 }]),
      ],
    });

    expect(after.objectiveScore).toBeLessThanOrEqual(before);
  });

  it('never introduces a hard violation', () => {
    const { context, after } = setup({ workers: workers(10) });
    expect(evaluate(after.assignments, context).isValid).toBe(true);
  });

  it('never introduces a hard violation on a tight problem', () => {
    const { context, after } = setup({
      workers: workers(4),
      coverageRequirements: [
        ...everyDay('t-day', [{ qualificationId: 'RN', count: 2 }]),
        ...everyDay('t-night', [{ qualificationId: 'RN', count: 1 }]),
      ],
    });

    expect(evaluate(after.assignments, context).isValid).toBe(true);
  });

  it('respects the iteration cap', () => {
    const { after } = setup({ workers: workers(10) }, { maxIterations: 25 });
    expect(after.iterations).toBeLessThanOrEqual(25);
  });

  it('stops at the deadline even with iterations left', () => {
    // Each clock read advances 100ms; the deadline is 250ms away.
    const { after } = setup(
      { workers: workers(10) },
      { maxIterations: 100_000, now: fakeClock(100), deadlineAt: 250 },
    );

    expect(after.iterations).toBeLessThan(10);
  });

  it('is deterministic for a given seed', () => {
    const a = setup({ workers: workers(10) }, { seed: 11 });
    const b = setup({ workers: workers(10) }, { seed: 11 });

    expect(a.after.assignments).toEqual(b.after.assignments);
    expect(a.after.objectiveScore).toBe(b.after.objectiveScore);
  });

  it('does nothing harmful when there is nothing to improve', () => {
    const { after } = setup({ coverageRequirements: [] });
    expect(after.assignments).toEqual([]);
    expect(after.unfilledSlots).toEqual([]);
  });

  it('counts the improvements it actually made', () => {
    const { after } = setup({ workers: workers(10) });
    expect(after.improvementSteps).toBeGreaterThanOrEqual(0);
    expect(after.improvementSteps).toBeLessThanOrEqual(after.iterations);
  });
});
