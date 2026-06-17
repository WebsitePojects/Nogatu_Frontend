import { useEffect, useMemo, useRef, useState } from 'react';
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  HiOutlineArrowsExpand,
  HiOutlineHome,
  HiOutlineMinusSm,
  HiOutlineRefresh,
  HiOutlineUsers,
} from 'react-icons/hi';
import api from '../../api';
import { Spinner, MemberNode, JunctionNode, TreeEdge } from '../../components/genealogyTreeUi';
import { getGenealogyTheme } from '../../components/genealogyTreeUiUtils';
import { buildFlatTreeGraph } from '../../lib/buildFlatTreeGraph';
import useInfiniteTree from '../../hooks/useInfiniteTree';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const UNILEVEL_RATES = [5, 3, 3, 2, 2, 1, 1, 1, 1, 1];
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US');
const fmtMoney = (n) => `₱${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Re-root the already-loaded full tree at a node, fully client-side (no API call).
// The member's whole sponsor tree is in memory, so "recenter" is just a subtree filter.
function subtreeFrom(flatNodes, viewRootUid) {
  if (!viewRootUid) return flatNodes;
  const start = flatNodes.find((n) => String(n.uid) === String(viewRootUid) || String(n.publicUid) === String(viewRootUid));
  if (!start || start.parentUid == null) return flatNodes;
  const childrenOf = new Map();
  for (const n of flatNodes) {
    if (n.parentUid == null) continue;
    const a = childrenOf.get(n.parentUid) || []; a.push(n); childrenOf.set(n.parentUid, a);
  }
  const out = [];
  const seen = new Set();
  const queue = [start];
  while (queue.length) {
    const n = queue.shift();
    if (seen.has(n.uid)) continue;
    seen.add(n.uid);
    out.push(n === start ? { ...n, parentUid: null } : n);
    for (const c of (childrenOf.get(n.uid) || [])) queue.push(c);
  }
  return out;
}

export default function UnilevelTree() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const reactFlowRef = useRef(null);
  const flowShellRef = useRef(null);

  const [canvasActive, setCanvasActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewRootUid, setViewRootUid] = useState(null); // null = my own root (full tree)
  const [uniSummary, setUniSummary] = useState(null);

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

  const viewNodes = useMemo(() => subtreeFrom(flatNodes, viewRootUid), [flatNodes, viewRootUid]);
  const built = useMemo(() => buildFlatTreeGraph(viewNodes, { renderBudget: 60000 }), [viewNodes]);
  const nodes = useMemo(() => built.nodes.map((n) => (
    n.type === 'memberNode'
      ? { ...n, data: { ...n.data, isDarkMode, canvasActive, onOpen: () => setViewRootUid(n.data.uid), onActivateCanvas: activateCanvas } }
      : n
    // eslint-disable-next-line react-hooks/exhaustive-deps
  )), [built, isDarkMode, canvasActive]);
  const edges = built.edges;

  useEffect(() => {
    if (!nodes.length) return undefined;
    const timer = setTimeout(() => {
      reactFlowRef.current?.fitView({ padding: 0.1, duration: 350, maxZoom: 1.2, minZoom: 0.08 });
    }, 80);
    return () => clearTimeout(timer);
  }, [built]);

  const nodeTypes = useMemo(() => ({ memberNode: MemberNode, junctionNode: JunctionNode }), []);
  const edgeTypes = useMemo(() => ({ treeEdge: TreeEdge }), []);
  const isSelfRoot = viewRootUid == null;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold portal-page-title flex items-center gap-2">
            <HiOutlineUsers className="size-6" style={{ color: '#D4AF37' }} />
            Unilevel Tree
          </h1>
          <p className="text-sm portal-card-muted mt-1">
            Your full sponsor (direct-referral) network — Level 0 is you, down to the deepest generation. Each card
            shows the points that member passes up to its upline. Click any member to recenter the tree on them.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="relative flex flex-wrap items-center gap-2 rounded-2xl p-3" style={{ ...panelStyle, zIndex: 40 }}>
        <button type="button" onClick={() => setViewRootUid(null)} disabled={isSelfRoot}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-40" style={neutralButtonStyle}>
          <HiOutlineHome className="size-4" /> My Root
        </button>
        <button type="button"
          onClick={() => reactFlowRef.current?.fitView({ padding: 0.1, duration: 350, maxZoom: 1.2, minZoom: 0.08 })}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold" style={neutralButtonStyle}>
          <HiOutlineRefresh className="size-4" /> Fit View
        </button>
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

      {/* Canvas */}
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
          {isFullscreen && !isSelfRoot && (
            <button type="button" onClick={() => setViewRootUid(null)}
              className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur" style={neutralButtonStyle}>
              <HiOutlineHome className="size-4" /> My Root
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

      <UnilevelBreakdown summary={uniSummary} panelStyle={panelStyle} />
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
