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
import { buildFlatTreeGraph, ORDER_BINARY, expandPathTo } from '../../lib/buildFlatTreeGraph';
import useInfiniteTree from '../../hooks/useInfiniteTree';
import { useTheme } from '../../contexts/ThemeContext';

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
  const [expanded, setExpanded] = useState(() => new Set());
  const [searchUsername, setSearchUsername] = useState(searchParams.get('username') || '');
  const [treeSearch, setTreeSearch] = useState('');
  const [exportingFormat, setExportingFormat] = useState(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const rootId = searchParams.get('id') || '';
  const rootUsername = searchParams.get('username') || '';
  const hasTarget = Boolean(rootId || rootUsername);
  const cacheKey = rootId ? `id:${rootId}` : (rootUsername ? `user:${rootUsername}` : '');
  const url = rootId
    ? `/admin/genealogy/binary/flat?id=${encodeURIComponent(rootId)}`
    : (rootUsername ? `/admin/genealogy/binary/flat?username=${encodeURIComponent(rootUsername)}` : '');
  const { nodes: flatNodes, status, loading, refreshing, count } = useInfiniteTree({
    treeType: 'binary', cacheKey, url, enabled: hasTarget,
  });

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
  useEffect(() => { setExpanded(new Set()); setTreeSearch(''); }, [cacheKey]);

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
  function toggleExpand(uid) {
    setExpanded((prev) => { const next = new Set(prev); if (next.has(uid)) next.delete(uid); else next.add(uid); return next; });
  }
  function jumpTo(node) {
    const path = expandPathTo(flatNodes, node.uid);
    setExpanded((prev) => { const next = new Set(prev); path.forEach((u) => next.add(u)); return next; });
    setCanvasActive(true);
    const id = String(node.publicUid || node.uid);
    setTimeout(() => {
      const rf = reactFlowRef.current; const target = rf?.getNode?.(id);
      if (target) rf.setCenter(target.position.x + NODE_WIDTH / 2, target.position.y + NODE_HEIGHT / 2, { zoom: 0.95, duration: 460 });
    }, 160);
  }

  // Render the WHOLE binary tree + open L/R slots (placeholders) so admin can see
  // every node and manually encode into any empty slot.
  const built = useMemo(
    () => buildFlatTreeGraph(flatNodes, { renderBudget: 60000, orderBy: ORDER_BINARY, expandAll: true, withPlaceholders: true, metricAsPv: true }),
    [flatNodes],
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
    return { ...n, data: { ...n.data, isDarkMode, canvasActive, positionLabel: n.data.position ? legLabel(n.data.position === 'right' ? 2 : 1) : n.data.positionLabel, onOpen: () => toggleExpand(n.data.uid), onActivateCanvas: activateCanvas } };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [built, isDarkMode, canvasActive]);
  const edges = built.edges;

  useEffect(() => {
    if (!built.nodes.length) return undefined;
    const timer = setTimeout(resetView, 80);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

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
  const treeStats = useMemo(() => {
    const s = { pd: 0, cd: 0, cdPaid: 0, fs: 0, totalBp: 0 };
    for (const n of flatNodes) {
      const l = n.accountStateLabel || 'PD';
      if (l === 'PD') s.pd += 1; else if (l === 'CD') s.cd += 1; else if (l === 'CD - Paid') s.cdPaid += 1; else if (l === 'FS') s.fs += 1;
      s.totalBp += Number(n.pointsToUpline || 0);
    }
    return s;
  }, [flatNodes]);
  const rootNode = flatNodes.find((n) => n.parentUid == null) || null;
  const rootName = rootNode?.fullname || rootNode?.username || rootUsername || 'Account';

  const statChips = [
    { label: 'PD', count: treeStats.pd, color: isDarkMode ? '#86EFAC' : '#166534', bg: 'rgba(34,197,94,0.10)', dot: '#22C55E' },
    { label: 'CD', count: treeStats.cd, color: isDarkMode ? '#FCA5A5' : '#B91C1C', bg: 'rgba(239,68,68,0.10)', dot: '#EF4444' },
    { label: 'CD-Paid', count: treeStats.cdPaid, color: isDarkMode ? '#FDE68A' : '#92400E', bg: 'rgba(234,179,8,0.10)', dot: '#F59E0B' },
    { label: 'FS', count: treeStats.fs, color: isDarkMode ? '#BFDBFE' : '#1D4ED8', bg: 'rgba(59,130,246,0.10)', dot: '#3B82F6' },
    { label: 'Total PV', count: fmtInt(treeStats.totalBp / 250), color: isDarkMode ? '#F4D675' : '#7A5C08', bg: 'rgba(212,175,55,0.10)', dot: '#D4AF37' },
  ];

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
            Open any account's full binary network — root to the deepest generation, no level limit. First levels load
            instantly; click a “+N below” card to open the next level. Search within the tree to jump to anyone.
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
          {/* Canvas */}
          <div ref={flowShellRef} className={`relative overflow-hidden ${isFullscreen ? 'rounded-none' : 'rounded-[1.75rem]'}`} style={{ ...panelStyle, zIndex: 0 }}>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${chrome.surfaceBorder}` }}>
              <div>
                <h2 className="font-display text-lg font-semibold" style={{ color: chrome.heading }}>{rootName}</h2>
                <p className="mt-1 text-xs" style={{ color: chrome.tertiary }}>{refreshing ? 'Syncing live data…' : `${fmtInt(count)} accounts · click “+N below” to go deeper`}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => setExpanded(new Set())} disabled={expanded.size === 0} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold hover:-translate-y-0.5 disabled:opacity-40" style={neutralButtonStyle}>
                  <HiOutlineHome className="size-4" /> Collapse
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

            {flatNodes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-5 py-3" style={{ borderTop: `1px solid ${chrome.surfaceBorder}` }}>
                <span className="mr-1 text-[11px] font-semibold" style={{ color: chrome.tertiary }}>Tree stats:</span>
                {statChips.map((chip) => (
                  <div key={chip.label} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ background: chip.bg, color: chip.color, border: `1px solid ${chip.dot}40` }}>
                    <span className="size-1.5 rounded-full" style={{ background: chip.dot }} /> {chip.label}: {chip.count}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Side list — search + jump */}
          <div className="flex min-h-0 flex-col rounded-2xl p-5" style={panelStyle}>
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
                return (
                  <button key={`${node.uid}-${node.depth}`} type="button" onClick={() => jumpTo(node)}
                    className="w-full rounded-xl p-3 text-left transition-all duration-200 hover:-translate-y-0.5" style={insetCardStyle}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" style={{ color: chrome.heading }}>{node.fullname || node.username || `Member ${node.uid}`}</p>
                        <p className="mt-0.5 truncate text-[11px]" style={{ color: chrome.tertiary }}>{node.username || `uid ${node.uid}`} • <span style={{ color: packageStyle.strong }}>{node.accttypeName}</span> • L{node.depth} • {legLabel(node.position === 'right' ? 2 : 1)}</p>
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
