import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  HiOutlineArrowsExpand,
  HiOutlineHome,
  HiOutlineMinusSm,
  HiOutlineOfficeBuilding,
  HiOutlineRefresh,
  HiOutlineUserGroup,
  HiOutlineUsers,
} from 'react-icons/hi';
import {
  Spinner,
  MemberNode,
  JunctionNode,
  TreeEdge,
} from '../../components/genealogyTreeUi';
import { getGenealogyTheme } from '../../components/genealogyTreeUiUtils';
import { buildFlatTreeGraph } from '../../lib/buildFlatTreeGraph';
import useInfiniteTree from '../../hooks/useInfiniteTree';
import { useTheme } from '../../contexts/ThemeContext';

// Heuristic only — flags accounts that LOOK like company/system/main accounts so
// admin can verify before excluding them from rank. Never an automatic action.
const COMPANY_RX = /nogatu|company|alliance|corp(oration)?|admin|system|\bmain\b|holdings|enterprise/i;
function isLikelyCompany(node) {
  return COMPANY_RX.test(String(node?.username || '')) || COMPANY_RX.test(String(node?.fullname || ''));
}

const fmtInt = (n) => Number(n || 0).toLocaleString('en-US');

export default function AdminUnilevelTree() {
  const { isDarkMode } = useTheme();
  const reactFlowRef = useRef(null);
  const flowShellRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [canvasActive, setCanvasActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [searchUsername, setSearchUsername] = useState(searchParams.get('username') || '');

  const rootId = searchParams.get('id') || '';
  const rootUsername = searchParams.get('username') || '';
  const hasTarget = Boolean(rootId || rootUsername);

  // Infinite, cache-first load of the WHOLE sponsor subtree (no level selector).
  const cacheKey = rootId ? `id:${rootId}` : (rootUsername ? `user:${rootUsername}` : '');
  const url = rootId
    ? `/admin/genealogy/unilevel/flat?id=${encodeURIComponent(rootId)}`
    : (rootUsername ? `/admin/genealogy/unilevel/flat?username=${encodeURIComponent(rootUsername)}` : '');
  const { nodes: flatNodes, status, loading, refreshing, count } = useInfiniteTree({
    treeType: 'unilevel', cacheKey, url, enabled: hasTarget,
  });

  const chrome = getGenealogyTheme(isDarkMode);
  const panelStyle = { background: chrome.surfaceStrong, border: `1px solid ${chrome.surfaceBorder}`, backdropFilter: 'blur(18px)' };
  const insetCardStyle = { background: chrome.surface, border: `1px solid ${chrome.surfaceBorder}` };
  const neutralButtonStyle = { background: chrome.panelButtonBg, color: chrome.panelButtonText, border: `1px solid ${chrome.surfaceBorder}` };
  const amberButtonStyle = { background: chrome.amberButtonBg, color: chrome.amberButtonText, border: `1px solid ${chrome.amberBorder}` };

  useEffect(() => {
    function handleOutside(event) {
      if (!flowShellRef.current?.contains(event.target)) setCanvasActive(false);
    }
    function handleEscape(event) { if (event.key === 'Escape') setCanvasActive(false); }
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Native fullscreen of the canvas shell (immersive "full canvas" mode).
  useEffect(() => {
    function onChange() { setIsFullscreen(document.fullscreenElement === flowShellRef.current); }
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  async function toggleFullscreen() {
    if (!flowShellRef.current) return;
    try {
      if (document.fullscreenElement === flowShellRef.current) await document.exitFullscreen();
      else { await flowShellRef.current.requestFullscreen(); setCanvasActive(true); }
    } catch { /* fullscreen denied — ignore */ }
  }

  function setRoot(nextRoot) {
    setSearchUsername('');
    setSearchParams(nextRoot ? { id: String(nextRoot) } : {});
  }
  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = String(searchUsername || '').trim();
    if (!trimmed) return;
    setSearchParams({ username: trimmed });
  }
  function activateCanvas() { setCanvasActive(true); }

  // Render the WHOLE tree (root → deepest). The budget is only an extreme safety net
  // so a pathological 6-figure tree can't freeze the tab; normal company trees
  // (thousands) render in full. ReactFlow onlyRenderVisibleElements keeps it smooth.
  const built = useMemo(() => buildFlatTreeGraph(flatNodes, { renderBudget: 30000 }), [flatNodes]);
  const nodes = useMemo(() => built.nodes.map((n) => (
    n.type === 'memberNode'
      ? { ...n, data: { ...n.data, isDarkMode, canvasActive, onOpen: () => setRoot(n.id), onActivateCanvas: activateCanvas } }
      : n
    // eslint-disable-next-line react-hooks/exhaustive-deps
  )), [built, isDarkMode, canvasActive]);
  const edges = built.edges;

  useEffect(() => {
    if (!nodes.length) return undefined;
    const timer = setTimeout(() => {
      reactFlowRef.current?.fitView({ padding: 0.1, duration: 350, maxZoom: 1.2, minZoom: 0.12 });
    }, 80);
    return () => clearTimeout(timer);
  }, [built]);

  const nodeTypes = useMemo(() => ({ memberNode: MemberNode, junctionNode: JunctionNode }), []);
  const edgeTypes = useMemo(() => ({ treeEdge: TreeEdge }), []);

  const flaggedCount = useMemo(() => flatNodes.filter(isLikelyCompany).length, [flatNodes]);
  const rootNode = flatNodes.find((n) => n.parentUid == null) || null;
  const rootName = rootNode?.fullname || rootNode?.username || rootUsername || 'Account';

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
            Search any account to load its <strong>entire</strong> sponsor (drefid) downline — root to the deepest
            generation, no level limit. Each card shows the points that member passes up to its upline, so you can see
            who feeds the network. Click any node to recenter on its downline.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label htmlFor="uni-search" className="sr-only">Search account username</label>
          <input id="uni-search" type="text" value={searchUsername}
            onChange={(event) => setSearchUsername(event.target.value)}
            className="min-w-[260px] rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200"
            style={{ background: chrome.searchBg, color: chrome.searchText, border: `1px solid ${chrome.searchBorder}` }}
            placeholder="Type a username (e.g. a company account)" />
          <button type="submit" className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5" style={amberButtonStyle}>
            Open Tree
          </button>
          <button type="button" onClick={() => { setSearchUsername(''); setSearchParams({}); }}
            className="rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5" style={neutralButtonStyle}>
            Clear
          </button>
        </form>
      </div>

      {/* Toolbar */}
      <div className="relative flex flex-wrap items-center gap-2 rounded-2xl p-3" style={{ ...panelStyle, zIndex: 40 }}>
        <button type="button"
          onClick={() => reactFlowRef.current?.fitView({ padding: 0.1, duration: 350, maxZoom: 1.2, minZoom: 0.12 })}
          className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold" style={neutralButtonStyle}>
          <HiOutlineRefresh className="size-4" /> Fit View
        </button>
        {rootId && (
          <button type="button" onClick={() => setSearchParams({})}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold" style={neutralButtonStyle}>
            <HiOutlineHome className="size-4" /> Clear Root
          </button>
        )}
        {refreshing && (
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ background: 'rgba(212,175,55,0.14)', color: chrome.amberButtonText, border: `1px solid ${chrome.amberBorder}` }}>
            <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Updating from live data…
          </span>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-3 text-xs" style={{ color: chrome.tertiary }}>
          <span>Root: <span className="font-semibold" style={{ color: chrome.heading }}>{rootName}</span></span>
          <span>Accounts: <span className="font-semibold" style={{ color: chrome.heading }}>{fmtInt(count)}</span></span>
          {built.truncated && (
            <span className="rounded-full px-2.5 py-1 font-semibold"
              style={{ background: 'rgba(251,146,60,0.14)', color: isDarkMode ? '#FED7AA' : '#C2410C', border: '1px solid rgba(251,146,60,0.28)' }}
              title={`Canvas renders ${fmtInt(built.rendered)} of ${fmtInt(built.total)} for performance. All ${fmtInt(built.total)} accounts are in the list →. Click a node to go deeper.`}>
              Canvas: {fmtInt(built.rendered)} / {fmtInt(built.total)}
            </span>
          )}
          {flaggedCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold"
              style={{ background: 'rgba(248,113,113,0.12)', color: isDarkMode ? '#FCA5A5' : '#B91C1C', border: '1px solid rgba(248,113,113,0.25)' }}>
              <HiOutlineOfficeBuilding className="size-3.5" /> {fmtInt(flaggedCount)} flagged
            </span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!hasTarget && (
        <div className="rounded-3xl p-10 text-center" style={panelStyle}>
          <HiOutlineUserGroup className="mx-auto mb-4 size-10" style={{ color: chrome.emptyIcon }} />
          <h2 className="font-display text-xl font-semibold" style={{ color: chrome.heading }}>Open a unilevel tree</h2>
          <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: chrome.subtext }}>
            Search a username above (for example, a company/main account) to inspect its full unilevel network.
          </p>
        </div>
      )}

      {hasTarget && (
        <div className={isFullscreen ? 'block' : 'grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]'}>
          {/* Canvas */}
          <div ref={flowShellRef} className={`relative overflow-hidden ${isFullscreen ? 'rounded-none' : 'rounded-2xl'}`}
            style={{ ...panelStyle, height: isFullscreen ? '100vh' : '70vh', zIndex: 0 }}>
            {/* Floating control cluster (Google-Stitch style — works in & out of fullscreen) */}
            <div className="absolute left-3 top-3 z-30 flex flex-wrap items-center gap-2">
              <button type="button"
                onClick={() => reactFlowRef.current?.fitView({ padding: 0.1, duration: 350, maxZoom: 1.2, minZoom: 0.06 })}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur"
                style={{ background: chrome.surfaceStrong, color: chrome.panelButtonText, border: `1px solid ${chrome.surfaceBorder}` }}>
                <HiOutlineRefresh className="size-4" /> Fit
              </button>
              <button type="button" onClick={toggleFullscreen}
                className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur"
                style={{ background: chrome.amberButtonBg, color: chrome.amberButtonText, border: `1px solid ${chrome.amberBorder}` }}>
                {isFullscreen ? <HiOutlineMinusSm className="size-4" /> : <HiOutlineArrowsExpand className="size-4" />}
                {isFullscreen ? 'Exit' : 'Full screen'}
              </button>
              {isFullscreen && (
                <span className="rounded-xl px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur"
                  style={{ background: chrome.surfaceStrong, color: chrome.heading, border: `1px solid ${chrome.surfaceBorder}` }}>
                  {rootName} • {fmtInt(count)} accounts
                </span>
              )}
              {refreshing && (
                <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold shadow-lg backdrop-blur"
                  style={{ background: 'rgba(212,175,55,0.14)', color: chrome.amberButtonText, border: `1px solid ${chrome.amberBorder}` }}>
                  <span className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent" /> Live sync…
                </span>
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
            {status === 'error' && (
              <div className="absolute inset-0 z-20 flex items-center justify-center text-sm" style={{ color: chrome.tertiary }}>
                Could not load that account’s tree. Try another username.
              </div>
            )}
            {!loading && status !== 'error' && nodes.length === 0 && (
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

          {/* Side panel — full account list with points-to-upline + company flags */}
          <div className="flex min-h-0 flex-col rounded-2xl p-5" style={panelStyle}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-semibold" style={{ color: chrome.heading }}>Accounts in tree</h2>
              <span className="rounded-full px-2.5 py-1 text-xs font-semibold" style={amberButtonStyle}>{fmtInt(flatNodes.length)}</span>
            </div>
            <p className="mt-1 text-xs" style={{ color: chrome.tertiary }}>
              Every account in the tree (full list, even beyond the canvas budget). Shows the points each passes up to
              its upline; likely company/system accounts are flagged — verify before excluding from rank.
            </p>

            <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
              {loading && (
                <div className="rounded-2xl p-6 text-center" style={insetCardStyle}>
                  <Spinner /><p className="mt-2 text-xs" style={{ color: chrome.tertiary }}>Loading full tree…</p>
                </div>
              )}
              {!loading && flatNodes.length === 0 && status !== 'error' && (
                <div className="rounded-2xl p-6 text-center" style={insetCardStyle}>
                  <HiOutlineUsers className="mx-auto mb-2 size-7" style={{ color: chrome.emptyIcon }} />
                  <p className="text-sm" style={{ color: chrome.tertiary }}>No accounts loaded yet.</p>
                </div>
              )}
              {flatNodes.map((node) => {
                const flagged = isLikelyCompany(node);
                return (
                  <button key={`${node.uid}-${node.depth}`} type="button"
                    onClick={() => setRoot(node.publicUid || node.uid)}
                    className="w-full rounded-xl p-3 text-left transition-all duration-200 hover:-translate-y-0.5"
                    style={{ ...insetCardStyle, ...(flagged ? { border: '1px solid rgba(248,113,113,0.4)' } : {}) }}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="flex items-center gap-1.5 truncate text-sm font-semibold" style={{ color: chrome.heading }}>
                          {flagged && <HiOutlineOfficeBuilding className="size-3.5 flex-shrink-0" style={{ color: isDarkMode ? '#FCA5A5' : '#B91C1C' }} />}
                          {node.fullname || node.username || `Member ${node.uid}`}
                        </p>
                        <p className="mt-0.5 truncate text-[11px]" style={{ color: chrome.tertiary }}>
                          {node.username || `uid ${node.uid}`} • {node.accttypeName || 'Bronze'} • L{node.depth}
                        </p>
                      </div>
                      <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={amberButtonStyle}>{node.accountStateLabel || 'PD'}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                      <span style={{ color: chrome.tertiary }}>Pts passed to upline</span>
                      <span className="font-semibold tabular-nums"
                        style={{ color: Number(node.pointsToUpline) > 0 ? (isDarkMode ? '#86EFAC' : '#166534') : chrome.tertiary }}>
                        {fmtInt(node.pointsToUpline || 0)}
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
