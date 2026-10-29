// errorCodes.js
// The machine-readable code on every error response ({ error: { code } }),
// so a client can tell kinds of refusal apart without parsing the message.
// Re-exported by constants.js, so existing imports from there still work.

import { SESSION_EXPIRED_CODE } from '../../../shared/sessionLimits.js';

export const ERROR_CODES = Object.freeze({
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RATE_LIMITED: 'RATE_LIMITED',
  // The shared demo organisation refuses changes to its setup (Milestone 10a).
  DEMO_LOCKED: 'DEMO_LOCKED',
  // Tokens are checked against Supabase's public keys, and Supabase could
  // not be reached for them. A 503: the session is not over, try again.
  AUTH_UNAVAILABLE: 'AUTH_UNAVAILABLE',
  // A 401 for a token whose sign-in is past Relay's 7-day limit. Refreshing
  // cannot help, so the frontend ends the session and says why. The code is
  // shared with the frontend (shared/sessionLimits.js).
  SESSION_EXPIRED: SESSION_EXPIRED_CODE,
  // Linking a sign-in to an existing account (or accepting an invite) needs
  // a proven email, and this Supabase project does not make people confirm
  // theirs (services/identity/emailTrust.js).
  EMAIL_NOT_PROVEN: 'EMAIL_NOT_PROVEN',
  INTERNAL: 'INTERNAL_ERROR',
});
