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
  const [viewMode, setViewMode] = useState('list'); // 'list' (15-node drill) | 'tree' (canvas) | 'members'

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

  // Show the "perfect 15" (root + 3 levels) by default; deeper generations stay
  // collapsed behind a "+N below" card and load one level on click. `expanded`
  // drives the progressive reveal, so it must be passed in AND be a dep.
  const built = useMemo(
    () => buildFlatTreeGraph(flatNodes, { renderBudget: 60000, orderBy: ORDER_BINARY, expandAll: false, initialDepth: 3, expanded, withPlaceholders: true, metricAsPv: true }),
    [flatNodes, expanded],
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
            “open N more” card to open the next level. Search a name to jump anywhere.
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
          {/* View tabs: 15-node drill list (default), graphical tree, flat members */}
          <div className="inline-flex flex-wrap overflow-hidden rounded-xl" style={{ border: `1px solid ${chrome.surfaceBorder}` }}>
            {[['list', 'List View'], ['tree', 'Tree View'], ['members', 'Members']].map(([mode, label]) => (
              <button key={mode} type="button" onClick={() => setViewMode(mode)}
                className="px-3.5 py-2 text-sm font-semibold transition-colors"
                style={viewMode === mode
                  ? { background: 'rgba(212,175,55,0.18)', color: 'var(--brand-gold)' }
                  : { background: 'transparent', color: chrome.panelButtonText }}>
                {label}
              </button>
            ))}
          </div>

          {viewMode === 'list' && (
            <BinaryDrill nodes={flatNodes} selfUid={selfUid} chrome={chrome} panelStyle={panelStyle} loading={loading} />
          )}

          {viewMode === 'tree' && (
          <div ref={flowShellRef} className={`relative z-10 overflow-hidden rounded-[1.75rem] ${isFullscreen ? 'genealogy-fullscreen-shell' : ''}`} style={panelStyle}>
            {/* Canvas header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${chrome.surfaceBorder}` }}>
              <div>
                <h2 className="font-display text-lg font-semibold" style={{ color: chrome.heading }}>Binary Tree Canvas</h2>
                <p className="mt-1 text-xs" style={{ color: chrome.tertiary }}>Click a “open N more” card to load the next level; drag and zoom to explore.</p>
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

          </div>
          )}

          {viewMode === 'members' && (
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
          )}
        </div>
      )}
    </div>
  );
}

/* ── Binary List/Drill view: 15-node window (root + 3 levels). Click any member to
      re-root into their own 15-node window; breadcrumb walks back up. Banner shows
      which overall leg (Left/Right of YOUR account) you're in; each row carries its
      placement side (L/R) under its parent. Search re-roots straight into a bloodline.
      Only the current root's 15-node window is built, so it stays light. ─────────── */
function BinaryDrill({ nodes, selfUid, chrome, panelStyle, loading }) {
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

  // Overall leg = the placement side of the level-1 ancestor (direct child of you).
  const overallSide = trail.length > 1 ? (trail[1]?.position || null) : null;

  // Build the 15-node window: root + 3 levels (L before R), flattened with depth.
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
              {i === 0 ? 'You' : (node.username || `UID ${node.uid}`)}
            </button>
          </span>
        ))}
      </div>

      {rootNode && rootNode.parentUid != null ? (
        <div className="rounded-xl px-4 py-2 text-xs font-semibold"
          style={overallSide === 'left'
            ? { background: 'rgba(96,165,250,0.10)', color: '#60a5fa', border: '1px solid rgba(96,165,250,0.25)' }
            : { background: 'rgba(244,114,182,0.10)', color: '#f472b6', border: '1px solid rgba(244,114,182,0.25)' }}>
          In your <strong>{overallSide === 'left' ? 'LEFT' : 'RIGHT'}</strong> leg — viewing {rootNode.username || `UID ${rootNode.uid}`}'s 15-node bloodline
        </div>
      ) : (
        <div className="rounded-xl px-4 py-2 text-xs font-semibold" style={{ background: 'rgba(212,175,55,0.10)', color: 'var(--brand-gold)', border: '1px solid rgba(212,175,55,0.25)' }}>
          Your account root — your full Left / Right structure
        </div>
      )}

      <div className="space-y-1.5">
        {rows.map(({ node, depth, side, more }) => (
          <button key={`${node.uid}-${depth}`} type="button" onClick={() => setRootUid(Number(node.uid))}
            className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition-all hover:-translate-y-0.5"
            style={{ marginLeft: depth * 18, border: `1px solid ${chrome.surfaceBorder}`, background: depth === 0 ? 'rgba(212,175,55,0.06)' : chrome.surface }}>
            <div className="flex min-w-0 items-center gap-2">
              {depth > 0 && sideBadge(side)}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium" style={{ color: chrome.heading }}>{node.fullname || node.username || `UID ${node.uid}`}</p>
                <p className="truncate text-[11px]" style={{ color: chrome.tertiary }}>@{node.username || node.uid} · {node.accttypeName || '—'}</p>
              </div>
            </div>
            {more > 0 && (
              <span className="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: 'rgba(212,175,55,0.10)', color: 'var(--brand-gold)', border: '1px solid rgba(212,175,55,0.2)' }}>
                open {fmtInt(more)} more
              </span>
            )}
          </button>
        ))}
      </div>
      <p className="text-[11px]" style={{ color: chrome.tertiary }}>
        Root + 3 levels (up to 15). Tap any member to make them the root and open their 15-node view; tap “open N more” on a deepest row to drill further.
      </p>
    </div>
  );
}
