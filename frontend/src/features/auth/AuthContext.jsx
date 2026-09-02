// AuthContext - provides user info and auth actions to the whole app.
import { createContext, useState, useEffect } from 'react';
import { setToken, clearToken } from '../../lib/tokenStore.js';
import { api } from '../../lib/apiClient.js';

export const AuthContext = createContext(null);

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
    const result = await api.post('/auth/register', { name, email, password });
    setToken(result.accessToken);
    setUser(result.user);
    setMemberships(result.memberships ?? []);
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

  const value = { user, memberships, isLoading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
