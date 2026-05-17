import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dagre from '@dagrejs/dagre';
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  Handle,
  Position,
  ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  HiOutlineArrowsExpand,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlinePlusCircle,
  HiOutlineHome,
  HiOutlineMinusSm,
  HiOutlineSearch,
  HiOutlineSparkles,
  HiOutlineUsers,
  HiOutlineZoomIn,
} from 'react-icons/hi';

const LEVEL_OPTIONS = [3, 5, 7, 10, 12];
const NODE_WIDTH = 208;
const NODE_HEIGHT = 102;
const JUNCTION_SIZE = 16;
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });
const BP_UNIT_VALUE = 250;

function formatBinaryPackagePoints(binaryPoints) {
  const raw = Number(binaryPoints || 0);
  if (!raw) return '0 BP';
  const bp = raw / BP_UNIT_VALUE;
  if (Number.isInteger(bp)) return `${fmtInt(bp)} BP`;
  return `${fmtInt(raw)} pts`;
}

function getPositionLabel(position, level) {
  if (level === 0 || position === 'self') return 'Root';
  if (position === 1 || position === 'left') return 'Left Leg';
  if (position === 2 || position === 'right') return 'Right Leg';
  return 'Team';
}

function getAccountStateChipStyle(label, isDarkMode) {
  if (label === 'PD') {
    return isDarkMode
      ? { background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.28)' }
      : { background: 'rgba(22,163,74,0.1)', color: '#166534', border: '1px solid rgba(22,163,74,0.22)' };
  }
  if (label === 'FS') {
    return isDarkMode
      ? { background: 'rgba(96,165,250,0.12)', color: '#93C5FD', border: '1px solid rgba(96,165,250,0.28)' }
      : { background: 'rgba(59,130,246,0.1)', color: '#1D4ED8', border: '1px solid rgba(59,130,246,0.22)' };
  }
  if (label === 'CD - Paid') {
    return isDarkMode
      ? { background: 'rgba(250,204,21,0.14)', color: '#FDE68A', border: '1px solid rgba(250,204,21,0.28)' }
      : { background: 'rgba(234,179,8,0.12)', color: '#92400E', border: '1px solid rgba(234,179,8,0.24)' };
  }
  return isDarkMode
    ? { background: 'rgba(248,113,113,0.12)', color: '#FCA5A5', border: '1px solid rgba(248,113,113,0.28)' }
    : { background: 'rgba(239,68,68,0.1)', color: '#B91C1C', border: '1px solid rgba(239,68,68,0.22)' };
}

const PACKAGE_STYLES = {
  Bronze:   { border: '#C9732E', accent: '#E59A57', glow: 'rgba(201,115,46,0.36)', bg: 'linear-gradient(180deg, rgba(201,115,46,0.28), rgba(31,18,10,0.97))', mini: '#C9732E' },
  Silver:   { border: '#B8C2CC', accent: '#E5ECF3', glow: 'rgba(184,194,204,0.34)', bg: 'linear-gradient(180deg, rgba(184,194,204,0.24), rgba(19,20,24,0.97))', mini: '#B8C2CC' },
  Gold:     { border: '#E1B73B', accent: '#F9E08A', glow: 'rgba(225,183,59,0.38)', bg: 'linear-gradient(180deg, rgba(225,183,59,0.26), rgba(31,23,8,0.97))', mini: '#E1B73B' },
  Platinum: { border: '#6FB0B6', accent: '#BDE3E7', glow: 'rgba(111,176,182,0.34)', bg: 'linear-gradient(180deg, rgba(111,176,182,0.25), rgba(14,24,26,0.97))', mini: '#6FB0B6' },
  Garnet:   { border: '#A8253B', accent: '#E4697D', glow: 'rgba(168,37,59,0.38)', bg: 'linear-gradient(180deg, rgba(168,37,59,0.25), rgba(29,10,14,0.97))', mini: '#A8253B' },
  Diamond:  { border: '#5CCFFF', accent: '#D9F6FF', glow: 'rgba(92,207,255,0.4)', bg: 'linear-gradient(180deg, rgba(92,207,255,0.24), rgba(10,21,28,0.97))', mini: '#5CCFFF' },
};

function getNodeAppearance(style, isDarkMode) {
  if (isDarkMode) {
    return {
      background: style.bg,
      border: style.border,
      accent: style.accent,
      glow: style.glow,
      text: '#FFFFFF',
      subtext: 'rgba(255,255,255,0.5)',
      badgeBg: 'rgba(0,0,0,0.26)',
      badgeText: '#F2D06B',
      pillBg: 'rgba(255,255,255,0.08)',
      positionText: 'rgba(255,255,255,0.62)',
      handleBg: '#120f0a',
      muted: 'rgba(255,255,255,0.48)',
    };
  }

  return {
    background: `linear-gradient(180deg, rgba(255,255,255,0.98), ${style.border}22)`,
    border: `${style.border}88`,
    accent: '#7A5C08',
    glow: 'rgba(212,175,55,0.16)',
    text: '#2F2412',
    subtext: 'rgba(74,56,18,0.72)',
    badgeBg: 'rgba(212,175,55,0.12)',
    badgeText: '#7A5C08',
    pillBg: 'rgba(255,255,255,0.82)',
    positionText: 'rgba(74,56,18,0.78)',
    handleBg: '#FFF7E3',
    muted: 'rgba(74,56,18,0.72)',
  };
}

function normalizePackageType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'bronze') return 'Bronze';
  if (raw === 'silver') return 'Silver';
  if (raw === 'gold') return 'Gold';
  if (raw === 'platinum') return 'Platinum';
  if (raw === 'garnet') return 'Garnet';
  if (raw === 'diamond') return 'Diamond';
  return 'Bronze';
}

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="w-12 h-12 rounded-full border-[3px] animate-spin"
        style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }}
      />
      <p className="text-sm" style={{ color: 'rgba(212,175,55,0.55)' }}>Loading genealogy...</p>
    </div>
  );
}

function MemberNode({ data }) {
  const packageName = normalizePackageType(data.packageType);
  const style = PACKAGE_STYLES[packageName] || PACKAGE_STYLES.Bronze;
  const tone = getNodeAppearance(style, Boolean(data.isDarkMode));
  const stateChip = getAccountStateChipStyle(data.accountStateLabel || 'PD', Boolean(data.isDarkMode));

  const primaryLabel = data.fullname && String(data.fullname).trim() && String(data.fullname).trim().toLowerCase() !== String(data.username || '').trim().toLowerCase()
    ? data.fullname
    : (data.username || data.displayName || `Member ${data.internalUid}`);
  const secondaryLabel = data.username && primaryLabel.trim().toLowerCase() !== String(data.username).trim().toLowerCase()
    ? data.username
    : '';
  const isPrimaryLong = String(primaryLabel || '').length > 16;

  return (
    <button
      type="button"
      onClick={() => {
        if (!data.canvasActive) {
          data.onActivateCanvas?.();
          return;
        }
        data.onOpen?.();
      }}
      className="w-full rounded-2xl p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 relative overflow-hidden"
      style={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        background: tone.background,
        border: data.highlighted ? '2px solid rgba(74,222,128,0.95)' : `1px solid ${tone.border}`,
        boxShadow: data.highlighted
          ? '0 0 0 3px rgba(74,222,128,0.22), 0 0 28px rgba(74,222,128,0.38)'
          : `0 12px 30px ${tone.glow}`,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={{
          top: -8,
          width: 14,
          height: 14,
          borderRadius: '999px',
          border: `2px solid ${tone.accent}`,
          background: tone.handleBg,
          boxShadow: `0 0 0 3px ${tone.glow}`,
        }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={{
          bottom: -8,
          width: 14,
          height: 14,
          borderRadius: '999px',
          border: `2px solid ${tone.accent}`,
          background: tone.handleBg,
          boxShadow: `0 0 0 3px ${tone.glow}`,
        }}
      />

      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${style.border}, ${tone.accent})` }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={`genealogy-name-marquee ${isPrimaryLong ? 'is-animated' : ''}`} style={{ color: tone.text }}>
            <div className={`genealogy-name-track ${isPrimaryLong ? 'is-animated' : ''}`}>
              <span className="text-base font-bold whitespace-nowrap">{primaryLabel}</span>
              {isPrimaryLong ? <span className="text-base font-bold whitespace-nowrap genealogy-name-ghost">{primaryLabel}</span> : null}
            </div>
          </div>
          {secondaryLabel ? (
            <p className="text-[11px] mt-1 truncate" style={{ color: tone.subtext }}>
              {secondaryLabel}
            </p>
          ) : null}
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: tone.badgeBg, color: tone.badgeText, border: '1px solid rgba(212,175,55,0.3)' }}>
          L{data.level}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4 gap-2">
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: tone.pillBg, color: tone.accent, border: `1px solid ${style.border}` }}>
          {packageName}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap" style={stateChip}>
            {data.accountStateLabel || 'PD'}
          </span>
          <span className="text-[11px]" style={{ color: tone.positionText }}>
            {data.positionLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 text-[11px]">
        <span style={{ color: tone.muted }}>Binary Value</span>
        <span className="font-semibold" style={{ color: tone.text }}>{formatBinaryPackagePoints(data.binaryPoints)}</span>
      </div>

      {Number(data.childCount || 0) > 0 && (
        <div className="mt-3 text-[10px] font-medium" style={{ color: tone.accent }}>
          + {data.childCount} more member{Number(data.childCount) > 1 ? 's' : ''} below this level
        </div>
      )}
    </button>
  );
}

function JunctionNode() {
  return (
    <div
      className="relative"
      style={{
        width: JUNCTION_SIZE,
        height: JUNCTION_SIZE,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={{
          top: -5,
          width: 10,
          height: 10,
          borderRadius: '999px',
          border: '2px solid #F9E08A',
          background: '#FFF7E3',
          boxShadow: '0 0 0 3px rgba(242,208,107,0.18)',
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, #F9E08A 0%, #D4AF37 48%, rgba(212,175,55,0.28) 100%)',
          boxShadow: '0 0 16px rgba(242,208,107,0.45)',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={{
          bottom: -5,
          width: 10,
          height: 10,
          borderRadius: '999px',
          border: '2px solid #F9E08A',
          background: '#FFF7E3',
          boxShadow: '0 0 0 3px rgba(242,208,107,0.18)',
        }}
      />
    </div>
  );
}

function PlaceholderNode({ data }) {
  const isDarkMode = Boolean(data.isDarkMode);
  return (
    <button
      type="button"
      onClick={() => {
        if (!data.canvasActive) {
          data.onActivateCanvas?.();
          return;
        }
        data.onRegister?.();
      }}
      className="w-full rounded-2xl p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 relative overflow-hidden"
      style={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        background: isDarkMode
          ? 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(18,16,10,0.92))'
          : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(255,247,227,0.98))',
        border: '2px dashed rgba(74,222,128,0.75)',
        boxShadow: isDarkMode ? '0 10px 24px rgba(0,0,0,0.24), 0 0 0 2px rgba(74,222,128,0.16)' : '0 10px 24px rgba(212,175,55,0.14), 0 0 0 2px rgba(74,222,128,0.12)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={{
          top: -8,
          width: 14,
          height: 14,
          borderRadius: '999px',
          border: '2px solid #F2D06B',
          background: isDarkMode ? '#120f0a' : '#FFF7E3',
          boxShadow: '0 0 0 3px rgba(242,208,107,0.18)',
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold" style={{ color: isDarkMode ? '#FFFFFF' : '#2F2412' }}>Open Slot</p>
          <p className="text-[11px] mt-1" style={{ color: isDarkMode ? 'rgba(255,255,255,0.54)' : 'rgba(74,56,18,0.72)' }}>
            {data.positionLabel}
          </p>
        </div>
        <span
          className="inline-flex items-center justify-center rounded-full"
          style={{
            width: 28,
            height: 28,
            background: 'rgba(74,222,128,0.12)',
            border: '1px solid rgba(74,222,128,0.45)',
            color: '#4ADE80',
          }}
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
        </span>
      </div>

      <div className="mt-5 rounded-xl px-3 py-2 text-[11px] font-semibold inline-flex items-center gap-2"
        style={{ background: 'rgba(74,222,128,0.1)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.22)' }}>
        Register new member here
      </div>

      <p className="mt-4 text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
        {isDarkMode
          ? 'Registration will verify the live binary placement policy before saving this slot.'
          : 'The registration screen will verify the live binary placement policy before saving this slot.'}
      </p>
    </button>
  );
}

function TreeEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
}) {
  const midY = sourceY + (targetY - sourceY) / 2;
  const path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
  const edgeStroke = style.stroke || 'rgba(242,208,107,0.9)';
  const edgeWidth = style.strokeWidth || 2.6;

  return (
    <>
      <BaseEdge id={id} path={path} style={{ ...style, stroke: edgeStroke, strokeWidth: edgeWidth }} />
      <circle cx={sourceX} cy={midY} r="2.8" fill="#F2D06B" opacity="0.76" />
      {Math.abs(targetX - sourceX) > 1 && <circle cx={targetX} cy={midY} r="2.8" fill="#F2D06B" opacity="0.76" />}
    </>
  );
}

function flattenTree(node, level = 0, maxRenderLevel = 5, bucket = { nodes: [], edges: [] }) {
  if (!node) return bucket;

  const nodeId = String(node.publicUid || node.uid);

  bucket.nodes.push({
    id: nodeId,
    type: 'memberNode',
    data: {
      ...node,
      packageType: normalizePackageType(node.packageType || node.accttypeName),
      level,
      positionLabel: getPositionLabel(node.position, level),
    },
    position: { x: 0, y: 0 },
  });

  const hasVisibleChildRoom = level < maxRenderLevel - 1;
  const children = [];

  if (node.left) {
    children.push({ ...node.left, __branchSide: 'left' });
  } else if (hasVisibleChildRoom && node.hasLeftSlot) {
    children.push({
      uid: `${nodeId}::placeholder-left`,
      internalUid: node.uid,
      publicUid: null,
      isPlaceholder: true,
      position: 1,
      __branchSide: 'left',
      positionLabel: 'Left Leg',
    });
  }

  if (node.right) {
    children.push({ ...node.right, __branchSide: 'right' });
  } else if (hasVisibleChildRoom && node.hasRightSlot) {
    children.push({
      uid: `${nodeId}::placeholder-right`,
      internalUid: node.uid,
      publicUid: null,
      isPlaceholder: true,
      position: 2,
      __branchSide: 'right',
      positionLabel: 'Right Leg',
    });
  }

  // Dagre mirrors sibling insertion order in this tree, so keep the right branch first
  // here to render the actual left leg on the left side of the canvas.
  children.sort((a, b) => {
    const weight = (value) => (value.__branchSide === 'right' ? 0 : 1);
    return weight(a) - weight(b);
  });

  if (children.length > 1) {
    const junctionId = `${nodeId}::junction`;
    bucket.nodes.push({
      id: junctionId,
      type: 'junctionNode',
      data: { level: level + 0.5, isJunction: true },
      position: { x: 0, y: 0 },
    });

    bucket.edges.push({
      id: `${nodeId}-${junctionId}`,
      source: nodeId,
      target: junctionId,
      type: 'treeEdge',
      animated: false,
      style: { stroke: 'rgba(242,208,107,0.94)', strokeWidth: 2.8 },
    });

    children.forEach((child) => {
      const childId = String(child.publicUid || child.uid);
      if (child.isPlaceholder) {
        bucket.nodes.push({
          id: childId,
          type: 'placeholderNode',
          data: {
            ...child,
            level: level + 1,
            positionLabel: getPositionLabel(child.position, level + 1),
          },
          position: { x: 0, y: 0 },
        });
      } else {
        flattenTree(child, level + 1, maxRenderLevel, bucket);
      }
      bucket.edges.push({
        id: `${junctionId}-${childId}`,
        source: junctionId,
        target: childId,
        type: 'treeEdge',
        animated: false,
        style: { stroke: 'rgba(242,208,107,0.9)', strokeWidth: 2.6 },
      });
    });
  } else if (children.length === 1) {
    const child = children[0];
    const childId = String(child.publicUid || child.uid);
    if (child.isPlaceholder) {
      bucket.nodes.push({
        id: childId,
        type: 'placeholderNode',
        data: {
          ...child,
          level: level + 1,
          positionLabel: getPositionLabel(child.position, level + 1),
        },
        position: { x: 0, y: 0 },
      });
    } else {
      flattenTree(child, level + 1, maxRenderLevel, bucket);
    }
    bucket.edges.push({
      id: `${nodeId}-${childId}`,
      source: nodeId,
      target: childId,
      type: 'treeEdge',
      animated: false,
      style: { stroke: 'rgba(242,208,107,0.9)', strokeWidth: 2.6 },
    });
  }

  return bucket;
}

function layoutGraph(nodes, edges) {
  const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'TB', ranksep: 92, nodesep: 32, marginx: 30, marginy: 30 });

  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: node.type === 'junctionNode' ? JUNCTION_SIZE : NODE_WIDTH,
      height: node.type === 'junctionNode' ? JUNCTION_SIZE : NODE_HEIGHT,
    });
  });
  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  dagre.layout(graph);

  return nodes.map((node) => {
    const pos = graph.node(node.id);
    const width = node.type === 'junctionNode' ? JUNCTION_SIZE : NODE_WIDTH;
    const height = node.type === 'junctionNode' ? JUNCTION_SIZE : NODE_HEIGHT;
    return {
      ...node,
      sourcePosition: 'bottom',
      targetPosition: 'top',
      position: { x: pos.x - width / 2, y: pos.y - height / 2 },
    };
  });
}

function legLabel(leg) {
  if (leg === 'left') return 'Left team';
  if (leg === 'right') return 'Right team';
  return 'Team';
}

export default function GenealogyTree() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
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

  const selfRootId = user?.publicUid || user?.public_uid || user?.uid;
  const rootId = searchParams.get('id') || selfRootId;
  const selectedDepth = LEVEL_OPTIONS.includes(Number(searchParams.get('depth')))
    ? Number(searchParams.get('depth'))
    : 5;

  useEffect(() => {
    if (!rootId) return;
    let cancelled = false;

    async function loadTreeData() {
      setLoading(true);
      try {
        const [treeRes, networkRes] = await Promise.all([
          api.get(`/genealogy/tree?root=${rootId}&depth=${selectedDepth}`),
          api.get(`/genealogy/network?root=${rootId}&depth=${selectedDepth}`),
        ]);

        if (!cancelled) {
          setTree(treeRes.data.tree);
          setNetwork(networkRes.data.network || []);
        }
      } catch {
        if (!cancelled) {
          setTree(null);
          setNetwork([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadTreeData();
    return () => { cancelled = true; };
  }, [rootId, selectedDepth]);

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
    setSearchParams(params);
  }

  function setDepth(nextDepth) {
    const params = { depth: String(nextDepth) };
    if (rootId) params.id = rootId;
    setSearchParams(params);
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
        onOpen: () => setRoot(node.id),
        onRegister: () => navigate(`/register?placement=${node.data.internalUid || node.data.uid}&position=${node.data.position || 1}`),
        onActivateCanvas: activateCanvas,
      },
    }));

    return {
      nodes: layoutGraph(graphNodes, flattened.edges),
      edges: flattened.edges,
    };
  }, [tree, selectedDepth, navigate, isDarkMode, highlightedNodeId, canvasActive]);

  useEffect(() => {
    if (!tree || !nodes.length) return;
    const timer = setTimeout(() => {
      reactFlowRef.current?.fitView({ padding: 0.08, duration: 350, maxZoom: 1.32, minZoom: 0.2 });
    }, 80);
    return () => clearTimeout(timer);
  }, [tree, rootId, selectedDepth, isFullscreen]);

  const nodeTypes = useMemo(() => ({ memberNode: MemberNode, junctionNode: JunctionNode, placeholderNode: PlaceholderNode }), []);
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Genealogy Tree</h1>
          <div className="w-10 h-0.5 mt-2 rounded-full" style={{ background: 'linear-gradient(90deg,#D4AF37,transparent)' }} />
          <p className="text-sm mt-3" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Zoom, pan, switch levels, and click any member node to open that branch as the new root.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {String(rootId) !== String(selfRootId) && (
            <button
              type="button"
              onClick={() => setRoot(selfRootId)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold"
              style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.2)' }}
            >
              <HiOutlineHome className="w-4 h-4" />
              My Tree
            </button>
          )}
          <button
            type="button"
            onClick={() => navigate('/referrals')}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold"
            style={isDarkMode
              ? { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.12)' }
              : { background: 'rgba(255,255,255,0.88)', color: '#7A5C08', border: '1px solid rgba(212,175,55,0.22)' }}
          >
            <HiOutlineUsers className="w-4 h-4" />
            Direct Referrals
          </button>
        </div>
      </div>

      <div className="glass-card relative z-30 rounded-2xl p-5">
        <div className="relative z-40 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Rendered Levels</p>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Choose how deep the current branch should render on the canvas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {LEVEL_OPTIONS.map((level) => (
              <button
                type="button"
                key={level}
                onClick={() => setDepth(level)}
                className="px-3.5 py-2 rounded-xl text-sm font-semibold"
                style={selectedDepth === level
                  ? { background: 'rgba(212,175,55,0.16)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.35)' }
                  : { background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                Level {level}
              </button>
            ))}
          </div>
        </div>

        <div ref={searchBoxRef} className="mt-4 relative z-[70]">
          <div className="relative max-w-xl">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: isDarkMode ? 'rgba(255,255,255,0.38)' : 'rgba(122,92,8,0.6)' }} />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search affiliated usernames in this visible tree..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
              style={isDarkMode
                ? { background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.09)' }
                : { background: 'rgba(255,255,255,0.95)', color: '#2F2412', border: '1px solid rgba(212,175,55,0.2)' }}
            />
          </div>

          {searchOpen && searchableMembers.length > 0 && (
            <div
              className="absolute left-0 top-full z-[80] mt-2 w-full max-w-xl rounded-2xl overflow-hidden"
              style={isDarkMode
                ? { background: '#15110b', border: '1px solid rgba(212,175,55,0.16)', boxShadow: '0 18px 38px rgba(0,0,0,0.35)' }
                : { background: '#ffffff', border: '1px solid rgba(212,175,55,0.18)', boxShadow: '0 18px 38px rgba(212,175,55,0.14)' }}
            >
              {searchableMembers.map((member) => (
                <button
                  key={`${member.publicUid || member.uid}-${member.depth}`}
                  type="button"
                  onClick={() => {
                    focusNode(member.publicUid || member.uid);
                    setSearchTerm(member.username || '');
                    setSearchOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-sm"
                  style={{ borderBottom: '1px solid rgba(212,175,55,0.08)', color: isDarkMode ? '#fff' : '#2F2412' }}
                >
                  <div className="font-semibold">{member.username}</div>
                  <div className="text-xs mt-1" style={{ color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(74,56,18,0.62)' }}>
                    {member.fullname || 'No full name'} - Level {member.depth}
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
              className="genealogy-level-chip inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.74)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <HiOutlineSparkles className="w-3.5 h-3.5" style={{ color: '#D4AF37' }} />
              Level {level}
            </span>
          )) : (
            <span className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
              No downline levels are visible in this branch yet.
            </span>
          )}
        </div>
      </div>

      {!loading && !tree ? (
        <div className="glass-card rounded-2xl p-10 text-center">
          <HiOutlineUsers className="w-10 h-10 mx-auto mb-4" style={{ color: 'rgba(212,175,55,0.24)' }} />
          <h2 className="font-display text-xl font-semibold text-white">Genealogy could not be loaded</h2>
          <p className="text-sm mt-3" style={{ color: 'rgba(255,255,255,0.52)' }}>
            We could not load this branch right now. Try returning to your own tree and opening the branch again.
          </p>
          <button
            type="button"
            onClick={() => setRoot(selfRootId)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold mt-6"
            style={{ background: 'rgba(212,175,55,0.14)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.32)' }}
          >
            <HiOutlineHome className="w-4 h-4" />
            Return to My Tree
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          <div ref={flowShellRef} className={`glass-card relative z-10 rounded-2xl overflow-hidden ${isFullscreen ? 'genealogy-fullscreen-shell' : ''}`}>
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(212,175,55,0.08)' }}>
              <div>
                <h2 className="font-display text-lg font-semibold text-white">General Tree Canvas</h2>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  Scroll, drag, zoom, and click any node to reload the genealogy from that member.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-2 text-xs" style={{ color: 'rgba(212,175,55,0.75)' }}>
                  <HiOutlineZoomIn className="w-4 h-4" />
                  Zoom enabled
                </div>
                <button
                  type="button"
                  onClick={resetView}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={isDarkMode
                    ? { background: 'rgba(255,255,255,0.06)', color: '#F4D675', border: '1px solid rgba(255,255,255,0.12)' }
                    : { background: 'rgba(255,255,255,0.92)', color: '#7A5C08', border: '1px solid rgba(212,175,55,0.24)' }}
                >
                  Reset View
                </button>
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={isDarkMode
                    ? { background: 'rgba(212,175,55,0.08)', color: '#F4D675', border: '1px solid rgba(212,175,55,0.18)' }
                    : { background: 'rgba(255,255,255,0.92)', color: '#7A5C08', border: '1px solid rgba(212,175,55,0.24)' }}
                >
                  {isFullscreen ? <HiOutlineMinusSm className="w-4 h-4" /> : <HiOutlineArrowsExpand className="w-4 h-4" />}
                  {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                </button>
              </div>
            </div>

            <div
              className={`genealogy-canvas-shell relative ${isFullscreen ? 'h-screen min-h-screen' : 'h-[62vh] min-h-[520px]'}`}
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
                <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]" style={{ background: 'rgba(10,8,5,0.28)' }}>
                  <Spinner />
                </div>
              )}
              <ReactFlow
                onInit={(instance) => {
                  reactFlowRef.current = instance;
                }}
                className="genealogy-flow h-full w-full"
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
                <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="rgba(212,175,55,0.18)" />
              </ReactFlow>

              <div className="absolute left-4 bottom-4 z-20 rounded-xl px-3 py-2 text-xs font-semibold pointer-events-none"
                style={isDarkMode
                  ? { background: 'rgba(15,23,42,0.82)', color: canvasActive ? '#4ADE80' : 'rgba(255,255,255,0.7)', border: '1px solid rgba(255,255,255,0.12)' }
                  : { background: 'rgba(255,255,255,0.94)', color: canvasActive ? '#15803d' : '#7A5C08', border: '1px solid rgba(212,175,55,0.18)' }}>
                {canvasActive ? 'Canvas active: drag and zoom enabled' : 'Click the canvas first to drag and zoom. Page scroll stays normal until then.'}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[280px_minmax(0,1fr)_340px] gap-5">
            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-display text-lg font-semibold text-white">Branch Summary</h2>
              <div className="grid grid-cols-2 gap-3 mt-4 text-sm">
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.45)' }}>Focused Root</p>
                  <p className="font-bold text-white mt-1">{tree?.username || user?.username || 'Member'}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.45)' }}>Visible Members</p>
                  <p className="font-bold text-white mt-1">{fmtInt(network.length)}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.45)' }}>Depth Loaded</p>
                  <p className="font-bold text-white mt-1">Level {selectedDepth}</p>
                </div>
                <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p style={{ color: 'rgba(255,255,255,0.45)' }}>Tree Mode</p>
                  <p className="font-bold text-white mt-1">Binary</p>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5 min-h-0">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">Affiliated Members</h2>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    List view of the members under the current root and the level where they sit.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 max-h-[42vh] xl:max-h-[36vh] overflow-auto pr-1">
                {network.map((member) => {
                  const packageStyle = PACKAGE_STYLES[member.accttypeName] || PACKAGE_STYLES.Bronze;
                  return (
                    <button
                      type="button"
                      key={`${member.publicUid || member.uid}-${member.depth}`}
                      onClick={() => setRoot(member.publicUid || member.uid)}
                      className="w-full rounded-2xl p-4 text-left"
                      style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{member.fullname || member.username}</p>
                          <p className="text-[11px] mt-1 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                            {member.username || `Member ${member.uid}`}
                          </p>
                        </div>
                        <span className="genealogy-member-badge text-[10px] font-bold px-2 py-1 rounded-full" style={{ background: 'rgba(0,0,0,0.26)', color: '#F2D06B', border: '1px solid rgba(212,175,55,0.3)' }}>
                          L{member.depth}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 mt-4 text-[11px]">
                        <div>
                          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Package</p>
                          <p className="font-semibold mt-1" style={{ color: packageStyle.border }}>{member.accttypeName}</p>
                        </div>
                        <div>
                          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Side</p>
                          <p className="font-semibold text-white mt-1">{legLabel(member.leg)}</p>
                        </div>
                        <div>
                          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Status</p>
                          <p className="font-semibold text-white mt-1">{member.accountStateLabel || 'PD'}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}

                {network.length === 0 && (
                  <div className="rounded-2xl p-8 text-center" style={{ background: 'rgba(255,255,255,0.03)' }}>
                    <HiOutlineUsers className="w-8 h-8 mx-auto mb-3" style={{ color: 'rgba(212,175,55,0.24)' }} />
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>No affiliated members were returned for this level range yet.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-5">
              <h2 className="font-display text-lg font-semibold text-white">How To Use The Tree</h2>
              <div className="grid grid-cols-1 gap-3 mt-4 text-sm">
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="font-semibold text-white">Zoom and pan</p>
                  <p className="mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Use your mouse wheel or trackpad to zoom, and drag the canvas to move across large branches.
                  </p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="font-semibold text-white">Choose level depth</p>
                  <p className="mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    The level selector changes how deep the current branch renders, from a quick 3-level view up to 12 levels.
                  </p>
                </div>
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <p className="font-semibold text-white">Open a member branch</p>
                  <p className="mt-2" style={{ color: 'rgba(255,255,255,0.6)' }}>
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

