import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkSession();
  }, []);

  async function checkSession() {
    try {
      const [memberRes, adminRes] = await Promise.allSettled([
        api.get('/auth/session'),
        api.get('/admin/auth/session'),
      ]);
      if (memberRes.status === 'fulfilled' && memberRes.value.data.authenticated) {
        setUser(memberRes.value.data.user);
      }
      if (adminRes.status === 'fulfilled' && adminRes.value.data.authenticated) {
        setAdmin(adminRes.value.data.admin);
      }
    } catch {
      // Not authenticated
    } finally {
      setLoading(false);
    }
  }

  async function loginMember(username, password) {
    const res = await api.post('/auth/login', { username, password });
    setUser(res.data.user);
    return res.data;
  }

  async function logoutMember() {
    await api.post('/auth/logout');
    setUser(null);
  }

  async function loginAdmin(username, password) {
    const res = await api.post('/admin/auth/login', { username, password });
    setAdmin(res.data.admin);
    return res.data;
  }

  async function logoutAdmin() {
    await api.post('/admin/auth/logout');
    setAdmin(null);
  }

  return (
    <AuthContext.Provider value={{
      user, admin, loading,
      loginMember, logoutMember, loginAdmin, logoutAdmin, checkSession,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
