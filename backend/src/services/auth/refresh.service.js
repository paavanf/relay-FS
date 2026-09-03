// refresh.service.js
// Uses a valid refresh token to issue a new access token.
//
// No rotation here: the refresh token stays the same and we simply hand back a
// fresh access token. Rotation and reuse detection are Milestone 10 hardening.

import { User } from '../../models/index.js';
import { findValidRefreshToken } from './refreshToken.service.js';
import { signAccessToken } from './token.service.js';
import { AppError } from '../../errors/AppError.js';

export async function refreshAccessToken(rawRefreshToken) {
  if (!rawRefreshToken) {
    throw AppError.unauthorized('No refresh token');
  }

  const tokenDoc = await findValidRefreshToken(rawRefreshToken);
  const user = await User.findById(tokenDoc.userId);

  // The account could have been deleted since the token was issued.
  if (!user) {
    throw AppError.unauthorized('User no longer exists');
  }

  const accessToken = signAccessToken(user._id);

  return { accessToken, user };
}
