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
//   out here and reported, so each constraint can be a short, total function
//   instead of defending itself. There is no blanket try/catch around them: a
//   genuine bug should fail a test loudly, not hide behind a swallowed error.

import { HARD_CONSTRAINTS } from './hard/index.js';
import { SOFT_CONSTRAINTS } from './soft/index.js';
import { isValidInstant, isValidZone, toMillis } from '../time.js';

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
export function evaluate(assignments, context) {
  const safeContext = normaliseContext(context);
  const { usable, malformed } = partition(Array.isArray(assignments) ? assignments : []);

  const hardViolations = [...malformed];
  for (const check of HARD_CONSTRAINTS) {
    hardViolations.push(...check(usable, safeContext));
  }

  const softPenalties = [];
  for (const score of SOFT_CONSTRAINTS) {
    softPenalties.push(...score(usable, safeContext));
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
  const { hardViolations } = evaluate([...existing, candidate], context);

  const violations = hardViolations.filter((v) => v.assignmentIds.includes(candidate.id));
  return { allowed: violations.length === 0, violations };
}

// An assignment is usable if we can place it on a timeline and attribute it to
// someone. Anything else cannot be reasoned about at all.
function partition(assignments) {
  const usable = [];
  const malformed = [];

  for (const assignment of assignments) {
    const problem = describeProblem(assignment);
    if (problem) malformed.push(malformedViolation(assignment, problem));
    else usable.push(assignment);
  }

  return { usable, malformed };
}

function describeProblem(assignment) {
  if (!assignment || typeof assignment !== 'object') return 'Not an assignment object.';
  if (typeof assignment.membershipId !== 'string' || assignment.membershipId.length === 0) {
    return 'Missing membershipId.';
  }
  if (typeof assignment.id !== 'string' || assignment.id.length === 0) return 'Missing id.';
  if (!isValidInstant(assignment.startsAt)) return 'startsAt is not a valid instant.';
  if (!isValidInstant(assignment.endsAt)) return 'endsAt is not a valid instant.';
  if (toMillis(assignment.endsAt) <= toMillis(assignment.startsAt)) {
    return 'Ends at or before it starts.';
  }
  return null;
}

function malformedViolation(assignment, reason) {
  return {
    code: 'MALFORMED_ASSIGNMENT',
    severity: 'hard',
    membershipId: typeof assignment?.membershipId === 'string' ? assignment.membershipId : '',
    assignmentIds: typeof assignment?.id === 'string' ? [assignment.id] : [],
    message: `Assignment cannot be evaluated: ${reason}`,
    details: { reason },
  };
}

// Fills in whatever the caller left out, so every constraint can read
// context.workers, context.coverage and so on without guarding first.
function normaliseContext(context) {
  const given = context && typeof context === 'object' ? context : {};
  const rules = given.rules && typeof given.rules === 'object' ? given.rules : {};

  return {
    workers: asArray(given.workers),
    shiftTemplates: asArray(given.shiftTemplates),
    availability: asArray(given.availability),
    coverage: asArray(given.coverage),
    // An unusable limit means "not configured": each constraint sits out
    // rather than inventing a default and rejecting a roster for a rule
    // nobody actually set.
    rules: {
      minRestHours: rules.minRestHours,
      maxConsecutiveDays: rules.maxConsecutiveDays,
      maxHoursPerWeek: rules.maxHoursPerWeek,
    },
    // A bad timezone would make every date calculation silently wrong, so fall
    // back to UTC rather than producing confident nonsense.
    timezone: isValidZone(given.timezone) ? given.timezone : 'utc',
    fairnessDebt: given.fairnessDebt,
  };
}

function asArray(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];
}
