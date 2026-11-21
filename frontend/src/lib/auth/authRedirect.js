// authRedirect.js
// Supabase's emailed links and Google sign-in come back to Relay with the
// result in the address - #access_token=...&refresh_token=...&type=recovery,
// or an error such as ?error_description=Email+link+is+invalid+or+has+expired.
//
// captureAuthRedirect() runs once, first thing (main.jsx): it reads that
// result and at once clears it from the address with history.replaceState,
// so the tokens never stay in the address bar, the back button, or a
// bookmark. Replacing - not pushing - means no history entry keeps them.
// The page's own path and any other query (?next=) stay.
//
// AuthProvider then reads what was captured (authRedirect()) to sign the
// person in, or to say what went wrong with the link.

const ERROR_PARAMS = ['error', 'error_code', 'error_description'];
let captured = null;

export function captureAuthRedirect(location = window.location, history = window.history) {
  const fragment = new URLSearchParams(location.hash.slice(1));
  const query = new URLSearchParams(location.search);
  const error = fragment.get('error_description') ?? query.get('error_description');

  if (fragment.has('access_token')) {
    const read = (name) => fragment.get(name);
    captured = { accessToken: read('access_token'), refreshToken: read('refresh_token'), type: read('type') };
  } else if (error) {
    captured = { error };
  } else {
    return;
  }

  ERROR_PARAMS.forEach((name) => query.delete(name));
  const search = query.toString();
  history.replaceState(history.state, '', `${location.pathname}${search ? `?${search}` : ''}`);
}

/** What arrived in the address, or null: { accessToken, refreshToken, type } or { error }. */
export function authRedirect() {
  return captured;
}
