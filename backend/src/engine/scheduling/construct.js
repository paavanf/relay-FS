// construct.js
// The greedy first pass: build a legal roster, slot by slot.
//
// Slots are filled MOST CONSTRAINED FIRST - the ones with the fewest people
// qualified to take them go first. Filling in date order instead means the
// easy Monday day shifts consume the flexible staff, and by Saturday night
// there is nobody left who is allowed to work it. Ordering by scarcity is the
// single change that most reduces unfilled slots.
//
// Scarcity is measured on qualification alone and computed once. The strictly
// better measure - how many people could legally take the slot right now -
// changes after every assignment, and recomputing it for every remaining slot
// each time means a full constraint check per slot per worker per iteration,
// which is minutes rather than seconds on a real ward. Legality is still
// checked against the live roster at the moment a slot is filled; it is only
// the ORDERING that uses the cheaper measure.
//
// A slot with nobody eligible is left empty and the reason recorded. Filling
// it by breaking a hard rule is never an option.

import { findEligibleWorkers, toAssignment } from './eligibility.js';
import { scoreCandidate } from './scoreCandidate.js';
import { describeUnfilled } from './explainUnfilled.js';
import { compareByTime } from '../grouping.js';

export function construct({ slots, context, weights }) {
  const workers = context.workers ?? [];
  const ordered = orderByScarcity(slots, workers);

  const assignments = [];
  const unfilledSlots = [];

  for (let i = 0; i < ordered.length; i += 1) {
    const slot = ordered[i];
    const remainingSlots = ordered.slice(i + 1);

    const { eligible, qualifiedCount, blockedBy } = findEligibleWorkers(
      slot,
      workers,
      assignments,
      context,
    );

    if (eligible.length === 0) {
      unfilledSlots.push(describeUnfilled({ slot, qualifiedCount, blockedBy }));
      continue;
    }

    const best = bestWorker({ eligible, slot, assignments, context, weights, remainingSlots });
    assignments.push(toAssignment(slot, best.membershipId));
  }

  return { assignments, unfilledSlots };
}

function bestWorker({ eligible, slot, assignments, context, weights, remainingSlots }) {
  let best = null;
  let bestScore = Infinity;

  for (const worker of eligible) {
    const score = scoreCandidate({ worker, slot, assignments, context, weights, remainingSlots });

    // Ties break on membershipId so the same input always gives the same
    // roster, whatever order the workers arrived in.
    if (score < bestScore || (score === bestScore && worker.membershipId < best.membershipId)) {
      best = worker;
      bestScore = score;
    }
  }

  return best;
}

function orderByScarcity(slots, workers) {
  const holdersOf = new Map();
  for (const slot of slots) {
    if (holdersOf.has(slot.qualificationId)) continue;
    holdersOf.set(
      slot.qualificationId,
      workers.filter((w) => (w.qualificationIds ?? []).includes(slot.qualificationId)).length,
    );
  }

  // Fewest qualified people first; then the engine's chronological order -
  // start, then end, then slotId - so the ordering is total and the result
  // reproducible. (It used to skip the end time and compare ids with
  // localeCompare, which can differ from one machine to the next.)
  return [...slots].sort((a, b) => {
    const scarcity = holdersOf.get(a.qualificationId) - holdersOf.get(b.qualificationId);
    if (scarcity !== 0) return scarcity;
    return compareByTime(a, b, (slot) => slot.slotId);
  });
}
