import type { SchemaNode } from '../types';

export function buildTree(
  nodes: SchemaNode[],
  parentId: string | null = null
): Array<SchemaNode & { children: SchemaNode[] }> {
  return nodes
    .filter((n) => n.parent === parentId)
    .map((n) => ({
      ...n,
      children: buildTree(nodes, n.id) ?? [],
    }));
}
