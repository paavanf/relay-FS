// sessionAge.js
// Relay's own limit on a sign-in: 7 days from signing in, however active the
// person has been since. Supabase's free plan keeps a session going until
// sign-out, so Relay records when this browser signed in and ends the
// session once that was more than 7 days ago. It is checked as the app loads
// (restoreSession.js) and whenever the access token is refreshed (session.js,
// sessionWatcher.js). README.md, "Sessions", says why.
//
// The time is kept in localStorage beside the session, so every tab agrees on
// it - and in memory too, for a browser whose storage refuses. A session with
// no record at all counts as too old, so there is no way around the limit.
// The 7 days are shared with the API, which refuses older sign-ins too
// (shared/sessionLimits.js).

import { SESSION_MAX_AGE_MS } from '../../../../shared/sessionLimits.js';

export { SESSION_MAX_AGE_MS };

const KEY = 'relay-signed-in-at';

let inMemory = null;
let endedForAge = false;

export function recordSignIn(now = Date.now()) {
  inMemory = now;
  endedForAge = false;
  try {
    window.localStorage.setItem(KEY, String(now));
  } catch {
    // Storage unavailable: the time in memory still counts for this page.
  }
}

export function forgetSignIn() {
  inMemory = null;
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    // Nothing to forget if storage is unavailable.
  }
}

function signedInAt() {
  try {
    const stored = Number(window.localStorage.getItem(KEY));
    if (stored > 0) return stored;
  } catch {
    // Fall back to memory.
  }
  return inMemory;
}

/** Signed in more than 7 days ago - or with no record of when. */
export function isSessionTooOld(now = Date.now()) {
  const at = signedInAt();
  return at === null || now - at > SESSION_MAX_AGE_MS;
}

/** Ends the session because it is too old, remembering why for the login page. */
export async function endSessionForAge(client) {
  endedForAge = true;
  forgetSignIn();
  await client.signOut();
}

export const sessionEndedForAge = () => endedForAge;
