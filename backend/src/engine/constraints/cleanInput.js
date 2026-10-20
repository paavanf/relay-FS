// cleanInput.js
// What evaluate.js does to its input before any constraint sees it: splits
// the assignments into usable ones and malformed ones - each malformed one
// reported as a violation, never thrown - and fills in whatever the context
// left out, so every constraint can be a short, total function.

import { isValidInstant, isValidZone, toMillis } from '../time.js';

// An assignment is usable if we can place it on a timeline and attribute it to
// someone. Anything else cannot be reasoned about at all.
export function partition(assignments) {
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

export function malformedViolation(assignment, reason) {
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
export function normaliseContext(context) {
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
