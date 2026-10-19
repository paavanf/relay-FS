// assignments.js
// What the illegal-assignment checks ask the API: a roster's shifts as they
// are right now, with lookups to read them by name, and the server's answer to
// a save that ought to be refused.
//
// A save names the role on the shift it fills, as the assign dialog does:
// the first of the shift's roles that person holds - or, for someone who
// holds none, simply the first, so the server still has a role to refuse.

import { stack } from './stack.js';

const weekdayOf = (date) => new Date(`${date}T00:00:00Z`).getUTCDay();

/** The roster as it is now: its assignments, plus lookups between names and ids. */
export async function loadRoster(api, roster) {
  const { orgId } = stack();
  const { assignments } = (await api.get(`/orgs/${orgId}/rosters/${roster.id}`)).body;
  const { members } = (await api.get(`/orgs/${orgId}/members`)).body;
  const { templates } = (await api.get(`/orgs/${orgId}/shift-templates`)).body;
  const { coverage } = (await api.get(`/orgs/${orgId}/coverage`)).body;
  const templateId = (name) => String(templates.find((t) => t.name === name)._id);

  return {
    assignments,
    memberId: (name) => members.find((m) => m.name === name).id,
    memberName: (id) => members.find((m) => m.id === id).name,
    templateId,
    templateName: (id) => templates.find((t) => String(t._id) === id).name,
    roleFor: (membershipId, shiftName, date) => {
      const rule = coverage.find((c) => String(c.shiftTemplateId) === templateId(shiftName) && c.dayOfWeek === weekdayOf(date));
      const roles = (rule?.requirements ?? []).map((r) => String(r.qualificationId));
      const held = members.find((m) => m.id === membershipId)?.qualificationIds ?? [];
      return roles.find((role) => held.includes(role)) ?? roles[0];
    },
  };
}

/** Tries to save one shift through the API. Returns the status and the codes of the rules it broke. */
export async function tryToSave(api, roster, lookups, { membershipId, shiftName, date }) {
  const role = lookups.roleFor(membershipId, shiftName, date);
  const res = await api.post(`/orgs/${stack().orgId}/assignments`, {
    rosterId: roster.id,
    membershipId,
    shiftTemplateId: lookups.templateId(shiftName),
    date,
    ...(role ? { slotQualificationId: role } : {}),
  });
  const violations = res.body?.error?.details?.violations ?? [];
  return { status: res.status, codes: violations.map((v) => v.code), message: res.body?.error?.message };
}
