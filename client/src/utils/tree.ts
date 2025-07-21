import type { ISchemaNode } from '../types';

export function buildTree(
  nodes: ISchemaNode[],
  parentId: string | null = null
): Array<ISchemaNode & { children: ISchemaNode[] }> {
  return nodes
    .filter((n) => n.parent === parentId)
    .map((n) => ({
      ...n,
      children: buildTree(nodes, n.id) ?? [],
    }));
}
