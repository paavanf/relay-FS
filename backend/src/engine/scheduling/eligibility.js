// eligibility.js
// Who can legally take a slot, given what has already been assigned.
//
// This does NOT decide legality itself - it calls canAssign() from the
// constraint engine, so there is exactly one implementation of every hard
// rule and the generator can never drift from what manual editing or swap
// validation will later allow.
//
// Each candidate assignment carries its slot's role (slotQualificationId),
// so the engine itself refuses anyone without that exact qualification. The
// filter below only narrows the field first: it is how qualifiedCount - who
// could ever fill this slot - is counted for the unfilled-slot explanation,
// and it saves asking the engine about people it is bound to refuse.

import { canAssign } from '../constraints/evaluate.js';

// PRECONDITION: every hard constraint is either per-assignment
// (qualification, declared unavailability, malformed) or grouped by worker
// (double booking, minimum rest, consecutive days, weekly hours). None looks
// across two different people.
//
// That means the violations involving a candidate depend only on the
// candidate and that worker's OWN assignments - so the rest of the roster can
// be left out of the check. On a fortnight's ward this turns a 150-assignment
// evaluation into a 5-assignment one, which is the difference between
// generation taking minutes and taking seconds.
//
// If a genuinely cross-worker hard constraint is ever added, this shortcut
// becomes wrong. tests/engine/scheduling/eligibility.test.js asserts the
// filtered answer matches the unfiltered one, and will fail if that happens.
function ownAssignments(assignments, membershipId) {
  return assignments.filter((a) => a.membershipId === membershipId);
}

/** The assignment a slot becomes once somebody is put in it - the slot's role included. */
export function toAssignment(slot, membershipId) {
  return {
    id: slot.slotId,
    membershipId,
    shiftTemplateId: slot.shiftTemplateId,
    slotQualificationId: slot.qualificationId,
    date: slot.date,
    startsAt: slot.startsAt,
    endsAt: slot.endsAt,
  };
}

export function holdsQualification(worker, slot) {
  return (worker.qualificationIds ?? []).includes(slot.qualificationId);
}

/**
 * @returns {{
 *   eligible: EngineWorker[],
 *   qualifiedCount: number,
 *   blockedBy: Record<string, number>   violation code -> how many people it stopped
 * }}
 */
export function findEligibleWorkers(slot, workers, assignments, context) {
  const qualified = workers.filter((worker) => holdsQualification(worker, slot));

  const eligible = [];
  const blockedBy = {};

  for (const worker of qualified) {
    const { allowed, violations } = canAssign(
      toAssignment(slot, worker.membershipId),
      ownAssignments(assignments, worker.membershipId),
      context,
    );

    if (allowed) {
      eligible.push(worker);
      continue;
    }

    // Remember what stopped them. When a slot ends up unfilled this is the
    // difference between "no reason given" and a manager knowing to move a
    // shift or hire.
    for (const code of new Set(violations.map((v) => v.code))) {
      blockedBy[code] = (blockedBy[code] ?? 0) + 1;
    }
  }

  return { eligible, qualifiedCount: qualified.length, blockedBy };
}
