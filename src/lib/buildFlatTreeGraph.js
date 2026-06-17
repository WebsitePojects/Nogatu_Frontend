/**
 * Build ReactFlow { nodes, edges } from a FLAT adjacency payload (the /flat API).
 *
 * The whole subtree arrives flat (root → deepest, nothing summarized). We:
 *   1. BFS from the root to the reachable set — this drops orphans (parentUid not in
 *      the payload) and is inherently cycle-safe (visited guard), so a bad
 *      refid/drefid edit can never loop us.
 *   2. Lay it out with d3-hierarchy's tree layout. d3 is O(n) and aligns every level
 *      by depth automatically (no junction nodes needed), so even a 100k-node company
 *      tree lays out in milliseconds on the main thread — full depth, no lag. Render
 *      perf on top is handled by ReactFlow `onlyRenderVisibleElements`.
 *
 * A high render budget is kept purely as an extreme memory safety net; normal trees
 * (thousands) render in full.
 */
import { stratify, tree as d3tree } from 'd3-hierarchy';
import { NODE_WIDTH, NODE_HEIGHT } from '../components/genealogyTreeUiUtils';

const DEFAULT_RENDER_BUDGET = 60000;
const H_GAP = 44; // horizontal gap between sibling subtrees
const V_GAP = 96; // vertical gap between levels

function cap(s) { return String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1); }

/**
 * @param {Array} flatNodes  rows from /flat ({ uid, parentUid, depth, ... })
 * @param {object} opts      { renderBudget }
 * @returns {{ nodes, edges, total, rendered, truncated }}
 */
export function buildFlatTreeGraph(flatNodes, opts = {}) {
  const empty = { nodes: [], edges: [], total: 0, rendered: 0, truncated: false };
  if (!Array.isArray(flatNodes) || flatNodes.length === 0) return empty;

  const budget = Math.max(50, Number(opts.renderBudget) || DEFAULT_RENDER_BUDGET);
  const byUid = new Map(flatNodes.map((n) => [n.uid, n]));
  const root = flatNodes.find((n) => n.parentUid == null) || flatNodes[0];
  if (!root) return { ...empty, total: flatNodes.length };

  // parent → children (skip orphans whose parent isn't in the payload)
  const childrenOf = new Map();
  for (const n of flatNodes) {
    if (n === root || n.parentUid == null || !byUid.has(n.parentUid)) continue;
    const arr = childrenOf.get(n.parentUid) || [];
    arr.push(n);
    childrenOf.set(n.parentUid, arr);
  }
  for (const arr of childrenOf.values()) arr.sort((a, b) => a.uid - b.uid);

  // BFS reachable set (cycle-safe, budget-bounded). A parent is always enqueued
  // before its children, so every kept child's parent is also kept.
  const reachable = [];
  const seen = new Set();
  const queue = [root];
  let truncated = false;
  while (queue.length) {
    const node = queue.shift();
    if (seen.has(node.uid)) continue;
    if (reachable.length >= budget) { truncated = true; break; }
    seen.add(node.uid);
    reachable.push(node);
    for (const c of (childrenOf.get(node.uid) || [])) if (!seen.has(c.uid)) queue.push(c);
  }

  let hierarchy;
  try {
    hierarchy = stratify()
      .id((d) => String(d.uid))
      .parentId((d) => (d.uid === root.uid ? null : String(d.parentUid)))(reachable);
  } catch {
    return { ...empty, total: flatNodes.length };
  }

  d3tree().nodeSize([NODE_WIDTH + H_GAP, NODE_HEIGHT + V_GAP])(hierarchy);

  const nodes = [];
  const edges = [];
  hierarchy.each((d) => {
    const n = d.data;
    const id = String(n.publicUid || n.uid);
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
        // Task 2 — what this member feeds upward through the tree.
        metricLabel: 'Pts to upline',
        metricValue: Number(n.pointsToUpline || 0),
        childCount: d.children ? d.children.length : 0,
        hasMore: (childrenOf.get(n.uid) || []).length > 0,
      },
    });
    if (d.parent) {
      const pid = String(d.parent.data.publicUid || d.parent.data.uid);
      edges.push({
        id: `${pid}->${id}`,
        source: pid,
        target: id,
        type: 'treeEdge',
        animated: false,
        style: { stroke: 'rgba(212,175,55,0.9)', strokeWidth: 2.4 },
      });
    }
  });

  return { nodes, edges, total: flatNodes.length, rendered: reachable.length, truncated };
}
