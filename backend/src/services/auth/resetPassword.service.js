// resetPassword.service.js
// Validates a reset token and sets a new password.

import argon2 from 'argon2';
import { User, PasswordResetToken, RefreshToken } from '../../models/index.js';
import { hashToken } from '../../utils/crypto.js';
import { AppError } from '../../errors/AppError.js';

export async function resetPassword({ rawToken, newPassword }) {
  const tokenHash = hashToken(rawToken);
  const tokenDoc = await PasswordResetToken.findOne({ tokenHash });

  if (!tokenDoc) throw AppError.badRequest('Invalid or expired reset link');
  if (tokenDoc.usedAt) throw AppError.badRequest('This reset link was already used');
  if (tokenDoc.expiresAt < new Date()) throw AppError.badRequest('This reset link has expired');

  const user = await User.findById(tokenDoc.userId);
  if (!user) throw AppError.badRequest('Invalid reset link');

  user.passwordHash = await argon2.hash(newPassword, { type: argon2.argon2id });
  await user.save();

  // Spend the token, so the link cannot be reused.
  tokenDoc.usedAt = new Date();
  await tokenDoc.save();

  // Whoever requested this may have been locked out by someone else, so end
  // every existing session rather than leaving an intruder signed in.
  await RefreshToken.updateMany(
    { userId: user._id, revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}
