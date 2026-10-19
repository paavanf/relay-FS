// validateAssignment.service.js
// Would this edit be legal? Asked before saving, and again while saving.
//
// The answer comes from canAssign() in the constraint engine - the same
// function the generator uses to decide who may take a slot. Writing a second
// copy of the rules here is the one thing guaranteed to make the grid and the
// generator disagree.
//
// An edit names the role it fills (slotQualificationId), which has to be one
// of the roles that shift needs that day; whether the person holds it is the
// engine's question, like every other rule. The shift's roles come back with
// the answer, so a save can insist that one is chosen.
//
// Everything needed to answer is loaded here and passed in as plain data,
// because the engine touches no database.

import { canAssign, shiftInstants } from '../../engine/index.js';
import { Roster, Assignment, ShiftTemplate, Organisation } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';
import { loadOrgSchedulingData, toEngineContext } from '../roster/orgSchedulingData.service.js';
import { toEngineAssignment } from '../roster/toEngineAssignment.js';

/** The roles a shift needs on one calendar date: its coverage rule for that weekday. */
export function rolesFor(coverageRequirements, shiftTemplateId, date) {
  const dayOfWeek = new Date(`${date}T00:00:00Z`).getUTCDay();
  const rule = coverageRequirements.find((c) => c.shiftTemplateId === String(shiftTemplateId) && c.dayOfWeek === dayOfWeek);
  return (rule?.requirements ?? []).map((r) => r.qualificationId);
}

/**
 * @returns {{ allowed: boolean, violations: Array, startsAt: string, endsAt: string, roles: string[] }}
 */
export async function validateAssignment({ orgId, rosterId, membershipId, shiftTemplateId, slotQualificationId, date, ignoreAssignmentId }) {
  const [org, roster, template] = await Promise.all([
    Organisation.findById(orgId).lean(),
    Roster.findOne({ _id: rosterId, orgId }).lean(),
    ShiftTemplate.findOne({ _id: shiftTemplateId, orgId }).lean(),
  ]);

  if (!org) throw AppError.notFound('Organisation not found');
  if (!roster) throw AppError.notFound('Roster not found');
  if (!template) throw AppError.notFound('Shift template not found');

  const data = await loadOrgSchedulingData(org);
  const roles = rolesFor(data.coverageRequirements, shiftTemplateId, date);
  if (slotQualificationId && !roles.includes(String(slotQualificationId))) {
    throw AppError.badRequest('That role is not one this shift needs on that day.');
  }

  const times = shiftInstants(data.shiftTemplates.find((t) => t.id === String(template._id)) ?? template, date, data.timezone);
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
    ...(slotQualificationId ? { slotQualificationId: String(slotQualificationId) } : {}),
    date,
    startsAt: times.startsAt,
    endsAt: times.endsAt,
  };

  const { allowed, violations } = canAssign(candidate, existing.map(toEngineAssignment), toEngineContext(data));
  return { allowed, violations, startsAt: times.startsAt, endsAt: times.endsAt, roles };
}
