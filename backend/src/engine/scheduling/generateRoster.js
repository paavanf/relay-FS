// generateRoster.js
// The generator's entry point: demand in, roster out.
//
// PURE. Everything it needs is passed in, including the clock - `now` is an
// injected function, so tests can control time exactly and the engine still
// reads nothing from the outside world. Given the same input and seed it
// returns the same roster, every time.
//
// Three stages: expand the coverage rules into concrete slots, fill them
// greedily, then improve what greed produced within the budget.

import { expandDemand } from './expandDemand.js';
import { construct } from './construct.js';
import { improve } from './improve.js';
import { scoreRoster } from './objective.js';
import { resolveWeights } from './weights.js';
import { createRandom } from './random.js';

export function generateRoster(input) {
  const {
    startDate,
    endDate,
    workers = [],
    shiftTemplates = [],
    coverageRequirements = [],
    qualifications = [],
    availability = [],
    rules = {},
    timezone,
    fairnessDebt,
    weights: weightOverrides,
    seed = 1,
    deadlineMs,
    maxIterations = 5000,
    now,
    onProgress,
  } = input ?? {};

  const startedAt = typeof now === 'function' ? now() : 0;
  const weights = resolveWeights(weightOverrides);

  // The shape the constraint engine expects. Coverage is included so its
  // qualification check sees the same rules the demand was built from.
  const context = {
    workers,
    shiftTemplates,
    availability,
    coverage: coverageRequirements,
    rules,
    timezone,
    fairnessDebt,
  };

  const slots = expandDemand({
    startDate,
    endDate,
    shiftTemplates,
    coverageRequirements,
    qualifications,
    timezone,
  });

  const built = construct({ slots, context, weights });
  onProgress?.(50, { phase: 'constructed', unfilledCount: built.unfilledSlots.length });

  const refined = improve({
    ...built,
    slots,
    context,
    weights,
    random: createRandom(seed),
    maxIterations,
    now,
    deadlineAt: Number.isFinite(deadlineMs) && typeof now === 'function' ? startedAt + deadlineMs : undefined,
    onProgress,
  });

  const final = scoreRoster({
    assignments: refined.assignments,
    unfilledSlots: refined.unfilledSlots,
    context,
    weights,
  });

  return {
    assignments: refined.assignments,
    unfilledSlots: refined.unfilledSlots,
    metrics: {
      iterations: refined.iterations,
      improvementSteps: refined.improvementSteps,
      objectiveScore: final.score,
      unfilledCount: final.unfilledCount,
      totalSlots: slots.length,
      fairnessVariance: Math.round(final.fairnessVariance * 100) / 100,
      durationMs: typeof now === 'function' ? now() - startedAt : 0,
    },
  };
}
