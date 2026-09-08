// moves.js
// The three ways local search can change a roster.
//
// Each returns a NEW candidate state or null if the move is not possible.
// None of them decides legality - the caller checks every candidate against
// the constraint engine before accepting it, because a move that looks local
// can break a rule several days away.

import { toAssignment } from './eligibility.js';
import { pickOne } from './random.js';

/** (a) Give one assignment to a different worker. */
export function reassign({ state, random, workers }) {
  const assignment = pickOne(random, state.assignments);
  const worker = pickOne(random, workers);
  if (!assignment || !worker || assignment.membershipId === worker.membershipId) return null;

  const slot = state.slotsById.get(assignment.id);
  if (!slot || !(worker.qualificationIds ?? []).includes(slot.qualificationId)) return null;

  return {
    assignments: state.assignments.map((a) =>
      a.id === assignment.id ? { ...a, membershipId: worker.membershipId } : a,
    ),
    unfilledSlots: state.unfilledSlots,
  };
}

/** (b) Swap the two workers on two assignments. */
export function swapPair({ state, random }) {
  const first = pickOne(random, state.assignments);
  const second = pickOne(random, state.assignments);
  if (!first || !second || first.id === second.id) return null;
  if (first.membershipId === second.membershipId) return null;

  const firstSlot = state.slotsById.get(first.id);
  const secondSlot = state.slotsById.get(second.id);
  if (!firstSlot || !secondSlot) return null;

  // Both people have to be qualified for the other's slot, or the swap is
  // pointless - the constraint check would reject it a moment later anyway.
  const firstWorker = state.workersById.get(first.membershipId);
  const secondWorker = state.workersById.get(second.membershipId);
  if (!firstWorker || !secondWorker) return null;
  if (!(firstWorker.qualificationIds ?? []).includes(secondSlot.qualificationId)) return null;
  if (!(secondWorker.qualificationIds ?? []).includes(firstSlot.qualificationId)) return null;

  return {
    assignments: state.assignments.map((a) => {
      if (a.id === first.id) return { ...a, membershipId: second.membershipId };
      if (a.id === second.id) return { ...a, membershipId: first.membershipId };
      return a;
    }),
    unfilledSlots: state.unfilledSlots,
  };
}

/** (c) Fill a hole that an earlier move may have opened up. */
export function fillUnfilled({ state, random, workers }) {
  const hole = pickOne(random, state.unfilledSlots);
  const worker = pickOne(random, workers);
  if (!hole || !worker) return null;

  const slot = state.slotsById.get(hole.slotId);
  if (!slot || !(worker.qualificationIds ?? []).includes(slot.qualificationId)) return null;

  return {
    assignments: [...state.assignments, toAssignment(slot, worker.membershipId)],
    unfilledSlots: state.unfilledSlots.filter((u) => u.slotId !== hole.slotId),
  };
}

export const MOVES = [reassign, swapPair, fillUnfilled];
