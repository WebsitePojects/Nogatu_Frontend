import { useEffect, useMemo, useState } from 'react';
import { HiOutlineSearch } from 'react-icons/hi';
import { Spinner } from './genealogyTreeUi';
import { fmtInt } from './genealogyTreeUiUtils';

/**
 * Binary List/Drill view (shared member + admin).
 * 15-node window (root + 3 levels). Tap any member to re-root into their own
 * 15-node window; breadcrumb walks back up. Banner shows which overall leg
 * (Left/Right of the ROOT account) you're in; each row carries its placement side
 * (L/R) under its parent. Search re-roots straight into a bloodline. Only the
 * current window is built, so it stays light.
 *
 * Props: nodes (flat list with uid/parentUid/position/username/fullname/accttypeName),
 *        selfUid (the account the tree is rooted at), chrome, panelStyle, loading,
 *        sponsorByUid (optional Map<uid, {uid,username,fullname}> — admin-only sponsor
 *        lookup derived from the unilevel tree; when absent no sponsor line is rendered).
 */
export default function BinaryDrill({ nodes, selfUid, chrome, panelStyle, loading, sponsorByUid }) {
  const selfRoot = nodes.find((n) => n.parentUid == null);
  const rootDefault = Number(selfRoot?.uid) || Number(selfUid) || null;
  const [rootUid, setRootUid] = useState(rootDefault);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => { if (rootUid == null && rootDefault != null) setRootUid(rootDefault); }, [rootDefault, rootUid]);

  const { byUid, childrenOf } = useMemo(() => {
    const bu = new Map(); const ch = new Map();
    for (const n of nodes) bu.set(Number(n.uid), n);
    for (const n of nodes) {
      if (n.parentUid == null) continue;
      const p = Number(n.parentUid);
      if (!ch.has(p)) ch.set(p, []);
      ch.get(p).push(n);
    }
    return { byUid: bu, childrenOf: ch };
  }, [nodes]);

  const sideKids = (uid) => {
    const kids = childrenOf.get(Number(uid)) || [];
    return {
      left: kids.find((k) => k.position === 'left') || null,
      right: kids.find((k) => k.position === 'right') || null,
    };
  };
  const descCount = (uid) => {
    let n = 0; const stack = [Number(uid)]; const seen = new Set();
    while (stack.length) {
      const cur = stack.pop();
      for (const k of (childrenOf.get(cur) || [])) {
        if (seen.has(k.uid)) continue;
        seen.add(k.uid); n += 1; stack.push(Number(k.uid));
      }
    }
    return n;
  };

  const rootNode = byUid.get(Number(rootUid)) || null;

  const trail = useMemo(() => {
    const arr = []; let cur = rootNode; let g = 0;
    while (cur && g < 200) { arr.unshift(cur); if (cur.parentUid == null) break; cur = byUid.get(Number(cur.parentUid)); g += 1; }
    return arr;
  }, [rootNode, byUid]);

  const overallSide = trail.length > 1 ? (trail[1]?.position || null) : null;

  const rows = [];
  (function walk(uid, depth) {
    if (uid == null || depth > 3) return;
    const node = byUid.get(Number(uid));
    if (!node) return;
    rows.push({ node, depth, side: node.position || null, more: depth === 3 ? descCount(uid) : 0 });
    if (depth < 3) {
      const { left, right } = sideKids(uid);
      if (left) walk(left.uid, depth + 1);
      if (right) walk(right.uid, depth + 1);
    }
  })(rootUid, 0);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return nodes.filter((n) => `${n.username || ''} ${n.fullname || ''}`.toLowerCase().includes(q)).slice(0, 8);
  }, [nodes, search]);

  if (loading) return <div className="rounded-3xl p-10" style={panelStyle}><Spinner /></div>;
  if (!nodes.length) return <div className="rounded-3xl p-8 text-center text-sm" style={{ ...panelStyle, color: chrome.tertiary }}>No binary downline yet.</div>;

  const sideBadge = (side) => (side ? (
    <span className="rounded-md px-1.5 py-0.5 text-[9px] font-bold"
      style={side === 'left' ? { background: 'rgba(96,165,250,0.16)', color: '#60a5fa' } : { background: 'rgba(244,114,182,0.16)', color: '#f472b6' }}>
      {side === 'left' ? 'L' : 'R'}
    </span>
  ) : null);

  return (
    <div className="rounded-3xl p-4 sm:p-5 space-y-4" style={panelStyle}>
      <div className="relative max-w-xl">
        <HiOutlineSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: chrome.tertiary }} />
        <input type="text" value={search}
          onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search anyone — open their 15-node view…"
          className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none"
          style={{ background: chrome.searchBg, color: chrome.searchText, border: `1px solid ${chrome.searchBorder}` }} />
        {searchOpen && matches.length > 0 && (
          <div className="absolute left-0 top-full z-50 mt-2 w-full overflow-hidden rounded-2xl"
            style={{ background: chrome.popoverBg, border: `1px solid ${chrome.surfaceBorder}`, boxShadow: chrome.popoverShadow }}>
            {matches.map((m) => (
              <button key={`${m.uid}-${m.depth}`} type="button"
                onClick={() => { setRootUid(Number(m.uid)); setSearch(''); setSearchOpen(false); }}
                className="w-full px-4 py-3 text-left text-sm" style={{ color: chrome.searchText }}>
                <span className="font-semibold">{m.fullname || m.username}</span>
                <span className="ml-1 text-xs" style={{ color: chrome.tertiary }}>@{m.username} • Lvl {m.depth}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1 text-xs">
        {trail.map((node, i) => (
          <span key={node.uid} className="inline-flex items-center gap-1">
            {i > 0 && <span style={{ color: chrome.tertiary }}>/</span>}
            <button type="button" onClick={() => setRootUid(Number(node.uid))}
              className="rounded-lg px-2 py-1 font-semibold"
              style={i === trail.length - 1 ? { background: 'rgba(212,175,55,0.18)', color: 'var(--brand-gold)' } : { color: chrome.panelButtonText }}>
              {i === 0 ? 'Root' : (node.username || `UID ${node.uid}`)}
            </button>
          </span>
        ))}
      </div>

      {rootNode && rootNode.parentUid != null ? (
        <div className="rounded-xl px-4 py-2 text-xs font-semibold"
          style={overallSide === 'left'
            ? { background: 'rgba(96,165,250,0.10)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }
            : { background: 'rgba(244,114,182,0.10)', color: '#f472b6', border: '1px solid rgba(244,114,182,0.25)' }}>
          In the <strong>{overallSide === 'left' ? 'LEFT' : 'RIGHT'}</strong> leg — viewing {rootNode.username || `UID ${rootNode.uid}`}'s 15-node bloodline
        </div>
      ) : (
        <div className="rounded-xl px-4 py-2 text-xs font-semibold" style={{ background: 'rgba(212,175,55,0.10)', color: 'var(--brand-gold)', border: '1px solid rgba(212,175,55,0.25)' }}>
          Account root — full Left / Right structure
        </div>
      )}

      <div className="space-y-1.5">
        {rows.map(({ node, depth, side, more }) => {
          const canGoUp = depth === 0 && node.parentUid != null;
          const sponsor = sponsorByUid ? sponsorByUid.get(Number(node.uid)) : null;
          return (
            <button key={`${node.uid}-${depth}`} type="button"
              onClick={() => setRootUid(canGoUp ? Number(node.parentUid) : Number(node.uid))}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:-translate-y-0.5"
              style={{ marginLeft: depth * 18, border: `1px solid ${chrome.surfaceBorder}`, background: depth === 0 ? 'rgba(212,175,55,0.06)' : chrome.surface }}>
              <div className="flex min-w-0 items-center gap-2">
                {depth > 0 && sideBadge(side)}
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium" style={{ color: chrome.heading }}>{node.fullname || node.username || `UID ${node.uid}`}</p>
                  <p className="truncate text-[11px]" style={{ color: chrome.tertiary }}>@{node.username || node.uid} · {node.accttypeName || '—'}</p>
                  {sponsorByUid && (
                    <p className="truncate text-[11px]" style={{ color: chrome.tertiary }}>
                      Sponsor: {sponsor ? `@${sponsor.username || sponsor.fullname || sponsor.uid}` : '—'}
                    </p>
                  )}
                </div>
              </div>
              {canGoUp && (
                <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: 'rgba(212,175,55,0.10)', color: 'var(--brand-gold)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  ↑ up one level
                </span>
              )}
              {!canGoUp && more > 0 && (
                <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: 'rgba(212,175,55,0.10)', color: 'var(--brand-gold)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  open {fmtInt(more)} more
                </span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-[11px]" style={{ color: chrome.tertiary }}>
        Root + 3 levels (up to 15). Tap any member to make them the root and open their 15-node view; tap the top row to go back up one level; tap “open N more” on a deepest row to drill further.
      </p>
    </div>
  );
}
