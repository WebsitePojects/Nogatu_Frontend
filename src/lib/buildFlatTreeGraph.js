/**
 * Build ReactFlow { nodes, edges } from a FLAT adjacency payload (the /flat API).
 *
 * PROGRESSIVE rendering: the whole tree DATA is in memory, but we only LAY OUT +
 * RENDER the opened trail — root + the first `initialDepth` levels, plus any branch
 * the user has expanded. A collapsed node carries its hidden-descendant count and an
 * `isCollapsed` flag so the card shows a "+N" affordance; clicking it expands one
 * level deeper (infinite loading along the last trail). This keeps the rendered node
 * count tiny (fast) even for a 100k-member company tree.
 *
 * Layout is d3-hierarchy (O(n), level-aligned). BFS is cycle/orphan safe.
 */
import { stratify, tree as d3tree } from 'd3-hierarchy';
import { NODE_WIDTH, NODE_HEIGHT } from '../components/genealogyTreeUiUtils';

const DEFAULT_RENDER_BUDGET = 60000;
const H_GAP = 44;
const V_GAP = 96;
const cap = (s) => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);

// Binary child ordering: left slot before right, unknown last; tiebreak by uid.
export const ORDER_BINARY = (a, b) => {
  const rank = (p) => (p === 'left' ? 0 : p === 'right' ? 1 : 2);
  return rank(a.position) - rank(b.position) || a.uid - b.uid;
};

/** parent→children index (skips orphans), root, and per-node descendant counts (O(n)). */
function indexTree(flatNodes) {
  const byUid = new Map(flatNodes.map((n) => [n.uid, n]));
  const childrenOf = new Map();
  let root = null;
  for (const n of flatNodes) {
    if (n.parentUid == null) { root = root || n; continue; }
    if (!byUid.has(n.parentUid)) continue;
    const arr = childrenOf.get(n.parentUid) || [];
    arr.push(n);
    childrenOf.set(n.parentUid, arr);
  }
  root = root || flatNodes[0] || null;
  // descendant counts via iterative post-order from root (cycle-safe)
  const descendants = new Map();
  if (root) {
    const order = [];
    const seen = new Set();
    const stack = [root];
    while (stack.length) {
      const n = stack.pop();
      if (seen.has(n.uid)) continue;
      seen.add(n.uid);
      order.push(n);
      for (const c of (childrenOf.get(n.uid) || [])) if (!seen.has(c.uid)) stack.push(c);
    }
    for (let i = order.length - 1; i >= 0; i -= 1) {
      const n = order[i];
      let total = 0;
      for (const c of (childrenOf.get(n.uid) || [])) total += 1 + (descendants.get(c.uid) || 0);
      descendants.set(n.uid, total);
    }
  }
  return { byUid, childrenOf, root, descendants };
}

/**
 * @param {Array} flatNodes
 * @param {object} opts {
 *   renderBudget, orderBy, expanded:Set<uid>, initialDepth,
 *   expandAll:boolean,        // render EVERY node (needed so binary open slots are all visible)
 *   withPlaceholders:boolean  // binary: emit an open-slot placeholder for each missing left/right child
 * }
 */
export function buildFlatTreeGraph(flatNodes, opts = {}) {
  const empty = { nodes: [], edges: [], total: 0, rendered: 0, truncated: false };
  if (!Array.isArray(flatNodes) || flatNodes.length === 0) return empty;

  const budget = Math.max(50, Number(opts.renderBudget) || DEFAULT_RENDER_BUDGET);
  const orderBy = opts.orderBy || ((a, b) => a.uid - b.uid);
  const expanded = opts.expanded || null;
  const expandAll = Boolean(opts.expandAll);
  const withPlaceholders = Boolean(opts.withPlaceholders);
  const initialDepth = Number.isFinite(opts.initialDepth) ? opts.initialDepth : 2;

  const { childrenOf, root, descendants } = indexTree(flatNodes);
  if (!root) return { ...empty, total: flatNodes.length };
  for (const arr of childrenOf.values()) arr.sort(orderBy);

  // expandAll → render everything; else first `initialDepth` levels + explicitly expanded branches.
  const isOpen = (uid, depth, hasKids) => {
    if (!hasKids) return true;
    if (expandAll) return true;
    if (depth < initialDepth) return true;
    return expanded ? expanded.has(uid) : false;
  };

  // BFS over the open trail; items are a uniform {kind,id,parentId,...} shape so
  // member nodes and open-slot placeholders can share one d3 hierarchy.
  const items = [];
  const seen = new Set();
  const queue = [{ node: root, depth: 0 }];
  let truncated = false;
  let realCount = 0;
  while (queue.length) {
    const { node, depth } = queue.shift();
    if (seen.has(node.uid)) continue;
    if (items.length >= budget) { truncated = true; break; }
    seen.add(node.uid);
    const kids = childrenOf.get(node.uid) || [];
    const open = isOpen(node.uid, depth, kids.length > 0);
    const id = String(node.uid);
    items.push({ kind: 'member', id, parentId: node === root ? null : String(node.parentUid), node, depth, kids, open });
    realCount += 1;
    if (open) for (const c of kids) if (!seen.has(c.uid)) queue.push({ node: c, depth: depth + 1 });
  }

  // Binary open slots: for each rendered, fully-open node missing a left/right child,
  // emit a placeholder so the slot is visible and manually encodable.
  if (withPlaceholders) {
    const inSet = new Set(items.map((it) => it.id));
    for (const it of [...items]) {
      if (it.kind !== 'member' || !it.open) continue;
      if (items.length >= budget) { truncated = true; break; }
      const kids = it.kids || [];
      const hasLeft = kids.some((k) => k.position === 'left');
      const hasRight = kids.some((k) => k.position === 'right');
      for (const side of ['left', 'right']) {
        if ((side === 'left' && hasLeft) || (side === 'right' && hasRight)) continue;
        const phId = `${it.id}::ph-${side}`;
        if (inSet.has(phId)) continue;
        inSet.add(phId);
        items.push({ kind: 'placeholder', id: phId, parentId: it.id, side, parent: it.node, depth: it.depth + 1 });
      }
    }
  }

  let hierarchy;
  try {
    hierarchy = stratify().id((d) => d.id).parentId((d) => d.parentId)(items);
  } catch {
    return { ...empty, total: flatNodes.length };
  }

  d3tree().nodeSize([NODE_WIDTH + H_GAP, NODE_HEIGHT + V_GAP])(hierarchy);

  const nodes = [];
  const edges = [];
  hierarchy.each((d) => {
    const it = d.data;
    const id = it.kind === 'placeholder' ? it.id : String(it.node.publicUid || it.node.uid);
    const pid = d.parent ? (d.parent.data.kind === 'placeholder' ? d.parent.data.id : String(d.parent.data.node.publicUid || d.parent.data.node.uid)) : null;

    if (it.kind === 'placeholder') {
      nodes.push({
        id,
        type: 'placeholderNode',
        position: { x: d.x - NODE_WIDTH / 2, y: d.y },
        sourcePosition: 'bottom',
        targetPosition: 'top',
        data: {
          isPlaceholder: true,
          side: it.side,
          position: it.side === 'right' ? 2 : 1,
          positionLabel: it.side === 'right' ? 'Right Leg' : 'Left Leg',
          parentUid: it.parent?.uid,
          parentPublicUid: it.parent?.publicUid,
          parentUsername: it.parent?.username,
          level: d.depth,
        },
      });
    } else {
      const n = it.node;
      const collapsed = (it.kids || []).length > 0 && !it.open;
      nodes.push({
        id,
        type: 'memberNode',
        position: { x: d.x - NODE_WIDTH / 2, y: d.y },
        sourcePosition: 'bottom',
        targetPosition: 'top',
        data: {
          ...n,
          packageType: n.accttypeName,
          level: d.depth,
          positionLabel: d.depth === 0 ? 'Root (Level 0)' : (n.position ? cap(n.position) : `Level ${d.depth}`),
          metricLabel: collapsed ? `▸ +${(descendants.get(n.uid) || 0).toLocaleString('en-US')} below` : 'Pts to upline',
          metricValue: Number(n.pointsToUpline || 0),
          isCollapsed: collapsed,
          childCount: (it.kids || []).length,
          hiddenDescendants: collapsed ? (descendants.get(n.uid) || 0) : 0,
        },
      });
    }
    if (pid != null) {
      edges.push({
        id: `${pid}->${id}`, source: pid, target: id, type: 'treeEdge', animated: false,
        style: it.kind === 'placeholder'
          ? { stroke: 'rgba(212,175,55,0.4)', strokeWidth: 2, strokeDasharray: '5 4' }
          : { stroke: 'rgba(212,175,55,0.9)', strokeWidth: 2.4 },
      });
    }
  });

  return { nodes, edges, total: flatNodes.length, rendered: realCount, truncated };
}

/** Set of ancestor uids whose expansion reveals `targetUid` (for search "jump to"). */
export function expandPathTo(flatNodes, targetUid) {
  const byUid = new Map(flatNodes.map((n) => [n.uid, n]));
  const path = new Set();
  let cur = byUid.get(Number(targetUid));
  let guard = 0;
  while (cur && cur.parentUid != null && guard < 200) {
    path.add(cur.parentUid);
    cur = byUid.get(cur.parentUid);
    guard += 1;
  }
  return path;
}
