// sessionRefusal.js
// The API's word that a sign-in is past Relay's 7-day limit: a 401 with the
// code SESSION_EXPIRED (shared/sessionLimits.js). The API reads the sign-in
// time from the token itself, so it holds even where this browser's own
// record says otherwise. Refreshing cannot help - a refreshed token keeps
// the same sign-in time - so the session is ended instead, and the login
// page says why, as when the browser ends it itself (sessionAge.js).

import { SESSION_EXPIRED_CODE } from '../../../../shared/sessionLimits.js';
import { authClient } from './authClient.js';
import { endSessionForAge } from './sessionAge.js';

export async function isPastSessionLimit(response) {
  if (response.status !== 401) return false;
  const body = await response
    .clone()
    .json()
    .catch(() => null);
  return body?.error?.code === SESSION_EXPIRED_CODE;
}

export async function endSessionPastLimit() {
  await endSessionForAge(await authClient());
}
