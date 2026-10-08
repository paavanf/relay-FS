// members.js
// API calls for an organisation's members. Invitations are in invites.js.

import { api } from '../../../lib/apiClient.js';

export async function listMembers(orgId) {
  const result = await api.get(`/orgs/${orgId}/members`);
  return result.members;
}

/**
 * changes may hold role, qualificationIds, employmentType and
 * contractedHoursPerWeek. The server decides who may change what: only an
 * owner can change a role, and the last owner can never stop being one.
 */
export async function updateMember(orgId, membershipId, changes) {
  const result = await api.patch(`/orgs/${orgId}/members/${membershipId}`, changes);
  return result.member;
}

/** A soft deactivation. Returns { member, removedDraftShifts }. */
export async function deactivateMember(orgId, membershipId) {
  return api.delete(`/orgs/${orgId}/members/${membershipId}`);
}
