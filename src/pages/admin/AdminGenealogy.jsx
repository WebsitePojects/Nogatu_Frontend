import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Background, BackgroundVariant, Controls, ReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  HiOutlineArrowsExpand,
  HiOutlineHome,
  HiOutlineMinusSm,
  HiOutlineSearch,
  HiOutlineSparkles,
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

const LEVEL_OPTIONS = [3, 5, 7, 10, 12, 15, 20];

export default function AdminGenealogy() {
  const { isDarkMode } = useTheme();
  const reactFlowRef = useRef(null);
  const flowShellRef = useRef(null);
  const searchBoxRef = useRef(null);
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
          api.get(`/admin/genealogy/tree?${rootParam}&depth=${selectedDepth}`),
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
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setCanvasActive(false);
        setSearchOpen(false);
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

      <div className="relative z-30 rounded-3xl p-5" style={panelStyle}>
        <div className="relative z-40 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: chrome.heading }}>Rendered Levels</p>
            <p className="mt-1 text-xs" style={{ color: chrome.tertiary }}>
              Choose how deep the current branch should render on the canvas. Admin mode can inspect up to 20 levels.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {LEVEL_OPTIONS.map((level) => (
              <button
                type="button"
                key={level}
                onClick={() => setDepth(level)}
                className="rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5"
                style={selectedDepth === level ? amberButtonStyle : neutralButtonStyle}
              >
                Level {level}
              </button>
            ))}
          </div>
        </div>

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
              : 'Search for a username above to inspect that member’s binary network.'}
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
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${chrome.surfaceBorder}` }}>
              <div>
                <h2 className="font-display text-lg font-semibold" style={{ color: chrome.heading }}>General Tree Canvas</h2>
                <p className="mt-1 text-xs" style={{ color: chrome.tertiary }}>
                  Scroll, drag, zoom, and click any node to reload the genealogy from that member.
                </p>
              </div>
              <div className="flex items-center gap-2">
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
                    The level selector lets admin inspect from a quick 3-level view up to 20 levels without changing the tree logic.
                  </p>
                </div>
                <div className="rounded-2xl p-4" style={insetCardStyle}>
                  <p className="font-semibold" style={{ color: chrome.heading }}>Open a member branch</p>
                  <p className="mt-2" style={{ color: chrome.subtext }}>
                    Click any node on the canvas or any member in the list to reload the genealogy from that account.
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
