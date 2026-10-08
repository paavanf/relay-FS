// findValidInvite.js
// The one way to turn a raw invite token into a live invite.
//
// Unknown, expired, already accepted and revoked all fail in exactly the same
// way: the same status, code and message. Telling them apart would let anyone
// holding - or guessing at - a token learn something about it, such as whether
// it was ever real or whether someone already used it.

import { Invite } from '../../models/index.js';
import { hashToken } from '../../utils/crypto.js';
import { AppError } from '../../errors/AppError.js';

export const INVITE_INVALID = 'INVITE_INVALID';

export function inviteNoLongerValid() {
  return AppError.notFound('This invite is no longer valid', { code: INVITE_INVALID });
}

/** True while an invite can still be accepted. */
export function isLive(invite, now = new Date()) {
  return Boolean(invite) && !invite.acceptedAt && !invite.revokedAt && invite.expiresAt > now;
}

export async function findValidInvite(rawToken) {
  const invite = await Invite.findOne({ tokenHash: hashToken(rawToken) });
  if (!isLive(invite)) throw inviteNoLongerValid();
  return invite;
}
