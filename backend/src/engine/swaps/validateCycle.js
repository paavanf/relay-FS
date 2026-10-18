// validateCycle.js
// Is a whole cycle legal? Runs the M3 engine on the post-swap schedules of
// the cycle's participants - theirs are the only schedules a swap changes.
//
// Checking only them is sound because no hard constraint looks across two
// people: each one is per assignment or grouped by worker. Generation leans
// on the same fact (scheduling/eligibility.js), and
// tests/engine/scheduling/eligibility.test.js fails the moment a
// cross-worker hard rule is added.
//
// Never edge by edge. Each participant is checked with what they give AND
// what they receive applied together - giving away a Monday night can be
// exactly what makes a Tuesday morning legal, and a shift that fits on its
// own can still break a rule once the rest of their week is counted.
//
// The same fact means a participant's post-swap schedule is their own shifts
// minus the one they offered plus the one they take, whatever else the
// cycle does. So it is built from that hand-over alone (applyCycle on the
// pair), checked against the context narrowed to them (ownContext.js), and
// the verdict is kept by the pair of offers: a long search asks the same
// question many times.

import { evaluate } from '../constraints/evaluate.js';
import { applyCycle } from './applyCycle.js';
import { createOwnContext } from './ownContext.js';

function byWorker(assignments) {
  const groups = new Map();
  for (const assignment of assignments) {
    if (!groups.has(assignment.membershipId)) groups.set(assignment.membershipId, []);
    groups.get(assignment.membershipId).push(assignment);
  }
  return groups;
}

export function createCycleValidator({ assignments, context }) {
  const ownShifts = byWorker(assignments);
  const byId = new Map(assignments.map((a) => [a.id, a]));
  const verdicts = new Map();
  const ownContext = createOwnContext(context);

  /** The hard rules `taker` would break after giving away their offer and taking `taken`'s shift. */
  function codesFor(taker, taken) {
    const key = `${taker.id}>${taken.id}`;
    if (!verdicts.has(key)) {
      const before = [...(ownShifts.get(taker.membershipId) ?? []), byId.get(taken.assignmentId)];
      const schedule = applyCycle(before, [taker, taken]).filter((a) => a.membershipId === taker.membershipId);
      const { hardViolations } = evaluate(schedule, ownContext(taker.membershipId), { skipSoft: true });
      verdicts.set(key, [...new Set(hardViolations.map((v) => v.code))]);
    }
    return verdicts.get(key);
  }

  /** @returns {{ valid: boolean, codes: string[], blockedWorker?: string }} */
  function validate(cycle) {
    for (const [i, taker] of cycle.entries()) {
      const codes = codesFor(taker, cycle[(i + 1) % cycle.length]);
      if (codes.length > 0) return { valid: false, codes, blockedWorker: taker.membershipId };
    }
    return { valid: true, codes: [] };
  }

  return { validate, codesFor };
}
