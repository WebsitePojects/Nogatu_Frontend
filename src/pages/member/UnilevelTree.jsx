import { useEffect, useMemo, useState } from 'react';
import {
  HiOutlineChevronDown,
  HiOutlineSearch,
  HiOutlineUsers,
} from 'react-icons/hi';
import api from '../../api';
import { Spinner } from '../../components/genealogyTreeUi';
import { getGenealogyTheme } from '../../components/genealogyTreeUiUtils';
import useInfiniteTree from '../../hooks/useInfiniteTree';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const UNILEVEL_RATES = [5, 3, 3, 2, 2, 1, 1, 1, 1, 1];
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US');
const fmtMoney = (n) => `₱${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function UnilevelTree() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();

  const [uniSummary, setUniSummary] = useState(null);

  const selfUid = user?.uid;
  const { nodes: flatNodes, loading, refreshing, count } = useInfiniteTree({
    treeType: 'unilevel',
    cacheKey: selfUid ? String(selfUid) : '',
    url: '/genealogy/unilevel/flat',
    enabled: Boolean(selfUid),
  });

  const chrome = getGenealogyTheme(isDarkMode);
  const panelStyle = { background: chrome.surfaceStrong, border: `1px solid ${chrome.surfaceBorder}`, backdropFilter: 'blur(18px)' };

  // Your own maintenance status + per-level breakdown.
  useEffect(() => {
    let cancelled = false;
    api.get('/dashboard/breakdown/uni-level')
      .then((res) => { if (!cancelled) setUniSummary(res.data); })
      .catch(() => { if (!cancelled) setUniSummary(null); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold portal-page-title flex items-center gap-2">
            <HiOutlineUsers className="size-6" style={{ color: '#D4AF37' }} />
            Unilevel Tree
          </h1>
          <p className="text-sm portal-card-muted mt-1">
            Your sponsor (direct-referral) network — every level at a glance. Level 1 (your direct downline) through
            your deepest level, with all members listed. Filter by name to find anyone quickly.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="relative flex flex-wrap items-center gap-2 rounded-2xl p-3" style={{ ...panelStyle, zIndex: 40 }}>
        {refreshing && (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: 'rgba(212,175,55,0.14)', color: 'var(--brand-gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
            <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> Live sync…
          </span>
        )}
        <div className="ml-auto flex items-center gap-3 text-xs portal-card-muted">
          <span>Members: <span className="portal-card-title font-semibold">{fmtInt(count)}</span></span>
        </div>
      </div>

      {/* All levels at once — static, every member visible */}
      <UnilevelAllLevels nodes={flatNodes} chrome={chrome} panelStyle={panelStyle} loading={loading} />

      <UnilevelBreakdown summary={uniSummary} panelStyle={panelStyle} />
    </div>
  );
}

/* ── All levels at once: group the flat downline by level (depth) and render every
      level (Level 1 = direct downline … deepest) with all members visible — no
      drill-down, no clicking. A name filter narrows across all levels for quick lookup.
      Uses the already-loaded flat list. ──────────────────────────────────────────── */
function UnilevelAllLevels({ nodes, chrome, panelStyle, loading }) {
  const [q, setQ] = useState('');
  const [openLevels, setOpenLevels] = useState(() => new Set([1])); // only Level 1 expanded by default

  // Group by level (depth >= 1 excludes the member themselves), sorted shallow→deep.
  const levels = useMemo(() => {
    const byLevel = new Map();
    for (const n of nodes) {
      const d = Number(n.depth || 0);
      if (d < 1) continue;
      if (!byLevel.has(d)) byLevel.set(d, []);
      byLevel.get(d).push(n);
    }
    const sorted = [...byLevel.entries()].sort((a, b) => a[0] - b[0]);
    for (const [, arr] of sorted) {
      arr.sort((a, b) => String(a.username || '').localeCompare(String(b.username || '')));
    }
    return sorted; // [ [level, members[]], … ]
  }, [nodes]);

  const term = q.trim().toLowerCase();
  const visible = useMemo(() => {
    if (!term) return levels;
    return levels
      .map(([lvl, arr]) => [lvl, arr.filter((n) => `${n.username || ''} ${n.fullname || ''}`.toLowerCase().includes(term))])
      .filter(([, arr]) => arr.length > 0);
  }, [levels, term]);

  if (loading) return <div className="rounded-2xl p-10" style={panelStyle}><Spinner /></div>;
  if (!nodes.length || levels.length === 0) {
    return <div className="rounded-2xl p-8 text-center text-sm portal-card-muted" style={panelStyle}>No downline members yet.</div>;
  }

  const totalMembers = levels.reduce((s, [, arr]) => s + arr.length, 0);
  const deepest = levels[levels.length - 1][0];

  return (
    <div className="rounded-2xl p-4 sm:p-5 space-y-5" style={panelStyle}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <HiOutlineSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 portal-card-muted" />
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Filter members by name…"
            className="w-full sm:w-72 rounded-xl py-2 pl-8 pr-3 text-sm outline-none"
            style={{ background: chrome.searchBg, color: chrome.searchText, border: `1px solid ${chrome.searchBorder}` }} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setOpenLevels(new Set(levels.map(([lvl]) => lvl)))}
            className="text-xs font-semibold rounded-lg px-2.5 py-1.5"
            style={{ background: 'rgba(212,175,55,0.08)', color: 'var(--brand-gold)', border: '1px solid rgba(212,175,55,0.2)' }}>
            Expand all
          </button>
          <button type="button" onClick={() => setOpenLevels(new Set())}
            className="text-xs font-semibold rounded-lg px-2.5 py-1.5"
            style={{ background: 'rgba(148,163,184,0.10)', color: chrome.panelButtonText, border: '1px solid rgba(148,163,184,0.2)' }}>
            Collapse all
          </button>
          <span className="text-xs portal-card-muted">
            <span className="portal-card-title font-semibold">{fmtInt(totalMembers)}</span> members ·{' '}
            <span className="portal-card-title font-semibold">{fmtInt(deepest)}</span> level{deepest === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {visible.length === 0 && (
        <p className="px-1 py-6 text-center text-xs portal-card-muted">No members match “{q}”.</p>
      )}

      {visible.map(([level, members]) => {
        const open = Boolean(term) || openLevels.has(level);
        return (
          <section key={level} className="rounded-xl overflow-hidden" style={{ border: `1px solid ${chrome.surfaceBorder}` }}>
            <button type="button"
              onClick={() => setOpenLevels((prev) => {
                const next = new Set(prev);
                if (next.has(level)) next.delete(level); else next.add(level);
                return next;
              })}
              className="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors"
              style={{ background: 'rgba(212,175,55,0.06)' }}>
              <HiOutlineChevronDown className="size-4 transition-transform" aria-hidden
                style={{ color: 'var(--brand-gold)', transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }} />
              <span className="rounded-lg px-2.5 py-0.5 text-xs font-bold"
                style={{ background: 'rgba(212,175,55,0.16)', color: 'var(--brand-gold)', border: '1px solid rgba(212,175,55,0.3)' }}>
                Level {level}
              </span>
              <span className="text-xs portal-card-muted">{fmtInt(members.length)} member{members.length === 1 ? '' : 's'}</span>
            </button>
            {open && (
              <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m) => (
                  <div key={m.uid} className="rounded-xl px-3.5 py-2.5"
                    style={{ border: `1px solid ${chrome.surfaceBorder}`, background: chrome.surface }}>
                    <p className="truncate text-sm font-medium portal-card-title">{m.fullname || m.username || `Member ${m.uid}`}</p>
                    <p className="truncate text-[11px] portal-card-muted">@{m.username || m.uid} · {m.accttypeName || '—'}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

/* ── Maintenance status + per-level breakdown (your own unilevel) ──────────── */
function UnilevelBreakdown({ summary, panelStyle }) {
  const eligibility = summary?.eligibility || null;
  const current = Number(eligibility?.currentPoints || 0);
  const required = Number(eligibility?.requiredPoints || 200);
  const needed = Number(eligibility?.neededPoints ?? Math.max(0, required - current));
  const eligible = Boolean(eligibility?.eligible);
  const pct = Math.max(0, Math.min(100, (current / Math.max(1, required)) * 100));

  const byLevel = Array.isArray(summary?.byLevel) ? summary.byLevel : [];
  const levelMap = Object.fromEntries(byLevel.map((row) => [Number(row.level), row]));
  const rows = UNILEVEL_RATES.map((rate, index) => {
    const level = index + 1;
    const live = levelMap[level] || {};
    return {
      level,
      ratePercent: Number(live.ratePercent || rate),
      contributorCount: Number(live.contributorCount || 0),
      totalPoints: Number(live.totalPoints || 0),
      projectedAmount: Number(live.projectedAmount || 0),
    };
  });

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-2xl p-5" style={panelStyle}>
        <h2 className="text-sm font-bold portal-card-title">Monthly Maintenance</h2>
        <p className="text-xs portal-card-muted mt-1">
          Unilevel income releases this month only if you hold at least {fmtInt(required)} own product points.
        </p>
        <div className="mt-4 flex items-end justify-between">
          <span className="text-2xl font-bold portal-card-title">{fmtInt(current)}</span>
          <span className="text-xs portal-card-muted">/ {fmtInt(required)} pts</span>
        </div>
        <div className="mt-2 h-2.5 w-full rounded-full overflow-hidden" style={{ background: 'rgba(148,163,184,0.18)' }}>
          <div className="h-full rounded-full transition-all" style={{
            width: `${pct}%`,
            background: eligible ? 'linear-gradient(90deg,#16a34a,#34d399)' : 'linear-gradient(90deg,#D4AF37,#f5d77a)',
          }} />
        </div>
        <div className="mt-3 inline-flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-full"
          style={eligible
            ? { background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399' }
            : { background: 'rgba(212,175,55,0.15)', border: '1px solid rgba(212,175,55,0.3)', color: '#D4AF37' }}>
          {eligible ? 'Eligible this month' : `${fmtInt(needed)} pts to qualify`}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="portal-card-muted">Downline Product Points</p>
            <p className="portal-card-title font-semibold mt-0.5">{fmtInt(eligibility?.downlineProductPoints || 0)}</p>
          </div>
          <div className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <p className="portal-card-muted">Projected Unilevel</p>
            <p className="portal-card-title font-semibold mt-0.5">{fmtMoney(eligibility?.projectedDownlineAmount || 0)}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-5" style={panelStyle}>
        <h2 className="text-sm font-bold portal-card-title">Per-Level Breakdown</h2>
        <p className="text-xs portal-card-muted mt-1">
          Current-month product-point contributors across your 10 unilevel levels.
        </p>
        <p className="text-[11px] mt-2 rounded-lg px-3 py-2 leading-5"
          style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)', color: 'var(--portal-card-muted)' }}>
          <strong style={{ color: 'var(--brand-gold)' }}>Roll-up compression:</strong> when no members in a level
          have product (repurchase) points this month, that level is skipped and the next qualifying generation
          rolls up to take its place — so your paid levels stay contiguous (1, 2, 3…) and an empty middle level
          never blocks the levels below it.
        </p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left portal-card-muted">
                <th className="py-2 pr-3 font-semibold">Level</th>
                <th className="py-2 px-3 font-semibold">Rate</th>
                <th className="py-2 px-3 font-semibold">Contributors</th>
                <th className="py-2 px-3 font-semibold">Product Pts</th>
                <th className="py-2 pl-3 font-semibold text-right">Projected</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const active = row.contributorCount > 0;
                return (
                  <tr key={row.level} style={{ borderTop: '1px solid rgba(148,163,184,0.12)' }}>
                    <td className="py-2 pr-3 portal-card-title font-semibold">Level {row.level}</td>
                    <td className="py-2 px-3 portal-card-muted">{row.ratePercent}%</td>
                    <td className="py-2 px-3 portal-card-title">{fmtInt(row.contributorCount)}</td>
                    <td className="py-2 px-3 portal-card-title">{fmtInt(row.totalPoints)}</td>
                    <td className="py-2 pl-3 text-right" style={{ color: active ? '#34d399' : 'var(--portal-card-muted)' }}>
                      {fmtMoney(row.projectedAmount)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
