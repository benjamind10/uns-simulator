import { describe, it, expect } from 'vitest';

import { buildTopicTree } from '../../utils/mqttTopicTree';

describe('buildTopicTree', () => {
  it('returns root with no children for empty array', () => {
    const root = buildTopicTree([]);
    expect(root.children).toEqual({});
    expect(root.name).toBe('');
  });

  it('builds a 3-level tree from a single topic', () => {
    const root = buildTopicTree(['a/b/c']);

    expect(root.children['a']).toBeDefined();
    expect(root.children['a'].children['b']).toBeDefined();
    expect(root.children['a'].children['b'].children['c']).toBeDefined();
  });

  it('merges topics with shared prefixes', () => {
    const root = buildTopicTree(['plant/area1/temp', 'plant/area1/pressure', 'plant/area2/temp']);

    const plant = root.children['plant'];
    expect(plant).toBeDefined();
    expect(Object.keys(plant.children)).toEqual(['area1', 'area2']);
    expect(Object.keys(plant.children['area1'].children)).toEqual([
      'temp',
      'pressure',
    ]);
    expect(Object.keys(plant.children['area2'].children)).toEqual(['temp']);
  });

  it('sets fullPath correctly at each level', () => {
    const root = buildTopicTree(['a/b/c']);

    expect(root.children['a'].fullPath).toBe('a');
    expect(root.children['a'].children['b'].fullPath).toBe('a/b');
    expect(root.children['a'].children['b'].children['c'].fullPath).toBe(
      'a/b/c'
    );
  });

  it('handles single-segment topics', () => {
    const root = buildTopicTree(['temperature']);
    expect(root.children['temperature']).toBeDefined();
    expect(root.children['temperature'].fullPath).toBe('temperature');
    expect(root.children['temperature'].name).toBe('temperature');
  });

  it('handles duplicate topics without creating duplicates', () => {
    const root = buildTopicTree(['a/b', 'a/b']);
    expect(Object.keys(root.children['a'].children)).toEqual(['b']);
  });
});
