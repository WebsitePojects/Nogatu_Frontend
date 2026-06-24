import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  HiOutlineArrowsExpand,
  HiOutlineClipboardList,
  HiOutlineDownload,
  HiOutlineHome,
  HiOutlineMinusSm,
  HiOutlineOfficeBuilding,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineUserGroup,
  HiOutlineUsers,
  HiOutlineX,
} from 'react-icons/hi';
import {
  Spinner,
  MemberNode,
  JunctionNode,
  TreeEdge,
} from '../../components/genealogyTreeUi';
import api from '../../api';
import { getGenealogyTheme, NODE_WIDTH, NODE_HEIGHT } from '../../components/genealogyTreeUiUtils';
import { buildFlatTreeGraph, expandPathTo } from '../../lib/buildFlatTreeGraph';
import useInfiniteTree from '../../hooks/useInfiniteTree';
import { useTheme } from '../../contexts/ThemeContext';
import { exportUnilevelXlsx } from '../../lib/unilevelXlsx';
import { MAINTENANCE_PRODUCTS } from '../../constants/maintenanceProducts';

const PRODUCT_BY_CODE = Object.fromEntries(MAINTENANCE_PRODUCTS.map((product) => [Number(product.code), product]));
const productName = (type) => PRODUCT_BY_CODE[Number(type)]?.name || `Product ${type}`;

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
  const [expanded, setExpanded] = useState(() => new Set()); // explicitly opened deep branches
  const [treeSearch, setTreeSearch] = useState(''); // in-tree name/username filter
  const [excludedUids, setExcludedUids] = useState(() => new Set()); // rank-excluded accounts
  const [savingExclusion, setSavingExclusion] = useState(0);

  // Unilevel Points Entry History (per-entry repurchase points feeding this account).
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyExporting, setHistoryExporting] = useState(false);

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

  // Toggle a deep branch open/closed (progressive loading along the trail).
  function toggleExpand(uid) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(uid)) next.delete(uid); else next.add(uid);
      return next;
    });
  }

  // Search "jump to": expand the path to a member and center the canvas on them.
  function jumpTo(node) {
    const path = expandPathTo(flatNodes, node.uid);
    setExpanded((prev) => { const next = new Set(prev); path.forEach((u) => next.add(u)); return next; });
    setCanvasActive(true);
    const id = String(node.publicUid || node.uid);
    setTimeout(() => {
      const rf = reactFlowRef.current;
      const target = rf?.getNode?.(id);
      if (target) rf.setCenter(target.position.x + NODE_WIDTH / 2, target.position.y + NODE_HEIGHT / 2, { zoom: 0.85, duration: 500 });
    }, 160);
  }

  // Reset expansion + in-tree search whenever a different account tree is loaded.
  useEffect(() => { setExpanded(new Set()); setTreeSearch(''); }, [cacheKey]);

  // Load the current rank-exclusion list once.
  useEffect(() => {
    let cancelled = false;
    api.get('/admin/genealogy/rank-exclusions')
      .then((res) => { if (!cancelled) setExcludedUids(new Set((res.data.excludedUids || []).map(Number))); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  async function toggleExclusion(node) {
    const uid = Number(node.uid);
    const nextExcluded = !excludedUids.has(uid);
    setSavingExclusion(uid);
    try {
      await api.post('/admin/genealogy/rank-exclusion', {
        uid, excluded: nextExcluded, reason: nextExcluded ? 'Company/system account' : '',
      });
      setExcludedUids((prev) => { const n = new Set(prev); if (nextExcluded) n.add(uid); else n.delete(uid); return n; });
    } catch { /* surfaced by axios interceptor */ } finally {
      setSavingExclusion(0);
    }
  }

  // Root identity — declared before the history/export functions that close over it.
  const rootNode = flatNodes.find((n) => n.parentUid == null) || null;
  const rootName = rootNode?.fullname || rootNode?.username || rootUsername || 'Account';

  // ── Unilevel Points Entry History ──────────────────────────────────────────
  // Query keyed to the SAME root the canvas shows (id wins, else username).
  const historyParam = rootId
    ? `id=${encodeURIComponent(rootId)}`
    : (rootUsername ? `username=${encodeURIComponent(rootUsername)}` : '');

  async function loadPointsHistory(page = 1) {
    if (!historyParam) return;
    setHistoryLoading(true);
    try {
      const res = await api.get(`/admin/genealogy/unilevel/points-history?${historyParam}&page=${page}&perPage=50`);
      setHistoryData(res.data);
    } catch {
      setHistoryData({ rows: [], total: 0, totalPoints: 0, page: 1, totalPages: 1 });
    } finally {
      setHistoryLoading(false);
    }
  }

  function openHistory() {
    if (!historyParam) return;
    setHistoryOpen(true);
    setHistoryData(null);
    loadPointsHistory(1);
  }

  // Export ALL entries (not just the visible page): loop pages until drained, capped.
  async function exportHistory() {
    if (!historyParam) return;
    setHistoryExporting(true);
    try {
      const all = [];
      let page = 1;
      let totalPoints = 0;
      let total = 0;
      const HARD_CAP = 20000;
      // eslint-disable-next-line no-constant-condition
      while (true) {
        // eslint-disable-next-line no-await-in-loop
        const res = await api.get(`/admin/genealogy/unilevel/points-history?${historyParam}&page=${page}&perPage=200`);
        const data = res.data || {};
        totalPoints = Number(data.totalPoints || totalPoints);
        total = Number(data.total || total);
        (data.rows || []).forEach((r) => all.push({ ...r, productName: productName(r.productType) }));
        if (all.length >= total || (data.rows || []).length === 0 || all.length >= HARD_CAP) break;
        page += 1;
      }
      await exportUnilevelXlsx({
        account: { name: rootName, username: rootNode?.username || rootUsername },
        totalPoints,
        total,
        rows: all,
      });
    } catch { /* surfaced by axios interceptor */ } finally {
      setHistoryExporting(false);
    }
  }

  // Render the WHOLE tree (root → deepest). The budget is only an extreme safety net
  // so a pathological 6-figure tree can't freeze the tab; normal company trees
  // (thousands) render in full. ReactFlow onlyRenderVisibleElements keeps it smooth.
  // Progressive render: only the open trail is laid out (first 2 levels + expanded
  // branches). Clicking a collapsed node loads the next level — fast even at 100k.
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
      const rf = reactFlowRef.current;
      if (!rf) return;
      // Focus on load = center on the searched/root account itself (level 0), not
      // a fit of the whole tree — so the viewer lands on who they looked up.
      const rootNode = built.nodes.find((n) => n.type === 'memberNode' && Number(n.data?.level) === 0)
        || built.nodes.find((n) => n.type === 'memberNode');
      const target = rootNode?.id ? rf.getNode?.(rootNode.id) : null;
      if (target) {
        rf.setCenter(target.position.x + NODE_WIDTH / 2, target.position.y + NODE_HEIGHT / 2, { zoom: 0.8, duration: 400 });
      } else {
        rf.fitView({ padding: 0.1, duration: 350, maxZoom: 1.2, minZoom: 0.12 });
      }
    }, 80);
    return () => clearTimeout(timer);
    // only refocus when the tree (root) changes, not on every expand
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  const nodeTypes = useMemo(() => ({ memberNode: MemberNode, junctionNode: JunctionNode }), []);
  const edgeTypes = useMemo(() => ({ treeEdge: TreeEdge }), []);

  // Side list / search: never render thousands of DOM cards — filter + cap.
  const listResults = useMemo(() => {
    const q = treeSearch.trim().toLowerCase();
    const base = q
      ? flatNodes.filter((n) => `${n.username || ''} ${n.fullname || ''}`.toLowerCase().includes(q))
      : flatNodes;
    return base.slice(0, 120);
  }, [flatNodes, treeSearch]);

  const flaggedCount = useMemo(() => flatNodes.filter(isLikelyCompany).length, [flatNodes]);

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
        {hasTarget && (
          <button type="button" onClick={openHistory}
            className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold" style={amberButtonStyle}>
            <HiOutlineClipboardList className="size-4" /> Points Entry History
          </button>
        )}
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

            {/* Fullscreen-only search: the sidebar list is hidden in fullscreen, so
                surface a compact search-and-jump here (expands path + centers). */}
            {isFullscreen && (
              <div className="absolute left-3 top-3 z-20 w-72">
                <div className="relative">
                  <HiOutlineSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: chrome.tertiary }} />
                  <input type="text" value={treeSearch} onChange={(e) => setTreeSearch(e.target.value)}
                    placeholder="Search this tree…"
                    className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none shadow-lg backdrop-blur"
                    style={{ background: chrome.surfaceStrong, color: chrome.heading, border: `1px solid ${chrome.surfaceBorder}` }} />
                </div>
                {treeSearch.trim() && (
                  <div className="mt-1 max-h-72 overflow-y-auto rounded-xl shadow-xl backdrop-blur"
                    style={{ background: chrome.surfaceStrong, border: `1px solid ${chrome.surfaceBorder}` }}>
                    {listResults.length === 0 && (
                      <div className="px-3 py-2 text-xs" style={{ color: chrome.tertiary }}>No match in this tree.</div>
                    )}
                    {listResults.map((node) => (
                      <button key={node.uid} type="button" onClick={() => jumpTo(node)}
                        className="block w-full px-3 py-2 text-left text-xs transition-colors hover:bg-white/10"
                        style={{ color: chrome.heading }}>
                        <span className="font-semibold">{node.fullname || node.username}</span>
                        <span className="ml-1" style={{ color: chrome.tertiary }}>@{node.username}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

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
              Search by name or username to jump to anyone in this tree (expands the path + centers).
              Shows the points each passes up to its upline; likely company/system accounts are flagged.
            </p>

            {/* In-tree search */}
            <div className="relative mt-3">
              <HiOutlineSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: chrome.tertiary }} />
              <input type="text" value={treeSearch} onChange={(e) => setTreeSearch(e.target.value)}
                placeholder="Find a name or username in this tree…"
                className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none"
                style={{ background: chrome.searchBg, color: chrome.searchText, border: `1px solid ${chrome.searchBorder}` }} />
            </div>
            <p className="mt-2 text-[11px]" style={{ color: chrome.tertiary }}>
              {treeSearch.trim()
                ? `${fmtInt(listResults.length)} match${listResults.length === 1 ? '' : 'es'}${listResults.length >= 120 ? '+ (refine)' : ''}`
                : `Showing first ${fmtInt(listResults.length)} of ${fmtInt(flatNodes.length)} — type to search`}
            </p>

            <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
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
              {!loading && treeSearch.trim() && listResults.length === 0 && (
                <p className="px-1 py-4 text-center text-xs" style={{ color: chrome.tertiary }}>No match in this tree.</p>
              )}
              {listResults.map((node) => {
                const flagged = isLikelyCompany(node);
                const excluded = excludedUids.has(Number(node.uid));
                return (
                  <div key={`${node.uid}-${node.depth}`} className="rounded-xl"
                    style={{ ...insetCardStyle, ...((flagged || excluded) ? { border: `1px solid rgba(248,113,113,${excluded ? 0.7 : 0.4})` } : {}) }}>
                  <button type="button" onClick={() => jumpTo(node)}
                    className="w-full rounded-t-xl p-3 text-left transition-all duration-200">
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
                    {flagged && !excluded && (
                      <p className="mt-2 rounded-lg px-2 py-1 text-[10px] font-medium"
                        style={{ background: 'rgba(248,113,113,0.10)', color: isDarkMode ? '#FCA5A5' : '#B91C1C' }}>
                        Possible company/system account — verify before rank exclusion
                      </p>
                    )}
                  </button>
                  {/* Rank-exclusion toggle — blocks this account from ranking/consuming points */}
                  <div className="flex items-center justify-between gap-2 border-t px-3 py-2" style={{ borderColor: chrome.surfaceBorder }}>
                    <span className="text-[10px] font-semibold"
                      style={{ color: excluded ? (isDarkMode ? '#FCA5A5' : '#B91C1C') : chrome.tertiary }}>
                      {excluded ? '⛔ Rank-excluded — cannot consume points' : 'Eligible to rank'}
                    </span>
                    <button type="button" onClick={() => toggleExclusion(node)} disabled={savingExclusion === node.uid}
                      className="rounded-lg px-2 py-1 text-[10px] font-semibold disabled:opacity-50"
                      style={excluded
                        ? { background: chrome.panelButtonBg, color: chrome.panelButtonText, border: `1px solid ${chrome.surfaceBorder}` }
                        : { background: 'rgba(248,113,113,0.14)', color: isDarkMode ? '#FCA5A5' : '#B91C1C', border: '1px solid rgba(248,113,113,0.35)' }}>
                      {savingExclusion === node.uid ? '…' : (excluded ? 'Allow rank' : 'Exclude from rank')}
                    </button>
                  </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Unilevel Points Entry History modal */}
      {historyOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}>
          <div className="flex max-h-[88vh] w-full max-w-4xl flex-col rounded-3xl shadow-2xl" style={panelStyle}>
            <div className="flex items-start justify-between gap-4 p-6 pb-4">
              <div>
                <h2 className="font-display text-xl font-semibold flex items-center gap-2" style={{ color: chrome.heading }}>
                  <HiOutlineClipboardList className="size-5" style={{ color: '#D4AF37' }} />
                  Unilevel Points Entry History
                </h2>
                <p className="mt-1 text-sm" style={{ color: chrome.subtext }}>
                  Every repurchase entry from <span className="font-semibold" style={{ color: chrome.heading }}>{rootName}</span>’s sponsor downline — the events that sum into its points passed to upline.
                </p>
              </div>
              <button type="button" onClick={() => setHistoryOpen(false)} className="p-1" style={{ color: chrome.tertiary }} aria-label="Close history">
                <HiOutlineX className="size-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 px-6 sm:grid-cols-3">
              <div className="rounded-2xl p-4" style={insetCardStyle}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: chrome.tertiary }}>Total Points to Upline</p>
                <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: isDarkMode ? '#86EFAC' : '#166534' }}>{fmtInt(historyData?.totalPoints || 0)}</p>
              </div>
              <div className="rounded-2xl p-4" style={insetCardStyle}>
                <p className="text-[10px] uppercase tracking-wider" style={{ color: chrome.tertiary }}>Total Entries</p>
                <p className="mt-1 text-lg font-bold tabular-nums" style={{ color: chrome.heading }}>{fmtInt(historyData?.total || 0)}</p>
              </div>
              <div className="col-span-2 flex items-center sm:col-span-1">
                <button type="button" onClick={exportHistory} disabled={historyExporting || !(historyData?.total > 0)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs font-semibold disabled:opacity-50" style={amberButtonStyle}>
                  <HiOutlineDownload className="size-4" /> {historyExporting ? 'Exporting…' : 'Export .xlsx'}
                </button>
              </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-auto px-6 pb-2">
              {historyLoading ? (
                <div className="flex justify-center py-12"><Spinner /></div>
              ) : !(historyData?.rows?.length) ? (
                <div className="rounded-2xl p-10 text-center" style={insetCardStyle}>
                  <HiOutlineClipboardList className="mx-auto mb-2 size-7" style={{ color: chrome.emptyIcon }} />
                  <p className="text-sm" style={{ color: chrome.tertiary }}>No maintenance/repurchase entries in this downline yet.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      {['Date', 'Source Member', 'Level', 'Product', 'Points'].map((h) => (
                        <th key={h} className="sticky top-0 p-2.5 text-left text-[11px] font-semibold uppercase tracking-wide"
                          style={{ background: chrome.surfaceStrong, color: chrome.tertiary }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {historyData.rows.map((r) => (
                      <tr key={r.id} className="border-t" style={{ borderColor: chrome.surfaceBorder }}>
                        <td className="p-2.5 text-xs" style={{ color: chrome.tertiary }}>{r.date || '-'}</td>
                        <td className="p-2.5" style={{ color: chrome.heading }}>
                          <div className="font-medium">{r.fullName || '-'}</div>
                          <div className="text-[11px]" style={{ color: chrome.tertiary }}>@{r.username || `uid ${r.sourceUid}`}</div>
                        </td>
                        <td className="p-2.5 text-xs tabular-nums" style={{ color: chrome.tertiary }}>L{r.depth}</td>
                        <td className="p-2.5 text-xs" style={{ color: chrome.subtext }}>{productName(r.productType)}</td>
                        <td className="p-2.5 text-right font-semibold tabular-nums" style={{ color: isDarkMode ? '#86EFAC' : '#166534' }}>{fmtInt(r.points)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex items-center justify-between gap-2 border-t p-4" style={{ borderColor: chrome.surfaceBorder }}>
              <span className="text-xs" style={{ color: chrome.tertiary }}>
                Page {fmtInt(historyData?.page || 1)} / {fmtInt(historyData?.totalPages || 1)}
              </span>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => loadPointsHistory((historyData?.page || 1) - 1)}
                  disabled={historyLoading || (historyData?.page || 1) <= 1}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40" style={neutralButtonStyle}>Prev</button>
                <button type="button" onClick={() => loadPointsHistory((historyData?.page || 1) + 1)}
                  disabled={historyLoading || (historyData?.page || 1) >= (historyData?.totalPages || 1)}
                  className="rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-40" style={neutralButtonStyle}>Next</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
