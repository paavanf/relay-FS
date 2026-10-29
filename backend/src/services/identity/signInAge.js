// signInAge.js
// When a token's sign-in happened, and Relay's 7-day limit on it
// (shared/sessionLimits.js). The browser signs itself out at 7 days; this is
// the server's half, so a refresh token copied out of that browser cannot
// keep a session going past the limit either.
//
// Supabase writes one `amr` entry for each way a session was authenticated,
// stamped (in seconds) with when that happened, and refreshing a token never
// changes them: in supabase/auth, AddClaimToSession runs when a session is
// made, and the refresh grant does not call it. So the earliest entry is
// when the session signed in. A token_refresh entry is not a sign-in and is
// ignored. A token with no usable entry is refused: there would be nothing
// to measure the limit from.

import { AppError } from '../../errors/AppError.js';
import { ERROR_CODES } from '../../config/constants.js';
import { SESSION_MAX_AGE_MS } from '../../../../shared/sessionLimits.js';

/** The sign-in time in milliseconds, or null when the token does not say. */
export function signedInAt(claims) {
  const entries = Array.isArray(claims.amr) ? claims.amr : [];
  const times = entries
    .filter((entry) => entry?.method !== 'token_refresh' && Number.isFinite(entry?.timestamp))
    .map((entry) => entry.timestamp * 1000);
  return times.length > 0 ? Math.min(...times) : null;
}

export function assertRecentSignIn(claims, now = Date.now()) {
  const at = signedInAt(claims);
  if (at === null) throw AppError.unauthorized('This sign-in does not say when it began');
  if (now - at > SESSION_MAX_AGE_MS) {
    throw new AppError('Sign-ins last 7 days. Sign in again to carry on.', 401, { code: ERROR_CODES.SESSION_EXPIRED });
  }
}
