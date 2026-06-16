import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  HiOutlineHome,
  HiOutlineRefresh,
  HiOutlineUsers,
  HiOutlineChevronDown,
} from 'react-icons/hi';
import api from '../../api';
import {
  Spinner,
  MemberNode,
  JunctionNode,
  TreeEdge,
} from '../../components/genealogyTreeUi';
import {
  flattenUnilevelTree,
  layoutGraph,
  getGenealogyTheme,
  NODE_WIDTH,
  NODE_HEIGHT,
} from '../../components/genealogyTreeUiUtils';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// Unilevel payout rate schedule (levels 1–10) — matches the income engine.
const UNILEVEL_RATES = [5, 3, 3, 2, 2, 1, 1, 1, 1, 1];

const fmtInt = (n) => Number(n || 0).toLocaleString('en-US');
const fmtMoney = (n) => `₱${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function countTreeNodes(node) {
  if (!node) return 0;
  const children = Array.isArray(node.children) ? node.children : [];
  return 1 + children.reduce((sum, child) => sum + countTreeNodes(child), 0);
}

export default function UnilevelTree() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const reactFlowRef = useRef(null);
  const flowShellRef = useRef(null);
  const levelMenuRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canvasActive, setCanvasActive] = useState(false);
  const [levelMenuOpen, setLevelMenuOpen] = useState(false);
  const [uniSummary, setUniSummary] = useState(null);

  const selfRootId = user?.publicUid || user?.public_uid || user?.uid;
  const rootId = searchParams.get('id') || selfRootId;
  const selectedDepth = LEVEL_OPTIONS.includes(Number(searchParams.get('depth')))
    ? Number(searchParams.get('depth'))
    : 3;
  const isSelfRoot = !searchParams.get('id') || String(searchParams.get('id')) === String(selfRootId);

  const chrome = getGenealogyTheme(isDarkMode);
  const panelStyle = {
    background: chrome.surfaceStrong,
    border: `1px solid ${chrome.surfaceBorder}`,
    backdropFilter: 'blur(18px)',
  };
  const neutralButtonStyle = {
    background: chrome.panelButtonBg,
    color: chrome.panelButtonText,
    border: `1px solid ${chrome.surfaceBorder}`,
  };

  useEffect(() => {
    if (!rootId) return undefined;
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get(`/genealogy/unilevel/tree?root=${rootId}&depth=${selectedDepth}`);
        if (!cancelled) setTree(res.data.tree);
      } catch {
        if (!cancelled) setTree(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [rootId, selectedDepth]);

  // Your own maintenance status + per-level breakdown (independent of canvas root).
  useEffect(() => {
    let cancelled = false;
    async function loadSummary() {
      try {
        const res = await api.get('/dashboard/breakdown/uni-level');
        if (!cancelled) setUniSummary(res.data);
      } catch {
        if (!cancelled) setUniSummary(null);
      }
    }
    loadSummary();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    function handleOutside(event) {
      if (!flowShellRef.current?.contains(event.target)) setCanvasActive(false);
      if (!levelMenuRef.current?.contains(event.target)) setLevelMenuOpen(false);
    }
    function handleEscape(event) {
      if (event.key === 'Escape') { setCanvasActive(false); setLevelMenuOpen(false); }
    }
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  function setRoot(nextRoot) {
    const params = {};
    if (nextRoot && String(nextRoot) !== String(selfRootId)) params.id = nextRoot;
    params.depth = String(selectedDepth);
    setSearchParams(params);
  }

  function setDepth(nextDepth) {
    const params = { depth: String(nextDepth) };
    if (searchParams.get('id')) params.id = searchParams.get('id');
    setSearchParams(params);
    setLevelMenuOpen(false);
  }

  function goHome() {
    setSearchParams({ depth: String(selectedDepth) });
  }

  function activateCanvas() {
    setCanvasActive(true);
  }

  const { nodes, edges } = useMemo(() => {
    if (!tree) return { nodes: [], edges: [] };
    const flattened = flattenUnilevelTree(tree, 0, selectedDepth);
    const graphNodes = flattened.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isDarkMode,
        canvasActive,
        binaryPoints: Number(node.data.binaryPoints || 0),
        onOpen: () => setRoot(node.id),
        onActivateCanvas: activateCanvas,
      },
    }));
    return { nodes: layoutGraph(graphNodes, flattened.edges), edges: flattened.edges };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree, selectedDepth, isDarkMode, canvasActive]);

  useEffect(() => {
    if (!tree || !nodes.length) return undefined;
    const timer = setTimeout(() => {
      reactFlowRef.current?.fitView({ padding: 0.1, duration: 350, maxZoom: 1.2, minZoom: 0.15 });
    }, 80);
    return () => clearTimeout(timer);
  }, [tree, rootId, selectedDepth, nodes.length]);

  const nodeTypes = useMemo(() => ({ memberNode: MemberNode, junctionNode: JunctionNode }), []);
  const edgeTypes = useMemo(() => ({ treeEdge: TreeEdge }), []);

  const totalNodes = useMemo(() => countTreeNodes(tree), [tree]);
  const rootName = tree?.fullname || tree?.username || 'You';

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold portal-page-title flex items-center gap-2">
            <HiOutlineUsers className="size-6" style={{ color: '#D4AF37' }} />
            Unilevel Tree
          </h1>
          <p className="text-sm portal-card-muted mt-1">
            Your sponsor (direct-referral) network — Level 0 is you, down to 10 levels. Click any
            member to recenter the tree on their downline.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="relative flex flex-wrap items-center gap-2 rounded-2xl p-3" style={{ ...panelStyle, zIndex: 40 }}>
        <button type="button" onClick={goHome} disabled={isSelfRoot}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-40"
          style={neutralButtonStyle}>
          <HiOutlineHome className="size-4" /> My Root
        </button>

        <div ref={levelMenuRef} className="relative">
          <button type="button" onClick={() => setLevelMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
            style={neutralButtonStyle}>
            Depth: {selectedDepth} {selectedDepth === 1 ? 'level' : 'levels'}
            <HiOutlineChevronDown className="size-3.5" />
          </button>
          {levelMenuOpen && (
            <div className="absolute mt-1 w-40 rounded-xl p-1.5 grid grid-cols-2 gap-1" style={{ ...panelStyle, zIndex: 60 }}>
              {LEVEL_OPTIONS.map((lvl) => (
                <button key={lvl} type="button" onClick={() => setDepth(lvl)}
                  className="rounded-lg px-2 py-1.5 text-xs font-semibold text-center"
                  style={lvl === selectedDepth
                    ? { background: 'rgba(212,175,55,0.18)', border: '1px solid rgba(212,175,55,0.35)', color: 'var(--brand-gold)' }
                    : neutralButtonStyle}>
                  {lvl}
                </button>
              ))}
            </div>
          )}
        </div>

        <button type="button"
          onClick={() => reactFlowRef.current?.fitView({ padding: 0.1, duration: 350, maxZoom: 1.2, minZoom: 0.15 })}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
          style={neutralButtonStyle}>
          <HiOutlineRefresh className="size-4" /> Fit View
        </button>

        <div className="ml-auto flex items-center gap-3 text-xs portal-card-muted">
          <span>Root: <span className="portal-card-title font-semibold">{rootName}</span></span>
          <span className="hidden sm:inline">Rendered: <span className="portal-card-title font-semibold">{totalNodes}</span></span>
        </div>
      </div>

      {/* Canvas */}
      <div ref={flowShellRef} className="relative rounded-2xl overflow-hidden" style={{ ...panelStyle, height: '70vh', zIndex: 0 }}>
        {!canvasActive && !loading && (
          <button type="button" aria-label="Activate unilevel canvas" onClick={activateCanvas}
            className="absolute inset-0 z-10 block cursor-grab bg-transparent" />
        )}
        {loading && (
          <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]" style={{ background: chrome.canvasOverlay }}>
            <Spinner />
          </div>
        )}
        {!loading && (!tree || nodes.length === 0) && (
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
          minZoom={0.12}
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

        {!canvasActive && !loading && (
          <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 z-10 rounded-full px-3 py-1.5 text-[11px] font-medium"
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

  // Merge live per-level figures onto the full 1–10 rate schedule so every level
  // shows, even with no contributors this month.
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
      {/* Maintenance progress */}
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

      {/* Per-level breakdown */}
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
