// authActions.js
// The things a person does to their sign-in, as AuthProvider hands them out.
// Each goes through the auth client (lib/auth/authClient.js); afterwards
// `loadUser` asks Relay's API who that is - its first answer for a new
// sign-in creates their Relay account.
//
// If Relay refuses a sign-in Supabase accepted (an existing account it
// cannot link, say), the session is ended again and the refusal thrown, so
// the form shows why rather than leaving a half-signed-in tab.
//
// Signing in records when (lib/auth/sessionAge.js): Relay ends every
// sign-in 7 days later. Signing out forgets it.
//
// Emailed links come back to /auth/callback (carrying ?next=, an invite
// say) and /reset-password; both must be in the Supabase project's list of
// redirect URLs (docs/deploy/SUPABASE.md).

import { authClient } from '../../lib/auth/authClient.js';
import { recordSignIn, forgetSignIn } from '../../lib/auth/sessionAge.js';

const callbackUrl = (next) => `${window.location.origin}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ''}`;

export function authActions({ loadUser, clearUser, watch }) {
  async function signedIn(client) {
    recordSignIn();
    watch(client);
    try {
      await loadUser();
    } catch (error) {
      await client.signOut();
      forgetSignIn();
      clearUser();
      throw error;
    }
  }

  return {
    async login(email, password) {
      const client = await authClient();
      await client.signIn(email, password);
      await signedIn(client);
    },
    /** next: a path already checked by safeReturnPath, or null. Resolves to { needsConfirmation }. */
    async register({ name, email, password, next }) {
      const client = await authClient();
      const result = await client.signUp({ name, email, password, redirectTo: callbackUrl(next) });
      if (!result.needsConfirmation) await signedIn(client);
      return result;
    },
    async loginWithGoogle(next) {
      await (await authClient()).signInWithGoogle(callbackUrl(next));
    },
    async requestPasswordReset(email) {
      await (await authClient()).sendPasswordReset(email, `${window.location.origin}/reset-password`);
    },
    async updatePassword(password) {
      await (await authClient()).updatePassword(password);
    },
    async logout() {
      await (await authClient()).signOut().catch(() => {});
      forgetSignIn();
      clearUser();
    },
  };
}
