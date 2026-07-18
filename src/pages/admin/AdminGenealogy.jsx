import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  HiOutlineArrowsExpand, HiOutlineChevronDown, HiOutlineCode, HiOutlineDocumentText,
  HiOutlineDownload, HiOutlineHome, HiOutlineMinusSm, HiOutlinePhotograph, HiOutlineRefresh,
  HiOutlineSearch, HiOutlineTable, HiOutlineUsers,
} from 'react-icons/hi';
import {
  Spinner, MemberNode, JunctionNode, PlaceholderNode, TreeEdge,
} from '../../components/genealogyTreeUi';
import {
  exportNetworkAsDocx, exportNetworkAsCsv, exportTreeAsJpeg, exportTreeAsPng, exportTreeAsSvg,
  fmtInt, getAccountStateChipStyle, getGenealogyTheme, legLabel,
  NODE_HEIGHT, NODE_WIDTH, PACKAGE_STYLES,
} from '../../components/genealogyTreeUiUtils';
import { buildFlatTreeGraph, ORDER_BINARY, rootSubtreeAt } from '../../lib/buildFlatTreeGraph';
import BinaryDrill from '../../components/BinaryDrill';
import useInfiniteTree from '../../hooks/useInfiniteTree';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api';

export default function AdminGenealogy() {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const reactFlowRef = useRef(null);
  const flowShellRef = useRef(null);
  const canvasDivRef = useRef(null);
  const exportDropdownRef = useRef(null);

  const [searchParams, setSearchParams] = useSearchParams();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasActive, setCanvasActive] = useState(false);
  const [canvasRootUid, setCanvasRootUid] = useState(null); // re-root target for Tree View; null = the searched account
  const [searchUsername, setSearchUsername] = useState(searchParams.get('username') || '');
  const [treeSearch, setTreeSearch] = useState('');
  const [exportingFormat, setExportingFormat] = useState(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' (15-node drill) | 'sponsor' (unilevel levels) | 'tree' (canvas)

  const rootId = searchParams.get('id') || '';
  const rootUsername = searchParams.get('username') || '';
  const hasTarget = Boolean(rootId || rootUsername);
  const cacheKey = rootId ? `id:${rootId}` : (rootUsername ? `user:${rootUsername}` : '');
  const url = rootId
    ? `/admin/genealogy/binary/flat?id=${encodeURIComponent(rootId)}`
    : (rootUsername ? `/admin/genealogy/binary/flat?username=${encodeURIComponent(rootUsername)}` : '');
  const reconcileUrl = rootId
    ? `/admin/genealogy/pairing-reconcile?id=${encodeURIComponent(rootId)}`
    : (rootUsername ? `/admin/genealogy/pairing-reconcile?username=${encodeURIComponent(rootUsername)}` : '');
  const { nodes: flatNodes, payload, status, loading, refreshing, count } = useInfiniteTree({
    treeType: 'binary', cacheKey, url, enabled: hasTarget,
  });
  // The searched account's OWN sponsor — served by the backend alongside the binary
  // flat payload (subtree nodes can't carry it; the root's parentUid is nulled).
  // Null until the backend ships the field or when the account has no sponsor.
  const rootSponsor = payload?.rootSponsor || null;
  // Sponsor (drefid) lookup: the binary flat payload carries no sponsor data, so we
  // separately pull the unilevel tree (where parentUid IS the sponsor) rooted at the
  // same account and derive a uid → sponsor map from it. treeStore.js namespaces its
  // IndexedDB cache by treeType, so reusing cacheKey here is safe (no collision with
  // the binary cache above).
  const unilevelUrl = rootId
    ? `/admin/genealogy/unilevel/flat?id=${encodeURIComponent(rootId)}`
    : (rootUsername ? `/admin/genealogy/unilevel/flat?username=${encodeURIComponent(rootUsername)}` : '');
  const { nodes: unilevelNodes } = useInfiniteTree({
    treeType: 'unilevel', cacheKey, url: unilevelUrl, enabled: hasTarget,
  });
  const sponsorByUid = useMemo(() => {
    const names = new Map();
    for (const n of flatNodes) names.set(Number(n.uid), n);
    for (const n of unilevelNodes) if (!names.has(Number(n.uid))) names.set(Number(n.uid), n);
    const map = new Map();
    for (const n of unilevelNodes) {
      if (n.parentUid == null) continue;
      const s = names.get(Number(n.parentUid));
      map.set(Number(n.uid), { uid: Number(n.parentUid), username: s?.username || null, fullname: s?.fullname || null });
    }
    // The searched root itself: its sponsor lives outside every payload's subtree,
    // so inject the backend-provided rootSponsor — BinaryDrill rows and the side
    // list then resolve the root like any other member.
    if (rootSponsor) {
      const rn = flatNodes.find((n) => n.parentUid == null);
      if (rn) map.set(Number(rn.uid), { uid: rootSponsor.uid, username: rootSponsor.username || null, fullname: rootSponsor.fullname || null });
    }
    return map;
  }, [flatNodes, unilevelNodes, rootSponsor]);

  const chrome = getGenealogyTheme(isDarkMode);
  const panelStyle = { background: chrome.surfaceStrong, border: `1px solid ${chrome.surfaceBorder}`, backdropFilter: 'blur(18px)' };
  const insetCardStyle = { background: chrome.surface, border: `1px solid ${chrome.surfaceBorder}` };
  const neutralButtonStyle = { background: chrome.panelButtonBg, color: chrome.panelButtonText, border: `1px solid ${chrome.surfaceBorder}` };
  const amberButtonStyle = { background: chrome.amberButtonBg, color: chrome.amberButtonText, border: `1px solid ${chrome.amberBorder}` };

  useEffect(() => {
    function onFs() { setIsFullscreen(document.fullscreenElement === flowShellRef.current); }
    function onPointer(e) {
      if (!flowShellRef.current?.contains(e.target)) setCanvasActive(false);
      if (!exportDropdownRef.current?.contains(e.target)) setExportDropdownOpen(false);
    }
    function onEsc(e) { if (e.key === 'Escape') { setCanvasActive(false); setExportDropdownOpen(false); } }
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);
  useEffect(() => { setCanvasRootUid(null); setTreeSearch(''); }, [cacheKey]);

  function activateCanvas() { setCanvasActive(true); }
  async function toggleFullscreen() {
    if (!flowShellRef.current) return;
    try {
      if (document.fullscreenElement === flowShellRef.current) await document.exitFullscreen();
      else { await flowShellRef.current.requestFullscreen(); setCanvasActive(true); }
    } catch { /* denied */ }
  }
  function resetView() { reactFlowRef.current?.fitView({ padding: 0.08, duration: 350, maxZoom: 1.32, minZoom: 0.06 }); }
  function handleSearchSubmit(e) { e.preventDefault(); const t = searchUsername.trim(); if (t) setSearchParams({ username: t }); }
  function jumpTo(node) {
    setCanvasRootUid(Number(node.uid) === Number(rootNode?.uid) ? null : Number(node.uid));
    setViewMode('tree');
    setCanvasActive(true);
  }

  // byUidMap indexes the FULL binary flat list (not the re-rooted window) so the
  // "walk up 3 levels" click handler below can always resolve real ancestors even
  // when the canvas is currently re-rooted deep in the tree.
  const byUidMap = useMemo(() => new Map(flatNodes.map((n) => [Number(n.uid), n])), [flatNodes]);
  const rootNode = flatNodes.find((n) => n.parentUid == null) || null;

  // Tree View: a 15-node window (root + 3 levels) re-rooted at canvasRootUid (null =
  // the searched account) — same re-root pattern as the member page's "Binary Tree"
  // tab. Clicking the window root walks 3 levels up; clicking any other member
  // re-roots down to them.
  const built = useMemo(
    () => buildFlatTreeGraph(rootSubtreeAt(flatNodes, canvasRootUid), { renderBudget: 60000, orderBy: ORDER_BINARY, expandAll: false, initialDepth: 3, withPlaceholders: true, metricAsPv: true }),
    [flatNodes, canvasRootUid],
  );
  function registerIntoSlot(d) {
    const params = new URLSearchParams({
      placement: String(d.parentUid || ''),
      position: String(d.position || 1),
      placementUser: String(d.parentUsername || ''),
      placementLabel: `${d.positionLabel} of ${d.parentUsername || `UID ${d.parentUid}`}`,
    });
    navigate(`/register?${params.toString()}`);
  }
  const nodes = useMemo(() => built.nodes.map((n) => {
    if (n.type === 'placeholderNode') {
      return { ...n, data: { ...n.data, isDarkMode, canvasActive, onActivateCanvas: activateCanvas, placeholderCta: 'Register here', placeholderHint: 'Manually encode a new member into this open binary slot.', onRegister: () => registerIntoSlot(n.data) } };
    }
    let positionLabel = n.data.position ? legLabel(n.data.position === 'right' ? 2 : 1) : n.data.positionLabel;
    let onOpen;
    if (n.data.level === 0) {
      // Window root: walk UP to 3 real ancestors (via the full-tree byUidMap, since
      // rootSubtreeAt nulled this copy's parentUid), re-rooting there. 0 ancestors
      // found (already at the searched account) → no-op.
      let cur = byUidMap.get(Number(n.data.uid));
      let steps = 0;
      while (steps < 3 && cur && cur.parentUid != null) { cur = byUidMap.get(Number(cur.parentUid)); steps += 1; }
      if (steps === 0) {
        onOpen = () => {};
      } else {
        const targetUid = cur && Number(cur.uid) !== Number(rootNode?.uid) ? Number(cur.uid) : null;
        onOpen = () => setCanvasRootUid(targetUid);
        positionLabel = 'Root · tap to go up';
      }
    } else {
      onOpen = () => setCanvasRootUid(Number(n.data.uid));
    }
    return { ...n, data: { ...n.data, isDarkMode, canvasActive, positionLabel, onOpen, onActivateCanvas: activateCanvas } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [built, isDarkMode, canvasActive, byUidMap, rootNode]);
  const edges = built.edges;

  useEffect(() => {
    if (!built.nodes.length) return undefined;
    const timer = setTimeout(resetView, 80);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, canvasRootUid]);

  const nodeTypes = useMemo(() => ({ memberNode: MemberNode, junctionNode: JunctionNode, placeholderNode: PlaceholderNode }), []);
  const edgeTypes = useMemo(() => ({ treeEdge: TreeEdge }), []);

  const networkForExport = useMemo(
    () => flatNodes.filter((n) => n.parentUid != null).map((n) => ({ ...n, leg: n.position, binaryPoints: n.pointsToUpline })),
    [flatNodes],
  );
  const listResults = useMemo(() => {
    const q = treeSearch.trim().toLowerCase();
    const base = q ? flatNodes.filter((n) => `${n.username || ''} ${n.fullname || ''}`.toLowerCase().includes(q)) : flatNodes;
    return base.slice(0, 120);
  }, [flatNodes, treeSearch]);
  const rootName = rootNode?.fullname || rootNode?.username || rootUsername || 'Account';

  async function runExport(format, fn) {
    if (exportingFormat) return;
    setExportDropdownOpen(false); setExportingFormat(format);
    try { await fn(); } catch { /* retry */ } finally { setExportingFormat(null); }
  }
  const fileBase = `admin_genealogy_${rootNode?.username || rootUsername || 'tree'}`;
  const exportItems = [
    { key: 'png', label: 'PNG', Icon: HiOutlinePhotograph, run: () => runExport('png', () => exportTreeAsPng(reactFlowRef.current, canvasDivRef.current, fileBase, isDarkMode)) },
    { key: 'jpeg', label: 'JPEG', Icon: HiOutlinePhotograph, run: () => runExport('jpeg', () => exportTreeAsJpeg(reactFlowRef.current, canvasDivRef.current, fileBase, isDarkMode)) },
    { key: 'svg', label: 'SVG Vector', Icon: HiOutlineCode, run: () => runExport('svg', () => exportTreeAsSvg(reactFlowRef.current, canvasDivRef.current, fileBase, isDarkMode)) },
    { key: 'csv', label: 'CSV Spreadsheet', Icon: HiOutlineTable, run: () => runExport('csv', () => exportNetworkAsCsv(networkForExport, rootName, 0)) },
    { key: 'docx', label: 'DOCX Report', Icon: HiOutlineDocumentText, run: () => runExport('docx', () => exportNetworkAsDocx(networkForExport, rootName, 0, true)) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: chrome.heading }}>Account Genealogy</h1>
          <div className="mt-2 h-0.5 w-12 rounded-full" style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
          <p className="mt-3 max-w-2xl text-sm" style={{ color: chrome.subtext }}>
            Open any account's full binary network — root to the deepest generation, no level limit. Search within the
            tree to jump to anyone.
          </p>
        </div>
        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input type="text" value={searchUsername} onChange={(e) => setSearchUsername(e.target.value)}
            className="min-w-[260px] rounded-xl px-4 py-2.5 text-sm outline-none"
            style={{ background: chrome.searchBg, color: chrome.searchText, border: `1px solid ${chrome.searchBorder}` }}
            placeholder="Type a username to open its tree" />
          <button type="submit" className="rounded-xl px-4 py-2.5 text-sm font-semibold hover:-translate-y-0.5" style={amberButtonStyle}>Open Tree</button>
          <button type="button" onClick={() => { setSearchUsername(''); setSearchParams({}); }} className="rounded-xl px-3.5 py-2 text-sm font-semibold hover:-translate-y-0.5" style={neutralButtonStyle}>Clear</button>
        </form>
      </div>

      {!hasTarget ? (
        <div className="rounded-3xl p-10 text-center" style={panelStyle}>
          <HiOutlineUsers className="mx-auto mb-4 size-10" style={{ color: chrome.emptyIcon }} />
          <h2 className="font-display text-xl font-semibold" style={{ color: chrome.heading }}>Open an account tree</h2>
          <p className="mx-auto mt-3 max-w-md text-sm" style={{ color: chrome.subtext }}>Search a username above to inspect that member’s binary network.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          {/* Canvas column: List (drill) / Tree (canvas) */}
          <div className="min-w-0 space-y-3">
            <div className="inline-flex overflow-hidden rounded-xl" style={{ border: `1px solid ${chrome.surfaceBorder}` }}>
              {[['list', 'List View'], ['sponsor', 'Sponsor View'], ['tree', 'Tree View']].map(([mode, label]) => (
                <button key={mode} type="button" onClick={() => setViewMode(mode)}
                  className="px-3.5 py-2 text-sm font-semibold transition-colors"
                  style={viewMode === mode ? { background: 'rgba(212,175,55,0.18)', color: 'var(--brand-gold)' } : { background: 'transparent', color: chrome.panelButtonText }}>
                  {label}
                </button>
              ))}
            </div>

            {viewMode === 'list' && (
              <BinaryDrill nodes={flatNodes} selfUid={rootNode?.uid} chrome={chrome} panelStyle={panelStyle} loading={loading} sponsorByUid={sponsorByUid} />
            )}

            {viewMode === 'sponsor' && (
              <SponsorLevels nodes={unilevelNodes} sponsorByUid={sponsorByUid} chrome={chrome} panelStyle={panelStyle} loading={loading} rootLabel={rootName} rootSponsor={rootSponsor} />
            )}

            {viewMode === 'tree' && (
            <div ref={flowShellRef} className={`relative overflow-hidden ${isFullscreen ? 'rounded-none' : 'rounded-[1.75rem]'}`} style={{ ...panelStyle, zIndex: 0 }}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${chrome.surfaceBorder}` }}>
              <div>
                <h2 className="font-display text-lg font-semibold" style={{ color: chrome.heading }}>{rootName}</h2>
                <p className="mt-1 text-xs" style={{ color: chrome.tertiary }}>
                  {refreshing ? 'Syncing live data…' : `${fmtInt(count)} accounts`}
                  {rootSponsor ? <> · Sponsored by <span style={{ color: 'var(--brand-gold)' }}>@{rootSponsor.username || rootSponsor.fullname || rootSponsor.uid}</span></> : null}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setCanvasRootUid(null)} disabled={canvasRootUid == null} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold hover:-translate-y-0.5 disabled:opacity-40" style={neutralButtonStyle}>
                  <HiOutlineHome className="size-4" /> Top
                </button>
                <button type="button" onClick={resetView} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold hover:-translate-y-0.5" style={neutralButtonStyle}>
                  <HiOutlineRefresh className="size-4" /> Fit
                </button>
                <div ref={exportDropdownRef} className="relative">
                  <button type="button" onClick={() => !exportingFormat && setExportDropdownOpen((v) => !v)} disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold hover:-translate-y-0.5 disabled:opacity-60"
                    style={{ background: isDarkMode ? 'rgba(212,175,55,0.18)' : 'rgba(255,248,227,0.96)', color: isDarkMode ? '#F4D675' : '#7A5C08', border: `1.5px solid ${chrome.amberBorder}` }}>
                    {exportingFormat ? <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <HiOutlineDownload className="size-3.5" />}
                    {exportingFormat ? 'Exporting…' : 'Export'} <HiOutlineChevronDown className="size-3" style={{ transform: exportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                  {exportDropdownOpen && (
                    <div className="absolute right-0 top-full z-[90] mt-2 w-56 overflow-hidden rounded-2xl py-2" style={{ background: chrome.popoverBg ?? chrome.surfaceStrong, border: `1px solid ${chrome.surfaceBorder}`, backdropFilter: 'blur(20px)' }}>
                      {exportItems.map(({ key, label, Icon, run }) => (
                        <button key={key} type="button" onClick={run} disabled={!!exportingFormat || flatNodes.length === 0}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5 disabled:pointer-events-none">
                          <span className="flex size-8 items-center justify-center rounded-xl" style={{ background: 'rgba(212,175,55,0.16)' }}>
                            {exportingFormat === key ? <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Icon className="size-4" style={{ color: isDarkMode ? '#F4D675' : '#7A5C08' }} />}
                          </span>
                          <p className="text-xs font-semibold" style={{ color: chrome.searchText ?? chrome.heading }}>{label}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={toggleFullscreen} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold hover:-translate-y-0.5" style={amberButtonStyle}>
                  {isFullscreen ? <HiOutlineMinusSm className="size-4" /> : <HiOutlineArrowsExpand className="size-4" />} {isFullscreen ? 'Exit' : 'Full Screen'}
                </button>
              </div>
            </div>

            <div ref={canvasDivRef} className={`relative ${isFullscreen ? 'h-screen' : 'h-[62vh] min-h-[520px]'}`} style={{ touchAction: canvasActive ? 'none' : 'pan-y pinch-zoom' }}>
              {!canvasActive && <button type="button" aria-label="Activate canvas" onClick={activateCanvas} className="absolute inset-0 z-10 block cursor-grab bg-transparent" />}
              {loading && <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]" style={{ background: chrome.canvasOverlay }}><Spinner /></div>}
              {status === 'error' && <div className="absolute inset-0 z-20 flex items-center justify-center text-sm" style={{ color: chrome.tertiary }}>Could not load that account’s tree.</div>}
              {!loading && status !== 'error' && nodes.length === 0 && <div className="absolute inset-0 z-20 flex items-center justify-center text-sm" style={{ color: chrome.tertiary }}>No downline to display.</div>}
              <ReactFlow onInit={(i) => { reactFlowRef.current = i; }} className="genealogy-flow size-full"
                nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
                onlyRenderVisibleElements minZoom={0.06} maxZoom={1.6}
                nodesDraggable={false} nodesConnectable={false} elementsSelectable={canvasActive}
                panOnDrag={canvasActive} panOnScroll={false} zoomOnScroll={canvasActive} zoomOnPinch={canvasActive}
                zoomOnDoubleClick={canvasActive} preventScrolling={canvasActive} proOptions={{ hideAttribution: true }} defaultEdgeOptions={{ type: 'treeEdge' }}>
                <Controls className="genealogy-controls" showInteractive={false} position="top-right" />
                <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color={chrome.backgroundDot} />
              </ReactFlow>
            </div>

          </div>
          )}
          </div>

          {/* Side list — search + jump */}
          <div className="flex min-h-0 flex-col rounded-2xl p-5" style={panelStyle}>
            <PairingReconcile url={reconcileUrl} chrome={chrome} />
            <h2 className="font-display text-lg font-semibold" style={{ color: chrome.heading }}>Accounts in tree</h2>
            <div className="relative mt-3">
              <HiOutlineSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: chrome.tertiary }} />
              <input type="text" value={treeSearch} onChange={(e) => setTreeSearch(e.target.value)} placeholder="Find a name or username…"
                className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none" style={{ background: chrome.searchBg, color: chrome.searchText, border: `1px solid ${chrome.searchBorder}` }} />
            </div>
            <p className="mt-2 text-[11px]" style={{ color: chrome.tertiary }}>
              {treeSearch.trim() ? `${fmtInt(listResults.length)} match${listResults.length === 1 ? '' : 'es'}` : `Showing first ${fmtInt(listResults.length)} of ${fmtInt(flatNodes.length)}`}
            </p>
            <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-auto pr-1">
              {loading && <div className="rounded-2xl p-6 text-center" style={insetCardStyle}><Spinner /></div>}
              {!loading && treeSearch.trim() && listResults.length === 0 && <p className="px-1 py-4 text-center text-xs" style={{ color: chrome.tertiary }}>No match in this tree.</p>}
              {listResults.map((node) => {
                const packageStyle = PACKAGE_STYLES[node.accttypeName] || PACKAGE_STYLES.Bronze;
                const statusStyle = getAccountStateChipStyle(node.accountStateLabel || 'PD', isDarkMode);
                const isBinaryRoot = node.parentUid == null;
                const sponsor = sponsorByUid.get(Number(node.uid));
                return (
                  <button key={`${node.uid}-${node.depth}`} type="button" onClick={() => jumpTo(node)}
                    className="w-full rounded-xl p-3 text-left transition-all duration-200 hover:-translate-y-0.5" style={insetCardStyle}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" style={{ color: chrome.heading }}>{node.fullname || node.username || `Member ${node.uid}`}</p>
                        <p className="mt-0.5 truncate text-[11px]" style={{ color: chrome.tertiary }}>{node.username || `uid ${node.uid}`} • <span style={{ color: packageStyle.strong }}>{node.accttypeName}</span> • L{node.depth} • {legLabel(node.position === 'right' ? 2 : 1)}</p>
                        <p className="mt-0.5 truncate text-[11px]" style={{ color: chrome.tertiary }}>
                          Sponsor: {sponsor ? `@${sponsor.username || sponsor.fullname || sponsor.uid}` : (isBinaryRoot ? '—' : '— (outside this root’s sponsor network)')}
                        </p>
                      </div>
                      <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold" style={statusStyle}>{node.accountStateLabel || 'PD'}</span>
                    </div>
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

/* ── Pairing reconciliation: leg PV totals vs paid lifetime SMB, for admin verify.
      Snapshot (matched PV) and lifetime SMB are different quantities — shown side by
      side, never forced equal (money-integrity rule). ─────────────────────────── */
function PairingReconcile({ url, chrome }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!url) { setData(null); return undefined; }
    let cancelled = false;
    setLoading(true);
    api.get(url)
      .then((res) => { if (!cancelled) setData(res.data); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [url]);

  if (!url) return null;
  const cards = data ? [
    { label: 'Left PV', value: fmtInt(data.leftPV), sub: `${fmtInt(data.leftAccounts)} accts` },
    { label: 'Right PV', value: fmtInt(data.rightPV), sub: `${fmtInt(data.rightAccounts)} accts` },
    { label: 'Matched PV', value: fmtInt(data.matchedPV), sub: `₱${fmtInt(data.matchedPeso)} snapshot` },
    { label: 'Lifetime SMB', value: `₱${fmtInt(data.lifetimeSmb)}`, sub: 'paid · ttlincome2' },
  ] : [];

  return (
    <div className="mb-4 pb-4" style={{ borderBottom: `1px solid ${chrome.surfaceBorder}` }}>
      <h3 className="text-sm font-bold" style={{ color: chrome.heading }}>Pairing Reconciliation</h3>
      <p className="mt-0.5 text-[11px]" style={{ color: chrome.tertiary }}>Leg totals vs paid SMB</p>
      {loading && <p className="mt-2 text-xs" style={{ color: chrome.tertiary }}>Loading…</p>}
      {data && (
        <>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {cards.map((c) => (
              <div key={c.label} className="rounded-xl px-3 py-2" style={{ background: chrome.surface, border: `1px solid ${chrome.surfaceBorder}` }}>
                <p className="text-[10px]" style={{ color: chrome.tertiary }}>{c.label}</p>
                <p className="mt-0.5 text-sm font-bold" style={{ color: chrome.heading }}>{c.value}</p>
                <p className="text-[10px]" style={{ color: chrome.tertiary }}>{c.sub}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-4" style={{ color: chrome.tertiary }}>{data.note}</p>
        </>
      )}
    </div>
  );
}

/* ── Sponsor View: the account's unilevel (sponsor) network, grouped by level —
      adapted from the member UnilevelTree page's UnilevelAllLevels, using admin
      chrome tokens instead of portal-* classes. Each card also shows who sponsored
      that member (resolved via sponsorByUid, keyed by the MEMBER's own uid). ─── */
function SponsorLevels({ nodes, sponsorByUid, chrome, panelStyle, loading, rootLabel, rootSponsor }) {
  const [q, setQ] = useState('');
  const [openLevels, setOpenLevels] = useState(() => new Set([1])); // only Level 1 expanded by default

  const levels = useMemo(() => {
    const byLevel = new Map();
    for (const n of nodes) {
      const d = Number(n.depth || 0);
      if (d < 1) continue;
      if (!byLevel.has(d)) byLevel.set(d, []);
      byLevel.get(d).push(n);
    }
    const sorted = [...byLevel.entries()].sort((a, b) => a[0] - b[0]);
    for (const [, arr] of sorted) arr.sort((a, b) => String(a.username || '').localeCompare(String(b.username || '')));
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
    return <div className="rounded-2xl p-8 text-center text-sm" style={{ ...panelStyle, color: chrome.tertiary }}>No sponsor-network downline loaded for this account.</div>;
  }

  const totalMembers = levels.reduce((s, [, arr]) => s + arr.length, 0);
  const deepest = levels[levels.length - 1][0];

  return (
    <div className="rounded-2xl p-4 sm:p-5 space-y-5" style={panelStyle}>
      <p className="text-xs" style={{ color: chrome.tertiary }}>
        Sponsor (unilevel) network of {rootLabel}{rootSponsor ? <> (sponsored by <span style={{ color: 'var(--brand-gold)' }}>@{rootSponsor.username || rootSponsor.fullname || rootSponsor.uid}</span>)</> : null} — each level lists who was sponsored by the level above.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative">
          <HiOutlineSearch className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2" style={{ color: chrome.tertiary }} />
          <input type="text" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Filter members by name…"
            className="w-full sm:w-72 rounded-xl py-2 pl-8 pr-3 text-sm outline-none"
            style={{ background: chrome.searchBg, color: chrome.searchText, border: `1px solid ${chrome.searchBorder}` }} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => exportSponsorDocx(levels, sponsorByUid, rootLabel)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold rounded-lg px-2.5 py-1.5"
            style={{ background: 'rgba(34,197,94,0.12)', color: '#34d399', border: '1px solid rgba(34,197,94,0.3)' }}
            title="Export all levels + sponsor names to Word (.doc)">
            <HiOutlineDownload className="size-4" /> Export DOCX
          </button>
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
          <span className="text-xs" style={{ color: chrome.tertiary }}>
            <span className="font-semibold" style={{ color: chrome.heading }}>{fmtInt(totalMembers)}</span> members ·{' '}
            <span className="font-semibold" style={{ color: chrome.heading }}>{fmtInt(deepest)}</span> level{deepest === 1 ? '' : 's'}
          </span>
        </div>
      </div>

      {visible.length === 0 && (
        <p className="px-1 py-6 text-center text-xs" style={{ color: chrome.tertiary }}>No members match “{q}”.</p>
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
              <span className="text-xs" style={{ color: chrome.tertiary }}>{fmtInt(members.length)} member{members.length === 1 ? '' : 's'}</span>
            </button>
            {open && (
              <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3">
                {members.map((m) => {
                  const sponsor = sponsorByUid.get(Number(m.uid));
                  const sponsorLabel = sponsor ? (sponsor.username || sponsor.fullname || sponsor.uid) : null;
                  return (
                    <div key={m.uid} className="rounded-xl px-3.5 py-2.5" style={{ border: `1px solid ${chrome.surfaceBorder}`, background: chrome.surface }}>
                      <p className="truncate text-sm font-medium" style={{ color: chrome.heading }}>{m.fullname || m.username || `Member ${m.uid}`}</p>
                      <p className="truncate text-[11px]" style={{ color: chrome.tertiary }}>@{m.username || m.uid} · {m.accttypeName || '—'}</p>
                      <p className="truncate text-[11px]" style={{ color: chrome.tertiary }}>Sponsor: {sponsorLabel ? `@${sponsorLabel}` : '—'}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

// Export the per-level sponsor network to a Word document (HTML→.doc — opens in
// Word, no extra dependency). Columns intentionally omit ranking points — the admin
// unilevel payload isn't verified to carry that field.
function exportSponsorDocx(levels, sponsorByUid, label) {
  const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const sections = levels.map(([lvl, members]) => {
    const rows = members.map((m, i) => {
      const sponsor = sponsorByUid.get(Number(m.uid));
      const sponsorLabel = sponsor ? (sponsor.username || sponsor.fullname || sponsor.uid) : '—';
      return `<tr><td>${i + 1}</td><td>${esc(m.fullname || m.username)}</td><td>${esc(m.username || m.uid)}</td>`
        + `<td>${esc(m.accttypeName || '—')}</td><td>${esc(sponsorLabel)}</td></tr>`;
    }).join('');
    return `<h2 style="color:#9a7b1f">Level ${lvl} — ${members.length} member${members.length === 1 ? '' : 's'}</h2>`
      + `<table border="1" cellspacing="0" cellpadding="5" style="border-collapse:collapse;width:100%;font-size:11pt">`
      + `<tr style="background:#f3e9c9"><th>#</th><th>Member</th><th>Username</th><th>Package</th><th>Sponsor</th></tr>${rows}</table><br/>`;
  }).join('');
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>`
    + `<head><meta charset='utf-8'></head><body style="font-family:Calibri,Arial,sans-serif">`
    + `<h1>Sponsor Network — ${esc(label)}</h1>`
    + `<p style="color:#666">Per-level members and who sponsored them. Generated ${new Date().toLocaleString('en-US')}.</p>`
    + `${sections}</body></html>`;
  const blob = new Blob(['﻿', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sponsor-network-${String(label || 'export').replace(/[^a-z0-9]/gi, '_')}.doc`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
