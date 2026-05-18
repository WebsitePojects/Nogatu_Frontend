import { useEffect, useState } from 'react';
import api from '../api';

const PUBLIC_STATS_STORAGE_KEY = 'nogatu-public-stats-cache-v1';
const PUBLIC_STATS_TTL_MS = 5 * 60 * 1000;

const FALLBACK_STATS = {
  activeMembers: 0,
  networksBuilt: 0,
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readCachedStats() {
  if (!canUseStorage()) return null;

  try {
    const raw = window.localStorage.getItem(PUBLIC_STATS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;

    return parsed;
  } catch {
    return null;
  }
}

function writeCachedStats(payload) {
  if (!canUseStorage()) return;

  try {
    window.localStorage.setItem(PUBLIC_STATS_STORAGE_KEY, JSON.stringify({
      ...payload,
      cachedAtMs: Date.now(),
    }));
  } catch {
    // Ignore quota and serialization failures for public stats cache.
  }
}

export default function usePublicStats() {
  const cached = readCachedStats();
  const [stats, setStats] = useState(cached || FALLBACK_STATS);
  const [loading, setLoading] = useState(!cached);

  useEffect(() => {
    let cancelled = false;
    const cachedStats = readCachedStats();
    const isFresh = cachedStats && (Date.now() - Number(cachedStats.cachedAtMs || 0) < PUBLIC_STATS_TTL_MS);

    if (cachedStats) {
      setStats({
        activeMembers: Number(cachedStats.activeMembers || 0),
        networksBuilt: Number(cachedStats.networksBuilt || 0),
      });
    }

    if (isFresh) {
      setLoading(false);
      return undefined;
    }

    async function load() {
      try {
        const res = await api.get('/stats');
        const nextStats = {
          activeMembers: Number(res.data?.activeMembers || 0),
          networksBuilt: Number(res.data?.networksBuilt || 0),
        };

        if (!cancelled) {
          setStats(nextStats);
          setLoading(false);
        }

        writeCachedStats(nextStats);
      } catch {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, loading };
}
