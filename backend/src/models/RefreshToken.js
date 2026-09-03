// RefreshToken.js
// One long-lived session. The raw token lives only in the user's httpOnly
// cookie - we store nothing but its SHA-256 hash, so a database leak cannot
// be replayed as a login.

import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

    // SHA-256 of the raw token. Unique so the same token can't be stored twice.
    tokenHash: { type: String, required: true, unique: true, index: true },

    // Reserved for rotation / reuse detection in a later milestone.
    familyId: { type: String, required: true },

    issuedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },

    // Recorded so a user can eventually review their active sessions.
    userAgent: { type: String, default: '' },
    ip: { type: String, default: '' },
  },
  { timestamps: true },
);

// Let MongoDB delete rows once they expire, so the collection self-cleans.
// Note this only removes expired documents; revoked-but-unexpired tokens stay
// until their own expiry, which is what the revokedAt check is for.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken =
  mongoose.models.RefreshToken ?? mongoose.model('RefreshToken', refreshTokenSchema);

export default RefreshToken;
