/**
 * Tree preload (Phase C) — fetch a member's trees on login/session-restore so the
 * first time they open Unilevel/Binary it paints instantly from cache.
 *
 * Reuses treeStore's IndexedDB + bounded in-memory layer (no separate context
 * needed): priming writes both, so useInfiniteTree's getCachedTree hits the warm
 * cache immediately and then revalidates in the background. In-flight dedup keeps
 * the preload and an early page-open from double-fetching the same tree.
 */
import api from '../api';
import { getCachedTree, setCachedTree, clearAllTrees } from './treeStore';

const inflight = new Map();

/** Fetch one tree (deduped) and persist to cache. Silent on failure (degrade to on-demand). */
export function primeTree(treeType, key, url) {
  const k = `${treeType}:${key}`;
  if (inflight.has(k)) return inflight.get(k);
  const p = (async () => {
    try {
      const cached = await getCachedTree(treeType, key);
      const { data } = await api.get(url);
      if (data && (!cached || cached.version !== data.version)) {
        await setCachedTree(treeType, key, data);
      }
    } catch { /* degrade to on-demand fetch on the page */ }
  })().finally(() => inflight.delete(k));
  inflight.set(k, p);
  return p;
}

/** Background-preload a member's unilevel + binary trees (non-blocking). */
export function preloadMemberTrees(uid) {
  if (!uid) return;
  primeTree('unilevel', String(uid), '/genealogy/unilevel/flat');
  primeTree('binary', String(uid), '/genealogy/binary/flat');
}

export { clearAllTrees };
