import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  HiOutlineArrowsExpand,
  HiOutlineChevronDown,
  HiOutlineCode,
  HiOutlineDocumentText,
  HiOutlineDownload,
  HiOutlineHome,
  HiOutlineMinusSm,
  HiOutlinePhotograph,
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineTable,
  HiOutlineUsers,
  HiOutlineZoomIn,
} from 'react-icons/hi';
import api from '../../api';
import {
  Spinner,
  MemberNode,
  JunctionNode,
  PlaceholderNode,
  TreeEdge,
} from '../../components/genealogyTreeUi';
import {
  exportNetworkAsDocx,
  exportNetworkAsCsv,
  exportTreeAsJpeg,
  exportTreeAsPng,
  exportTreeAsSvg,
  flattenTree,
  fmtInt,
  getAccountStateChipStyle,
  getGenealogyTheme,
  layoutGraph,
  legLabel,
  NODE_HEIGHT,
  NODE_WIDTH,
  PACKAGE_STYLES,
} from '../../components/genealogyTreeUiUtils';
import { useTheme } from '../../contexts/ThemeContext';

const LEVEL_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20];
const LARGE_DEPTH_THRESHOLD = 10;

export default function AdminGenealogy() {
  const { isDarkMode } = useTheme();
  const reactFlowRef = useRef(null);
  const flowShellRef = useRef(null);
  const canvasDivRef = useRef(null);
  const searchBoxRef = useRef(null);
  const levelDropdownRef = useRef(null);
  const exportDropdownRef = useRef(null);
  const wantedFullscreenRef = useRef(false);
  const highlightTimerRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [tree, setTree] = useState(null);
  const [network, setNetwork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [canvasActive, setCanvasActive] = useState(false);
  const [highlightedNodeId, setHighlightedNodeId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchUsername, setSearchUsername] = useState(searchParams.get('username') || '');
  const [loadProgress, setLoadProgress] = useState(0);
  const [levelDropdownOpen, setLevelDropdownOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState(null); // null | 'png' | 'jpeg' | 'svg' | 'csv' | 'docx'
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);

  const rootId = searchParams.get('id') || '';
  const rootUsername = searchParams.get('username') || '';
  const selectedDepth = LEVEL_OPTIONS.includes(Number(searchParams.get('depth')))
    ? Number(searchParams.get('depth'))
    : 7;
  const chrome = getGenealogyTheme(isDarkMode);

  const panelStyle = {
    background: chrome.surfaceStrong,
    border: `1px solid ${chrome.surfaceBorder}`,
    boxShadow: isDarkMode ? '0 18px 42px rgba(2, 6, 23, 0.28)' : '0 18px 40px rgba(15, 23, 42, 0.08)',
    backdropFilter: 'blur(18px)',
  };
  const insetCardStyle = {
    background: chrome.surface,
    border: `1px solid ${chrome.surfaceBorder}`,
    boxShadow: isDarkMode ? 'inset 0 1px 0 rgba(255,255,255,0.03)' : 'inset 0 1px 0 rgba(255,255,255,0.6)',
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
      setLoading(false);
      setTree(null);
      setNetwork([]);
      setLoadProgress(0);
      return;
    }

    let cancelled = false;
    let progressTimer = null;

    async function loadTreeData() {
      setLoading(true);
      setLoadProgress(14);

      progressTimer = window.setInterval(() => {
        setLoadProgress((current) => (current >= 86 ? current : current + 8));
      }, 180);

      try {
        const rootParam = rootId
          ? `id=${encodeURIComponent(rootId)}`
          : `username=${encodeURIComponent(rootUsername)}`;

        const [treeRes, networkRes] = await Promise.all([
          api.get(`/admin/genealogy/tree?${rootParam}&depth=${selectedDepth + 1}`),
          api.get(`/admin/genealogy/network?${rootParam}&depth=${selectedDepth}`),
        ]);

        if (!cancelled) {
          setLoadProgress(92);
          setTree(treeRes.data.tree);
          setNetwork(networkRes.data.network || []);
          if (treeRes.data.rootUid && String(treeRes.data.rootUid) !== String(rootId)) {
            setSearchParams({ id: String(treeRes.data.rootUid), depth: String(selectedDepth) }, { replace: true });
          }
        }
      } catch {
        if (!cancelled) {
          setTree(null);
          setNetwork([]);
          setLoadProgress(0);
        }
      } finally {
        if (progressTimer) window.clearInterval(progressTimer);
        if (!cancelled) {
          setLoadProgress(100);
          setLoading(false);
          window.setTimeout(() => setLoadProgress(0), 220);
        }
      }
    }

    loadTreeData();
    return () => {
      cancelled = true;
      if (progressTimer) window.clearInterval(progressTimer);
    };
  }, [rootId, rootUsername, selectedDepth, setSearchParams]);

  useEffect(() => {
    function handleFullscreenChange() {
      const active = document.fullscreenElement === flowShellRef.current;
      setIsFullscreen(active);
      if (!document.fullscreenElement) {
        wantedFullscreenRef.current = false;
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    function handleOutsidePointer(event) {
      if (!flowShellRef.current?.contains(event.target)) {
        setCanvasActive(false);
      }
      if (!searchBoxRef.current?.contains(event.target)) {
        setSearchOpen(false);
      }
      if (!levelDropdownRef.current?.contains(event.target)) {
        setLevelDropdownOpen(false);
      }
      if (!exportDropdownRef.current?.contains(event.target)) {
        setExportDropdownOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setCanvasActive(false);
        setSearchOpen(false);
        setLevelDropdownOpen(false);
        setExportDropdownOpen(false);
      }
    }

    document.addEventListener('pointerdown', handleOutsidePointer);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => () => {
    window.clearTimeout(highlightTimerRef.current);
  }, []);

  useEffect(() => {
    if (!loading && wantedFullscreenRef.current && flowShellRef.current && document.fullscreenElement !== flowShellRef.current) {
      flowShellRef.current.requestFullscreen().catch(() => {});
    }
  }, [loading, rootId]);

  function setRoot(nextRoot) {
    const params = {};
    if (nextRoot) params.id = nextRoot;
    if (selectedDepth) params.depth = String(selectedDepth);
    setSearchUsername('');
    setSearchParams(params);
  }

  function setDepth(nextDepth) {
    const params = { depth: String(nextDepth) };
    if (rootId) params.id = rootId;
    if (!rootId && rootUsername) params.username = rootUsername;
    setSearchParams(params);
    setLevelDropdownOpen(false);
  }

  function handleSearchSubmit(event) {
    event.preventDefault();
    const trimmed = String(searchUsername || '').trim();
    if (!trimmed) return;
    setSearchParams({ username: trimmed, depth: String(selectedDepth) });
  }

  async function toggleFullscreen() {
    if (!flowShellRef.current) return;
    if (document.fullscreenElement === flowShellRef.current) {
      wantedFullscreenRef.current = false;
      await document.exitFullscreen();
      return;
    }
    wantedFullscreenRef.current = true;
    await flowShellRef.current.requestFullscreen();
  }

  function resetView() {
    reactFlowRef.current?.fitView({ padding: 0.08, duration: 350, maxZoom: 1.32, minZoom: 0.2 });
  }

  function activateCanvas() {
    setCanvasActive(true);
  }

  function focusNode(nodeId) {
    const targetNode = nodes.find((node) => String(node.id) === String(nodeId));
    if (!targetNode) return;

    activateCanvas();
    setHighlightedNodeId(String(nodeId));
    reactFlowRef.current?.setCenter(
      targetNode.position.x + NODE_WIDTH / 2,
      targetNode.position.y + NODE_HEIGHT / 2,
      { zoom: 1.12, duration: 420 }
    );

    window.clearTimeout(highlightTimerRef.current);
    highlightTimerRef.current = window.setTimeout(() => setHighlightedNodeId(''), 1800);
  }

  async function handleExportPng() {
    if (exportingFormat) return;
    setExportDropdownOpen(false);
    setExportingFormat('png');
    try {
      await exportTreeAsPng(
        reactFlowRef.current,
        canvasDivRef.current,
        `admin_genealogy_${tree?.username || rootUsername || 'tree'}_L${selectedDepth}`,
        isDarkMode
      );
    } catch {
      // silently fail
    } finally {
      setExportingFormat(null);
    }
  }

  async function handleExportJpeg() {
    if (exportingFormat) return;
    setExportDropdownOpen(false);
    setExportingFormat('jpeg');
    try {
      await exportTreeAsJpeg(
        reactFlowRef.current,
        canvasDivRef.current,
        `admin_genealogy_${tree?.username || rootUsername || 'tree'}_L${selectedDepth}`,
        isDarkMode
      );
    } catch {} finally {
      setExportingFormat(null);
    }
  }

  async function handleExportSvg() {
    if (exportingFormat) return;
    setExportDropdownOpen(false);
    setExportingFormat('svg');
    try {
      await exportTreeAsSvg(
        reactFlowRef.current,
        canvasDivRef.current,
        `admin_genealogy_${tree?.username || rootUsername || 'tree'}_L${selectedDepth}`,
        isDarkMode
      );
    } catch {} finally {
      setExportingFormat(null);
    }
  }

  async function handleExportCsv() {
    if (exportingFormat) return;
    setExportDropdownOpen(false);
    setExportingFormat('csv');
    try {
      await exportNetworkAsCsv(network, tree?.username || rootUsername, selectedDepth);
    } finally {
      setExportingFormat(null);
    }
  }

  async function handleExportDocx() {
    if (exportingFormat) return;
    setExportDropdownOpen(false);
    setExportingFormat('docx');
    try {
      await exportNetworkAsDocx(network, tree?.username || rootUsername, selectedDepth, true);
    } finally {
      setExportingFormat(null);
    }
  }

  const { nodes, edges } = useMemo(() => {
    if (!tree) return { nodes: [], edges: [] };
    const flattened = flattenTree(tree, 0, selectedDepth);
    const graphNodes = flattened.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isDarkMode,
        highlighted: String(node.id) === String(highlightedNodeId),
        canvasActive,
        binaryPoints: Number(node.data.binaryPoints || 0),
        placeholderCta: 'Inspect this open slot',
        placeholderHint: 'Admin can verify open left and right branch positions here without changing the binary tree structure.',
        onOpen: () => setRoot(node.id),
        onRegister: () => {},
        onActivateCanvas: activateCanvas,
      },
    }));

    return {
      nodes: layoutGraph(graphNodes, flattened.edges),
      edges: flattened.edges,
    };
  }, [tree, selectedDepth, isDarkMode, highlightedNodeId, canvasActive]);

  useEffect(() => {
    if (!tree || !nodes.length) return;
    const timer = setTimeout(() => {
      reactFlowRef.current?.fitView({ padding: 0.08, duration: 350, maxZoom: 1.32, minZoom: 0.2 });
    }, 80);
    return () => clearTimeout(timer);
  }, [tree, rootId, selectedDepth, isFullscreen, nodes.length]);

  const nodeTypes = useMemo(() => ({
    memberNode: MemberNode,
    junctionNode: JunctionNode,
    placeholderNode: PlaceholderNode,
  }), []);
  const edgeTypes = useMemo(() => ({ treeEdge: TreeEdge }), []);

  const visibleLevels = useMemo(() => {
    const levels = new Set(network.map((member) => Number(member.depth || 0)).filter(Boolean));
    return Array.from(levels).sort((a, b) => a - b);
  }, [network]);

  const treeStats = useMemo(() => {
    const pd = network.filter((m) => (m.accountStateLabel || 'PD') === 'PD').length;
    const cd = network.filter((m) => m.accountStateLabel === 'CD').length;
    const cdPaid = network.filter((m) => m.accountStateLabel === 'CD - Paid').length;
    const fs = network.filter((m) => m.accountStateLabel === 'FS').length;
    const totalBp = network.reduce((sum, m) => sum + Number(m.binaryPoints || 0), 0);
    return { pd, cd, cdPaid, fs, totalBp };
  }, [network]);

  const searchableMembers = useMemo(() => {
    const query = String(searchTerm || '').trim().toLowerCase();
    const base = (network || []).filter((member) => member.username);
    if (!query) return base.slice(0, 8);
    return base
      .filter((member) => {
        const username = String(member.username || '').toLowerCase();
        const fullname = String(member.fullname || '').toLowerCase();
        return username.includes(query) || fullname.includes(query);
      })
      .slice(0, 8);
  }, [network, searchTerm]);

  // ── Stat chip config ─────────────────────────────────────────────────
  const statChips = [
    {
      label: 'PD',
      count: treeStats.pd,
      bg: isDarkMode ? 'rgba(74,222,128,0.10)' : 'rgba(34,197,94,0.10)',
      color: isDarkMode ? '#86EFAC' : '#166534',
      border: isDarkMode ? '1px solid rgba(74,222,128,0.22)' : '1px solid rgba(34,197,94,0.22)',
      dot: '#22C55E',
      tooltip: 'Paid accounts',
    },
    {
      label: 'CD',
      count: treeStats.cd,
      bg: isDarkMode ? 'rgba(248,113,113,0.10)' : 'rgba(239,68,68,0.10)',
      color: isDarkMode ? '#FCA5A5' : '#B91C1C',
      border: isDarkMode ? '1px solid rgba(248,113,113,0.22)' : '1px solid rgba(239,68,68,0.22)',
      dot: '#EF4444',
      tooltip: 'Commission Deduction (unpaid)',
    },
    {
      label: 'CD-Paid',
      count: treeStats.cdPaid,
      bg: isDarkMode ? 'rgba(250,204,21,0.10)' : 'rgba(234,179,8,0.10)',
      color: isDarkMode ? '#FDE68A' : '#92400E',
      border: isDarkMode ? '1px solid rgba(250,204,21,0.22)' : '1px solid rgba(234,179,8,0.22)',
      dot: '#F59E0B',
      tooltip: 'CD fully recovered',
    },
    {
      label: 'FS',
      count: treeStats.fs,
      bg: isDarkMode ? 'rgba(96,165,250,0.10)' : 'rgba(59,130,246,0.10)',
      color: isDarkMode ? '#BFDBFE' : '#1D4ED8',
      border: isDarkMode ? '1px solid rgba(96,165,250,0.22)' : '1px solid rgba(59,130,246,0.22)',
      dot: '#3B82F6',
      tooltip: 'Free Slot',
    },
    {
      label: 'Total BP',
      count: fmtInt(treeStats.totalBp / 250),
      bg: isDarkMode ? 'rgba(212,175,55,0.10)' : 'rgba(212,175,55,0.10)',
      color: isDarkMode ? '#F4D675' : '#7A5C08',
      border: isDarkMode ? '1px solid rgba(212,175,55,0.24)' : '1px solid rgba(212,175,55,0.24)',
      dot: '#D4AF37',
      tooltip: 'Total Binary Points (in BP units) in this view',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: chrome.heading }}>Account Genealogy</h1>
          <div className="mt-2 h-0.5 w-12 rounded-full" style={{ background: 'linear-gradient(90deg, #D4AF37, transparent)' }} />
          <p className="mt-3 text-sm" style={{ color: chrome.subtext }}>
            Inspect deeper binary branches with the same premium tree canvas, stronger contrast, and clearer member hierarchy.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="text"
            value={searchUsername}
            onChange={(event) => setSearchUsername(event.target.value)}
            className="min-w-[260px] rounded-xl px-4 py-2.5 text-sm outline-none transition-all duration-200"
            style={{ background: chrome.searchBg, color: chrome.searchText, border: `1px solid ${chrome.searchBorder}` }}
            placeholder="Type a username to open its tree"
          />
          <button
            type="submit"
            className="rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={amberButtonStyle}
          >
            Open Tree
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchUsername('');
              setSearchParams({ depth: String(selectedDepth) });
            }}
            className="rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
            style={neutralButtonStyle}
          >
            Clear
          </button>
        </form>
      </div>

      {/* ── Controls Panel ── */}
      <div className="relative z-30 rounded-3xl p-5" style={panelStyle}>
        <div className="relative z-40 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: chrome.heading }}>Rendered Levels</p>
            <p className="mt-1 text-xs" style={{ color: chrome.tertiary }}>
              Choose how deep the current branch renders on the canvas. Admin mode supports up to 20 levels.
            </p>
          </div>

          {/* ── Beautiful Level Dropdown (Admin) ── */}
          <div ref={levelDropdownRef} className="relative">
            <button
              type="button"
              onClick={() => setLevelDropdownOpen((v) => !v)}
              className="inline-flex min-w-[200px] items-center justify-between gap-3 rounded-2xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={{
                background: isDarkMode
                  ? 'linear-gradient(135deg, rgba(212,175,55,0.14), rgba(212,175,55,0.06))'
                  : 'linear-gradient(135deg, rgba(255,248,227,0.98), rgba(254,243,199,0.88))',
                border: `1.5px solid ${chrome.amberBorder}`,
                color: chrome.amberButtonText,
                boxShadow: isDarkMode
                  ? '0 4px 16px rgba(212,175,55,0.10)'
                  : '0 4px 12px rgba(212,175,55,0.14)',
              }}
            >
              <span className="flex items-center gap-2">
                <HiOutlineSparkles className="size-4" style={{ color: '#D4AF37' }} />
                <span>Level {selectedDepth}</span>
                {selectedDepth >= LARGE_DEPTH_THRESHOLD && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                    style={{
                      background: isDarkMode ? 'rgba(251,146,60,0.18)' : 'rgba(251,146,60,0.14)',
                      color: isDarkMode ? '#FED7AA' : '#C2410C',
                      border: isDarkMode ? '1px solid rgba(251,146,60,0.3)' : '1px solid rgba(251,146,60,0.28)',
                    }}
                  >
                    summary
                  </span>
                )}
              </span>
              <HiOutlineChevronDown
                className="size-4 transition-transform duration-200"
                style={{ transform: levelDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
              />
            </button>

            {levelDropdownOpen && (
              <div
                className="absolute right-0 top-full z-[90] mt-2 w-56 overflow-hidden rounded-2xl py-1.5"
                style={{
                  background: chrome.popoverBg,
                  border: `1px solid ${chrome.surfaceBorder}`,
                  boxShadow: chrome.popoverShadow,
                }}
              >
                <p
                  className="px-4 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-widest"
                  style={{ color: chrome.tertiary }}
                >
                  Select depth
                </p>
                {LEVEL_OPTIONS.map((level) => {
                  const isActive = selectedDepth === level;
                  const isLarge = level >= LARGE_DEPTH_THRESHOLD;
                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setDepth(level)}
                      className="flex w-full items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors duration-150"
                      style={{
                        background: isActive
                          ? (isDarkMode ? 'rgba(212,175,55,0.14)' : 'rgba(255,248,227,0.9)')
                          : 'transparent',
                        color: isActive ? chrome.amberButtonText : chrome.searchText,
                      }}
                    >
                      <span className="flex items-center gap-2">
                        {isActive && (
                          <span className="block size-1.5 rounded-full" style={{ background: '#D4AF37' }} />
                        )}
                        {!isActive && <span className="block size-1.5" />}
                        Level {level}
                      </span>
                      {isLarge && (
                        <span
                          className="rounded-full px-1.5 py-0.5 text-[9px] font-bold"
                          style={{
                            background: isDarkMode ? 'rgba(251,146,60,0.15)' : 'rgba(251,146,60,0.12)',
                            color: isDarkMode ? '#FED7AA' : '#C2410C',
                          }}
                        >
                          large
                        </span>
                      )}
                    </button>
                  );
                })}
                {selectedDepth >= LARGE_DEPTH_THRESHOLD && (
                  <p
                    className="border-t px-4 py-2.5 text-[10px] leading-4"
                    style={{ borderColor: chrome.surfaceBorder, color: chrome.tertiary }}
                  >
                    ⚡ Deep levels may summarize distant branches to keep the canvas readable.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        {loading && loadProgress > 0 && (
          <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-[11px]" style={{ color: chrome.tertiary }}>
              <span>Loading network data</span>
              <span>{Math.min(100, Math.round(loadProgress))}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full" style={{ background: chrome.surface }}>
              <div
                className="h-full rounded-full transition-all duration-200"
                style={{ width: `${Math.min(100, Math.round(loadProgress))}%`, background: 'linear-gradient(90deg, #D4AF37, #F9E08A)' }}
              />
            </div>
          </div>
        )}

        <div ref={searchBoxRef} className="relative z-[70] mt-4">
          <div className="relative max-w-xl">
            <HiOutlineSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2" style={{ color: chrome.tertiary }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search affiliated usernames in this visible tree..."
              className="w-full rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none transition-all duration-200"
              style={{ background: chrome.searchBg, color: chrome.searchText, border: `1px solid ${chrome.searchBorder}` }}
            />
          </div>

          {searchOpen && searchableMembers.length > 0 && (
            <div
              className="absolute left-0 top-full z-[80] mt-2 w-full max-w-xl overflow-hidden rounded-2xl"
              style={{ background: chrome.popoverBg, border: `1px solid ${chrome.surfaceBorder}`, boxShadow: chrome.popoverShadow }}
            >
              {searchableMembers.map((member, index) => (
                <button
                  key={`${member.publicUid || member.uid}-${member.depth}`}
                  type="button"
                  onClick={() => {
                    focusNode(member.publicUid || member.uid);
                    setSearchTerm(member.username || '');
                    setSearchOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm"
                  style={{
                    borderBottom: index === searchableMembers.length - 1 ? 'none' : `1px solid ${chrome.surfaceBorder}`,
                    color: chrome.searchText,
                  }}
                >
                  <div className="font-semibold">{member.username}</div>
                  <div className="mt-1 text-xs" style={{ color: chrome.tertiary }}>
                    {member.fullname || 'No full name'} • Level {member.depth}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Visible-level badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          {visibleLevels.length > 0 ? visibleLevels.map((level) => (
            <span
              key={level}
              className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
              style={{ background: chrome.surface, color: chrome.panelButtonText, border: `1px solid ${chrome.surfaceBorder}` }}
            >
              <HiOutlineSparkles className="size-3.5" style={{ color: '#D4AF37' }} />
              Level {level}
            </span>
          )) : (
            <span className="text-xs" style={{ color: chrome.tertiary }}>
              No downline levels are visible in this branch yet.
            </span>
          )}
        </div>
      </div>

      {!loading && !tree ? (
        <div className="rounded-3xl p-10 text-center" style={panelStyle}>
          <HiOutlineUsers className="mx-auto mb-4 size-10" style={{ color: chrome.emptyIcon }} />
          <h2 className="font-display text-xl font-semibold" style={{ color: chrome.heading }}>
            {rootId || rootUsername ? 'Genealogy could not be loaded' : 'Open an account tree'}
          </h2>
          <p className="mt-3 text-sm" style={{ color: chrome.subtext }}>
            {rootId || rootUsername
              ? 'We could not load that branch right now. Try another username or reload this account tree.'
              : 'Search for a username above to inspect that member\u2019s binary network.'}
          </p>
          {(rootId || rootUsername) && (
            <button
              type="button"
              onClick={() => {
                setSearchUsername('');
                setSearchParams({ depth: String(selectedDepth) });
              }}
              className="mt-6 inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
              style={amberButtonStyle}
            >
              <HiOutlineHome className="size-4" />
              Reset Search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div
            ref={flowShellRef}
            className={`rrelative z-10 overflow-hidden rounded-[1.75rem] ${isFullscreen ? 'genealogy-fullscreen-shell' : ''}`}
            style={panelStyle}
          >
            {/* Canvas header */}
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${chrome.surfaceBorder}` }}>
              <div>
                <h2 className="font-display text-lg font-semibold" style={{ color: chrome.heading }}>General Tree Canvas</h2>
                <p className="mt-1 text-xs" style={{ color: chrome.tertiary }}>
                  Scroll, drag, zoom, and click any node to reload the genealogy from that member.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <div className="hidden items-center gap-2 text-xs sm:flex" style={{ color: chrome.amberButtonText }}>
                  <HiOutlineZoomIn className="size-4" />
                  Zoom enabled
                </div>
                <button
                  type="button"
                  onClick={resetView}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  style={neutralButtonStyle}
                >
                  Reset View
                </button>

                {/* ── Export Dropdown ── */}
                <div ref={exportDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => !exportingFormat && setExportDropdownOpen((v) => !v)}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-60"
                    style={{
                      background: isDarkMode ? 'rgba(212,175,55,0.18)' : 'rgba(255,248,227,0.96)',
                      color: isDarkMode ? '#F4D675' : '#7A5C08',
                      border: `1.5px solid ${chrome.amberBorder}`,
                    }}
                  >
                    {exportingFormat ? (
                      <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <HiOutlineDownload className="size-3.5" />
                    )}
                    {exportingFormat ? 'Exporting…' : 'Export'}
                    <HiOutlineChevronDown
                      className="size-3 transition-transform duration-200"
                      style={{ transform: exportDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                    />
                  </button>

                  {exportDropdownOpen && (
                    <div
                      className="absolute right-0 top-full z-[90] mt-2 w-60 overflow-hidden rounded-2xl py-2"
                      style={{
                        background: chrome.popoverBg ?? chrome.surfaceStrong,
                        border: `1px solid ${chrome.surfaceBorder}`,
                        boxShadow: isDarkMode
                          ? '0 20px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(212,175,55,0.08)'
                          : '0 16px 40px rgba(15,23,42,0.14), 0 0 0 1px rgba(0,0,0,0.04)',
                        backdropFilter: 'blur(20px)',
                      }}
                    >
                      <p
                        className="px-4 pb-1 pt-2.5 text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: chrome.tertiary }}
                      >
                        Image
                      </p>
                      {[
                        {
                          key: 'png',
                          label: 'PNG',
                          desc: 'Lossless · 3× HiDPI',
                          Icon: HiOutlinePhotograph,
                          action: handleExportPng,
                          iconBg: 'rgba(212,175,55,0.16)',
                          iconColor: isDarkMode ? '#F4D675' : '#7A5C08',
                        },
                        {
                          key: 'jpeg',
                          label: 'JPEG',
                          desc: 'Smaller file · 92% quality',
                          Icon: HiOutlinePhotograph,
                          action: handleExportJpeg,
                          iconBg: 'rgba(96,165,250,0.14)',
                          iconColor: isDarkMode ? '#93C5FD' : '#1D4ED8',
                        },
                        {
                          key: 'svg',
                          label: 'SVG Vector',
                          desc: 'Scalable · print-ready',
                          Icon: HiOutlineCode,
                          action: handleExportSvg,
                          iconBg: 'rgba(74,222,128,0.14)',
                          iconColor: isDarkMode ? '#86EFAC' : '#166534',
                        },
                      ].map(({ key, label, desc, Icon, action, iconBg, iconColor }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={action}
                          disabled={!!exportingFormat}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150 hover:bg-white/5 disabled:pointer-events-none"
                          style={{ opacity: exportingFormat && exportingFormat !== key ? 0.45 : 1 }}
                        >
                          <span
                            className="flex size-8 flex-shrink-0 items-center justify-center rounded-xl"
                            style={{ background: iconBg }}
                          >
                            {exportingFormat === key ? (
                              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: iconColor }} />
                            ) : (
                              <Icon className="size-4" style={{ color: iconColor }} />
                            )}
                          </span>
                          <span>
                            <p className="text-xs font-semibold" style={{ color: chrome.searchText ?? chrome.heading }}>{label}</p>
                            <p className="text-[10px]" style={{ color: chrome.tertiary }}>{desc}</p>
                          </span>
                        </button>
                      ))}

                      <div className="mx-3 my-1.5 border-t" style={{ borderColor: chrome.surfaceBorder }} />

                      <p
                        className="px-4 pb-1 text-[9px] font-bold uppercase tracking-widest"
                        style={{ color: chrome.tertiary }}
                      >
                        Data Reports
                      </p>
                      {[
                        {
                          key: 'csv',
                          label: 'CSV Spreadsheet',
                          desc: 'Member list, levels, and BP',
                          Icon: HiOutlineTable,
                          action: handleExportCsv,
                          iconBg: 'rgba(34,197,94,0.14)',
                          iconColor: isDarkMode ? '#86EFAC' : '#166534',
                        },
                        {
                          key: 'docx',
                          label: 'DOCX Report',
                          desc: 'Narrative text report',
                          Icon: HiOutlineDocumentText,
                          action: handleExportDocx,
                          iconBg: 'rgba(99,102,241,0.14)',
                          iconColor: isDarkMode ? '#A5B4FC' : '#4338CA',
                        },
                      ].map(({ key, label, desc, Icon, action, iconBg, iconColor }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={action}
                          disabled={!!exportingFormat || network.length === 0}
                          className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors duration-150 hover:bg-white/5 disabled:pointer-events-none"
                          style={{ opacity: exportingFormat && exportingFormat !== key ? 0.45 : network.length === 0 ? 0.4 : 1 }}
                        >
                          <span
                            className="flex size-8 flex-shrink-0 items-center justify-center rounded-xl"
                            style={{ background: iconBg }}
                          >
                            {exportingFormat === key ? (
                              <span className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" style={{ color: iconColor }} />
                            ) : (
                              <Icon className="size-4" style={{ color: iconColor }} />
                            )}
                          </span>
                          <span>
                            <p className="text-xs font-semibold" style={{ color: chrome.searchText ?? chrome.heading }}>{label}</p>
                            <p className="text-[10px]" style={{ color: chrome.tertiary }}>{desc}</p>
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-200 hover:-translate-y-0.5"
                  style={amberButtonStyle}
                >
                  {isFullscreen ? <HiOutlineMinusSm className="size-4" /> : <HiOutlineArrowsExpand className="size-4" />}
                  {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                </button>
              </div>
            </div>

            <div
              ref={canvasDivRef}
              className={`ggenealogy-canvas-shell relative ${isFullscreen ? 'h-screen min-h-screen' : 'h-[62vh] min-h-[520px]'}`}
              style={{ touchAction: canvasActive ? 'none' : 'pan-y pinch-zoom' }}
            >
              {!canvasActive ? (
                <button
                  type="button"
                  aria-label="Activate genealogy canvas"
                  onClick={activateCanvas}
                  className="absolute inset-0 z-10 block cursor-grab bg-transparent"
                />
              ) : null}
              {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]" style={{ background: chrome.canvasOverlay }}>
                  <Spinner />
                </div>
              )}
              <ReactFlow
                onInit={(instance) => {
                  reactFlowRef.current = instance;
                }}
                className="genealogy-flow size-full"
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                minZoom={0.15}
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

              <div
                className="pointer-events-none absolute bottom-4 left-4 z-20 rounded-xl px-3 py-2 text-xs font-semibold"
                style={{
                  background: chrome.canvasBadgeBg,
                  color: canvasActive ? chrome.canvasActiveText : chrome.canvasPassiveText,
                  border: `1px solid ${chrome.surfaceBorder}`,
                }}
              >
                {canvasActive ? 'Canvas active: drag and zoom enabled' : 'Click the canvas first to drag and zoom. Page scroll stays normal until then.'}
              </div>
            </div>

            {/* ── Account State Stats Bar ── */}
            {network.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 px-5 py-3" style={{ borderTop: `1px solid ${chrome.surfaceBorder}` }}>
                <span className="mr-1 text-[11px] font-semibold" style={{ color: chrome.tertiary }}>Tree stats:</span>
                {statChips.map((chip) => (
                  <div
                    key={chip.label}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold"
                    style={{ background: chip.bg, color: chip.color, border: chip.border }}
                    title={chip.tooltip}
                  >
                    <span className="size-1.5 rounded-full flex-shrink-0" style={{ background: chip.dot }} />
                    {chip.label}: {chip.count}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 gap-5 xl:grid-cols-[280px_minmax(0,1fr)_340px]">
            <div className="rounded-3xl p-5" style={panelStyle}>
              <h2 className="font-display text-lg font-semibold" style={{ color: chrome.heading }}>Branch Summary</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-2xl p-3" style={insetCardStyle}>
                  <p style={{ color: chrome.tertiary }}>Focused Root</p>
                  <p className="mt-1 font-bold" style={{ color: chrome.heading }}>{tree?.username || rootUsername || 'Member'}</p>
                </div>
                <div className="rounded-2xl p-3" style={insetCardStyle}>
                  <p style={{ color: chrome.tertiary }}>Visible Members</p>
                  <p className="mt-1 font-bold" style={{ color: chrome.heading }}>{fmtInt(network.length)}</p>
                </div>
                <div className="rounded-2xl p-3" style={insetCardStyle}>
                  <p style={{ color: chrome.tertiary }}>Depth Loaded</p>
                  <p className="mt-1 font-bold" style={{ color: chrome.heading }}>Level {selectedDepth}</p>
                </div>
                <div className="rounded-2xl p-3" style={insetCardStyle}>
                  <p style={{ color: chrome.tertiary }}>Tree Mode</p>
                  <p className="mt-1 font-bold" style={{ color: chrome.heading }}>Binary</p>
                </div>
              </div>
            </div>

            <div className="min-h-0 rounded-3xl p-5" style={panelStyle}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold" style={{ color: chrome.heading }}>Affiliated Members</h2>
                  <p className="mt-1 text-xs" style={{ color: chrome.tertiary }}>
                    List view of the members under the current root and the level where they sit.
                  </p>
                </div>
              </div>

              <div className="mt-4 max-h-[42vh] space-y-3 overflow-auto pr-1 xl:max-h-[36vh]">
                {network.map((member) => {
                  const packageStyle = PACKAGE_STYLES[member.accttypeName] || PACKAGE_STYLES.Bronze;
                  const statusStyle = getAccountStateChipStyle(member.accountStateLabel || 'PD', isDarkMode);
                  return (
                    <button
                      type="button"
                      key={`${member.publicUid || member.uid}-${member.depth}`}
                      onClick={() => setRoot(member.publicUid || member.uid)}
                      className="w-full rounded-2xl p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
                      style={insetCardStyle}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" style={{ color: chrome.heading }}>
                            {member.fullname || member.username}
                          </p>
                          <p className="mt-1 truncate text-[11px]" style={{ color: chrome.tertiary }}>
                            {member.username || `Member ${member.uid}`}
                          </p>
                        </div>
                        <span
                          className="rounded-full px-2 py-1 text-[10px] font-bold"
                          style={{ background: chrome.amberButtonBg, color: chrome.amberButtonText, border: `1px solid ${chrome.amberBorder}` }}
                        >
                          L{member.depth}
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px]">
                        <div>
                          <p style={{ color: chrome.tertiary }}>Package</p>
                          <p className="mt-1 font-semibold" style={{ color: packageStyle.strong }}>{member.accttypeName}</p>
                        </div>
                        <div>
                          <p style={{ color: chrome.tertiary }}>Side</p>
                          <p className="mt-1 font-semibold" style={{ color: chrome.heading }}>{legLabel(member.leg)}</p>
                        </div>
                        <div>
                          <p style={{ color: chrome.tertiary }}>Status</p>
                          <span className="mt-1 inline-flex rounded-full px-2 py-1 text-[10px] font-semibold" style={statusStyle}>
                            {member.accountStateLabel || 'PD'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {network.length === 0 && (
                  <div className="rounded-2xl p-8 text-center" style={insetCardStyle}>
                    <HiOutlineUsers className="mx-auto mb-3 size-8" style={{ color: chrome.emptyIcon }} />
                    <p className="text-sm" style={{ color: chrome.tertiary }}>
                      No affiliated members were returned for this level range yet.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-3xl p-5" style={panelStyle}>
              <h2 className="font-display text-lg font-semibold" style={{ color: chrome.heading }}>How To Use The Tree</h2>
              <div className="mt-4 grid grid-cols-1 gap-3 text-sm">
                <div className="rounded-2xl p-4" style={insetCardStyle}>
                  <p className="font-semibold" style={{ color: chrome.heading }}>Zoom and pan</p>
                  <p className="mt-2" style={{ color: chrome.subtext }}>
                    Use your mouse wheel or trackpad to zoom, then drag the canvas to move across wider branches.
                  </p>
                </div>
                <div className="rounded-2xl p-4" style={insetCardStyle}>
                  <p className="font-semibold" style={{ color: chrome.heading }}>Choose level depth</p>
                  <p className="mt-2" style={{ color: chrome.subtext }}>
                    The dropdown lets admin inspect from level 1 up to 20. Levels ≥10 use a summary mode for large trees.
                  </p>
                </div>
                <div className="rounded-2xl p-4" style={insetCardStyle}>
                  <p className="font-semibold" style={{ color: chrome.heading }}>Export data</p>
                  <p className="mt-2" style={{ color: chrome.subtext }}>
                    Use PNG for a full canvas screenshot, CSV for a complete tabular export, or DOCX for a printable admin report.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
