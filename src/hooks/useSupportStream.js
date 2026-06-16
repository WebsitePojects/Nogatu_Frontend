import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../utils/apiBase';

/**
 * Subscribe to the server-sent-events stream and dispatch support.* events.
 *
 * @param {(event: string, data: any) => void} onEvent  called for each support event
 * @param {{ admin?: boolean, enabled?: boolean }} opts  admin stream vs member stream
 *
 * EventSource sends the session cookie automatically (same-origin / withCredentials).
 * Auto-reconnects on error with a short backoff; cleans up on unmount.
 */
export default function useSupportStream(onEvent, { admin = false, enabled = true } = {}) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;

  useEffect(() => {
    if (!enabled || typeof EventSource === 'undefined') return undefined;

    const path = admin ? '/events/admin/stream' : '/events/stream';
    const url = `${API_BASE_URL}${path}`;
    let es = null;
    let retry = null;
    let closed = false;

    const dispatch = (event) => (e) => {
      let data = null;
      try { data = e.data ? JSON.parse(e.data) : null; } catch { data = null; }
      handlerRef.current?.(event, data);
    };

    const open = () => {
      if (closed) return;
      es = new EventSource(url, { withCredentials: true });
      ['support.reply', 'support.read', 'support.status'].forEach((evt) => {
        es.addEventListener(evt, dispatch(evt));
      });
      es.onerror = () => {
        // Browser auto-reconnects on transient drops; for hard errors we close
        // and retry with a small delay to avoid a tight loop.
        if (es && es.readyState === EventSource.CLOSED && !closed) {
          es.close();
          retry = setTimeout(open, 3000);
        }
      };
    };

    open();

    return () => {
      closed = true;
      if (retry) clearTimeout(retry);
      if (es) es.close();
    };
  }, [admin, enabled]);
}
