// invites.js
// API calls for invitations: sending one, the public preview an invite link
// opens on, accepting it, and the Team page's pending list.

import { api } from '../../../lib/apiClient.js';

/**
 * What an invite link shows before anyone signs in:
 * { orgName, role, inviterName, email, expiresAt }. An expired, used,
 * withdrawn or unknown link is a 404 with one generic message, on purpose.
 */
export async function previewInvite(token) {
  const result = await api.get(`/invites/${encodeURIComponent(token)}`);
  return result.invite;
}

/** Joins the organisation. Returns the membership in the shape AuthProvider keeps. */
export async function acceptInvite(token) {
  const result = await api.post(`/invites/${encodeURIComponent(token)}/accept`);
  return result.membership;
}

// Returns the whole invite, including inviteLink. The link is the only copy:
// the server keeps just a hash of it, so it can never be shown again.
export async function createInvite(orgId, data) {
  return api.post(`/orgs/${orgId}/invites`, data);
}

/** Invites nobody has accepted or withdrawn yet, newest first, expired ones flagged. */
export async function listInvites(orgId) {
  const result = await api.get(`/orgs/${orgId}/invites`);
  return result.invites;
}

export async function revokeInvite(orgId, inviteId) {
  await api.delete(`/orgs/${orgId}/invites/${inviteId}`);
}
