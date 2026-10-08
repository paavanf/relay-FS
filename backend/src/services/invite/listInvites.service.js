// listInvites.service.js
// The invites a manager is still waiting on: not accepted, not revoked.
//
// Expired ones are included and flagged, so a manager can see who never
// answered and invite them again, rather than wondering where they went. The
// links themselves cannot be listed - only a hash of each token is stored.

import { Invite } from '../../models/index.js';
import { inviterNames } from './inviterNames.js';

export async function listPendingInvites(orgId) {
  const invites = await Invite.find({ orgId, acceptedAt: null, revokedAt: null })
    .sort({ createdAt: -1 })
    .lean();

  const names = await inviterNames(invites.map((invite) => invite.createdBy));
  const now = Date.now();

  return invites.map((invite) => ({
    id: String(invite._id),
    email: invite.email,
    role: invite.role,
    qualificationIds: (invite.qualificationIds ?? []).map(String),
    invitedBy: names.get(String(invite.createdBy)) ?? '',
    createdAt: invite.createdAt.toISOString(),
    expiresAt: invite.expiresAt.toISOString(),
    isExpired: invite.expiresAt.getTime() <= now,
  }));
}
