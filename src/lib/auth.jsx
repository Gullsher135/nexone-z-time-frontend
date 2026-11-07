import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!getToken());

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const { user: u } = await api.get('/auth/me');
    setUser(u);
    return u;
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    refresh()
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [refresh, logout]);

  useEffect(() => {
    const onUnauthorized = () => logout();
    window.addEventListener('nz-unauthorized', onUnauthorized);
    return () => window.removeEventListener('nz-unauthorized', onUnauthorized);
  }, [logout]);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout, refresh }), [user, loading, login, logout, refresh]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
