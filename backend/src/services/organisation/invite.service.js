// invite.service.js
// Creates an invitation to join an organisation.
// Returns the raw token to be emailed (in this MVP we return it in the
// response so it can be shared by hand).

import { Invite } from '../../models/index.js';
import { generateToken, hashToken } from '../../utils/crypto.js';
import { constants } from '../../config/constants.js';

export async function createInvite({ orgId, email, role, qualificationIds, createdBy }) {
  const rawToken = generateToken(32);

  // Same rule as refresh tokens: only the hash is persisted.
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + constants.INVITE_EXPIRY_HOURS);

  const invite = await Invite.create({
    orgId,
    email,
    role,
    qualificationIds,
    tokenHash,
    expiresAt,
    createdBy,
  });

  return { invite, rawToken };
}
