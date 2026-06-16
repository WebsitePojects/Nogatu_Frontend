import axios from 'axios';
import { API_BASE_URL } from '../utils/apiBase';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  config.headers = config.headers || {};
  config.headers['X-Request-ID'] = requestId;
  // For multipart uploads (FormData), the default 'application/json' content-type
  // must be removed so the browser sets 'multipart/form-data' WITH the boundary.
  // Without this, multer on the server parses nothing -> empty body/file -> 400.
  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    if (config.headers['Content-Type']) delete config.headers['Content-Type'];
    if (config.headers.common) delete config.headers.common['Content-Type'];
    if (config.headers.post) delete config.headers.post['Content-Type'];
  }
  return config;
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
