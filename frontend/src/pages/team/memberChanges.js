// memberChanges.js
// Between the edit-member form and the API: the form's starting values, a
// check on the hours, and the PATCH body. Pure.
//
// Only the fields that changed are sent. Two reasons: a manager's request
// must never carry a role at all (the server refuses one outright), and an
// unchanged form should send nothing.

export const MAX_WEEKLY_HOURS = 80;

export function formValuesOf(member) {
  return {
    role: member.role,
    qualificationIds: member.qualificationIds ?? [],
    employmentType: member.employmentType ?? 'casual',
    hours: String(member.contractedHoursPerWeek ?? 0),
  };
}

/** What is wrong with the hours as typed, or null when they are fine. */
export function hoursProblem(text) {
  const hours = Number(text);
  if (String(text).trim() === '' || !Number.isFinite(hours)) return 'Enter the hours as a number.';
  if (hours < 0 || hours > MAX_WEEKLY_HOURS) return `Contracted hours must be between 0 and ${MAX_WEEKLY_HOURS} a week.`;
  return null;
}

const sameIds = (a, b) => a.length === b.length && a.every((id) => b.includes(id));

/** The PATCH body: just what changed, and a role only when the editor may change roles. */
export function changedFields(member, values, { canChangeRole }) {
  const changes = {};

  if (canChangeRole && values.role !== member.role) changes.role = values.role;
  if (!sameIds(values.qualificationIds, member.qualificationIds ?? [])) {
    changes.qualificationIds = values.qualificationIds;
  }
  if (values.employmentType !== member.employmentType) changes.employmentType = values.employmentType;

  const hours = Number(values.hours);
  if (hours !== (member.contractedHoursPerWeek ?? 0)) changes.contractedHoursPerWeek = hours;

  return changes;
}

/** Who this viewer may deactivate. The server checks the same rules again. */
export function mayDeactivate({ member, viewerUserId, viewerIsOwner }) {
  if (member.userId === viewerUserId) return false;
  return viewerIsOwner || member.role === 'member';
}
