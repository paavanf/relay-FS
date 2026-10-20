// generateRosterBudget.test.js
// Generation within its budget: it stops at the iteration cap or a tiny time
// budget with a usable roster, runs with no clock at all, reports progress
// through a callback, leaves holes rather than break rules, and survives an
// empty organisation.

import { describe, it, expect } from 'vitest';
import { generateRoster } from '../../../src/engine/scheduling/generateRoster.js';
import { evaluate } from '../../../src/engine/constraints/evaluate.js';
import { scenario, contextOf, workers, everyDay, fakeClock } from './helpers/build.js';

describe('generateRoster', () => {
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
