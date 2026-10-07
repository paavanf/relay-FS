// AuthProvider - provides user info and auth actions to the whole app.
import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext.js';
import { setToken, clearToken } from '../../lib/tokenStore.js';
import { markTabSession, hasTabSession, clearTabSession } from '../../lib/tabSession.js';
import { api } from '../../lib/apiClient.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  // "Loading" only in a tab that may have a session to restore. A first-time
  // visitor has nothing to wait for, so the landing page renders at once
  // instead of flashing a full-screen spinner for a frame.
  const [isLoading, setIsLoading] = useState(hasTabSession);

  // On mount: restore the session, but only for a tab that already had one.
  // A tab opened after the last one was closed carries no marker, so we skip
  // the refresh entirely and leave the user logged out.
  useEffect(() => {
    if (!hasTabSession()) {
      setIsLoading(false);
      return;
    }

    tryRestoreSession();
  }, []);

  async function tryRestoreSession() {
    try {
      const refreshResult = await api.post('/auth/refresh');
      setToken(refreshResult.accessToken);
      const me = await api.get('/auth/me');
      setUser(me.user);
      setMemberships(me.memberships);
    } catch {
      // No valid session - user needs to log in.
      clearTabSession();
      setUser(null);
      setMemberships([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password) {
    const result = await api.post('/auth/login', { email, password });
    setToken(result.accessToken);

    // This tab now owns a session; the marker dies with the tab.
    markTabSession();

    setUser(result.user);
    setMemberships(result.memberships);
  }

  async function register(name, email, password) {
    // Only creates the account. Does NOT log the user in - no token, no user
    // state. The register page sends them to /login to sign in.
    await api.post('/auth/register', { name, email, password });
  }

  // Adds a membership the user just gained (e.g. by creating an organisation)
  // so it shows up straight away, without waiting for a page refresh to
  // re-fetch /auth/me.
  function addMembership(newMembership) {
    setMemberships((prev) => [...prev, newMembership]);
  }

  async function logout() {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore - we're logging out anyway.
    }
    clearToken();
    clearTabSession();
    setUser(null);
    setMemberships([]);
  }

  const value = { user, memberships, isLoading, login, register, logout, addMembership };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
