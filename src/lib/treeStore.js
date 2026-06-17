/**
 * IndexedDB cache for full subtree payloads (infinite-tree, Phase C foundation).
 *
 * Why IndexedDB and not localStorage: a 100k-node tree is multiple MB. localStorage
 * is a ~5MB *synchronous* string store — writing a big tree there blocks the main
 * thread and can overflow the quota. IndexedDB is async and holds hundreds of MB,
 * which is what large MLM trees actually need. We keep a tiny in-memory LRU on top
 * so re-opening the same tree in one session is instant without an IDB round-trip.
 */
import { get as idbGet, set as idbSet, del as idbDel, keys as idbKeys } from 'idb-keyval';

const NS = 'nogatu:tree:';
const MEM_MAX = 8; // bounded LRU — admin can search many big trees in one session
const memCache = new Map(); // key -> payload (insertion order = LRU order)

function keyFor(treeType, rootUid) {
  return `${NS}${treeType}:${rootUid}`;
}

// Touch a key as most-recently-used; evict the oldest when over capacity.
function memTouch(key, payload) {
  if (memCache.has(key)) memCache.delete(key);
  memCache.set(key, payload);
  while (memCache.size > MEM_MAX) {
    const oldest = memCache.keys().next().value;
    memCache.delete(oldest);
  }
}

/** Read a cached tree payload ({ version, nodes, ... }) or null. Never throws. */
export async function getCachedTree(treeType, rootUid) {
  const key = keyFor(treeType, rootUid);
  if (memCache.has(key)) {
    const hot = memCache.get(key);
    memTouch(key, hot); // refresh LRU recency
    return hot;
  }
  try {
    const payload = await idbGet(key);
    if (payload) memTouch(key, payload);
    return payload || null;
  } catch {
    return null;
  }
}

/** Persist a tree payload. Best-effort: a cache failure must never break the page. */
export async function setCachedTree(treeType, rootUid, payload) {
  const key = keyFor(treeType, rootUid);
  memTouch(key, payload);
  try {
    await idbSet(key, payload);
  } catch {
    // Quota / private-mode — silently degrade to in-memory only.
  }
}

/** Drop one cached tree (e.g. after a known structural change). */
export async function clearCachedTree(treeType, rootUid) {
  const key = keyFor(treeType, rootUid);
  memCache.delete(key);
  try { await idbDel(key); } catch { /* ignore */ }
}

/** Evict every cached tree (e.g. on logout). */
export async function clearAllTrees() {
  memCache.clear();
  try {
    const all = await idbKeys();
    await Promise.all(all.filter((k) => String(k).startsWith(NS)).map((k) => idbDel(k)));
  } catch { /* ignore */ }
}
