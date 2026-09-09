// validateAssignment.service.js
// Would this edit be legal? Asked before saving, and again while saving.
//
// The answer comes from canAssign() in the constraint engine - the same
// function the generator uses to decide who may take a slot. Writing a second
// copy of the rules here is the one thing guaranteed to make the grid and the
// generator disagree.
//
// Everything needed to answer is loaded here and passed in as plain data,
// because the engine touches no database.

import { canAssign, shiftInstants } from '../../engine/index.js';
import { Roster, Assignment, ShiftTemplate, Organisation } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { loadOrgSchedulingData, toEngineContext } from '../roster/orgSchedulingData.service.js';

/**
 * @returns {{ allowed: boolean, violations: Array, startsAt: string, endsAt: string }}
 */
export async function validateAssignment({ orgId, rosterId, membershipId, shiftTemplateId, date, ignoreAssignmentId }) {
  const [org, roster, template] = await Promise.all([
    Organisation.findById(orgId).lean(),
    Roster.findOne({ _id: rosterId, orgId }).lean(),
    ShiftTemplate.findOne({ _id: shiftTemplateId, orgId }).lean(),
  ]);

  if (!org) throw AppError.notFound('Organisation not found');
  if (!roster) throw AppError.notFound('Roster not found');
  if (!template) throw AppError.notFound('Shift template not found');

  const data = await loadOrgSchedulingData(org);
  const context = toEngineContext(data);

  const times = shiftInstants(
    data.shiftTemplates.find((t) => t.id === String(template._id)) ?? template,
    date,
    data.timezone,
  );
  if (!times) throw AppError.badRequest('That date and shift do not make a valid time.');

  // Everything already on this roster except, when reassigning, the row being
  // moved - otherwise it would collide with itself.
  const existing = await Assignment.find({
    rosterId: roster._id,
    ...(ignoreAssignmentId ? { _id: { $ne: ignoreAssignmentId } } : {}),
  }).lean();

  const candidate = {
    id: ignoreAssignmentId ? String(ignoreAssignmentId) : '__candidate__',
    membershipId: String(membershipId),
    shiftTemplateId: String(shiftTemplateId),
    date,
    startsAt: times.startsAt,
    endsAt: times.endsAt,
  };

  const { allowed, violations } = canAssign(candidate, existing.map(toEngineAssignment), context);

  return { allowed, violations, startsAt: times.startsAt, endsAt: times.endsAt };
}

function toEngineAssignment(a) {
  return {
    id: String(a._id),
    membershipId: String(a.membershipId),
    shiftTemplateId: String(a.shiftTemplateId),
    date: a.date,
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt.toISOString(),
  };
}
