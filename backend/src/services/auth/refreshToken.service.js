// refreshToken.service.js
// Handles refresh token creation, storage, and revocation.
// Refresh tokens are opaque random strings (NOT JWTs) - we store only their
// hash in the DB, so a database leak cannot be replayed as a session.

import crypto from 'node:crypto';
import { RefreshToken } from '../../models/index.js';
import { generateToken, hashToken } from '../../utils/crypto.js';
import { constants } from '../../config/constants.js';
import { AppError } from '../../errors/AppError.js';

// Create a new refresh token, store its hash, return the raw token.
// The raw token goes to the user (in a cookie). Only the hash lives in the DB.
export async function createRefreshToken(userId, meta = {}) {
  const rawToken = generateToken(48);
  const tokenHash = hashToken(rawToken);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + constants.REFRESH_TOKEN_EXPIRY_DAYS);

  await RefreshToken.create({
    userId,
    tokenHash,
    familyId: crypto.randomUUID(), // For future rotation / reuse detection
    issuedAt: new Date(),
    expiresAt,
    userAgent: meta.userAgent || '',
    ip: meta.ip || '',
  });

  return rawToken;
}

// Look up a refresh token by its raw value.
// Returns the DB doc if valid and not expired/revoked, else throws.
export async function findValidRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const doc = await RefreshToken.findOne({ tokenHash });

  if (!doc) throw AppError.unauthorized('Invalid refresh token');
  if (doc.revokedAt) throw AppError.unauthorized('Refresh token revoked');
  if (doc.expiresAt < new Date()) throw AppError.unauthorized('Refresh token expired');

  return doc;
}

// Revoke a refresh token (used on logout).
export async function revokeRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  await RefreshToken.updateOne({ tokenHash }, { $set: { revokedAt: new Date() } });
}
