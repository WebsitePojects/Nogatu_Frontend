import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-redirect on 401 (but never for the login endpoints themselves —
// those return 401 for bad credentials and the form handles it via toast)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const url = err.config?.url || '';
    const isLoginCall = url.endsWith('/login');
    if (err.response?.status === 401 && !isLoginCall) {
      const isAdmin = window.location.pathname.startsWith('/portal/admin');
      window.location.href = isAdmin ? '/portal/admin/login' : '/portal/login';
    }
    return Promise.reject(err);
  }
);

export default api;
