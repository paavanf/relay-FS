// acceptsShift.js
// Would this person take that shift in return? Each offer can say what its
// owner would accept for the shift they give away - some kinds of shift, on
// some weekdays - and an empty or missing list means any.
//
// A cheap question about one shift, which never depends on what else moves
// in a swap - so buildGraph asks it alongside its other pre-filter checks.
// It is willingness, not legality: whether the person CAN take the shift is
// still the constraint engine's answer, cycle by cycle.
//
// "Which weekday" is the day the shift starts on in the organisation's
// timezone, as everywhere else in the engine: a night starting 23:00 on a
// Friday is a Friday shift.

import { localDayOfWeek } from '../time.js';

/**
 * @param {{ categories?: string[], daysOfWeek?: number[] } | undefined} filters  the taker's
 * @param {{ shiftTemplateId: string, startsAt: string }} assignment  the shift they would take
 * @param {{ shiftTemplates?: Array<{ id: string, category: string }>, timezone: string }} context
 */
export function acceptsShift(filters, assignment, context) {
  const categories = filters?.categories ?? [];
  const daysOfWeek = filters?.daysOfWeek ?? [];

  if (categories.length > 0) {
    const template = (context.shiftTemplates ?? []).find((t) => t.id === assignment.shiftTemplateId);
    if (!categories.includes(template?.category)) return false;
  }

  return daysOfWeek.length === 0 || daysOfWeek.includes(localDayOfWeek(assignment.startsAt, context.timezone));
}
