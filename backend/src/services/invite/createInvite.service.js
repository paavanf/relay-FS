// createInvite.service.js
// Creates an invitation to join an organisation, and tries to email it.
//
// The link is the primary mechanism, not the email. The raw token comes back
// in the response so a manager can copy and share it directly - that works
// with no email infrastructure at all, which is what Slack and Notion do too.
// The email is an addition on top, and a failure to send never fails the
// invite: the record is already written and the link already works.

import { Invite, Organisation } from '../../models/index.js';
import { generateToken, hashToken } from '../../utils/crypto.js';
import { INVITE_EXPIRY_HOURS, INVITE_LIMIT } from '../../config/constants.js';
import { env } from '../../config/env.js';
import { sendInviteEmail } from '../email/email.service.js';
import { assertOwnQualifications } from '../qualification/assertOwnQualifications.js';
import { inviterNames } from './inviterNames.js';
import { assertUnderLimit } from '../limits/windowLimit.js';

export async function createInvite({ orgId, email, role, qualificationIds, createdBy }) {
  // Each invite is an email to an address someone typed in: a daily cap per
  // organisation keeps invites from becoming a spam channel. Revoked ones count.
  await assertUnderLimit(Invite, { orgId }, INVITE_LIMIT, `This organisation has sent ${INVITE_LIMIT.max} invites in the last 24 hours, the most it can send in a day.`);

  // The qualifications travel onto the membership when the invite is accepted,
  // so they must be this organisation's.
  await assertOwnQualifications(orgId, qualificationIds);

  const rawToken = generateToken(32);

  // Same rule as refresh tokens: only the hash is persisted.
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + INVITE_EXPIRY_HOURS);

  const invite = await Invite.create({ orgId, email, role, qualificationIds, tokenHash, expiresAt, createdBy });

  // FRONTEND_URL, the same source of truth the password-reset link uses. In
  // production this must point at the deployed frontend, or invites will send
  // people to localhost.
  const inviteLink = `${env.FRONTEND_URL}/invite/${rawToken}`;

  const emailSent = await tryToEmailInvite({ orgId, createdBy, email, inviteLink });

  return { invite, rawToken, inviteLink, emailSent };
}

// Everything here is best-effort. The invite already exists and the link
// already works, so nothing in this function is allowed to throw. A server
// that sends no email does not try: the link is the invite.
async function tryToEmailInvite({ orgId, createdBy, email, inviteLink }) {
  if (!env.EMAIL_ENABLED) return false;
  try {
    const [org, names] = await Promise.all([
      Organisation.findById(orgId).select('name').lean(),
      inviterNames([createdBy]),
    ]);

    return await sendInviteEmail(email, inviteLink, org?.name ?? 'your team', names.get(String(createdBy)) ?? '');
  } catch {
    // Already logged by the email service; the caller does not need to care.
    return false;
  }
}
