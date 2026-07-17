import axios from 'axios';
import { API_BASE_URL } from '../utils/apiBase';
import { getViewAs, clearViewAs } from '../lib/viewAs';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const requestId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  config.headers = config.headers || {};
  config.headers['X-Request-ID'] = requestId;
  // Admin read-only view-as: attach the target member so MEMBER GET endpoints return
  // that member's data. Never attach on /admin routes (defense in depth — admin
  // endpoints must authorize on adminid, never on this header). Backend also enforces
  // GET-only + non-persistent (see middleware/auth.js).
  const viewAs = getViewAs();
  if (viewAs?.uid && !String(config.url || '').includes('/admin')) {
    config.headers['X-View-As-Member'] = String(viewAs.uid);
  }
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
      // In view-as, a 401 means the admin session lapsed — drop view-as and send the
      // admin back to admin login (not the member login).
      if (getViewAs()) {
        clearViewAs();
        window.location.href = '/portal/admin/login';
      } else {
        const isAdmin = window.location.pathname.startsWith('/portal/admin');
        window.location.href = isAdmin ? '/portal/admin/login' : '/portal/login';
      }
    }
    return Promise.reject(err);
  }
);

/**
 * POST with an Idempotency-Key — use for every money / state-changing action
 * (code activation, upgrade, transfer, encashment, registration).
 *
 * One key is generated per CALL, i.e. per user action. The server records it
 * (UNIQUE per scope+actor) so a duplicate submission of the same action — a
 * double-tap that slips past the UI guard, or a network retry — can never run
 * the handler twice: in-flight duplicates get 409, completed ones get the
 * original response replayed. Server side: middleware/idempotency.js (backend).
 */
export function postIdempotent(url, data, config = {}) {
  const key =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}-${Math.random().toString(36).slice(2, 12)}`;
  return api.post(url, data, {
    ...config,
    headers: { ...(config.headers || {}), 'Idempotency-Key': key },
  });
}

export default api;
