// forgotPassword.service.js
// Creates a password reset token and emails a reset link.
// Always returns success even if the email doesn't exist - this prevents
// attackers from discovering which emails are registered.
//
// On a server that sends no email (EMAIL_ENABLED off) it refuses outright,
// for every address alike, rather than create a token nobody can receive.

import { User, PasswordResetToken } from '../../models/index.js';
import { generateToken, hashToken } from '../../utils/crypto.js';
import { sendPasswordResetEmail } from '../email/email.service.js';
import { env } from '../../config/env.js';
import { ERROR_CODES } from '../../config/constants.js';
import { AppError } from '../../errors/AppError.js';

export const EMAIL_DISABLED_MESSAGE = "Password reset by email isn't available on this deployment, because it doesn't send email.";

export async function requestPasswordReset(email) {
  if (!env.EMAIL_ENABLED) throw new AppError(EMAIL_DISABLED_MESSAGE, 403, { code: ERROR_CODES.EMAIL_DISABLED });
  const user = await User.findOne({ email: email.toLowerCase() });

  // Silently succeed if the user doesn't exist (no user enumeration).
  if (!user) return;

  // Only the newest link should work. Spending any outstanding token means a
  // resend cannot leave two valid links in someone's inbox, and an older link
  // that leaked cannot be used once a fresh one has been asked for.
  await PasswordResetToken.updateMany(
    { userId: user._id, usedAt: null, expiresAt: { $gt: new Date() } },
    { $set: { usedAt: new Date() } },
  );

  const rawToken = generateToken(32);
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

  await PasswordResetToken.create({ userId: user._id, tokenHash, expiresAt });

  // Only the raw token goes in the link; the database holds just its hash.
  const resetLink = `${env.FRONTEND_URL}/reset-password/${rawToken}`;

  // Best-effort: the token is already saved, so the reset works from a link
  // read out of the console even if delivery fails. This call never throws.
  await sendPasswordResetEmail(user.email, resetLink);
}
