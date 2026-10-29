// session.js
// The access token every API request carries (lib/apiClient.js), and one
// shared refresh for when the API answers 401: however many requests fail
// at the same moment, the auth client is asked once and they all wait for
// its answer. A sign-in more than 7 days old is not refreshed at all - it
// is ended (sessionAge.js), and the 401 stands.
//
// With no stored session there is no token - and nothing is loaded to find
// that out, so the public pages never download the sign-in code.

import { authClient } from './authClient.js';
import { hasStoredSession } from './storedSession.js';
import { isSessionTooOld, endSessionForAge } from './sessionAge.js';

let refreshing = null;

export async function currentAccessToken() {
  if (!hasStoredSession()) return null;
  const client = await authClient();
  return client.accessToken();
}

async function refreshOrEnd(client) {
  if (!isSessionTooOld()) return client.refresh();
  await endSessionForAge(client);
  return null;
}

/** A new access token, or null when the session is really over. */
export function refreshAccessToken() {
  refreshing ??= authClient()
    .then(refreshOrEnd)
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}
