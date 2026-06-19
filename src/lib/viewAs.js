/**
 * Admin read-only "view as member" client state.
 *
 * Session-scoped (sessionStorage) so it survives in-app navigation but never leaks
 * across tabs/sessions. While set, the api client attaches the X-View-As-Member
 * header so member GET endpoints return the target member's data; the backend
 * enforces GET-only (read-only) and never mutates the admin's own session.
 */
const KEY = 'nogatu_view_as';

export function getViewAs() {
  try {
    const raw = sessionStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && Number(parsed.uid) > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function setViewAs(member) {
  try { sessionStorage.setItem(KEY, JSON.stringify(member)); } catch { /* storage blocked */ }
}

export function clearViewAs() {
  try { sessionStorage.removeItem(KEY); } catch { /* storage blocked */ }
}

export function isViewingAs() {
  return Boolean(getViewAs());
}
