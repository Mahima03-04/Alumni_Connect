import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api/endpoints';
import { fetchCsrfToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children, initialUser = null, initialProfile = null, skipBootstrap = false }) {
  const [user, setUser] = useState(initialUser);
  const [profile, setProfile] = useState(initialProfile);
  const [loading, setLoading] = useState(!skipBootstrap);
  const [error, setError] = useState(null);

  const applySession = useCallback((payload) => {
    if (!payload) {
      setUser(null);
      setProfile(null);
      return;
    }
    setUser(payload.user || null);
    setProfile(payload.profile || null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const res = await authApi.me();
      applySession(res.data.data);
      setError(null);
      return res.data.data;
    } catch (err) {
      if (err.response?.status === 401) {
        applySession(null);
        return null;
      }
      setError(err.friendlyMessage || err.message);
      return null;
    }
  }, [applySession]);

  // Bootstrap: fetch the CSRF token, then restore any existing session cookie.
  useEffect(() => {
    if (skipBootstrap) return undefined;
    let active = true;
    (async () => {
      try {
        await fetchCsrfToken();
      } catch (_e) {
        /* the interceptor will retry when needed */
      }
      if (!active) return;
      await refresh();
      if (active) setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [refresh, skipBootstrap]);

  const login = useCallback(
    async (credentials) => {
      const res = await authApi.login(credentials);
      applySession(res.data.data);
      return res.data.data;
    },
    [applySession]
  );

  const register = useCallback(
    async (payload) => {
      const res = await authApi.register(payload);
      applySession(res.data.data);
      return res.data.data;
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      applySession(null);
    }
  }, [applySession]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      isAuthenticated: Boolean(user),
      role: user?.role || null,
      isApprovedAlumni: user?.role === 'alumni' && user?.approvalStatus === 'approved',
      login,
      register,
      logout,
      refresh,
      setSession: applySession,
    }),
    [user, profile, loading, error, login, register, logout, refresh, applySession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

export default AuthContext;
