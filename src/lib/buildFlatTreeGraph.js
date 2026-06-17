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
 * @param {object} opts { renderBudget, orderBy, expanded:Set<uid>, initialDepth }
 */
export function buildFlatTreeGraph(flatNodes, opts = {}) {
  const empty = { nodes: [], edges: [], total: 0, rendered: 0, truncated: false };
  if (!Array.isArray(flatNodes) || flatNodes.length === 0) return empty;

  const budget = Math.max(50, Number(opts.renderBudget) || DEFAULT_RENDER_BUDGET);
  const orderBy = opts.orderBy || ((a, b) => a.uid - b.uid);
  const expanded = opts.expanded || null;
  const initialDepth = Number.isFinite(opts.initialDepth) ? opts.initialDepth : 2;

  const { childrenOf, root, descendants } = indexTree(flatNodes);
  if (!root) return { ...empty, total: flatNodes.length };
  for (const arr of childrenOf.values()) arr.sort(orderBy);

  // Always show the first `initialDepth` levels; deeper branches only when the user
  // has explicitly expanded that node (progressive loading along the chosen trail).
  const isOpen = (uid, depth, hasKids) => {
    if (!hasKids) return true;
    if (depth < initialDepth) return true;
    return expanded ? expanded.has(uid) : false;
  };

  // BFS over the OPEN trail only.
  const reachable = [];
  const seen = new Set();
  const queue = [{ node: root, depth: 0 }];
  let truncated = false;
  while (queue.length) {
    const { node, depth } = queue.shift();
    if (seen.has(node.uid)) continue;
    if (reachable.length >= budget) { truncated = true; break; }
    seen.add(node.uid);
    const kids = childrenOf.get(node.uid) || [];
    const open = isOpen(node.uid, depth, kids.length > 0);
    reachable.push({ node, depth, kids, open });
    if (open) for (const c of kids) if (!seen.has(c.uid)) queue.push({ node: c, depth: depth + 1 });
  }

  let hierarchy;
  try {
    const set = new Set(reachable.map((r) => r.node.uid));
    hierarchy = stratify()
      .id((d) => String(d.node.uid))
      .parentId((d) => (d.node.uid === root.uid ? null : (set.has(d.node.parentUid) ? String(d.node.parentUid) : null)))(reachable);
  } catch {
    return { ...empty, total: flatNodes.length };
  }

  d3tree().nodeSize([NODE_WIDTH + H_GAP, NODE_HEIGHT + V_GAP])(hierarchy);

  const nodes = [];
  const edges = [];
  hierarchy.each((d) => {
    const { node: n, kids, open } = d.data;
    const id = String(n.publicUid || n.uid);
    const collapsed = kids.length > 0 && !open;
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
        childCount: kids.length,
        hiddenDescendants: collapsed ? (descendants.get(n.uid) || 0) : 0,
      },
    });
    if (d.parent) {
      const pid = String(d.parent.data.node.publicUid || d.parent.data.node.uid);
      edges.push({
        id: `${pid}->${id}`, source: pid, target: id, type: 'treeEdge', animated: false,
        style: { stroke: 'rgba(212,175,55,0.9)', strokeWidth: 2.4 },
      });
    }
  });

  return { nodes, edges, total: flatNodes.length, rendered: reachable.length, truncated };
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
