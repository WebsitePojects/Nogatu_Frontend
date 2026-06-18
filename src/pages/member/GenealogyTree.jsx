import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  HiOutlineArrowsExpand, HiOutlineChevronDown, HiOutlineCode, HiOutlineDocumentText,
  HiOutlineDownload, HiOutlineHome, HiOutlineMinusSm, HiOutlinePhotograph, HiOutlineRefresh,
  HiOutlineSearch, HiOutlineTable, HiOutlineUsers, HiOutlineZoomIn,
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
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

export default function GenealogyTree() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const reactFlowRef = useRef(null);
  const flowShellRef = useRef(null);
  const canvasDivRef = useRef(null);
  const searchBoxRef = useRef(null);
  const exportDropdownRef = useRef(null);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasActive, setCanvasActive] = useState(false);
  const [expanded, setExpanded] = useState(() => new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const selfUid = user?.uid;
  const { nodes: flatNodes, status, loading, refreshing, count } = useInfiniteTree({
    treeType: 'binary',
    cacheKey: selfUid ? String(selfUid) : '',
    url: '/genealogy/binary/flat',
    enabled: Boolean(selfUid),
  });

  const chrome = getGenealogyTheme(isDarkMode);
  const panelStyle = { background: chrome.surfaceStrong, border: `1px solid ${chrome.surfaceBorder}`, boxShadow: isDarkMode ? '0 18px 42px rgba(2,6,23,0.28)' : '0 18px 40px rgba(15,23,42,0.08)', backdropFilter: 'blur(18px)' };
  const insetCardStyle = { background: chrome.surface, border: `1px solid ${chrome.surfaceBorder}` };
  const neutralButtonStyle = { background: chrome.panelButtonBg, color: chrome.panelButtonText, border: `1px solid ${chrome.surfaceBorder}` };
  const amberButtonStyle = { background: chrome.amberButtonBg, color: chrome.amberButtonText, border: `1px solid ${chrome.amberBorder}` };

  useEffect(() => {
    function onFs() { setIsFullscreen(document.fullscreenElement === flowShellRef.current); }
    function onPointer(e) {
      if (!flowShellRef.current?.contains(e.target)) setCanvasActive(false);
      if (!searchBoxRef.current?.contains(e.target)) setSearchOpen(false);
      if (!exportDropdownRef.current?.contains(e.target)) setExportDropdownOpen(false);
    }
    function onEsc(e) { if (e.key === 'Escape') { setCanvasActive(false); setSearchOpen(false); setExportDropdownOpen(false); } }
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  function activateCanvas() { setCanvasActive(true); }
  async function toggleFullscreen() {
    if (!flowShellRef.current) return;
    try {
      if (document.fullscreenElement === flowShellRef.current) await document.exitFullscreen();
      else { await flowShellRef.current.requestFullscreen(); setCanvasActive(true); }
    } catch { /* denied */ }
  }
  function resetView() { reactFlowRef.current?.fitView({ padding: 0.08, duration: 350, maxZoom: 1.32, minZoom: 0.08 }); }
  function toggleExpand(uid) {
    setExpanded((prev) => { const next = new Set(prev); if (next.has(uid)) next.delete(uid); else next.add(uid); return next; });
  }
  function jumpTo(node) {
    const path = expandPathTo(flatNodes, node.uid);
    setExpanded((prev) => { const next = new Set(prev); path.forEach((u) => next.add(u)); return next; });
    setCanvasActive(true); setSearchOpen(false); setSearchTerm(node.username || '');
    const id = String(node.publicUid || node.uid);
    setTimeout(() => {
      const rf = reactFlowRef.current; const target = rf?.getNode?.(id);
      if (target) rf.setCenter(target.position.x + NODE_WIDTH / 2, target.position.y + NODE_HEIGHT / 2, { zoom: 1.0, duration: 460 });
    }, 160);
  }

  // Render the WHOLE binary tree + open L/R slots so every node is visible and any
  // empty slot can be placed into.
  const built = useMemo(
    () => buildFlatTreeGraph(flatNodes, { renderBudget: 60000, orderBy: ORDER_BINARY, expandAll: true, withPlaceholders: true }),
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
      return { ...n, data: { ...n.data, isDarkMode, canvasActive, onActivateCanvas: activateCanvas, onRegister: () => registerIntoSlot(n.data) } };
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

  // Export expects a network[] list — the flat payload IS that list (map leg/BP).
  const networkForExport = useMemo(
    () => flatNodes.filter((n) => n.parentUid != null).map((n) => ({ ...n, leg: n.position, binaryPoints: n.pointsToUpline })),
    [flatNodes],
  );

  const searchResults = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return [];
    return flatNodes.filter((n) => `${n.username || ''} ${n.fullname || ''}`.toLowerCase().includes(q)).slice(0, 8);
  }, [flatNodes, searchTerm]);

  const treeStats = useMemo(() => {
    const s = { pd: 0, cd: 0, cdPaid: 0, fs: 0, totalBp: 0 };
    for (const n of flatNodes) {
      const l = n.accountStateLabel || 'PD';
      if (l === 'PD') s.pd += 1; else if (l === 'CD') s.cd += 1; else if (l === 'CD - Paid') s.cdPaid += 1; else if (l === 'FS') s.fs += 1;
      s.totalBp += Number(n.pointsToUpline || 0);
    }
    return s;
  }, [flatNodes]);

  const statChips = [
    { label: 'PD', count: treeStats.pd, bg: isDarkMode ? 'rgba(74,222,128,0.10)' : 'rgba(34,197,94,0.10)', color: isDarkMode ? '#86EFAC' : '#166534', border: `1px solid ${isDarkMode ? 'rgba(74,222,128,0.22)' : 'rgba(34,197,94,0.22)'}`, dot: '#22C55E', tooltip: 'Paid accounts' },
    { label: 'CD', count: treeStats.cd, bg: isDarkMode ? 'rgba(248,113,113,0.10)' : 'rgba(239,68,68,0.10)', color: isDarkMode ? '#FCA5A5' : '#B91C1C', border: `1px solid ${isDarkMode ? 'rgba(248,113,113,0.22)' : 'rgba(239,68,68,0.22)'}`, dot: '#EF4444', tooltip: 'Commission Deduction (unpaid)' },
    { label: 'CD-Paid', count: treeStats.cdPaid, bg: isDarkMode ? 'rgba(250,204,21,0.10)' : 'rgba(234,179,8,0.10)', color: isDarkMode ? '#FDE68A' : '#92400E', border: `1px solid ${isDarkMode ? 'rgba(250,204,21,0.22)' : 'rgba(234,179,8,0.22)'}`, dot: '#F59E0B', tooltip: 'CD fully recovered' },
    { label: 'FS', count: treeStats.fs, bg: isDarkMode ? 'rgba(96,165,250,0.10)' : 'rgba(59,130,246,0.10)', color: isDarkMode ? '#BFDBFE' : '#1D4ED8', border: `1px solid ${isDarkMode ? 'rgba(96,165,250,0.22)' : 'rgba(59,130,246,0.22)'}`, dot: '#3B82F6', tooltip: 'Free Slot' },
    { label: 'Total PV', count: fmtInt(treeStats.totalBp / 250), bg: 'rgba(212,175,55,0.10)', color: isDarkMode ? '#F4D675' : '#7A5C08', border: '1px solid rgba(212,175,55,0.24)', dot: '#D4AF37', tooltip: 'Total Binary PV (1 PV = ₱250) in this view' },
  ];

  async function runExport(format, fn) {
    if (exportingFormat) return;
    setExportDropdownOpen(false); setExportingFormat(format);
    try { await fn(); } catch { /* user can retry */ } finally { setExportingFormat(null); }
  }
  const fileBase = `member_genealogy_${user?.username || 'tree'}`;
  const imgExports = [
    { key: 'png', label: 'PNG', desc: 'Lossless · 3× HiDPI', Icon: HiOutlinePhotograph, run: () => runExport('png', () => exportTreeAsPng(reactFlowRef.current, canvasDivRef.current, fileBase, isDarkMode)) },
    { key: 'jpeg', label: 'JPEG', desc: 'Smaller · 92%', Icon: HiOutlinePhotograph, run: () => runExport('jpeg', () => exportTreeAsJpeg(reactFlowRef.current, canvasDivRef.current, fileBase, isDarkMode)) },
    { key: 'svg', label: 'SVG Vector', desc: 'Scalable · print', Icon: HiOutlineCode, run: () => runExport('svg', () => exportTreeAsSvg(reactFlowRef.current, canvasDivRef.current, fileBase, isDarkMode)) },
  ];
  const dataExports = [
    { key: 'csv', label: 'CSV Spreadsheet', desc: 'Members, levels, BP', Icon: HiOutlineTable, run: () => runExport('csv', () => exportNetworkAsCsv(networkForExport, user?.username, 0)) },
    { key: 'docx', label: 'DOCX Report', desc: 'Narrative report', Icon: HiOutlineDocumentText, run: () => runExport('docx', () => exportNetworkAsDocx(networkForExport, user?.username, 0, false)) },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: chrome.heading }}>Genealogy Tree</h1>
          <div className="mt-2 h-0.5 w-12 rounded-full" style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
          <p className="mt-3 text-sm" style={{ color: chrome.subtext }}>
            Your full binary network — root to the deepest generation. First levels load instantly; click a
            “+N below” card to open the next level. Search a name to jump anywhere.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setExpanded(new Set())} disabled={expanded.size === 0}
            className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-40" style={amberButtonStyle}>
            <HiOutlineHome className="size-4" /> Collapse all
          </button>
          <button type="button" onClick={() => navigate('/referrals')}
            className="inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5" style={neutralButtonStyle}>
            <HiOutlineUsers className="size-4" /> Direct Referrals
          </button>
        </div>
      </div>

      {/* Controls: search */}
      <div className="relative z-30 rounded-3xl p-5" style={panelStyle}>
        <div ref={searchBoxRef} className="relative z-[70]">
          <div className="relative max-w-xl">
            <HiOutlineSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: chrome.tertiary }} />
            <input type="text" value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search a name or username in your tree…"
              className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none"
              style={{ background: chrome.searchBg, color: chrome.searchText, border: `1px solid ${chrome.searchBorder}` }} />
          </div>
          {searchOpen && searchResults.length > 0 && (
            <div className="absolute left-0 top-full z-[80] mt-2 w-full max-w-xl overflow-hidden rounded-2xl"
              style={{ background: chrome.popoverBg, border: `1px solid ${chrome.surfaceBorder}`, boxShadow: chrome.popoverShadow }}>
              {searchResults.map((m, i) => (
                <button key={`${m.uid}-${m.depth}`} type="button" onClick={() => jumpTo(m)}
                  className="w-full px-4 py-3 text-left text-sm"
                  style={{ borderBottom: i === searchResults.length - 1 ? 'none' : `1px solid ${chrome.surfaceBorder}`, color: chrome.searchText }}>
                  <div className="font-semibold">{m.fullname || m.username}</div>
                  <div className="mt-1 text-xs" style={{ color: chrome.tertiary }}>@{m.username} • Level {m.depth} • {legLabel(m.position === 'right' ? 2 : 1)}</div>
                </button>
              ))}
            </div>
          )}
        </div>
        <p className="mt-3 text-xs" style={{ color: chrome.tertiary }}>
          {refreshing ? 'Syncing live data…' : `${fmtInt(count)} members in your binary network.`}
        </p>
      </div>

      {!loading && status === 'error' ? (
        <div className="rounded-3xl p-10 text-center" style={panelStyle}>
          <HiOutlineUsers className="mx-auto mb-4 size-10" style={{ color: chrome.emptyIcon }} />
          <h2 className="font-display text-xl font-semibold" style={{ color: chrome.heading }}>Genealogy could not be loaded</h2>
          <p className="mt-3 text-sm" style={{ color: chrome.subtext }}>Please try again in a moment.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div ref={flowShellRef} className={`relative z-10 overflow-hidden rounded-[1.75rem] ${isFullscreen ? 'genealogy-fullscreen-shell' : ''}`} style={panelStyle}>
            {/* Canvas header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${chrome.surfaceBorder}` }}>
              <div>
                <h2 className="font-display text-lg font-semibold" style={{ color: chrome.heading }}>Binary Tree Canvas</h2>
                <p className="mt-1 text-xs" style={{ color: chrome.tertiary }}>Click a “+N below” card to load the next level; drag and zoom to explore.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="hidden items-center gap-2 text-xs sm:flex" style={{ color: chrome.amberButtonText }}><HiOutlineZoomIn className="size-4" /> Zoom</div>
                <button type="button" onClick={resetView} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold hover:-translate-y-0.5" style={neutralButtonStyle}>
                  <HiOutlineRefresh className="size-4" /> Fit
                </button>
                <div ref={exportDropdownRef} className="relative">
                  <button type="button" onClick={() => !exportingFormat && setExportDropdownOpen((v) => !v)} disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold hover:-translate-y-0.5 disabled:opacity-60"
                    style={{ background: isDarkMode ? 'rgba(212,175,55,0.18)' : 'rgba(255,248,227,0.96)', color: isDarkMode ? '#F4D675' : '#7A5C08', border: `1.5px solid ${chrome.amberBorder}` }}>
                    {exportingFormat ? <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <HiOutlineDownload className="size-3.5" />}
                    {exportingFormat ? 'Exporting…' : 'Export'}
                    <HiOutlineChevronDown className="size-3" style={{ transform: exportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                  {exportDropdownOpen && (
                    <div className="absolute right-0 top-full z-[90] mt-2 w-60 overflow-hidden rounded-2xl py-2"
                      style={{ background: chrome.popoverBg ?? chrome.surfaceStrong, border: `1px solid ${chrome.surfaceBorder}`, backdropFilter: 'blur(20px)' }}>
                      <p className="px-4 pb-1 pt-2.5 text-[9px] font-bold uppercase tracking-widest" style={{ color: chrome.tertiary }}>Image</p>
                      {imgExports.map(({ key, label, desc, Icon, run }) => (
                        <button key={key} type="button" onClick={run} disabled={!!exportingFormat}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5 disabled:pointer-events-none">
                          <span className="flex size-8 items-center justify-center rounded-xl" style={{ background: 'rgba(212,175,55,0.16)' }}>
                            {exportingFormat === key ? <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Icon className="size-4" style={{ color: isDarkMode ? '#F4D675' : '#7A5C08' }} />}
                          </span>
                          <span><p className="text-xs font-semibold" style={{ color: chrome.searchText ?? chrome.heading }}>{label}</p><p className="text-[10px]" style={{ color: chrome.tertiary }}>{desc}</p></span>
                        </button>
                      ))}
                      <div className="mx-3 my-1.5 border-t" style={{ borderColor: chrome.surfaceBorder }} />
                      <p className="px-4 pb-1 text-[9px] font-bold uppercase tracking-widest" style={{ color: chrome.tertiary }}>Data Reports</p>
                      {dataExports.map(({ key, label, desc, Icon, run }) => (
                        <button key={key} type="button" onClick={run} disabled={!!exportingFormat || flatNodes.length === 0}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-white/5 disabled:pointer-events-none">
                          <span className="flex size-8 items-center justify-center rounded-xl" style={{ background: 'rgba(34,197,94,0.14)' }}>
                            {exportingFormat === key ? <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" /> : <Icon className="size-4" style={{ color: isDarkMode ? '#86EFAC' : '#166534' }} />}
                          </span>
                          <span><p className="text-xs font-semibold" style={{ color: chrome.searchText ?? chrome.heading }}>{label}</p><p className="text-[10px]" style={{ color: chrome.tertiary }}>{desc}</p></span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={toggleFullscreen} className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold hover:-translate-y-0.5" style={amberButtonStyle}>
                  {isFullscreen ? <HiOutlineMinusSm className="size-4" /> : <HiOutlineArrowsExpand className="size-4" />} {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                </button>
              </div>
            </div>

            <div ref={canvasDivRef} className={`relative ${isFullscreen ? 'h-screen min-h-screen' : 'h-[62vh] min-h-[520px]'}`} style={{ touchAction: canvasActive ? 'none' : 'pan-y pinch-zoom' }}>
              {!canvasActive && <button type="button" aria-label="Activate canvas" onClick={activateCanvas} className="absolute inset-0 z-10 block cursor-grab bg-transparent" />}
              {loading && <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]" style={{ background: chrome.canvasOverlay }}><Spinner /></div>}
              {!loading && nodes.length === 0 && status !== 'error' && <div className="absolute inset-0 z-20 flex items-center justify-center text-sm" style={{ color: chrome.tertiary }}>No downline to display yet.</div>}
              <ReactFlow onInit={(i) => { reactFlowRef.current = i; }} className="genealogy-flow size-full"
                nodes={nodes} edges={edges} nodeTypes={nodeTypes} edgeTypes={edgeTypes}
                onlyRenderVisibleElements minZoom={0.06} maxZoom={1.6}
                nodesDraggable={false} nodesConnectable={false} elementsSelectable={canvasActive}
                panOnDrag={canvasActive} panOnScroll={false} zoomOnScroll={canvasActive} zoomOnPinch={canvasActive}
                zoomOnDoubleClick={canvasActive} preventScrolling={canvasActive} proOptions={{ hideAttribution: true }} defaultEdgeOptions={{ type: 'treeEdge' }}>
                <Controls className="genealogy-controls" showInteractive={false} position="top-right" />
                <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color={chrome.backgroundDot} />
              </ReactFlow>
              <div className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-xl px-3 py-2 text-xs font-semibold"
                style={{ background: chrome.canvasBadgeBg, color: canvasActive ? chrome.canvasActiveText : chrome.canvasPassiveText, border: `1px solid ${chrome.surfaceBorder}` }}>
                {canvasActive ? 'Canvas active: drag and zoom enabled' : 'Click the canvas first to drag and zoom.'}
              </div>
            </div>

            {flatNodes.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-5 py-3" style={{ borderTop: `1px solid ${chrome.surfaceBorder}` }}>
                <span className="mr-1 text-[11px] font-semibold" style={{ color: chrome.tertiary }}>Tree stats:</span>
                {statChips.map((chip) => (
                  <div key={chip.label} className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ background: chip.bg, color: chip.color, border: chip.border }} title={chip.tooltip}>
                    <span className="size-1.5 rounded-full" style={{ background: chip.dot }} /> {chip.label}: {chip.count}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Affiliated members (search-filtered, capped) */}
          <div className="rounded-3xl p-5" style={panelStyle}>
            <h2 className="font-display text-lg font-semibold" style={{ color: chrome.heading }}>Affiliated Members</h2>
            <p className="mt-1 text-xs" style={{ color: chrome.tertiary }}>Search above to filter; click anyone to jump to them in the tree.</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(searchTerm.trim() ? searchResults : flatNodes.slice(0, 24)).map((member) => {
                const packageStyle = PACKAGE_STYLES[member.accttypeName] || PACKAGE_STYLES.Bronze;
                const statusStyle = getAccountStateChipStyle(member.accountStateLabel || 'PD', isDarkMode);
                return (
                  <button type="button" key={`${member.uid}-${member.depth}`} onClick={() => jumpTo(member)}
                    className="w-full rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5" style={insetCardStyle}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold" style={{ color: chrome.heading }}>{member.fullname || member.username}</p>
                        <p className="mt-1 truncate text-[11px]" style={{ color: chrome.tertiary }}>{member.username || `Member ${member.uid}`}</p>
                      </div>
                      <span className="rounded-full px-2 py-1 text-[10px] font-bold" style={amberButtonStyle}>L{member.depth}</span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                      <div><p style={{ color: chrome.tertiary }}>Package</p><p className="mt-1 font-semibold" style={{ color: packageStyle.strong }}>{member.accttypeName}</p></div>
                      <div><p style={{ color: chrome.tertiary }}>Side</p><p className="mt-1 font-semibold" style={{ color: chrome.heading }}>{legLabel(member.position === 'right' ? 2 : 1)}</p></div>
                      <div><p style={{ color: chrome.tertiary }}>Status</p><span className="mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold" style={statusStyle}>{member.accountStateLabel || 'PD'}</span></div>
                    </div>
                  </button>
                );
              })}
            </div>
            {flatNodes.length === 0 && !loading && (
              <div className="rounded-2xl p-8 text-center" style={insetCardStyle}>
                <HiOutlineUsers className="mx-auto mb-3 size-8" style={{ color: chrome.emptyIcon }} />
                <p className="text-sm" style={{ color: chrome.tertiary }}>No members in your binary network yet.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
