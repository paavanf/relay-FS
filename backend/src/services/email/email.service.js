// email.service.js
// The two emails Relay sends, and the rule that governs both: email is
// best-effort. A delivery failure is logged loudly and reported back to the
// caller, but it never throws, because neither a password reset nor an invite
// should fail just because a message did not go out.
//
// Outside production the link is ALWAYS logged as well, whatever the transport
// is doing. That way local testing never depends on delivery working.

import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { deliver } from './transport.js';
import { passwordResetEmail, inviteEmail } from './templates.js';

// Deliberately not logged in production - a reset link in a log file is a
// password reset anyone with log access can perform.
function logLink(label, toEmail, link) {
  if (env.isProduction) return;
  logger.warn(`[EMAIL DEV MODE] ${label} for ${toEmail}: ${link}`);
}

// The one place the best-effort promise is kept. deliver() already guards
// itself, but the guarantee belongs here too: a caller reading
// sendPasswordResetEmail should not have to go and check the transport to know
// whether awaiting it can blow up their request.
async function trySend(message) {
  try {
    const { delivered } = await deliver(message);
    return delivered;
  } catch (err) {
    logger.error({ to: message.to, err: err.message }, 'Email send threw unexpectedly');
    return false;
  }
}

/**
 * @returns {Promise<boolean>} whether the message actually went out
 */
export async function sendPasswordResetEmail(toEmail, resetLink) {
  logLink('Password reset link', toEmail, resetLink);

  return trySend({
    to: toEmail,
    subject: 'Reset your Relay password',
    html: passwordResetEmail(resetLink),
  });
}

/**
 * @returns {Promise<boolean>} whether the message actually went out
 */
export async function sendInviteEmail(toEmail, inviteLink, orgName, inviterName) {
  logLink('Invite link', toEmail, inviteLink);

  return trySend({
    to: toEmail,
    subject: `${inviterName || 'Someone'} invited you to join ${orgName} on Relay`,
    html: inviteEmail({ inviteLink, orgName, inviterName }),
  });
}
