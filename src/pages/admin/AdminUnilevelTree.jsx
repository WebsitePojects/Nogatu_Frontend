import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  HiOutlineChevronDown,
  HiOutlineHome,
  HiOutlineOfficeBuilding,
  HiOutlineRefresh,
  HiOutlineSparkles,
  HiOutlineUserGroup,
  HiOutlineUsers,
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
  getGenealogyTheme,
  layoutGraph,
} from '../../components/genealogyTreeUiUtils';
import { useTheme } from '../../contexts/ThemeContext';

const LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

// Heuristic only — flags accounts that LOOK like company/system/main accounts so
// admin can verify before excluding them from rank. Never an automatic action.
const COMPANY_RX = /nogatu|company|alliance|corp(oration)?|admin|system|\bmain\b|holdings|enterprise/i;
function isLikelyCompany(node) {
  return COMPANY_RX.test(String(node?.username || '')) || COMPANY_RX.test(String(node?.fullname || ''));
}

const fmtInt = (n) => Number(n || 0).toLocaleString('en-US');

// Flatten the raw (nested) unilevel tree into a level-ordered list for the side panel.
function flattenRaw(node, acc = []) {
  if (!node) return acc;
  acc.push(node);
  for (const child of (node.children || [])) flattenRaw(child, acc);
  return acc;
}

export default function AdminUnilevelTree() {
  const { isDarkMode } = useTheme();
  const reactFlowRef = useRef(null);
  const flowShellRef = useRef(null);
  const levelMenuRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [tree, setTree] = useState(null);
  const [loading, setLoading] = useState(false);
  const [canvasActive, setCanvasActive] = useState(false);
  const [levelMenuOpen, setLevelMenuOpen] = useState(false);
  const [searchUsername, setSearchUsername] = useState(searchParams.get('username') || '');

  const rootId = searchParams.get('id') || '';
  const rootUsername = searchParams.get('username') || '';
  const selectedDepth = LEVEL_OPTIONS.includes(Number(searchParams.get('depth')))
    ? Number(searchParams.get('depth'))
    : 5;

  const chrome = getGenealogyTheme(isDarkMode);
  const panelStyle = {
    background: chrome.surfaceStrong,
    border: `1px solid ${chrome.surfaceBorder}`,
    backdropFilter: 'blur(18px)',
  };
  const insetCardStyle = {
    background: chrome.surface,
    border: `1px solid ${chrome.surfaceBorder}`,
  };
  const neutralButtonStyle = {
    background: chrome.panelButtonBg,
    color: chrome.panelButtonText,
    border: `1px solid ${chrome.surfaceBorder}`,
  };
  const amberButtonStyle = {
    background: chrome.amberButtonBg,
    color: chrome.amberButtonText,
    border: `1px solid ${chrome.amberBorder}`,
  };

  useEffect(() => {
    if (!rootId && !rootUsername) {
      setTree(null);
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const rootParam = rootId
          ? `id=${encodeURIComponent(rootId)}`
          : `username=${encodeURIComponent(rootUsername)}`;
        const res = await api.get(`/admin/genealogy/unilevel/tree?${rootParam}&depth=${selectedDepth}`);
        if (!cancelled) {
          setTree(res.data.tree);
          if (res.data.rootUid && String(res.data.rootUid) !== String(rootId) && !rootId) {
            // keep the username-based deep link; no rewrite needed
          }
        }
      } catch {
        if (!cancelled) setTree(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [rootId, rootUsername, selectedDepth]);

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
    const params = { depth: String(selectedDepth) };
    if (nextRoot) params.id = nextRoot;
    setSearchUsername('');
    setSearchParams(params);
  }

  function setDepth(nextDepth) {
    const params = { depth: String(nextDepth) };
    if (rootId) params.id = rootId;
    else if (rootUsername) params.username = rootUsername;
    setSearchParams(params);
    setLevelMenuOpen(false);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = String(searchUsername || '').trim();
    if (!trimmed) return;
    setSearchParams({ username: trimmed, depth: String(selectedDepth) });
  }

  function activateCanvas() { setCanvasActive(true); }

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
  }, [tree, rootId, rootUsername, selectedDepth, nodes.length]);

  const nodeTypes = useMemo(() => ({ memberNode: MemberNode, junctionNode: JunctionNode }), []);
  const edgeTypes = useMemo(() => ({ treeEdge: TreeEdge }), []);

  const flatList = useMemo(() => flattenRaw(tree), [tree]);
  const flaggedCount = useMemo(() => flatList.filter(isLikelyCompany).length, [flatList]);
  const rootName = tree?.fullname || tree?.username || (rootUsername || 'Account');

  return (
    <div className="space-y-6">
      {/* Header + search */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2" style={{ color: chrome.heading }}>
            <HiOutlineUserGroup className="size-6" style={{ color: '#D4AF37' }} />
            Unilevel Tree Viewer
          </h1>
          <div className="mt-2 h-0.5 w-12 rounded-full" style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
          <p className="mt-3 max-w-2xl text-sm" style={{ color: chrome.subtext }}>
            Inspect any account's sponsor (drefid) downline — Level 0 is the searched account, each
            level its direct referrals. Use it to review company/system accounts before deciding rank
            exclusions. Click any node to recenter on its downline.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="uni-search" className="sr-only">Search account username</label>
          <input
            id="uni-search"
            type="text"
            value={searchUsername}
            onChange={(event) => setSearchUsername(event.target.value)}
            className="min-w-[260px] rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200"
            style={{ background: chrome.searchBg, color: chrome.searchText, border: `1px solid ${chrome.searchBorder}` }}
            placeholder="Type a username (e.g. a company account)"
          />
          <button type="submit"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={amberButtonStyle}>
            Open Tree
          </button>
          <button type="button"
            onClick={() => { setSearchUsername(''); setSearchParams({ depth: String(selectedDepth) }); }}
            className="rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={neutralButtonStyle}>
            Clear
          </button>
        </form>
      </div>

      {/* Toolbar */}
      <div className="relative flex flex-wrap items-center gap-2 rounded-2xl p-3" style={{ ...panelStyle, zIndex: 40 }}>
        <div ref={levelMenuRef} className="relative">
          <button type="button" onClick={() => setLevelMenuOpen((v) => !v)}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
            style={neutralButtonStyle}>
            <HiOutlineSparkles className="size-4" style={{ color: '#D4AF37' }} />
            Depth: {selectedDepth} {selectedDepth === 1 ? 'level' : 'levels'}
            <HiOutlineChevronDown className="size-3.5" />
          </button>
          {levelMenuOpen && (
            <div className="absolute mt-1 grid w-48 grid-cols-3 gap-1 rounded-xl p-1.5"
              style={{ ...panelStyle, zIndex: 60, background: chrome.popoverBg }}>
              {LEVEL_OPTIONS.map((lvl) => (
                <button key={lvl} type="button" onClick={() => setDepth(lvl)}
                  className="rounded-lg px-2 py-1.5 text-center text-xs font-semibold"
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

        {rootId && (
          <button type="button" onClick={() => setSearchParams({ depth: String(selectedDepth) })}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold"
            style={neutralButtonStyle}>
            <HiOutlineHome className="size-4" /> Clear Root
          </button>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-3 text-xs" style={{ color: chrome.tertiary }}>
          <span>Root: <span className="font-semibold" style={{ color: chrome.heading }}>{rootName}</span></span>
          <span>Nodes: <span className="font-semibold" style={{ color: chrome.heading }}>{fmtInt(flatList.length)}</span></span>
          {flaggedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold"
              style={{ background: 'rgba(248,113,113,0.12)', color: isDarkMode ? '#FCA5A5' : '#B91C1C', border: '1px solid rgba(248,113,113,0.25)' }}>
              <HiOutlineOfficeBuilding className="size-3.5" /> {flaggedCount} flagged
            </span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!loading && !tree && (
        <div className="rounded-3xl p-10 text-center" style={panelStyle}>
          <HiOutlineUserGroup className="mx-auto mb-4 size-10" style={{ color: chrome.emptyIcon }} />
          <h2 className="font-display text-xl font-semibold" style={{ color: chrome.heading }}>
            {rootId || rootUsername ? 'Unilevel tree could not be loaded' : 'Open a unilevel tree'}
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: chrome.subtext }}>
            {rootId || rootUsername
              ? 'We could not load that account’s sponsor downline. Try another username.'
              : 'Search a username above (for example, a company/main account) to inspect its unilevel network.'}
          </p>
        </div>
      )}

      {(loading || tree) && (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Canvas */}
          <div ref={flowShellRef} className="relative overflow-hidden rounded-2xl" style={{ ...panelStyle, height: '70vh', zIndex: 0 }}>
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
              <div className="absolute inset-0 z-20 flex items-center justify-center text-sm" style={{ color: chrome.tertiary }}>
                No downline to display.
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

            {!canvasActive && !loading && tree && (
              <div className="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full px-3 py-1.5 text-[11px] font-medium"
                style={{ background: 'rgba(15,23,42,0.72)', color: 'rgba(255,255,255,0.85)' }}>
                Tap the canvas to pan, zoom, and open members
              </div>
            )}
          </div>

          {/* Side panel — node list with maintenance points + company flags */}
          <div className="flex min-h-0 flex-col rounded-2xl p-5" style={panelStyle}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold" style={{ color: chrome.heading }}>Accounts in view</h2>
              <span className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ background: chrome.amberButtonBg, color: chrome.amberButtonText, border: `1px solid ${chrome.amberBorder}` }}>
                {fmtInt(flatList.length)}
              </span>
            </div>
            <p className="mt-1 text-xs" style={{ color: chrome.tertiary }}>
              Per-account current-month maintenance (repurchase) points. Accounts that look like
              company/system accounts are flagged for review — verify before excluding from rank.
            </p>

            <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
              {flatList.length === 0 && !loading && (
                <div className="rounded-2xl p-6 text-center" style={insetCardStyle}>
                  <HiOutlineUsers className="mx-auto mb-2 size-7" style={{ color: chrome.emptyIcon }} />
                  <p className="text-sm" style={{ color: chrome.tertiary }}>No accounts loaded yet.</p>
                </div>
              )}
              {flatList.map((node) => {
                const flagged = isLikelyCompany(node);
                return (
                  <button
                    key={`${node.uid}-${node.level}`}
                    type="button"
                    onClick={() => setRoot(node.publicUid || node.uid)}
                    className="w-full rounded-xl p-3 text-left transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      ...insetCardStyle,
                      ...(flagged ? { border: '1px solid rgba(248,113,113,0.4)' } : {}),
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-sm font-semibold" style={{ color: chrome.heading }}>
                          {flagged && <HiOutlineOfficeBuilding className="size-3.5 flex-shrink-0" style={{ color: isDarkMode ? '#FCA5A5' : '#B91C1C' }} />}
                          {node.fullname || node.username || `Member ${node.uid}`}
                        </p>
                        <p className="mt-0.5 truncate text-[11px]" style={{ color: chrome.tertiary }}>
                          {node.username || `uid ${node.uid}`} • {node.accttypeName || 'Bronze'}
                        </p>
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                        style={{ background: chrome.amberButtonBg, color: chrome.amberButtonText, border: `1px solid ${chrome.amberBorder}` }}>
                        L{node.level}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span style={{ color: chrome.tertiary }}>Maintenance pts (this month)</span>
                      <span className="font-semibold tabular-nums"
                        style={{ color: Number(node.maintenancePoints) > 0 ? (isDarkMode ? '#86EFAC' : '#166534') : chrome.tertiary }}>
                        {fmtInt(node.maintenancePoints || 0)}
                      </span>
                    </div>
                    {flagged && (
                      <p className="mt-2 rounded-lg px-2 py-1 text-[10px] font-medium"
                        style={{ background: 'rgba(248,113,113,0.10)', color: isDarkMode ? '#FCA5A5' : '#B91C1C' }}>
                        Possible company/system account — verify before rank exclusion
                      </p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
