// testAuthClient.js
// The offline stand-in for Supabase Auth, in the e2e build only
// (VITE_AUTH_MODE=test - a production build refuses it: config/envGuard.js).
// It signs, in the browser, the token the backend's test adapter checks
// (testTokens.js), so no Supabase project is involved at all.
//
// Like Supabase it keeps the session in localStorage under SESSION_KEY, and
// refuses a wrong password - every e2e account shares the demo's public
// password. A sign-up waits for email confirmation, as a real project does;
// Google and emailed links do not exist offline.

import { SESSION_KEY } from './storedSession.js';
import { AuthFailure } from './authErrors.js';
import { signTestToken } from './testTokens.js';
import { DEMO_PASSWORD } from '../../pages/auth/login/demoAccounts.js';

const listeners = new Set();
const tell = (event) => listeners.forEach((listener) => listener(event));

function stored() {
  try {
    return JSON.parse(window.localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function store(session) {
  if (session) window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_KEY);
}

export function createTestAuthClient() {
  return {
    async signIn(email, password) {
      if (password !== DEMO_PASSWORD) throw new AuthFailure('Invalid email or password.', 'invalid_credentials');
      const address = email.trim().toLowerCase();
      store({ email: address, accessToken: await signTestToken(address) });
      tell('SIGNED_IN');
    },
    signUp: async () => ({ needsConfirmation: true }),
    async signInWithGoogle() {
      throw new AuthFailure('Google sign-in is not available offline.', 'unavailable');
    },
    sendPasswordReset: async () => {},
    updatePassword: async () => {},
    adoptSession: async () => {},
    accessToken: async () => stored()?.accessToken ?? null,
    async refresh() {
      const session = stored();
      if (!session) return null;
      const accessToken = await signTestToken(session.email);
      store({ ...session, accessToken });
      tell('TOKEN_REFRESHED');
      return accessToken;
    },
    async signOut() {
      store(null);
      tell('SIGNED_OUT');
    },
    onChange(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
