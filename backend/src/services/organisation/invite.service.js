// invite.service.js
// Creates an invitation to join an organisation, and tries to email it.
//
// The link is the primary mechanism, not the email. The raw token comes back
// in the response so a manager can copy and share it directly - that works
// with no email infrastructure at all, which is what Slack and Notion do too.
// The email is an addition on top, and a failure to send never fails the
// invite: the record is already written and the link already works.

import { Invite, Organisation, User, Membership } from '../../models/index.js';
import { generateToken, hashToken } from '../../utils/crypto.js';
import { constants } from '../../config/constants.js';
import { env } from '../../config/env.js';
import { sendInviteEmail } from '../email/email.service.js';

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

  // FRONTEND_URL, the same source of truth the password-reset link uses. In
  // production this must point at the deployed frontend, or invites will send
  // people to localhost.
  const inviteLink = `${env.FRONTEND_URL}/invite/${rawToken}`;

  const emailSent = await tryToEmailInvite({ orgId, createdBy, email, inviteLink });

  return { invite, rawToken, inviteLink, emailSent };
}

// Everything here is best-effort. The invite already exists and the link
// already works, so nothing in this function is allowed to throw.
async function tryToEmailInvite({ orgId, createdBy, email, inviteLink }) {
  try {
    const [org, inviter] = await Promise.all([
      Organisation.findById(orgId).select('name').lean(),
      findInviterName(createdBy),
    ]);

    return await sendInviteEmail(email, inviteLink, org?.name ?? 'your team', inviter);
  } catch {
    // Already logged by the email service; the caller does not need to care.
    return false;
  }
}

// createdBy is a membership id, so the person's name is one hop further on.
async function findInviterName(membershipId) {
  const membership = await Membership.findById(membershipId).select('userId').lean();
  if (!membership) return '';

  const user = await User.findById(membership.userId).select('name').lean();
  return user?.name ?? '';
}
