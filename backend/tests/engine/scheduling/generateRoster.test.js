// generateRoster.test.js
// The whole generation pipeline: a legal roster, a comfortably staffed week
// filled, metrics the job record can store, and the same roster for the same
// seed - the property the caller depends on most.

import { describe, it, expect } from 'vitest';
import { generateRoster } from '../../../src/engine/scheduling/generateRoster.js';
import { evaluate } from '../../../src/engine/constraints/evaluate.js';
import { scenario, contextOf, workers, everyDay, fakeClock } from './helpers/build.js';

describe('generateRoster', () => {
  it('produces a legal roster', () => {
    const input = scenario({ workers: workers(12) });
    const result = generateRoster(input);

    expect(evaluate(result.assignments, contextOf(input)).isValid).toBe(true);
  });

  it('fills a comfortably staffed week', () => {
    const result = generateRoster(scenario({ workers: workers(12) }));

    expect(result.unfilledSlots).toEqual([]);
    expect(result.metrics.unfilledCount).toBe(0);
    expect(result.assignments).toHaveLength(result.metrics.totalSlots);
  });

  it('reports metrics the job record can store', () => {
    const result = generateRoster(scenario({ workers: workers(12), now: fakeClock(2) }));

    expect(result.metrics).toMatchObject({
      iterations: expect.any(Number),
      objectiveScore: expect.any(Number),
      unfilledCount: expect.any(Number),
      improvementSteps: expect.any(Number),
      totalSlots: expect.any(Number),
    });
  });

  it('gives the same roster for the same seed', () => {
    const input = scenario({ workers: workers(10), seed: 7 });

    expect(generateRoster(input).assignments).toEqual(generateRoster(input).assignments);
  });

  it('gives the same roster for the same seed across separate runs of a bigger problem', () => {
    const input = scenario({
      workers: workers(14),
      seed: 99,
      maxIterations: 800,
      coverageRequirements: [
        ...everyDay('t-day', [{ qualificationId: 'RN', count: 2 }]),
        ...everyDay('t-night', [{ qualificationId: 'RN', count: 2 }]),
      ],
    });

    const a = generateRoster(input);
    const b = generateRoster(input);
    expect(a.assignments).toEqual(b.assignments);
    expect(a.metrics.objectiveScore).toBe(b.metrics.objectiveScore);
  });

  it('may explore differently under a different seed', () => {
    // Not "must differ" - on an easy problem every seed can reach the same
    // optimum, and asserting otherwise would be a flaky test. What must hold
    // is that the seed is actually consulted.
    const base = scenario({ workers: workers(10), maxIterations: 400 });
    const one = generateRoster({ ...base, seed: 1 });
    const two = generateRoster({ ...base, seed: 2 });

    expect(evaluate(one.assignments, contextOf(base)).isValid).toBe(true);
    expect(evaluate(two.assignments, contextOf(base)).isValid).toBe(true);
    expect(one.assignments).toHaveLength(two.assignments.length);
  });
});
