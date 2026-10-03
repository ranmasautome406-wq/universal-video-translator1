import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../services/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const logout = useCallback(() => { tokenStore.clear(); setUser(null); }, []);

  useEffect(() => {
    if (!tokenStore.get()) return;
    api('/api/auth/me').then((d) => setUser(d.user)).catch(() => tokenStore.clear()).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    window.addEventListener('uvt:unauthorized', logout);
    return () => window.removeEventListener('uvt:unauthorized', logout);
  }, [logout]);

  const authenticate = useCallback(async (path, body, remember = true) => {
    const d = await api(path, { method: 'POST', body });
    tokenStore.set(d.token, remember);
    setUser(d.user);
    return d.user;
  }, []);

  const value = useMemo(() => ({
    user, loading, logout,
    login: (email, password, remember) => authenticate('/api/auth/login', { email, password }, remember),
    register: (name, email, password) => authenticate('/api/auth/register', { name, email, password }, true),
  }), [user, loading, logout, authenticate]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
