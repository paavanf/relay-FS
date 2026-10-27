// AuthProvider - who is signed in, their organisations, and what they can do
// about it, for the whole app.
//
// Signing in is Supabase's job (lib/auth/); who the person is in Relay -
// their name, their organisations - comes from GET /auth/me.
//
// On load it restores the session (restoreSession.js) - but only when there
// may be one: a stored session, or a sign-in arriving in the address. A
// first-time visitor has nothing to wait for, so the landing page renders at
// once instead of flashing a spinner, and loads none of the sign-in code.
import { useState, useEffect, useRef } from 'react';
import { AuthContext } from './AuthContext.js';
import { membershipActions } from './membershipActions.js';
import { authActions } from './authActions.js';
import { restoreSession } from './restoreSession.js';
import { hasStoredSession } from '../../lib/auth/storedSession.js';
import { authRedirect } from '../../lib/auth/authRedirect.js';
import { api } from '../../lib/apiClient.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [isLoading, setIsLoading] = useState(() => hasStoredSession() || Boolean(authRedirect()));
  // What an arriving link brought: its type ('recovery') or what went wrong.
  const [link, setLink] = useState(null);
  const stopWatching = useRef(null);
  const { addMembership, updateMembership } = membershipActions(setMemberships);

  async function loadUser() {
    const me = await api.get('/auth/me');
    setUser(me.user);
    setMemberships(me.memberships);
  }

  function clearUser() {
    setUser(null);
    setMemberships([]);
  }

  // Signed out elsewhere - an expired session, or a sign-out in another tab.
  function watch(client) {
    stopWatching.current ??= client.onChange((event) => event === 'SIGNED_OUT' && clearUser());
  }

  const actions = authActions({ loadUser, clearUser, watch });

  useEffect(() => {
    if (!isLoading) return undefined;
    let cancelled = false; // StrictMode's first, discarded mount

    restoreSession().then(async ({ client, signedIn, link: arrived }) => {
      if (cancelled) return;
      setLink(arrived);
      if (signedIn) {
        watch(client);
        // Refused by Relay: end the session. An outage keeps it for next time.
        await loadUser().catch(async (error) => {
          if ([401, 403, 409].includes(error.status)) await client.signOut();
          clearUser();
        });
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      stopWatching.current?.();
      stopWatching.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- once, on load
  }, []);

  const value = { user, memberships, isLoading, link, ...actions, addMembership, updateMembership };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
