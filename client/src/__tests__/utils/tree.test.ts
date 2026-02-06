import { describe, it, expect } from 'vitest';

import { buildTree } from '../../utils/tree';
import type { ISchemaNode } from '../../types';

function makeNode(overrides: Partial<ISchemaNode> & { id: string; name: string }): ISchemaNode {
  return {
    kind: 'metric',
    parent: null,
    path: overrides.name,
    order: 0,
    ...overrides,
  };
}

describe('buildTree', () => {
  it('returns empty array for empty input', () => {
    expect(buildTree([])).toEqual([]);
  });

  it('returns root nodes (parent === null)', () => {
    const nodes: ISchemaNode[] = [
      makeNode({ id: '1', name: 'a' }),
      makeNode({ id: '2', name: 'b' }),
    ];
    const tree = buildTree(nodes);
    expect(tree).toHaveLength(2);
    expect(tree[0].children).toEqual([]);
    expect(tree[1].children).toEqual([]);
  });

  it('builds nested children correctly', () => {
    const nodes: ISchemaNode[] = [
      makeNode({ id: '1', name: 'parent', kind: 'group' }),
      makeNode({ id: '2', name: 'child', parent: '1' }),
      makeNode({ id: '3', name: 'grandchild', parent: '2' }),
    ];
    const tree = buildTree(nodes);

    expect(tree).toHaveLength(1);
    expect(tree[0].name).toBe('parent');
    expect(tree[0].children).toHaveLength(1);
    expect(tree[0].children[0].name).toBe('child');
    const child = tree[0].children[0] as ReturnType<typeof buildTree>[number];
    expect(child.children).toHaveLength(1);
    expect(child.children[0].name).toBe('grandchild');
  });

  it('handles multiple roots with children', () => {
    const nodes: ISchemaNode[] = [
      makeNode({ id: '1', name: 'root1', kind: 'group' }),
      makeNode({ id: '2', name: 'root2', kind: 'group' }),
      makeNode({ id: '3', name: 'child1', parent: '1' }),
      makeNode({ id: '4', name: 'child2', parent: '2' }),
    ];
    const tree = buildTree(nodes);

    expect(tree).toHaveLength(2);
    expect(tree[0].children).toHaveLength(1);
    expect(tree[1].children).toHaveLength(1);
  });
});
