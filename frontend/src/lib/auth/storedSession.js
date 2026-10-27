// storedSession.js
// Where the browser keeps the signed-in session, and a quick look at whether
// there is one - without loading any of the sign-in code.
//
// Supabase (and the e2e stand-in) keep it in localStorage under SESSION_KEY,
// so a session outlives the tab and the browser, until the person signs out.
// README.md ("Sessions") says why, and what that costs.
//
// Every access is guarded: storage throws outright in some privacy modes,
// and a storage failure must never take the app down with it.

export const SESSION_KEY = 'relay-auth';

export function hasStoredSession() {
  try {
    return Boolean(window.localStorage.getItem(SESSION_KEY));
  } catch {
    return false;
  }
}
