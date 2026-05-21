import React from 'react';
import dagre from '@dagrejs/dagre';
import { BaseEdge, Handle, Position } from '@xyflow/react';
import { HiOutlinePlusCircle } from 'react-icons/hi';

export const NODE_WIDTH = 248;
export const NODE_HEIGHT = 152;
export const JUNCTION_SIZE = 18;
const BP_UNIT_VALUE = 250;

export const fmtInt = (n) => Number(n || 0).toLocaleString('en-US', { maximumFractionDigits: 0 });

export function formatBinaryPackagePoints(binaryPoints) {
  const raw = Number(binaryPoints || 0);
  if (!raw) return '0 BP';
  const bp = raw / BP_UNIT_VALUE;
  if (Number.isInteger(bp)) return `${fmtInt(bp)} BP`;
  return `${fmtInt(raw)} pts`;
}

export function normalizePackageType(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (raw === 'bronze') return 'Bronze';
  if (raw === 'silver') return 'Silver';
  if (raw === 'gold') return 'Gold';
  if (raw === 'platinum') return 'Platinum';
  if (raw === 'garnet') return 'Garnet';
  if (raw === 'diamond') return 'Diamond';
  return 'Bronze';
}

export function getPositionLabel(position, level) {
  if (level === 0 || position === 'self') return 'Root';
  if (position === 1 || position === 'left') return 'Left Leg';
  if (position === 2 || position === 'right') return 'Right Leg';
  return 'Team';
}

export function legLabel(leg) {
  if (leg === 'left') return 'Left team';
  if (leg === 'right') return 'Right team';
  return 'Team';
}

export const PACKAGE_STYLES = {
  Bronze: {
    strong: '#B86225',
    soft: '#E8A56D',
    tint: '#FFF1E7',
    ring: 'rgba(184,98,37,0.24)',
    darkBg: 'linear-gradient(180deg, rgba(184,98,37,0.26), rgba(24,15,10,0.98))',
  },
  Silver: {
    strong: '#8FA0B5',
    soft: '#D6E0EB',
    tint: '#F4F7FB',
    ring: 'rgba(143,160,181,0.24)',
    darkBg: 'linear-gradient(180deg, rgba(143,160,181,0.24), rgba(17,22,28,0.98))',
  },
  Gold: {
    strong: '#C39212',
    soft: '#F4D67A',
    tint: '#FFF8E3',
    ring: 'rgba(195,146,18,0.24)',
    darkBg: 'linear-gradient(180deg, rgba(195,146,18,0.24), rgba(27,20,8,0.98))',
  },
  Platinum: {
    strong: '#6B91A8',
    soft: '#D5E1EA',
    tint: '#F2F7FA',
    ring: 'rgba(107,145,168,0.24)',
    darkBg: 'linear-gradient(180deg, rgba(107,145,168,0.24), rgba(14,20,26,0.98))',
  },
  Garnet: {
    strong: '#A52B4B',
    soft: '#E2859A',
    tint: '#FFF0F4',
    ring: 'rgba(165,43,75,0.24)',
    darkBg: 'linear-gradient(180deg, rgba(165,43,75,0.24), rgba(29,11,16,0.98))',
  },
  Diamond: {
    strong: '#3DA8E8',
    soft: '#CDEFFF',
    tint: '#EEF8FF',
    ring: 'rgba(61,168,232,0.24)',
    darkBg: 'linear-gradient(180deg, rgba(61,168,232,0.24), rgba(10,20,29,0.98))',
  },
};

function getPlacementChipStyle(positionLabel, isDarkMode) {
  const label = String(positionLabel || '').toLowerCase();
  if (label.includes('left')) {
    return isDarkMode
      ? { background: 'rgba(244,114,182,0.12)', color: '#F9A8D4', border: '1px solid rgba(244,114,182,0.24)' }
      : { background: 'rgba(244,114,182,0.12)', color: '#BE185D', border: '1px solid rgba(244,114,182,0.22)' };
  }
  if (label.includes('right')) {
    return isDarkMode
      ? { background: 'rgba(96,165,250,0.12)', color: '#BFDBFE', border: '1px solid rgba(96,165,250,0.24)' }
      : { background: 'rgba(96,165,250,0.12)', color: '#1D4ED8', border: '1px solid rgba(96,165,250,0.22)' };
  }
  return isDarkMode
    ? { background: 'rgba(212,175,55,0.12)', color: '#F4D675', border: '1px solid rgba(212,175,55,0.22)' }
    : { background: 'rgba(212,175,55,0.12)', color: '#7A5C08', border: '1px solid rgba(212,175,55,0.2)' };
}

export function getAccountStateChipStyle(label, isDarkMode) {
  if (label === 'PD') {
    return isDarkMode
      ? { background: 'rgba(74,222,128,0.12)', color: '#86EFAC', border: '1px solid rgba(74,222,128,0.26)' }
      : { background: 'rgba(34,197,94,0.12)', color: '#166534', border: '1px solid rgba(34,197,94,0.22)' };
  }
  if (label === 'FS') {
    return isDarkMode
      ? { background: 'rgba(96,165,250,0.12)', color: '#BFDBFE', border: '1px solid rgba(96,165,250,0.24)' }
      : { background: 'rgba(59,130,246,0.12)', color: '#1D4ED8', border: '1px solid rgba(59,130,246,0.22)' };
  }
  if (label === 'CD - Paid') {
    return isDarkMode
      ? { background: 'rgba(250,204,21,0.14)', color: '#FDE68A', border: '1px solid rgba(250,204,21,0.26)' }
      : { background: 'rgba(234,179,8,0.12)', color: '#92400E', border: '1px solid rgba(234,179,8,0.24)' };
  }
  return isDarkMode
    ? { background: 'rgba(248,113,113,0.12)', color: '#FCA5A5', border: '1px solid rgba(248,113,113,0.26)' }
    : { background: 'rgba(239,68,68,0.12)', color: '#B91C1C', border: '1px solid rgba(239,68,68,0.22)' };
}

function getNodeAppearance(style, isDarkMode) {
  if (isDarkMode) {
    return {
      cardBg: style.darkBg,
      border: style.strong,
      text: '#F8FAFC',
      subtext: 'rgba(226,232,240,0.7)',
      muted: 'rgba(203,213,225,0.72)',
      sectionBg: 'rgba(255,255,255,0.055)',
      sectionBorder: 'rgba(255,255,255,0.09)',
      handleBg: '#111827',
      handleRing: 'rgba(212,175,55,0.28)',
      levelBg: 'rgba(10,15,22,0.44)',
      levelText: '#F8E3A0',
      glow: `0 16px 34px ${style.ring}`,
      accentGlow: `0 0 0 4px ${style.ring}`,
    };
  }

  return {
    cardBg: `linear-gradient(180deg, ${style.tint}, rgba(255,255,255,0.98))`,
    border: style.strong,
    text: '#1F2937',
    subtext: '#475569',
    muted: '#64748B',
    sectionBg: 'rgba(255,255,255,0.72)',
    sectionBorder: 'rgba(148,163,184,0.18)',
    handleBg: '#FFF8EA',
    handleRing: 'rgba(212,175,55,0.22)',
    levelBg: 'rgba(255,248,227,0.9)',
    levelText: '#7A5C08',
    glow: '0 18px 36px rgba(15,23,42,0.08)',
    accentGlow: `0 0 0 4px ${style.ring}`,
  };
}

function getStatusDot(stateLabel) {
  if (stateLabel === 'PD') return '#22C55E';
  if (stateLabel === 'FS') return '#3B82F6';
  if (stateLabel === 'CD - Paid') return '#F59E0B';
  return '#EF4444';
}

export function getGenealogyTheme(isDarkMode) {
  return isDarkMode
    ? {
        heading: '#FFFFFF',
        subtext: 'rgba(226,232,240,0.74)',
        tertiary: 'rgba(203,213,225,0.6)',
        surface: 'rgba(255,255,255,0.045)',
        surfaceStrong: 'rgba(255,255,255,0.065)',
        surfaceBorder: 'rgba(255,255,255,0.1)',
        searchBg: 'rgba(255,255,255,0.055)',
        searchText: '#F8FAFC',
        searchBorder: 'rgba(255,255,255,0.12)',
        popoverBg: '#131821',
        popoverShadow: '0 24px 48px rgba(0,0,0,0.38)',
        panelButtonBg: 'rgba(255,255,255,0.06)',
        panelButtonText: '#F8FAFC',
        amberButtonBg: 'rgba(212,175,55,0.12)',
        amberButtonText: '#F4D675',
        amberBorder: 'rgba(212,175,55,0.24)',
        canvasBadgeBg: 'rgba(15,23,42,0.8)',
        canvasPassiveText: 'rgba(226,232,240,0.82)',
        canvasActiveText: '#86EFAC',
        emptyIcon: 'rgba(212,175,55,0.24)',
        backgroundDot: 'rgba(212,175,55,0.18)',
        canvasOverlay: 'rgba(10,8,5,0.28)',
        listHover: 'rgba(212,175,55,0.08)',
      }
    : {
        heading: '#18212F',
        subtext: '#475569',
        tertiary: '#64748B',
        surface: 'rgba(255,255,255,0.76)',
        surfaceStrong: 'rgba(255,255,255,0.88)',
        surfaceBorder: 'rgba(148,163,184,0.22)',
        searchBg: 'rgba(255,255,255,0.96)',
        searchText: '#1F2937',
        searchBorder: 'rgba(212,175,55,0.24)',
        popoverBg: '#F8FAFC',
        popoverShadow: '0 24px 48px rgba(15,23,42,0.12)',
        panelButtonBg: 'rgba(255,255,255,0.92)',
        panelButtonText: '#334155',
        amberButtonBg: 'rgba(255,248,227,0.96)',
        amberButtonText: '#7A5C08',
        amberBorder: 'rgba(212,175,55,0.28)',
        canvasBadgeBg: 'rgba(255,255,255,0.94)',
        canvasPassiveText: '#7A5C08',
        canvasActiveText: '#15803D',
        emptyIcon: 'rgba(212,175,55,0.24)',
        backgroundDot: 'rgba(212,175,55,0.14)',
        canvasOverlay: 'rgba(255,255,255,0.38)',
        listHover: 'rgba(212,175,55,0.09)',
      };
}

export function Spinner() {
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

export function MemberNode({ data }) {
  const packageName = normalizePackageType(data.packageType);
  const style = PACKAGE_STYLES[packageName] || PACKAGE_STYLES.Bronze;
  const tone = getNodeAppearance(style, Boolean(data.isDarkMode));
  const stateChip = getAccountStateChipStyle(data.accountStateLabel || 'PD', Boolean(data.isDarkMode));
  const placementChip = getPlacementChipStyle(data.positionLabel, Boolean(data.isDarkMode));
  const primaryLabel = data.fullname && String(data.fullname).trim() && String(data.fullname).trim().toLowerCase() !== String(data.username || '').trim().toLowerCase()
    ? data.fullname
    : (data.username || data.displayName || `Member ${data.internalUid}`);
  const secondaryLabel = data.username && primaryLabel.trim().toLowerCase() !== String(data.username).trim().toLowerCase()
    ? data.username
    : '';
  const isPrimaryLong = String(primaryLabel || '').length > 20;

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
      <div className="absolute right-4 top-4 h-2.5 w-2.5 rounded-full" style={{ background: getStatusDot(data.accountStateLabel || 'PD'), boxShadow: `0 0 0 4px ${tone.sectionBg}` }} />

      <div className="flex items-start justify-between gap-3 pr-5">
        <div className="min-w-0">
          <div className={`genealogy-name-marquee ${isPrimaryLong ? 'is-animated' : ''}`} style={{ color: tone.text }}>
            <div className={`genealogy-name-track ${isPrimaryLong ? 'is-animated' : ''}`}>
              <span className="text-[15px] font-bold whitespace-nowrap leading-tight">{primaryLabel}</span>
              {isPrimaryLong ? <span className="text-[15px] font-bold whitespace-nowrap genealogy-name-ghost">{primaryLabel}</span> : null}
            </div>
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

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-xl px-3 py-2.5" style={{ background: tone.sectionBg, border: `1px solid ${tone.sectionBorder}` }}>
          <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: tone.muted }}>Binary Value</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: tone.text }}>{formatBinaryPackagePoints(data.binaryPoints)}</p>
        </div>
        <div className="rounded-xl px-3 py-2.5" style={{ background: tone.sectionBg, border: `1px solid ${tone.sectionBorder}` }}>
          <p className="text-[10px] uppercase tracking-[0.16em]" style={{ color: tone.muted }}>Branch Size</p>
          <p className="mt-1 text-sm font-semibold" style={{ color: tone.text }}>{fmtInt(data.childCount || 0)}</p>
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
          <HiOutlinePlusCircle className="w-5 h-5" />
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
      <BaseEdge id={`${id}-glow`} path={path} style={{ stroke: 'rgba(212,175,55,0.18)', strokeWidth: edgeWidth + 4, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
      <BaseEdge id={id} path={path} style={{ ...style, stroke: edgeStroke, strokeWidth: edgeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' }} />
      <circle cx={sourceX} cy={midY} r="3" fill="#E7C45C" opacity="0.78" />
      {Math.abs(targetX - sourceX) > 1 ? <circle cx={targetX} cy={midY} r="3" fill="#E7C45C" opacity="0.78" /> : null}
    </>
  );
}

export function flattenTree(node, level = 0, maxRenderLevel = 5, bucket = { nodes: [], edges: [] }) {
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
      style: { stroke: 'rgba(212,175,55,0.95)', strokeWidth: 2.9 },
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
        style: { stroke: 'rgba(212,175,55,0.9)', strokeWidth: 2.7 },
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
      style: { stroke: 'rgba(212,175,55,0.9)', strokeWidth: 2.7 },
    });
  }

  return bucket;
}

export function layoutGraph(nodes, edges) {
  const graph = new dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'TB', ranksep: 118, nodesep: 54, marginx: 42, marginy: 34 });

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
