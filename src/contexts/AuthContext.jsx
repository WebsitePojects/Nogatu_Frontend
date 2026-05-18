import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';
import {
  bumpAuthEpoch,
  clearAllMemberWarmCache,
  setMemberCache,
} from '../utils/memberWarmCache';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (!user?.uid) return undefined;

    const epoch = bumpAuthEpoch();
    const controller = new AbortController();
    let cancelled = false;

    async function warmMemberData() {
      try {
        const rankingRes = await api.get('/ranking', { signal: controller.signal });
        if (cancelled || String(epoch) !== String(sessionStorage.getItem('nogatu-member-warm:auth-epoch'))) return;
        setMemberCache(user.uid, 'ranking', rankingRes.data);

        const leaderboardRes = await api.get('/leaderboard?page=1&perPage=25', { signal: controller.signal });
        if (cancelled || String(epoch) !== String(sessionStorage.getItem('nogatu-member-warm:auth-epoch'))) return;
        setMemberCache(user.uid, 'leaderboard:1', leaderboardRes.data);
      } catch {}
    }

    warmMemberData();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [user?.uid]);

  async function checkSession() {
    try {
      const [memberRes, adminRes] = await Promise.allSettled([
        api.get('/auth/session'),
        api.get('/admin/auth/session'),
      ]);
      const nextUser = memberRes.status === 'fulfilled' && memberRes.value.data.authenticated
        ? memberRes.value.data.user
        : null;
      const nextAdmin = adminRes.status === 'fulfilled' && adminRes.value.data.authenticated
        ? adminRes.value.data.admin
        : null;

      if ((nextUser?.uid || null) !== (user?.uid || null)) {
        clearAllMemberWarmCache();
      }
      setUser(nextUser);
      setAdmin(nextAdmin);
    } catch {
      setUser(null);
      setAdmin(null);
    } finally {
      setLoading(false);
    }
  }

  async function refreshUser() {
    try {
      const memberRes = await api.get('/auth/session');
      if (memberRes.data.authenticated) {
        setUser(memberRes.data.user);
        return memberRes.data.user;
      }
      setUser(null);
      return null;
    } catch {
      return null;
    }
  }

  async function loginMember(username, password) {
    const res = await api.post('/auth/login', { username, password });
    clearAllMemberWarmCache();
    setUser(res.data.user);
    setAdmin(null);
    return res.data;
  }

  async function logoutMember() {
    await api.post('/auth/logout');
    clearAllMemberWarmCache();
    setUser(null);
    setAdmin(null);
  }

  async function loginAdmin(username, password) {
    const res = await api.post('/admin/auth/login', { username, password });
    clearAllMemberWarmCache();
    setAdmin(res.data.admin);
    setUser(null);
    return res.data;
  }

  async function logoutAdmin() {
    await api.post('/admin/auth/logout');
    clearAllMemberWarmCache();
    setAdmin(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{
      user, admin, loading,
      loginMember, logoutMember, loginAdmin, logoutAdmin, checkSession, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
