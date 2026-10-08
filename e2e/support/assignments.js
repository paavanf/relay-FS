// assignments.js
// What the illegal-assignment checks ask the API: a roster's shifts as they
// are right now, with lookups to read them by name, and the server's answer to
// a save that ought to be refused.

import { stack } from './stack.js';

/** The roster as it is now: its assignments, plus lookups between names and ids. */
export async function loadRoster(api, roster) {
  const { orgId } = stack();
  const { assignments } = (await api.get(`/orgs/${orgId}/rosters/${roster.id}`)).body;
  const { members } = (await api.get(`/orgs/${orgId}/members`)).body;
  const { templates } = (await api.get(`/orgs/${orgId}/shift-templates`)).body;

  return {
    assignments,
    memberId: (name) => members.find((m) => m.name === name).id,
    memberName: (id) => members.find((m) => m.id === id).name,
    templateId: (name) => String(templates.find((t) => t.name === name)._id),
    templateName: (id) => templates.find((t) => String(t._id) === id).name,
  };
}

/** Tries to save one shift through the API. Returns the status and the codes of the rules it broke. */
export async function tryToSave(api, roster, lookups, { membershipId, shiftName, date }) {
  const res = await api.post(`/orgs/${stack().orgId}/assignments`, {
    rosterId: roster.id,
    membershipId,
    shiftTemplateId: lookups.templateId(shiftName),
    date,
  });
  const violations = res.body?.error?.details?.violations ?? [];
  return { status: res.status, codes: violations.map((v) => v.code), message: res.body?.error?.message };
}
