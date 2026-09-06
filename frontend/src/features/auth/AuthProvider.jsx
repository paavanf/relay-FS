// AuthProvider - provides user info and auth actions to the whole app.
import { useState, useEffect } from 'react';
import { AuthContext } from './AuthContext.js';
import { setToken, clearToken } from '../../lib/tokenStore.js';
import { api } from '../../lib/apiClient.js';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // On mount: try to refresh the session using the cookie.
  useEffect(() => {
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
      setUser(null);
      setMemberships([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email, password) {
    const result = await api.post('/auth/login', { email, password });
    setToken(result.accessToken);
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
    setUser(null);
    setMemberships([]);
  }

  const value = { user, memberships, isLoading, login, register, logout, addMembership };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
