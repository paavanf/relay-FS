// restoreSession.js
// What the app does once, as it loads, to learn whether someone is signed
// in: first adopt a sign-in arriving from an emailed link or Google
// (lib/auth/authRedirect.js has already taken it out of the address) - that
// counts as signing in now - then end a stored session that began more than
// 7 days ago (lib/auth/sessionAge.js), and ask the auth client for the rest.
//
// Resolves to { client, signedIn, link }: `link` is what arrived in the
// address - its type ('recovery' for a password reset link) or its error.
//
// Once per page load: React's StrictMode mounts the provider twice in
// development, and the same link must not be adopted twice.

import { authClient } from '../../lib/auth/authClient.js';
import { authRedirect } from '../../lib/auth/authRedirect.js';
import { hasStoredSession } from '../../lib/auth/storedSession.js';
import { recordSignIn, isSessionTooOld, endSessionForAge } from '../../lib/auth/sessionAge.js';

let restoring = null;

async function restore() {
  const client = await authClient();
  const arrived = authRedirect();

  if (arrived?.accessToken) {
    try {
      await client.adoptSession(arrived);
      recordSignIn();
    } catch (error) {
      return { client, signedIn: false, link: { error: error.message } };
    }
  }

  const link = arrived && { type: arrived.type ?? null, error: arrived.error ?? null };
  if (hasStoredSession() && isSessionTooOld()) {
    await endSessionForAge(client);
    return { client, signedIn: false, link };
  }
  return { client, signedIn: Boolean(await client.accessToken()), link };
}

export function restoreSession() {
  restoring ??= restore();
  return restoring;
}
