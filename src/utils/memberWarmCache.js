const CACHE_PREFIX = 'nogatu-member-warm';
const AUTH_EPOCH_KEY = `${CACHE_PREFIX}:auth-epoch`;

function safeParse(raw) {
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getAuthEpoch() {
  return String(sessionStorage.getItem(AUTH_EPOCH_KEY) || '0');
}

export function bumpAuthEpoch() {
  const nextValue = String(Date.now());
  sessionStorage.setItem(AUTH_EPOCH_KEY, nextValue);
  return nextValue;
}

export function buildMemberCacheKey(uid, scope) {
  return `${CACHE_PREFIX}:${getAuthEpoch()}:${Number(uid || 0)}:${scope}`;
}

export function setMemberCache(uid, scope, value) {
  if (!uid || !scope) return;
  sessionStorage.setItem(
    buildMemberCacheKey(uid, scope),
    JSON.stringify({ cachedAt: Date.now(), value })
  );
}

export function getMemberCache(uid, scope, maxAgeMs = 120000) {
  if (!uid || !scope) return null;
  const parsed = safeParse(sessionStorage.getItem(buildMemberCacheKey(uid, scope)));
  if (!parsed?.cachedAt) return null;
  if ((Date.now() - Number(parsed.cachedAt || 0)) > maxAgeMs) return null;
  return parsed.value ?? null;
}

export function clearAllMemberWarmCache() {
  const prefix = `${CACHE_PREFIX}:`;
  const keysToDelete = [];
  for (let index = 0; index < sessionStorage.length; index += 1) {
    const key = sessionStorage.key(index);
    if (key && key.startsWith(prefix)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach((key) => sessionStorage.removeItem(key));
  bumpAuthEpoch();
}
