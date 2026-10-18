// describeShifts.js
// The shift details every swap response shows: the day, the times, and
// which kind of shift it is - so "Asha takes your Saturday night" can be
// written without another request.

import { Assignment, ShiftTemplate } from '../../models/index.js';

/** One shift, from an assignment (a document or the engine's plain shape) and its template. */
export function shiftDto(assignment, template) {
  return {
    id: String(assignment._id ?? assignment.id),
    date: assignment.date,
    startsAt: new Date(assignment.startsAt).toISOString(),
    endsAt: new Date(assignment.endsAt).toISOString(),
    shift: template
      ? {
          id: String(template._id ?? template.id),
          name: template.name,
          category: template.category,
          startLocal: template.startLocal,
          endLocal: template.endLocal,
        }
      : null,
  };
}

/** @returns {Promise<Map<string, Object>>} assignmentId -> shiftDto */
export async function shiftsById(assignmentIds) {
  const assignments = await Assignment.find({ _id: { $in: assignmentIds } }).lean();
  const templates = await ShiftTemplate.find({ _id: { $in: assignments.map((a) => a.shiftTemplateId) } }).lean();
  const templateOf = new Map(templates.map((t) => [String(t._id), t]));

  return new Map(assignments.map((a) => [String(a._id), shiftDto(a, templateOf.get(String(a.shiftTemplateId)))]));
}
