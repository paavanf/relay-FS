// logout.service.js
// Revokes a refresh token (called during logout).

import { revokeRefreshToken } from './refreshToken.service.js';

export async function logoutUser(rawRefreshToken) {
  if (rawRefreshToken) {
    await revokeRefreshToken(rawRefreshToken);
  }
  // Even if no token was provided we return success - logout is idempotent,
  // and a client clearing a session it no longer has is not an error.
}
