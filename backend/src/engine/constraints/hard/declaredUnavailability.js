// declaredUnavailability.js
// A worker cannot be rostered on a day or shift they declared `unavailable`.
// That is a hard rule; `prefer` and `avoid` are advisory and handled by the
// soft constraints instead.
//
// Two kinds of declaration can apply to one assignment:
//   recurring  - matched on day of week, computed in the org's timezone
//   exception  - matched on a specific local date
//
// Exceptions take precedence over recurring entries for the same date. Someone
// who never works Mondays but made an exception for the 16th is available on
// the 16th, and the recurring rule must not override that.
//
// Scope: an entry with shiftTemplateId null covers every shift that day; with
// one set it covers only that template.

import { localDate, localDayOfWeek } from '../../time.js';

/**
 * @param {import('../../types.js').EngineAssignment[]} assignments
 * @param {import('../../types.js').EngineContext} context
 * @returns {import('../../types.js').Violation[]}
 */
export function checkDeclaredUnavailability(assignments, context) {
  const violations = [];

  for (const assignment of assignments) {
    const day = localDate(assignment.startsAt, context.timezone);
    const dayOfWeek = localDayOfWeek(assignment.startsAt, context.timezone);

    const applicable = context.availability.filter(
      (entry) =>
        entry.membershipId === assignment.membershipId &&
        coversTemplate(entry, assignment.shiftTemplateId) &&
        matchesWhen(entry, day, dayOfWeek),
    );

    // If the worker said anything specific about this date, that is the whole
    // story - the weekly habit does not get a vote.
    const exceptions = applicable.filter((entry) => entry.type === 'exception');
    const deciding = exceptions.length > 0 ? exceptions : applicable;

    const blocking = deciding.find((entry) => entry.status === 'unavailable');
    if (!blocking) continue;

    violations.push({
      code: 'DECLARED_UNAVAILABLE',
      severity: 'hard',
      membershipId: assignment.membershipId,
      assignmentIds: [assignment.id],
      message: `Declared unavailable on ${day}.`,
      details: {
        date: day,
        declarationType: blocking.type,
        appliesToAllShifts: blocking.shiftTemplateId == null,
      },
    });
  }

  return violations;
}

// null (or an absent field) means the declaration covers the whole day.
function coversTemplate(entry, shiftTemplateId) {
  return entry.shiftTemplateId == null || entry.shiftTemplateId === shiftTemplateId;
}

function matchesWhen(entry, day, dayOfWeek) {
  if (entry.type === 'exception') return day !== null && entry.date === day;
  if (entry.type === 'recurring') return dayOfWeek !== null && entry.dayOfWeek === dayOfWeek;
  return false;
}
