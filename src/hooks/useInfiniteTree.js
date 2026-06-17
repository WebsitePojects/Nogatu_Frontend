/**
 * useInfiniteTree — optimistic, cache-first loader for a full subtree (/flat API).
 *
 * Flow (stale-while-revalidate):
 *   1. Read the IndexedDB cache → if present, render it INSTANTLY (status 'refreshing').
 *   2. In parallel, fetch the live DB version.
 *   3. When it returns, swap state ONLY if the content `version` changed — so the
 *      user never waits and the canvas self-updates without a manual refresh.
 *   4. If the live fetch fails but we had a cache, keep showing the cache.
 *
 * A monotonically increasing request id guards against out-of-order responses when
 * the key/url changes (e.g. admin searches a different account mid-flight).
 */
import { useEffect, useRef, useState } from 'react';
import api from '../api';
import { getCachedTree, setCachedTree } from '../lib/treeStore';

export default function useInfiniteTree({ treeType, cacheKey, url, enabled = true }) {
  const [payload, setPayload] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | refreshing | ready | error
  const [error, setError] = useState(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!enabled || !url || cacheKey == null || cacheKey === '') {
      setPayload(null);
      setStatus('idle');
      return undefined;
    }

    let cancelled = false;
    const myReq = ++reqIdRef.current;
    const isCurrent = () => !cancelled && myReq === reqIdRef.current;

    (async () => {
      setError(null);

      const cached = await getCachedTree(treeType, cacheKey);
      if (!isCurrent()) return;
      if (cached) { setPayload(cached); setStatus('refreshing'); }
      else { setPayload(null); setStatus('loading'); }

      try {
        const res = await api.get(url);
        if (!isCurrent()) return;
        const fresh = res.data;
        if (!cached || cached.version !== fresh.version) {
          setPayload(fresh);
          setCachedTree(treeType, cacheKey, fresh); // fire-and-forget persist
        }
        setStatus('ready');
      } catch (e) {
        if (!isCurrent()) return;
        if (cached) { setStatus('ready'); } // keep stale cache on refresh failure
        else { setError(e); setStatus('error'); }
      }
    })();

    return () => { cancelled = true; };
  }, [treeType, cacheKey, url, enabled]);

  return {
    payload,
    nodes: payload?.nodes || [],
    rootUid: payload?.rootUid ?? null,
    count: payload?.count ?? (payload?.nodes?.length || 0),
    status,
    loading: status === 'loading',     // no cache yet, first fetch in flight
    refreshing: status === 'refreshing', // showing cache, live refresh in background
    error,
  };
}
