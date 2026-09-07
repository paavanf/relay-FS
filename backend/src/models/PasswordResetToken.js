// PasswordResetToken.js
// One password-reset request. Like refresh tokens and invites, only the
// SHA-256 hash of the token is stored - the raw value exists solely in the
// link that was emailed, so a database leak cannot be used to reset anyone's
// password.

import mongoose from 'mongoose';

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    tokenHash: { type: String, required: true, unique: true, index: true },

    expiresAt: { type: Date, required: true, index: true },

    // Set the moment the token is spent, so a link works exactly once.
    usedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

export const PasswordResetToken =
  mongoose.models.PasswordResetToken ??
  mongoose.model('PasswordResetToken', passwordResetTokenSchema);

export default PasswordResetToken;
