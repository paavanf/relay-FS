// sessionLimits.js
// How long a sign-in lasts in Relay, for the frontend and the backend alike:
// 7 days from signing in, however active the session has been since.
// Supabase's free plan keeps a session going until sign-out, so Relay keeps
// this limit itself, twice:
//
//   the browser  signs itself out once its sign-in is too old
//                (frontend/src/lib/auth/sessionAge.js)
//   the API      refuses any token whose sign-in is too old, with a 401 and
//                the code below (backend/src/services/identity/signInAge.js)
//
// so a refresh token copied out of the browser cannot outlive it either.
// One file, so the two can never disagree. Plain values only: both the
// browser bundle and the server import it.

export const SESSION_MAX_AGE_DAYS = 7;
export const SESSION_MAX_AGE_MS = SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000;

// The API's error code for a token whose sign-in is past the limit. The
// frontend recognises it, ends the session and says why.
export const SESSION_EXPIRED_CODE = 'SESSION_EXPIRED';
