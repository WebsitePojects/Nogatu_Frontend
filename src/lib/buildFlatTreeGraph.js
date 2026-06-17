/**
 * Build ReactFlow { nodes, edges } from a FLAT adjacency payload (the /flat API).
 *
 * The whole subtree arrives flat (root → deepest, nothing summarized). We rebuild
 * the parent→child structure in O(n), then emit the same junction-routed graph the
 * existing nested flatten produces, so MemberNode/JunctionNode render identically.
 *
 * A high safety budget bounds how many nodes we hand to the dagre layout (laying
 * out a pathological 100k-node company tree at once would freeze the tab). All data
 * is still present for the side breakdown — the canvas just renders a bounded slice
 * and flags where deeper branches continue (click a node to recenter there).
 * Render performance on top of that is handled by ReactFlow `onlyRenderVisibleElements`.
 */
import { layoutGraph } from '../components/genealogyTreeUiUtils';

const DEFAULT_RENDER_BUDGET = 2500;
const GOLD_STRONG = 'rgba(212,175,55,0.95)';

function indexByParent(flatNodes) {
  const childrenOf = new Map();
  let root = null;
  for (const n of flatNodes) {
    if (n.parentUid == null) { root = n; continue; }
    const arr = childrenOf.get(n.parentUid) || [];
    arr.push(n);
    childrenOf.set(n.parentUid, arr);
  }
  // Stable order: by uid so the tree doesn't reshuffle between refreshes.
  for (const arr of childrenOf.values()) arr.sort((a, b) => a.uid - b.uid);
  return { childrenOf, root: root || flatNodes[0] || null };
}

/**
 * @param {Array} flatNodes  rows from /flat ({ uid, parentUid, depth, ... })
 * @param {object} opts      { renderBudget }
 * @returns {{ nodes, edges, total, rendered, truncated }}
 */
export function buildFlatTreeGraph(flatNodes, opts = {}) {
  const budget = Math.max(50, Number(opts.renderBudget) || DEFAULT_RENDER_BUDGET);
  if (!Array.isArray(flatNodes) || flatNodes.length === 0) {
    return { nodes: [], edges: [], total: 0, rendered: 0, truncated: false };
  }

  const { childrenOf, root } = indexByParent(flatNodes);
  if (!root) return { nodes: [], edges: [], total: flatNodes.length, rendered: 0, truncated: false };

  const bucket = { nodes: [], edges: [] };
  let rendered = 0;
  let truncated = false;
  const seen = new Set(); // cycle/duplicate guard — a bad refid/drefid edit can't loop us

  // BFS so the bounded render is breadth-first (keeps upper levels complete).
  const queue = [{ node: root, level: 0 }];
  while (queue.length) {
    const { node, level } = queue.shift();
    if (rendered >= budget) { truncated = true; break; }
    if (seen.has(node.uid)) continue;
    seen.add(node.uid);

    const nodeId = String(node.publicUid || node.uid);
    const kids = childrenOf.get(node.uid) || [];
    rendered += 1;

    bucket.nodes.push({
      id: nodeId,
      type: 'memberNode',
      data: {
        ...node,
        packageType: node.accttypeName,
        level,
        positionLabel: level === 0 ? 'Root (Level 0)' : (node.position ? cap(node.position) : `Level ${level}`),
        // Task 2 — what this member feeds upward through the unilevel.
        metricLabel: 'Pts to upline',
        metricValue: Number(node.pointsToUpline || 0),
        childCount: kids.length,
        hasMore: kids.length > 0,
      },
      position: { x: 0, y: 0 },
    });

    if (kids.length === 0) continue;

    const junctionId = `${nodeId}::junction`;
    bucket.nodes.push({
      id: junctionId,
      type: 'junctionNode',
      data: { level: level + 0.5, isJunction: true },
      position: { x: 0, y: 0 },
    });
    bucket.edges.push({
      id: `${nodeId}-${junctionId}`, source: nodeId, target: junctionId,
      type: 'treeEdge', animated: false, style: { stroke: GOLD_STRONG, strokeWidth: 2.9 },
    });

    for (const child of kids) {
      const childId = String(child.publicUid || child.uid);
      bucket.edges.push({
        id: `${junctionId}-${childId}`, source: junctionId, target: childId,
        type: 'treeEdge', animated: false, style: { stroke: 'rgba(212,175,55,0.9)', strokeWidth: 2.7 },
      });
      queue.push({ node: child, level: level + 1 });
    }
  }

  // Prune edges whose target node was cut by the budget (avoids dangling edges).
  const renderedIds = new Set(bucket.nodes.map((n) => n.id));
  bucket.edges = bucket.edges.filter((e) => renderedIds.has(e.source) && renderedIds.has(e.target));

  return {
    nodes: layoutGraph(bucket.nodes, bucket.edges),
    edges: bucket.edges,
    total: flatNodes.length,
    rendered,
    truncated,
  };
}

function cap(s) { return String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1); }
