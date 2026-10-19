// coverageImpact.js
// Coverage per role on every shift a swap touches, before and after.
//
// It should be unchanged by construction: each shift keeps its role, only
// its holder changes, and the engine refuses a holder without that role. It
// is worked out anyway, from the shifts as they are - counting each role's
// places filled by someone who actually holds that role - because
// confirming it is the point of looking before approving.

import { Assignment, CoverageRequirement, Membership, Qualification, ShiftTemplate } from '../../models/index.js';

const weekdayOf = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();

async function qualificationsOf(membershipIds) {
  const members = await Membership.find({ _id: { $in: membershipIds } }).select('qualificationIds').lean();
  return new Map(members.map((m) => [String(m._id), new Set((m.qualificationIds ?? []).map(String))]));
}

/** How many of a role's places on a shift are held by someone with that role. */
function filled(onShift, roleId, holds) {
  return onShift.filter((a) => String(a.slotQualificationId) === roleId && holds.get(String(a.membershipId))?.has(roleId)).length;
}

async function oneShift(shift, { newHolder, roleName, templateName, orgId }) {
  const before = await Assignment.find({ rosterId: shift.rosterId, shiftTemplateId: shift.shiftTemplateId, date: shift.date }).lean();
  const after = before.map((a) => (newHolder.has(String(a._id)) ? { ...a, membershipId: newHolder.get(String(a._id)) } : a));
  const holds = await qualificationsOf([...before, ...after].map((a) => a.membershipId));

  const rule = await CoverageRequirement.findOne({ orgId, shiftTemplateId: shift.shiftTemplateId, dayOfWeek: weekdayOf(shift.date) }).lean();
  const roles = (rule?.requirements ?? []).map((r) => {
    const roleId = String(r.qualificationId);
    return { role: roleName(roleId), needed: r.count, before: filled(before, roleId, holds), after: filled(after, roleId, holds) };
  });

  return { date: shift.date, shift: templateName(shift.shiftTemplateId), roles };
}

export async function coverageImpact(chain) {
  const moved = await Assignment.find({ _id: { $in: chain.legs.map((leg) => leg.givesAssignmentId) } }).lean();
  const newHolder = new Map(chain.legs.map((leg) => [String(leg.receivesAssignmentId), String(leg.membershipId)]));

  // Each shift (roster, template, day) once, even if two of its places move.
  const shifts = [...new Map(moved.map((a) => [`${a.rosterId}|${a.shiftTemplateId}|${a.date}`, a])).values()];
  const [templates, qualifications] = await Promise.all([
    ShiftTemplate.find({ _id: { $in: shifts.map((s) => s.shiftTemplateId) } }).select('name').lean(),
    Qualification.find({ orgId: chain.orgId }).select('name').lean(),
  ]);
  const roleName = (id) => qualifications.find((q) => String(q._id) === id)?.name ?? 'A role';
  const templateName = (id) => templates.find((t) => String(t._id) === String(id))?.name ?? 'Shift';

  const rows = await Promise.all(shifts.map((shift) => oneShift(shift, { newHolder, roleName, templateName, orgId: chain.orgId })));
  return rows.sort((a, b) => a.date.localeCompare(b.date));
}
