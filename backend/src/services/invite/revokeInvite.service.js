// revokeInvite.service.js
// Withdraws a pending invite. From then on its link answers exactly like an
// expired or unknown one.
//
// Only this organisation's own pending invites can be revoked: the orgId is in
// the query itself, so an id from elsewhere simply matches nothing.

import { Invite } from '../../models/index.js';
import { AppError } from '../../errors/AppError.js';

export async function revokeInvite({ orgId, inviteId }) {
  const result = await Invite.updateOne(
    { _id: inviteId, orgId, acceptedAt: null, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );

  if (result.matchedCount === 0) throw AppError.notFound('Invite not found');
}
