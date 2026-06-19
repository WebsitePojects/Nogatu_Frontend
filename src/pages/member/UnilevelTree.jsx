import { useEffect, useMemo, useRef, useState } from 'react';
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  HiOutlineArrowsExpand,
  HiOutlineChevronDown,
  HiOutlineChevronRight,
  HiOutlineHome,
  HiOutlineMinusSm,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineUsers,
} from 'react-icons/hi';
import api from '../../api';
import { Spinner, MemberNode, JunctionNode, TreeEdge } from '../../components/genealogyTreeUi';
import { getGenealogyTheme, NODE_WIDTH, NODE_HEIGHT } from '../../components/genealogyTreeUiUtils';
import { buildFlatTreeGraph, expandPathTo } from '../../lib/buildFlatTreeGraph';
import useInfiniteTree from '../../hooks/useInfiniteTree';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const UNILEVEL_RATES = [5, 3, 3, 2, 2, 1, 1, 1, 1, 1];
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US');
const fmtMoney = (n) => `₱${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function UnilevelTree() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const reactFlowRef = useRef(null);
  const flowShellRef = useRef(null);

  const [canvasActive, setCanvasActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set()); // explicitly opened deep branches
  const [treeSearch, setTreeSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [uniSummary, setUniSummary] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' (per-level, default) | 'tree' (canvas)

  const selfUid = user?.uid;
  const { nodes: flatNodes, status, loading, refreshing, count } = useInfiniteTree({
    treeType: 'unilevel',
    cacheKey: selfUid ? String(selfUid) : '',
    url: '/genealogy/unilevel/flat',
    enabled: Boolean(selfUid),
  });

  const chrome = getGenealogyTheme(isDarkMode);
  const panelStyle = { background: chrome.surfaceStrong, border: `1px solid ${chrome.surfaceBorder}`, backdropFilter: 'blur(18px)' };
  const neutralButtonStyle = { background: chrome.panelButtonBg, color: chrome.panelButtonText, border: `1px solid ${chrome.surfaceBorder}` };

  // Your own maintenance status + per-level breakdown (independent of canvas root).
  useEffect(() => {
    let cancelled = false;
    api.get('/dashboard/breakdown/uni-level')
      .then((res) => { if (!cancelled) setUniSummary(res.data); })
      .catch(() => { if (!cancelled) setUniSummary(null); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function onChange() { setIsFullscreen(document.fullscreenElement === flowShellRef.current); }
    function onPointer(e) { if (!flowShellRef.current?.contains(e.target)) setCanvasActive(false); }
    function onEsc(e) { if (e.key === 'Escape') setCanvasActive(false); }
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  async function toggleFullscreen() {
    if (!flowShellRef.current) return;
    try {
      if (document.fullscreenElement === flowShellRef.current) await document.exitFullscreen();
      else { await flowShellRef.current.requestFullscreen(); setCanvasActive(true); }
    } catch { /* denied */ }
  }
  function activateCanvas() { setCanvasActive(true); }

  function toggleExpand(uid) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  }
  function jumpTo(node) {
    const path = expandPathTo(flatNodes, node.uid);
    setExpanded((prev) => { const next = new Set(prev); path.forEach((u) => next.add(u)); return next; });
    setCanvasActive(true);
    setTreeSearch(''); setSearchOpen(false);
    const id = String(node.publicUid || node.uid);
    setTimeout(() => {
      const rf = reactFlowRef.current;
      const target = rf?.getNode?.(id);
      if (target) rf.setCenter(target.position.x + NODE_WIDTH / 2, target.position.y + NODE_HEIGHT / 2, { zoom: 0.9, duration: 500 });
    }, 160);
  }

  // Progressive render: first 2 levels + explicitly expanded branches only (fast).
  // Render the WHOLE unilevel tree (all nodes visible).
  const built = useMemo(
    () => buildFlatTreeGraph(flatNodes, { renderBudget: 60000, expandAll: true }),
    [flatNodes],
  );
  const nodes = useMemo(() => built.nodes.map((n) => (
    n.type === 'memberNode'
      ? { ...n, data: { ...n.data, isDarkMode, canvasActive, onOpen: () => toggleExpand(n.data.uid), onActivateCanvas: activateCanvas } }
      : n
    // eslint-disable-next-line react-hooks/exhaustive-deps
  )), [built, isDarkMode, canvasActive]);
  const edges = built.edges;

  useEffect(() => {
    if (!built.nodes.length) return undefined;
    const timer = setTimeout(() => {
      reactFlowRef.current?.fitView({ padding: 0.1, duration: 350, maxZoom: 1.2, minZoom: 0.08 });
    }, 80);
    return () => clearTimeout(timer);
    // refit only when the tree (size) changes, not on every expand
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const matchResults = useMemo(() => {
    const q = treeSearch.trim().toLowerCase();
    if (!q) return [];
    return flatNodes.filter((n) => `${n.username || ''} ${n.fullname || ''}`.toLowerCase().includes(q)).slice(0, 8);
  }, [flatNodes, treeSearch]);

  const nodeTypes = useMemo(() => ({ memberNode: MemberNode, junctionNode: JunctionNode }), []);
  const edgeTypes = useMemo(() => ({ treeEdge: TreeEdge }), []);
  const isCollapsed = expanded.size === 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold portal-page-title flex items-center gap-2">
            <HiOutlineUsers className="size-6" style={{ color: '#D4AF37' }} />
            Unilevel Tree
          </h1>
          <p className="text-sm portal-card-muted mt-1">
            Your sponsor (direct-referral) network. List view shows one level at a time — click a member to drill
            into their bloodline (they become the root); use the breadcrumb to step back. Search jumps straight to
            anyone's bloodline. Switch to Tree view for the full graphical canvas.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="relative flex flex-wrap items-center gap-2 rounded-2xl p-3" style={{ ...panelStyle, zIndex: 40 }}>
        {/* View toggle: per-level list (default) vs graphical tree canvas */}
        <div className="inline-flex overflow-hidden rounded-xl" style={{ border: `1px solid ${chrome.surfaceBorder}` }}>
          {[['list', 'List view'], ['tree', 'Tree view']].map(([mode, label]) => (
            <button key={mode} type="button" onClick={() => setViewMode(mode)}
              className="px-3 py-2 text-xs font-semibold transition-colors"
              style={viewMode === mode
                ? { background: 'rgba(212,175,55,0.18)', color: 'var(--brand-gold)' }
                : { background: 'transparent', color: chrome.panelButtonText }}>
              {label}
            </button>
          ))}
        </div>

        {viewMode === 'tree' && (
          <>
            <button type="button" onClick={() => setExpanded(new Set())} disabled={isCollapsed}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-40" style={neutralButtonStyle}>
              <HiOutlineHome className="size-4" /> Collapse all
            </button>
            <button type="button"
              onClick={() => reactFlowRef.current?.fitView({ padding: 0.1, duration: 350, maxZoom: 1.2, minZoom: 0.08 })}
              className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold" style={neutralButtonStyle}>
              <HiOutlineRefresh className="size-4" /> Fit View
            </button>

            {/* In-tree search */}
            <div className="relative">
              <HiOutlineSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 portal-card-muted" />
              <input type="text" value={treeSearch}
                onChange={(e) => { setTreeSearch(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search a name in your tree…"
                className="w-56 rounded-xl py-2 pl-8 pr-3 text-xs outline-none"
                style={{ background: chrome.searchBg, color: chrome.searchText, border: `1px solid ${chrome.searchBorder}` }} />
              {searchOpen && matchResults.length > 0 && (
                <div className="absolute left-0 top-full z-50 mt-1 w-64 overflow-hidden rounded-xl"
                  style={{ background: chrome.popoverBg, border: `1px solid ${chrome.surfaceBorder}`, boxShadow: chrome.popoverShadow }}>
                  {matchResults.map((m) => (
                    <button key={m.uid} type="button" onClick={() => jumpTo(m)}
                      className="w-full px-3 py-2 text-left text-xs" style={{ color: chrome.searchText }}>
                      <span className="font-semibold">{m.fullname || m.username}</span>
                      <span className="ml-1 portal-card-muted">@{m.username} · L{m.depth}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

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

      {/* List view (default): drill-down explorer — click a member to re-root */}
      {viewMode === 'list' && (
        <UnilevelDrill nodes={flatNodes} selfUid={selfUid} chrome={chrome} panelStyle={panelStyle} loading={loading} />
      )}

      {/* Canvas (graphical tree) */}
      {viewMode === 'tree' && (
      <div ref={flowShellRef} className={`relative overflow-hidden ${isFullscreen ? 'rounded-none' : 'rounded-2xl'}`}
        style={{ ...panelStyle, height: isFullscreen ? '100vh' : '70vh', zIndex: 0 }}>
        <div className="absolute left-3 top-3 z-30 flex flex-wrap items-center gap-2">
          <button type="button"
            onClick={() => reactFlowRef.current?.fitView({ padding: 0.1, duration: 350, maxZoom: 1.2, minZoom: 0.08 })}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur"
            style={neutralButtonStyle}>
            <HiOutlineRefresh className="size-4" /> Fit
          </button>
          <button type="button" onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur"
            style={{ background: 'rgba(212,175,55,0.16)', color: 'var(--brand-gold)', border: '1px solid rgba(212,175,55,0.35)' }}>
            {isFullscreen ? <HiOutlineMinusSm className="size-4" /> : <HiOutlineArrowsExpand className="size-4" />}
            {isFullscreen ? 'Exit' : 'Full screen'}
          </button>
          {isFullscreen && !isCollapsed && (
            <button type="button" onClick={() => setExpanded(new Set())}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur" style={neutralButtonStyle}>
              <HiOutlineHome className="size-4" /> Collapse all
            </button>
          )}
        </div>

        {!canvasActive && !loading && (
          <button type="button" aria-label="Activate unilevel canvas" onClick={activateCanvas}
            className="absolute inset-0 z-10 block cursor-grab bg-transparent" />
        )}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]" style={{ background: chrome.canvasOverlay }}>
            <Spinner />
          </div>
        )}
        {!loading && status !== 'error' && nodes.length === 0 && (
          <div className="absolute inset-0 z-20 flex items-center justify-center text-sm portal-card-muted">
            No downline to display yet.
          </div>
        )}
        <ReactFlow
          onInit={(instance) => { reactFlowRef.current = instance; }}
          className="genealogy-flow size-full"
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onlyRenderVisibleElements
          minZoom={0.06}
          maxZoom={1.6}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={canvasActive}
          panOnDrag={canvasActive}
          panOnScroll={false}
          zoomOnScroll={canvasActive}
          zoomOnPinch={canvasActive}
          zoomOnDoubleClick={canvasActive}
          preventScrolling={canvasActive}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ type: 'treeEdge' }}
        >
          <Controls className="genealogy-controls" showInteractive={false} position="top-right" />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color={chrome.backgroundDot} />
        </ReactFlow>

        {!canvasActive && !loading && nodes.length > 0 && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1.5 text-[11px] font-medium"
            style={{ background: 'rgba(15,23,42,0.72)', color: 'rgba(255,255,255,0.85)' }}>
            Tap the canvas to pan, zoom, and open members
          </div>
        )}
      </div>
      )}

      <UnilevelBreakdown summary={uniSummary} panelStyle={panelStyle} />
    </div>
  );
}

/* ── Drill-down explorer: render ONE level at a time. Click a member to re-root
      (they become the root, their direct downline shows). Breadcrumb walks back up.
      Search jumps straight into anyone's bloodline (re-roots to them), instead of
      expanding the whole path. Uses the already-loaded flat list — only the current
      root's direct children are rendered, so it stays light. ─────────────────── */
function UnilevelDrill({ nodes, selfUid, chrome, panelStyle, loading }) {
  const rootDefault = Number(selfUid) || Number(nodes.find((n) => n.parentUid == null)?.uid) || null;
  const [rootUid, setRootUid] = useState(rootDefault);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    if (rootUid == null && rootDefault != null) setRootUid(rootDefault);
  }, [rootDefault, rootUid]);

  const { byUid, childrenOf } = useMemo(() => {
    const bu = new Map();
    const ch = new Map();
    for (const n of nodes) bu.set(Number(n.uid), n);
    for (const n of nodes) {
      if (n.parentUid == null) continue;
      const p = Number(n.parentUid);
      if (!ch.has(p)) ch.set(p, []);
      ch.get(p).push(n);
    }
    return { byUid: bu, childrenOf: ch };
  }, [nodes]);

  const rootNode = byUid.get(Number(rootUid)) || null;
  const children = (childrenOf.get(Number(rootUid)) || [])
    .slice()
    .sort((a, b) => String(a.username || '').localeCompare(String(b.username || '')));

  const trail = useMemo(() => {
    const arr = [];
    let cur = rootNode;
    let guard = 0;
    while (cur && guard < 100) {
      arr.unshift(cur);
      if (cur.parentUid == null) break;
      cur = byUid.get(Number(cur.parentUid));
      guard += 1;
    }
    return arr;
  }, [rootNode, byUid]);

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return [];
    return nodes.filter((n) => `${n.username || ''} ${n.fullname || ''}`.toLowerCase().includes(q)).slice(0, 8);
  }, [nodes, search]);

  if (loading) return <div className="rounded-2xl p-10" style={panelStyle}><Spinner /></div>;
  if (!nodes.length) return <div className="rounded-2xl p-8 text-center text-sm portal-card-muted" style={panelStyle}>No downline members yet.</div>;

  return (
    <div className="rounded-2xl p-4 sm:p-5 space-y-4" style={panelStyle}>
      {/* Search → jump into any member's bloodline */}
      <div className="relative">
        <HiOutlineSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 portal-card-muted" />
        <input type="text" value={search}
          onChange={(e) => { setSearch(e.target.value); setSearchOpen(true); }}
          onFocus={() => setSearchOpen(true)}
          placeholder="Search anyone — jump into their bloodline…"
          className="w-full sm:w-80 rounded-xl py-2 pl-8 pr-3 text-sm outline-none"
          style={{ background: chrome.searchBg, color: chrome.searchText, border: `1px solid ${chrome.searchBorder}` }} />
        {searchOpen && matches.length > 0 && (
          <div className="absolute left-0 top-full z-50 mt-1 w-full sm:w-80 overflow-hidden rounded-xl"
            style={{ background: chrome.popoverBg, border: `1px solid ${chrome.surfaceBorder}`, boxShadow: chrome.popoverShadow }}>
            {matches.map((m) => (
              <button key={m.uid} type="button"
                onClick={() => { setRootUid(Number(m.uid)); setSearch(''); setSearchOpen(false); }}
                className="w-full px-3 py-2 text-left text-xs" style={{ color: chrome.searchText }}>
                <span className="font-semibold">{m.fullname || m.username}</span>
                <span className="ml-1 portal-card-muted">@{m.username} · L{m.depth}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Breadcrumb (re-root by clicking an ancestor) */}
      <div className="flex flex-wrap items-center gap-1 text-xs">
        {trail.map((node, i) => (
          <span key={node.uid} className="inline-flex items-center gap-1">
            {i > 0 && <span className="portal-card-muted">/</span>}
            <button type="button" onClick={() => setRootUid(Number(node.uid))}
              className="rounded-lg px-2 py-1 font-semibold"
              style={i === trail.length - 1
                ? { background: 'rgba(212,175,55,0.18)', color: 'var(--brand-gold)' }
                : { color: chrome.panelButtonText }}>
              {i === 0 ? 'You' : (node.username || `UID ${node.uid}`)}
            </button>
          </span>
        ))}
      </div>

      {/* Current root summary */}
      {rootNode && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.18)' }}>
          <p className="text-sm font-bold portal-card-title">{rootNode.fullname || rootNode.username || `UID ${rootNode.uid}`}</p>
          <p className="text-[11px] portal-card-muted mt-0.5">
            @{rootNode.username || rootNode.uid} · {rootNode.accttypeName || '—'} · {fmtInt(children.length)} direct downline
          </p>
        </div>
      )}

      {/* Direct children — one level; click to drill deeper */}
      <div className="space-y-2">
        {children.length === 0 && (
          <p className="px-1 py-6 text-center text-xs portal-card-muted">No direct downline under this member.</p>
        )}
        {children.map((c) => {
          const grandkids = (childrenOf.get(Number(c.uid)) || []).length;
          return (
            <button key={c.uid} type="button" onClick={() => setRootUid(Number(c.uid))}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-all hover:-translate-y-0.5"
              style={{ border: `1px solid ${chrome.surfaceBorder}`, background: chrome.surface }}>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium portal-card-title">{c.fullname || c.username || `Member ${c.uid}`}</p>
                <p className="truncate text-[11px] portal-card-muted">@{c.username || c.uid} · {c.accttypeName || '—'}</p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-2">
                <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold"
                  style={{ background: 'rgba(212,175,55,0.10)', color: 'var(--brand-gold)', border: '1px solid rgba(212,175,55,0.2)' }}>
                  {grandkids > 0 ? `${fmtInt(grandkids)} below` : 'leaf'}
                </span>
                <HiOutlineChevronRight className="size-4 portal-card-muted" />
              </span>
            </button>
          );
        })}
      </div>
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
