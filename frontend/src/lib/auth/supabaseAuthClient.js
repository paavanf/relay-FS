// supabaseAuthClient.js
// Sign-in through Supabase Auth, behind the interface authClient.js lists.
//
//   storage   localStorage, under SESSION_KEY - a session lasts until sign-out
//   flowType  implicit - an emailed link works in whatever tab or browser
//             opens it; the PKCE flow needs the tab that asked
//   detectSessionInUrl  off - authRedirect.js takes a sign-in from the address
//             itself, so the tokens leave the address bar at once
//   signOut   scope 'local', this browser only. Supabase's default, 'global',
//             would sign out every visitor sharing a demo account.
//
// VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are public by design;
// a build never holds a secret key (config/envGuard.js refuses one).

import { createClient } from '@supabase/supabase-js';
import { SESSION_KEY } from './storedSession.js';
import { AuthFailure, authFailure } from './authErrors.js';

function connect() {
  const { VITE_SUPABASE_URL: url, VITE_SUPABASE_PUBLISHABLE_KEY: key } = import.meta.env;
  if (!url || !key) throw new AuthFailure('Sign-in is not set up in this build (VITE_SUPABASE_URL).', 'not_configured');
  const options = { storage: window.localStorage, storageKey: SESSION_KEY, flowType: 'implicit', detectSessionInUrl: false };
  return createClient(url, key, { auth: options }).auth;
}

// Supabase answers { data, error } rather than throwing.
function dataOrThrow({ data, error }) {
  if (error) throw authFailure(error);
  return data;
}

export function createSupabaseAuthClient() {
  const auth = connect();

  return {
    async signIn(email, password) {
      dataOrThrow(await auth.signInWithPassword({ email, password }));
    },
    async signUp({ name, email, password, redirectTo }) {
      const options = { data: { name }, emailRedirectTo: redirectTo };
      const data = dataOrThrow(await auth.signUp({ email, password, options }));
      return { needsConfirmation: !data.session };
    },
    async signInWithGoogle(redirectTo) {
      dataOrThrow(await auth.signInWithOAuth({ provider: 'google', options: { redirectTo } }));
    },
    async sendPasswordReset(email, redirectTo) {
      dataOrThrow(await auth.resetPasswordForEmail(email, { redirectTo }));
    },
    async updatePassword(password) {
      dataOrThrow(await auth.updateUser({ password }));
    },
    async adoptSession({ accessToken, refreshToken }) {
      dataOrThrow(await auth.setSession({ access_token: accessToken, refresh_token: refreshToken }));
    },
    async accessToken() {
      const { data } = await auth.getSession();
      return data.session?.access_token ?? null;
    },
    async refresh() {
      const { data, error } = await auth.refreshSession();
      return error ? null : (data.session?.access_token ?? null);
    },
    async signOut() {
      await auth.signOut({ scope: 'local' });
    },
    onChange(callback) {
      const { data } = auth.onAuthStateChange((event) => callback(event));
      return () => data.subscription.unsubscribe();
    },
  };
}
