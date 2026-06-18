import React from 'react';
import { Handle, Position, useStore } from '@xyflow/react';

// Viewport level-of-detail: below this zoom, nodes render as cheap ghost shells
// (like game frustum LOD) and hydrate to full detail when you zoom/focus in.
// Raised so shells kick in sooner (fewer heavy cards rendered at moderate zoom).
const LOD_ZOOM = 0.55;
import { HiOutlinePlusCircle } from 'react-icons/hi';
import {
  JUNCTION_SIZE,
  NODE_HEIGHT,
  NODE_WIDTH,
  formatBinaryPackagePoints,
  getMemberNodeViewModel,
} from './genealogyTreeUiUtils';

export function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div
        className="size-12 rounded-full border-[3px] animate-spin"
        style={{ borderColor: 'rgba(212,175,55,0.15)', borderTopColor: '#D4AF37' }}
      />
      <p className="text-sm" style={{ color: 'rgba(212,175,55,0.55)' }}>Loading genealogy...</p>
    </div>
  );
}

export function MemberNode({ data }) {
  const {
    packageName,
    placementChip,
    primaryLabel,
    secondaryLabel,
    stateChip,
    statusDot,
    style,
    tone,
  } = getMemberNodeViewModel(data);

  // Selector returns a boolean, so the node only re-renders when it crosses the
  // LOD threshold (not on every pan) — keeps zoomed-out panning cheap.
  const lowDetail = useStore((s) => s.transform[2] < LOD_ZOOM);
  const handleNodeClick = () => {
    if (!data.canvasActive) { data.onActivateCanvas?.(); return; }
    data.onOpen?.();
  };

  if (lowDetail) {
    return (
      <button
        type="button"
        onClick={handleNodeClick}
        className="w-full rounded-[1.35rem] p-4 text-left relative overflow-hidden"
        style={{
          width: NODE_WIDTH,
          minHeight: NODE_HEIGHT,
          background: tone.cardBg,
          border: data.highlighted ? '2px solid rgba(74,222,128,0.9)' : `1px solid ${style.strong}66`,
          boxShadow: tone.glow,
        }}
      >
        <Handle type="target" position={Position.Top} isConnectable={false}
          style={{ top: -9, width: 16, height: 16, borderRadius: '999px', border: `2px solid ${style.soft}`, background: tone.handleBg }} />
        <Handle type="source" position={Position.Bottom} isConnectable={false}
          style={{ bottom: -9, width: 16, height: 16, borderRadius: '999px', border: `2px solid ${style.soft}`, background: tone.handleBg }} />
        <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${style.strong}, ${style.soft})` }} />
        <div className="absolute right-4 top-4 size-2.5 rounded-full" style={{ background: statusDot }} />
        <div className="mt-2 h-4 w-2/3 rounded animate-pulse" style={{ background: 'rgba(255,255,255,0.10)' }} />
        <div className="mt-3 h-12 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.05)' }} />
      </button>
    );
  }

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
      className="w-full rounded-[1.35rem] p-4 text-left transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
      style={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        background: tone.cardBg,
        border: data.highlighted ? '2px solid rgba(74,222,128,0.9)' : `1px solid ${style.strong}66`,
        boxShadow: data.highlighted ? `${tone.glow}, ${tone.accentGlow}` : tone.glow,
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={{
          top: -9,
          width: 16,
          height: 16,
          borderRadius: '999px',
          border: `2px solid ${style.soft}`,
          background: tone.handleBg,
          boxShadow: `0 0 0 3px ${tone.handleRing}`,
        }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={{
          bottom: -9,
          width: 16,
          height: 16,
          borderRadius: '999px',
          border: `2px solid ${style.soft}`,
          background: tone.handleBg,
          boxShadow: `0 0 0 3px ${tone.handleRing}`,
        }}
      />

      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: `linear-gradient(90deg, ${style.strong}, ${style.soft})` }} />
      <div className="absolute right-4 top-4 size-2.5 rounded-full" style={{ background: statusDot, boxShadow: `0 0 0 4px ${tone.sectionBg}` }} />

      <div className="flex items-start justify-between gap-3 pr-5">
        <div className="min-w-0">
          {/* Plain truncated name (no always-on marquee animation) — the scrolling
              marquee ran continuously on every visible long-named node, a real
              perf drain at scale. Title shows the full name on hover. */}
          <div className="text-[15px] font-bold leading-tight truncate" style={{ color: tone.text }} title={primaryLabel}>
            {primaryLabel}
          </div>
          {secondaryLabel ? (
            <p className="mt-1 truncate text-[11px] font-medium" style={{ color: tone.subtext }}>
              @{secondaryLabel}
            </p>
          ) : null}
        </div>
        <span className="rounded-full px-2.5 py-1 text-[10px] font-bold whitespace-nowrap" style={{ background: tone.levelBg, color: tone.levelText, border: `1px solid ${style.strong}30` }}>
          L{data.level}
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ background: tone.sectionBg, color: style.strong, border: `1px solid ${style.strong}36` }}>
          {packageName}
        </span>
        <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={placementChip}>
          {data.positionLabel}
        </span>
        <span className="rounded-full px-2.5 py-1 text-[10px] font-semibold" style={stateChip}>
          {data.accountStateLabel || 'PD'}
        </span>
      </div>

      <div className="mt-4">
        <div className="rounded-xl px-3 py-2.5" style={{ background: tone.sectionBg, border: `1px solid ${tone.sectionBorder}` }}>
          <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: tone.muted }}>{data.metricLabel || 'Binary PV'}</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: tone.text }}>
            {data.metricLabel
              ? `${Number(data.metricValue || 0).toLocaleString('en-US')} ${data.metricUnit || 'pts'}`
              : formatBinaryPackagePoints(data.binaryPoints)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function JunctionNode({ data }) {
  const isDarkMode = Boolean(data?.isDarkMode);
  return (
    <div className="relative" style={{ width: JUNCTION_SIZE, height: JUNCTION_SIZE }}>
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={{
          top: -6,
          width: 12,
          height: 12,
          borderRadius: '999px',
          border: '2px solid #F8D26B',
          background: isDarkMode ? '#111827' : '#FFF8EA',
          boxShadow: '0 0 0 3px rgba(212,175,55,0.18)',
        }}
      />
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, #FFE8A3 0%, #D4AF37 50%, rgba(212,175,55,0.24) 100%)',
          boxShadow: '0 0 18px rgba(212,175,55,0.34)',
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        isConnectable={false}
        style={{
          bottom: -6,
          width: 12,
          height: 12,
          borderRadius: '999px',
          border: '2px solid #F8D26B',
          background: isDarkMode ? '#111827' : '#FFF8EA',
          boxShadow: '0 0 0 3px rgba(212,175,55,0.18)',
        }}
      />
    </div>
  );
}

export function PlaceholderNode({ data }) {
  const isDarkMode = Boolean(data.isDarkMode);
  const ctaText = data.placeholderCta || 'Register new member here';
  const helperText = data.placeholderHint || 'The registration screen will verify the live binary placement policy before saving this slot.';
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
      className="w-full rounded-[1.35rem] p-4 text-left transition-all duration-200 hover:-translate-y-1 relative overflow-hidden"
      style={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        background: isDarkMode
          ? 'linear-gradient(180deg, rgba(16,185,129,0.08), rgba(15,23,42,0.94))'
          : 'linear-gradient(180deg, rgba(236,253,245,0.96), rgba(249,250,251,0.98))',
        border: isDarkMode ? '2px dashed rgba(74,222,128,0.58)' : '2px dashed rgba(34,197,94,0.46)',
        boxShadow: isDarkMode ? '0 14px 30px rgba(0,0,0,0.24)' : '0 14px 30px rgba(15,23,42,0.08)',
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        isConnectable={false}
        style={{
          top: -9,
          width: 16,
          height: 16,
          borderRadius: '999px',
          border: '2px solid #F8D26B',
          background: isDarkMode ? '#111827' : '#FFF8EA',
          boxShadow: '0 0 0 3px rgba(212,175,55,0.18)',
        }}
      />

      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: 'linear-gradient(90deg, #22C55E, #86EFAC)' }} />

      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold" style={{ color: isDarkMode ? '#F8FAFC' : '#166534' }}>Open Slot</p>
          <p className="text-[11px] mt-1 font-medium" style={{ color: isDarkMode ? 'rgba(226,232,240,0.72)' : '#475569' }}>
            {data.positionLabel}
          </p>
        </div>
        <span
          className="inline-flex items-center justify-center rounded-full"
          style={{
            width: 34,
            height: 34,
            background: isDarkMode ? 'rgba(74,222,128,0.12)' : 'rgba(34,197,94,0.12)',
            border: isDarkMode ? '1px solid rgba(74,222,128,0.38)' : '1px solid rgba(34,197,94,0.28)',
            color: isDarkMode ? '#86EFAC' : '#15803D',
          }}
        >
          <HiOutlinePlusCircle className="size-5" />
        </span>
      </div>

      <div
        className="mt-5 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[11px] font-semibold"
        style={{
          background: isDarkMode ? 'rgba(16,185,129,0.14)' : 'rgba(16,185,129,0.12)',
          color: isDarkMode ? '#A7F3D0' : '#166534',
          border: isDarkMode ? '1px solid rgba(16,185,129,0.24)' : '1px solid rgba(16,185,129,0.22)',
        }}
      >
        {ctaText}
      </div>

      <p className="mt-4 text-[11px] leading-5" style={{ color: isDarkMode ? 'rgba(203,213,225,0.7)' : '#64748B' }}>
        {helperText}
      </p>
    </button>
  );
}

export function TreeEdge({ id, sourceX, sourceY, targetX, targetY, style = {} }) {
  const midY = sourceY + (targetY - sourceY) / 2;
  const path = `M ${sourceX} ${sourceY} L ${sourceX} ${midY} L ${targetX} ${midY} L ${targetX} ${targetY}`;
  const edgeStroke = style.stroke || 'rgba(212,175,55,0.9)';
  const edgeWidth = style.strokeWidth || 2.8;

  return (
    <>
      <path
        id={`${id}-glow`}
        d={path}
        className="react-flow__edge-path"
        fill="none"
        stroke="rgba(212,175,55,0.18)"
        strokeWidth={Number(edgeWidth) + 4}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ fill: 'none', stroke: 'rgba(212,175,55,0.18)', strokeWidth: Number(edgeWidth) + 4 }}
      />
      <path
        id={id}
        d={path}
        className="react-flow__edge-path"
        fill="none"
        stroke={edgeStroke}
        strokeWidth={edgeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ fill: 'none', stroke: edgeStroke, strokeWidth: edgeWidth, ...style }}
      />
      <circle cx={sourceX} cy={midY} r="3" fill="#E7C45C" opacity="0.78" />
      {Math.abs(targetX - sourceX) > 1 ? <circle cx={targetX} cy={midY} r="3" fill="#E7C45C" opacity="0.78" /> : null}
    </>
  );
}
