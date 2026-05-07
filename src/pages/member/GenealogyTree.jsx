import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dagre from '@dagrejs/dagre';
import {
  Background,
  BackgroundVariant,
  BaseEdge,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import {
  HiOutlineArrowsExpand,
  HiOutlineArrowLeft,
  HiOutlineArrowRight,
  HiOutlinePlusCircle,
  HiOutlineHome,
  HiOutlineMinusSm,
  HiOutlineSparkles,
  HiOutlineUsers,
  HiOutlineZoomIn,
} from 'react-icons/hi';

const LEVEL_OPTIONS = [3, 5, 7, 10, 12];
const NODE_WIDTH = 208;
const NODE_HEIGHT = 102;
const JUNCTION_SIZE = 16;
const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

const PACKAGE_STYLES = {
  Bronze:   { border: '#C9732E', accent: '#E59A57', glow: 'rgba(201,115,46,0.36)', bg: 'linear-gradient(180deg, rgba(201,115,46,0.28), rgba(31,18,10,0.97))', mini: '#C9732E' },
  Silver:   { border: '#B8C2CC', accent: '#E5ECF3', glow: 'rgba(184,194,204,0.34)', bg: 'linear-gradient(180deg, rgba(184,194,204,0.24), rgba(19,20,24,0.97))', mini: '#B8C2CC' },
  Gold:     { border: '#E1B73B', accent: '#F9E08A', glow: 'rgba(225,183,59,0.38)', bg: 'linear-gradient(180deg, rgba(225,183,59,0.26), rgba(31,23,8,0.97))', mini: '#E1B73B' },
  Platinum: { border: '#6FB0B6', accent: '#BDE3E7', glow: 'rgba(111,176,182,0.34)', bg: 'linear-gradient(180deg, rgba(111,176,182,0.25), rgba(14,24,26,0.97))', mini: '#6FB0B6' },
  Garnet:   { border: '#A8253B', accent: '#E4697D', glow: 'rgba(168,37,59,0.38)', bg: 'linear-gradient(180deg, rgba(168,37,59,0.25), rgba(29,10,14,0.97))', mini: '#A8253B' },
  Diamond:  { border: '#5CCFFF', accent: '#D9F6FF', glow: 'rgba(92,207,255,0.4)', bg: 'linear-gradient(180deg, rgba(92,207,255,0.24), rgba(10,21,28,0.97))', mini: '#5CCFFF' },
};

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

  return (
    <button
      type="button"
      onClick={data.onOpen}
      className="w-full rounded-2xl p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 relative overflow-hidden"
      style={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        background: style.bg,
        border: `1px solid ${style.border}`,
        boxShadow: `0 12px 30px ${style.glow}`,
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
          border: `2px solid ${style.accent}`,
          background: '#120f0a',
          boxShadow: `0 0 0 3px ${style.glow}`,
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
          border: `2px solid ${style.accent}`,
          background: '#120f0a',
          boxShadow: `0 0 0 3px ${style.glow}`,
        }}
      />

      <div
        className="absolute inset-x-0 top-0 h-1.5"
        style={{ background: `linear-gradient(90deg, ${style.border}, ${style.accent})` }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-white truncate">{data.displayName || data.username}</p>
          <p className="text-[11px] mt-1 truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
            {data.username || `Member ${data.internalUid}`}
          </p>
        </div>
        <span className="text-[10px] font-bold px-2 py-1 rounded-full whitespace-nowrap" style={{ background: 'rgba(0,0,0,0.26)', color: '#F2D06B', border: '1px solid rgba(212,175,55,0.3)' }}>
          L{data.level}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4">
        <span className="text-[10px] font-semibold px-2 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.08)', color: style.accent, border: `1px solid ${style.border}` }}>
          {packageName}
        </span>
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.62)' }}>
          {data.positionLabel}
        </span>
      </div>

      <div className="flex items-center justify-between mt-4 text-[11px]">
        <span style={{ color: 'rgba(255,255,255,0.48)' }}>Points</span>
        <span className="font-semibold text-white">{data.binaryPoints}</span>
      </div>

      {Number(data.childCount || 0) > 0 && (
        <div className="mt-3 text-[10px] font-medium" style={{ color: 'rgba(242,208,107,0.82)' }}>
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
          background: '#120f0a',
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
          background: '#120f0a',
          boxShadow: '0 0 0 3px rgba(242,208,107,0.18)',
        }}
      />
    </div>
  );
}

function PlaceholderNode({ data }) {
  return (
    <button
      type="button"
      onClick={data.onRegister}
      className="w-full rounded-2xl p-4 text-left transition-transform duration-200 hover:-translate-y-0.5 relative overflow-hidden"
      style={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(18,16,10,0.92))',
        border: '1px dashed rgba(242,208,107,0.42)',
        boxShadow: '0 10px 24px rgba(0,0,0,0.24)',
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
          background: '#120f0a',
          boxShadow: '0 0 0 3px rgba(242,208,107,0.18)',
        }}
      />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-white">Open Slot</p>
          <p className="text-[11px] mt-1" style={{ color: 'rgba(255,255,255,0.54)' }}>
            {data.positionLabel}
          </p>
        </div>
        <span
          className="inline-flex items-center justify-center rounded-full"
          style={{
            width: 28,
            height: 28,
            background: 'rgba(242,208,107,0.12)',
            border: '1px solid rgba(242,208,107,0.38)',
            color: '#F2D06B',
          }}
        >
          <HiOutlinePlusCircle className="w-5 h-5" />
        </span>
      </div>

      <div className="mt-5 rounded-xl px-3 py-2 text-[11px] font-semibold inline-flex items-center gap-2"
        style={{ background: 'rgba(242,208,107,0.08)', color: '#F2D06B', border: '1px solid rgba(242,208,107,0.18)' }}>
        Register new member here
      </div>

      <p className="mt-4 text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Keep the binary tree balanced by placing a new account on this side.
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
      positionLabel: level === 0 ? 'Root' : (Number(node.position) === 1 ? 'Left Leg' : 'Right Leg'),
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
            positionLabel: child.position === 1 ? 'Left Leg' : 'Right Leg',
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
          positionLabel: child.position === 1 ? 'Left Leg' : 'Right Leg',
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
  const navigate = useNavigate();
  const reactFlowRef = useRef(null);
  const flowShellRef = useRef(null);
  const wantedFullscreenRef = useRef(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [tree, setTree] = useState(null);
  const [network, setNetwork] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const { nodes, edges } = useMemo(() => {
    if (!tree) return { nodes: [], edges: [] };
    const flattened = flattenTree(tree, 0, selectedDepth);
    const graphNodes = flattened.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        binaryPoints: fmtInt(node.data.binaryPoints || 0),
        onOpen: () => setRoot(node.id),
        onRegister: () => navigate(`/register?placement=${node.data.internalUid || node.data.uid}&position=${node.data.position || 1}`),
      },
    }));

    return {
      nodes: layoutGraph(graphNodes, flattened.edges),
      edges: flattened.edges,
    };
  }, [tree, selectedDepth, navigate]);

  useEffect(() => {
    if (!nodes.length) return;
    const timer = setTimeout(() => {
      reactFlowRef.current?.fitView({ padding: 0.22, duration: 350, maxZoom: 1.15, minZoom: 0.15 });
    }, 80);
    return () => clearTimeout(timer);
  }, [nodes, rootId, selectedDepth, isFullscreen]);

  const nodeTypes = useMemo(() => ({ memberNode: MemberNode, junctionNode: JunctionNode, placeholderNode: PlaceholderNode }), []);
  const edgeTypes = useMemo(() => ({ treeEdge: TreeEdge }), []);
  const visibleLevels = useMemo(() => {
    const levels = new Set(network.map((member) => Number(member.depth || 0)).filter(Boolean));
    return Array.from(levels).sort((a, b) => a - b);
  }, [network]);

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
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.12)' }}
          >
            <HiOutlineUsers className="w-4 h-4" />
            Direct Referrals
          </button>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-5">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
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
        <div className="grid grid-cols-1 2xl:grid-cols-[minmax(0,1.7fr)_420px] gap-5">
          <div ref={flowShellRef} className={`glass-card rounded-2xl overflow-hidden ${isFullscreen ? 'genealogy-fullscreen-shell' : ''}`}>
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
                  onClick={toggleFullscreen}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold"
                  style={{ background: 'rgba(212,175,55,0.08)', color: '#D4AF37', border: '1px solid rgba(212,175,55,0.18)' }}
                >
                  {isFullscreen ? <HiOutlineMinusSm className="w-4 h-4" /> : <HiOutlineArrowsExpand className="w-4 h-4" />}
                  {isFullscreen ? 'Exit Full Screen' : 'Full Screen'}
                </button>
              </div>
            </div>

            <div className={`relative ${isFullscreen ? 'h-screen min-h-screen' : 'h-[68vh] min-h-[560px]'}`} style={{ background: 'linear-gradient(180deg, rgba(212,175,55,0.05), rgba(10,8,5,0.95))' }}>
              {loading && (
                <div className="absolute inset-0 z-20 flex items-center justify-center backdrop-blur-[2px]" style={{ background: 'rgba(10,8,5,0.28)' }}>
                  <Spinner />
                </div>
              )}
              <ReactFlow
                onInit={(instance) => {
                  reactFlowRef.current = instance;
                }}
                className="genealogy-flow"
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                fitViewOptions={{ padding: 0.24 }}
                minZoom={0.15}
                maxZoom={1.6}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{ type: 'treeEdge' }}
              >
                <MiniMap
                  className="genealogy-minimap"
                  pannable
                  zoomable
                  position="bottom-right"
                  style={{ width: 220, height: 140 }}
                  nodeColor={(node) => PACKAGE_STYLES[node.data?.packageType]?.mini || '#D4AF37'}
                  maskColor="rgba(242,208,107,0.18)"
                  nodeStrokeColor={(node) => PACKAGE_STYLES[node.data?.packageType]?.accent || '#F2D06B'}
                  nodeBorderRadius={10}
                  nodeStrokeWidth={3}
                  bgColor="rgba(14,12,9,0.96)"
                />
                <Controls className="genealogy-controls" showInteractive={false} position="top-right" />
                <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} color="rgba(212,175,55,0.18)" />
              </ReactFlow>
            </div>
          </div>

          <div className="space-y-5">
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

            <div className="glass-card rounded-2xl p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-semibold text-white">Affiliated Members</h2>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>
                    List view of the members under the current root and the level where they sit.
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3 max-h-[52vh] overflow-auto pr-1">
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
                          <p style={{ color: 'rgba(255,255,255,0.45)' }}>Points</p>
                          <p className="font-semibold text-white mt-1">{fmtInt(member.binaryPoints)}</p>
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
