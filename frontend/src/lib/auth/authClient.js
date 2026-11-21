// authClient.js
// The one door to whoever proves who someone is: Supabase Auth - or, in the
// offline e2e build (VITE_AUTH_MODE=test, which a production build refuses),
// a stand-in that signs test tokens in the browser (testAuthClient.js). The
// rest of the app talks to this, never to Supabase directly.
//
// The client loads on first use, so the landing page downloads none of it.
// Vite turns VITE_AUTH_MODE into a constant at build time, so the branch not
// taken - and the stand-in with it - is left out of the bundle altogether.
//
// Either client offers:
//   signIn(email, password)              signUp({ name, email, password, redirectTo })
//                                          -> { needsConfirmation }
//   signInWithGoogle(redirectTo)         sendPasswordReset(email, redirectTo)
//   updatePassword(password)             adoptSession({ accessToken, refreshToken })
//   accessToken()   refresh()   signOut()   onChange(callback) -> unsubscribe
//
// A refusal is an AuthFailure (authErrors.js), with a message fit to show.

let client;

export function authClient() {
  client ??=
    import.meta.env.VITE_AUTH_MODE === 'test'
      ? import('./testAuthClient.js').then((module) => module.createTestAuthClient())
      : import('./supabaseAuthClient.js').then((module) => module.createSupabaseAuthClient());
  return client;
}
