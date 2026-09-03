// token.service.js
// Handles JWT access token creation and verification.

import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { constants } from '../../config/constants.js';
import { AppError } from '../../errors/AppError.js';

// Sign an access token with just the user ID as the subject.
// Keeping the payload minimal - role/org info is loaded per-request from the
// DB so that role changes take effect immediately instead of at next login.
export function signAccessToken(userId) {
  return jwt.sign({ sub: userId.toString() }, env.JWT_ACCESS_SECRET, {
    expiresIn: constants.ACCESS_TOKEN_EXPIRY,
  });
}

// Verify a JWT and return the payload, or throw an AppError.
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  } catch (err) {
    // Distinguish expiry from tampering: the client can act on the first
    // (refresh and retry) but not the second.
    if (err.name === 'TokenExpiredError') {
      throw AppError.unauthorized('Access token expired');
    }
    throw AppError.unauthorized('Invalid access token');
  }
}
