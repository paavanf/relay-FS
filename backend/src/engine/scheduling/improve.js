// improve.js
// Local search: take the constructed roster and make it better, within a
// budget.
//
// Hill climbing with random restarts. Propose a move, keep it if the
// objective improves, otherwise throw it away; when progress stalls, jump
// back to the best roster found so far and try a different direction.
// Simulated annealing is the natural upgrade - it escapes local optima by
// sometimes accepting a worse move - but hill climbing is far easier to
// reason about when a roster comes out wrong, which matters more right now.
//
// Two hard guarantees:
//   never returns a roster worse than the one it was given
//   never returns a roster with a hard violation - every candidate is checked
//   against the constraint engine, never assumed legal
//
// Both bounds are external: an iteration cap, and a deadline read through an
// injected now(). The engine reads no clock of its own.

import { MOVES } from './moves.js';
import { randomIndex } from './random.js';
import { scoreRoster } from './objective.js';

const STALL_LIMIT = 60;

export function improve({
  assignments,
  unfilledSlots,
  slots,
  context,
  weights,
  random,
  maxIterations,
  now,
  deadlineAt,
  onProgress,
}) {
  const state = {
    assignments,
    unfilledSlots,
    slotsById: new Map(slots.map((s) => [s.slotId, s])),
    workersById: new Map((context.workers ?? []).map((w) => [w.membershipId, w])),
  };

  let best = { assignments, unfilledSlots };
  let bestScore = scoreRoster({ assignments, unfilledSlots, context, weights }).score;

  let current = best;
  let iterations = 0;
  let improvementSteps = 0;
  let sinceImprovement = 0;

  while (iterations < maxIterations) {
    if (outOfTime(now, deadlineAt)) break;
    iterations += 1;

    const move = MOVES[randomIndex(random, MOVES.length)];
    const candidate = move({
      state: { ...state, ...current },
      random,
      workers: context.workers ?? [],
    });

    if (candidate && isBetter(candidate, bestScore, context, weights)) {
      best = candidate;
      current = candidate;
      bestScore = scoreRoster({ ...candidate, context, weights }).score;
      improvementSteps += 1;
      sinceImprovement = 0;
    } else {
      sinceImprovement += 1;
    }

    // Stalled: restart from the best known roster rather than grinding on a
    // dead end. With a seeded generator the restarts are reproducible too.
    if (sinceImprovement >= STALL_LIMIT) {
      current = best;
      sinceImprovement = 0;
    }

    if (onProgress && iterations % 100 === 0) {
      onProgress(Math.min(99, Math.round((iterations / maxIterations) * 100)), {
        iterations,
        objectiveScore: bestScore,
        unfilledCount: best.unfilledSlots.length,
      });
    }
  }

  return { ...best, iterations, improvementSteps, objectiveScore: bestScore };
}

// A candidate is only better if it is both legal AND lower scoring. Legality
// is asked of the constraint engine, never inferred from the move.
//
// scoreRoster already evaluates the roster and reports isValid, so both
// questions come from one evaluation rather than two - which halves the cost
// of the hot loop.
function isBetter(candidate, bestScore, context, weights) {
  const scored = scoreRoster({ ...candidate, context, weights });
  return scored.isValid && scored.score < bestScore;
}

function outOfTime(now, deadlineAt) {
  if (typeof now !== 'function' || !Number.isFinite(deadlineAt)) return false;
  return now() >= deadlineAt;
}
