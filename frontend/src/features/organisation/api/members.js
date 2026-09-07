// members.js
// API calls for an organisation's members and invitations.

import { api } from '../../../lib/apiClient.js';

export async function listMembers(orgId) {
  const result = await api.get(`/orgs/${orgId}/members`);
  return result.members;
}

// Returns the whole invite, including inviteLink - invites are not emailed
// yet, so the link is shown in the UI to be shared by hand.
export async function createInvite(orgId, data) {
  return api.post(`/orgs/${orgId}/invites`, data);
}
