// session.js
// The access token every API request carries (lib/apiClient.js), and one
// shared refresh for when the API answers 401: however many requests fail
// at the same moment, the auth client is asked once and they all wait for
// its answer.
//
// With no stored session there is no token - and nothing is loaded to find
// that out, so the public pages never download the sign-in code.

import { authClient } from './authClient.js';
import { hasStoredSession } from './storedSession.js';

let refreshing = null;

export async function currentAccessToken() {
  if (!hasStoredSession()) return null;
  const client = await authClient();
  return client.accessToken();
}

/** A new access token, or null when the session is really over. */
export function refreshAccessToken() {
  refreshing ??= authClient()
    .then((client) => client.refresh())
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}
