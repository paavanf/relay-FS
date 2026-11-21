// sessionWatcher.js
// What AuthProvider does when the auth client reports a change nobody on
// this page asked for:
//
//   SIGNED_OUT       signed out elsewhere - another tab, or a session that
//                    could not be refreshed: forget the user
//   TOKEN_REFRESHED  the access token was renewed in the background: end the
//                    session if this sign-in is more than 7 days old
//                    (lib/auth/sessionAge.js)
//
// The sign-out is put off a moment with setTimeout: Supabase calls this from
// inside its own bookkeeping, and asks that no other Supabase call is made
// from there directly. Returns the unsubscribe function.

import { isSessionTooOld, forgetSignIn, endSessionForAge } from '../../lib/auth/sessionAge.js';

export function sessionWatcher(client, { clearUser }) {
  return client.onChange((event) => {
    if (event === 'SIGNED_OUT') {
      forgetSignIn();
      clearUser();
    }
    if (event === 'TOKEN_REFRESHED' && isSessionTooOld()) {
      setTimeout(() => endSessionForAge(client), 0);
    }
  });
}
