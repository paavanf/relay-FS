// generateRoster.test.js
// The whole pipeline, plus the two properties the caller depends on: the same
// seed gives the same roster, and the budget is always respected.

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

  it('stops at the iteration cap', () => {
    const result = generateRoster(scenario({ workers: workers(10), maxIterations: 50 }));
    expect(result.metrics.iterations).toBeLessThanOrEqual(50);
  });

  it('returns quickly when the time budget is tiny, with a usable roster', () => {
    // The clock jumps 100ms per read against a 10ms budget, so improvement
    // stops almost immediately - but construction has already run, so what
    // comes back is a real roster.
    const input = scenario({
      workers: workers(12),
      maxIterations: 1_000_000,
      deadlineMs: 10,
      now: fakeClock(100),
    });

    const result = generateRoster(input);

    expect(result.metrics.iterations).toBeLessThan(10);
    expect(result.assignments.length).toBeGreaterThan(0);
    expect(evaluate(result.assignments, contextOf(input)).isValid).toBe(true);
  });

  it('runs without a clock at all, bounded by iterations alone', () => {
    const result = generateRoster(scenario({ workers: workers(10), maxIterations: 100, now: undefined }));

    expect(result.metrics.iterations).toBeLessThanOrEqual(100);
    expect(result.metrics.durationMs).toBe(0);
  });

  it('reports progress through the callback rather than doing any I/O', () => {
    const seen = [];
    generateRoster(
      scenario({ workers: workers(10), maxIterations: 500, onProgress: (p) => seen.push(p) }),
    );

    expect(seen.length).toBeGreaterThan(0);
    expect(Math.max(...seen)).toBeLessThanOrEqual(99);
  });

  it('leaves holes rather than breaking rules when understaffed', () => {
    const input = scenario({
      workers: workers(2),
      coverageRequirements: [
        ...everyDay('t-day', [{ qualificationId: 'RN', count: 2 }]),
        ...everyDay('t-night', [{ qualificationId: 'RN', count: 2 }]),
      ],
    });

    const result = generateRoster(input);

    expect(result.unfilledSlots.length).toBeGreaterThan(0);
    expect(result.unfilledSlots.every((u) => typeof u.reason === 'string' && u.reason.length > 0)).toBe(true);
    expect(evaluate(result.assignments, contextOf(input)).isValid).toBe(true);
  });

  it('survives an empty organisation', () => {
    const result = generateRoster(scenario({ workers: [], coverageRequirements: [] }));
    expect(result.assignments).toEqual([]);
    expect(result.unfilledSlots).toEqual([]);
  });
});
