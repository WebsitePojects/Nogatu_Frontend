import dagre from '@dagrejs/dagre';

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

export function getMemberNodeViewModel(data) {
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

  return {
    packageName,
    style,
    tone,
    stateChip,
    placementChip,
    primaryLabel,
    secondaryLabel,
    isPrimaryLong: String(primaryLabel || '').length > 20,
    statusDot: getStatusDot(data.accountStateLabel || 'PD'),
  };
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
      parentUsername: node.username,
      parentFullname: node.fullname,
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
      parentUsername: node.username,
      parentFullname: node.fullname,
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
