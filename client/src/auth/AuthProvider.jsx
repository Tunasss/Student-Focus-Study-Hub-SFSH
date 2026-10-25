import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, UNAUTHORIZED_EVENT } from '../lib/api';
import { clearToken, getToken, setToken } from '../lib/tokenStorage';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // 'loading' while we validate a stored token, then 'ready'.
  const [status, setStatus] = useState(() => (getToken() ? 'loading' : 'ready'));
  const [sessionExpired, setSessionExpired] = useState(false);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  useEffect(() => {
    if (!getToken()) return;
    let cancelled = false;
    apiFetch('/api/auth/me')
      .then(({ user }) => !cancelled && setUser(user))
      .catch(() => !cancelled && logout())
      .finally(() => !cancelled && setStatus('ready'));
    return () => {
      cancelled = true;
    };
  }, [logout]);

  useEffect(() => {
    function onUnauthorized(e) {
      if (e.detail?.code === 'TOKEN_EXPIRED') setSessionExpired(true);
      logout();
    }
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [logout]);

  const authenticate = useCallback(async (path, email, password) => {
    const { token, user } = await apiFetch(path, { method: 'POST', body: { email, password }, auth: false });
    setToken(token);
    setUser(user);
    setSessionExpired(false);
    return user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      sessionExpired,
      login: (email, password) => authenticate('/api/auth/login', email, password),
      register: (email, password) => authenticate('/api/auth/register', email, password),
      logout,
    }),
    [user, status, sessionExpired, authenticate, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
