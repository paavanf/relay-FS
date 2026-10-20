// evaluate.js
// The single entry point to the constraint engine.
//
// The roster generator, manual roster edits and the swap-chain finder all come
// through here. That is the whole point: if constraint logic were written more
// than once the copies would drift, and we would eventually ship a swap the
// generator would have refused.
//
// Two guarantees this file is responsible for:
//
//   It never throws. Malformed input is reported as a violation rather than an
//   exception, because the callers are a background job, a live-typing UI and
//   a search loop - none of which can usefully catch.
//
//   Constraints only ever see well-formed data. Anything unusable is filtered
//   out here (cleanInput.js) and reported, so each constraint can be a short,
//   total function instead of defending itself. There is no blanket try/catch around them: a
//   genuine bug should fail a test loudly, not hide behind a swallowed error.

import { HARD_CONSTRAINTS } from './hard/index.js';
import { SOFT_CONSTRAINTS } from './soft/index.js';
import { partition, malformedViolation, normaliseContext } from './cleanInput.js';

/**
 * @param {import('../types.js').EngineAssignment[]} assignments
 * @param {import('../types.js').EngineContext} context
 * @returns {{
 *   isValid: boolean,
 *   hardViolations: import('../types.js').Violation[],
 *   softPenalties: import('../types.js').SoftPenalty[],
 *   softScore: number
 * }}
 */
export function evaluate(assignments, context, { skipSoft = false } = {}) {
  const safeContext = normaliseContext(context);
  const { usable, malformed } = partition(Array.isArray(assignments) ? assignments : []);

  const hardViolations = [...malformed];
  for (const check of HARD_CONSTRAINTS) {
    hardViolations.push(...check(usable, safeContext));
  }

  // The generator asks this question hundreds of thousands of times and only
  // ever reads hardViolations, so computing penalties it throws away is pure
  // waste. skipSoft cannot change legality - no soft constraint contributes a
  // hard violation.
  const softPenalties = [];
  if (!skipSoft) {
    for (const score of SOFT_CONSTRAINTS) {
      softPenalties.push(...score(usable, safeContext));
    }
  }

  const softScore = softPenalties.reduce((total, item) => total + item.penalty, 0);

  return { isValid: hardViolations.length === 0, hardViolations, softPenalties, softScore };
}

/**
 * Would adding one assignment to an existing set be legal?
 *
 * Returns only the violations that involve the candidate, so a UI can say
 * "this edit breaks minimum rest" rather than dumping every unrelated problem
 * the roster already had.
 *
 * @returns {{ allowed: boolean, violations: import('../types.js').Violation[] }}
 */
export function canAssign(candidateAssignment, existingAssignments, context) {
  if (!candidateAssignment || typeof candidateAssignment !== 'object') {
    return {
      allowed: false,
      violations: [malformedViolation(candidateAssignment, 'Not an assignment object.')],
    };
  }

  // An assignment being placed may not have an id yet. Give it one for the
  // duration of the check so the violations can be traced back to it.
  const candidate =
    typeof candidateAssignment.id === 'string' && candidateAssignment.id.length > 0
      ? candidateAssignment
      : { ...candidateAssignment, id: '__candidate__' };

  const existing = Array.isArray(existingAssignments) ? existingAssignments : [];
  const { hardViolations } = evaluate([...existing, candidate], context, { skipSoft: true });

  const violations = hardViolations.filter((v) => v.assignmentIds.includes(candidate.id));
  return { allowed: violations.length === 0, violations };
}
