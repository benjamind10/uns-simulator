import type { ISchemaNode } from '../types';

export interface TreeNode extends ISchemaNode {
  children: TreeNode[];
}

export function buildTree(
  nodes: ISchemaNode[],
  parentId: string | null = null
): TreeNode[] {
  return nodes
    .filter((n) => n.parent === parentId)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((n) => ({
      ...n,
      children: buildTree(nodes, n.id),
    }));
}

/**
 * Collect all node IDs from a tree (for default expand-all).
 */
export function collectAllIds(nodes: ISchemaNode[]): Set<string> {
  const ids = new Set<string>();
  for (const n of nodes) {
    ids.add(n.id);
  }
  return ids;
}

/**
 * Recompute paths for a node and all its descendants after reparenting.
 */
export function recomputePaths(
  allNodes: ISchemaNode[],
  movedNodeId: string,
  newParentId: string | null
): ISchemaNode[] {
  const nodeMap = new Map(allNodes.map((n) => [n.id, { ...n }]));

  const movedNode = nodeMap.get(movedNodeId);
  if (!movedNode) return allNodes;

  movedNode.parent = newParentId;

  // Compute path for a node from its ancestors
  function computePath(nodeId: string): string {
    const node = nodeMap.get(nodeId);
    if (!node) return '';
    if (!node.parent) return node.name;
    return `${computePath(node.parent)}/${node.name}`;
  }

  // Find all descendants of a node
  function getDescendants(parentId: string): string[] {
    const children = Array.from(nodeMap.values()).filter(
      (n) => n.parent === parentId
    );
    const result: string[] = [];
    for (const child of children) {
      result.push(child.id);
      result.push(...getDescendants(child.id));
    }
    return result;
  }

  // Update path for moved node and all descendants
  const toUpdate = [movedNodeId, ...getDescendants(movedNodeId)];
  for (const id of toUpdate) {
    const node = nodeMap.get(id);
    if (node) {
      node.path = computePath(id);
    }
  }

  return Array.from(nodeMap.values());
}
