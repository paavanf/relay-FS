// forgotPassword.service.js
// Creates a password reset token and emails a reset link.
// Always returns success even if the email doesn't exist - this prevents
// attackers from discovering which emails are registered.

import { User, PasswordResetToken } from '../../models/index.js';
import { generateToken, hashToken } from '../../utils/crypto.js';
import { sendPasswordResetEmail } from '../email/email.service.js';
import { env } from '../../config/env.js';

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.toLowerCase() });

  // Silently succeed if the user doesn't exist (no user enumeration).
  if (!user) return;

  const rawToken = generateToken(32);
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiry

  await PasswordResetToken.create({ userId: user._id, tokenHash, expiresAt });

  // Only the raw token goes in the link; the database holds just its hash.
  const resetLink = `${env.FRONTEND_URL}/reset-password/${rawToken}`;
  await sendPasswordResetEmail(user.email, resetLink);
}
