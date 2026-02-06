import { describe, it, expect, vi, beforeEach } from 'vitest';

import { parseSchemaFile } from '../../utils/parseSchemaFile';
import type { ISchemaNode } from '../../types';

let uuidCounter = 0;

beforeEach(() => {
  uuidCounter = 0;
  vi.stubGlobal('crypto', {
    randomUUID: () => `uuid-${++uuidCounter}`,
  });
});

function makeFile(content: unknown): File {
  const json = JSON.stringify(content);
  return {
    text: () => Promise.resolve(json),
    name: 'test.json',
  } as unknown as File;
}

describe('parseSchemaFile', () => {
  it('parses a valid JSON array of nodes', async () => {
    const raw = [
      { name: 'temperature', kind: 'metric' },
      { name: 'pressure', kind: 'metric' },
    ];
    const result = await parseSchemaFile(makeFile(raw), []);

    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('temperature');
    expect(result[0].kind).toBe('metric');
    expect(result[0].id).toBe('uuid-1');
    expect(result[1].id).toBe('uuid-2');
    expect(result[0].isTemporary).toBe(true);
  });

  it('resolves parent by name from existing nodes', async () => {
    const existingNodes: ISchemaNode[] = [
      {
        id: 'existing-1',
        name: 'plant',
        kind: 'group',
        parent: null,
        path: 'plant',
        order: 0,
      },
    ];
    const raw = [{ name: 'temp', kind: 'metric', parent: 'plant' }];
    const result = await parseSchemaFile(makeFile(raw), existingNodes);

    expect(result[0].parent).toBe('existing-1');
    expect(result[0].path).toBe('plant/temp');
  });

  it('resolves parent by id from existing nodes', async () => {
    const existingNodes: ISchemaNode[] = [
      {
        id: 'existing-1',
        name: 'plant',
        kind: 'group',
        parent: null,
        path: 'plant',
        order: 0,
      },
    ];
    const raw = [{ name: 'temp', kind: 'metric', parent: 'existing-1' }];
    const result = await parseSchemaFile(makeFile(raw), existingNodes);

    expect(result[0].parent).toBe('existing-1');
  });

  it('resolves parent within imported batch', async () => {
    const raw = [
      { id: 'parent-ref', name: 'group1', kind: 'group' },
      { name: 'child1', kind: 'metric', parent: 'parent-ref' },
    ];
    const result = await parseSchemaFile(makeFile(raw), []);

    // parent-ref gets mapped to index 0 → uuid-1
    expect(result[1].parent).toBe('uuid-1');
    expect(result[1].path).toBe('group1/child1');
  });

  it('constructs paths from parent paths', async () => {
    const existingNodes: ISchemaNode[] = [
      {
        id: 'e1',
        name: 'factory',
        kind: 'group',
        parent: null,
        path: 'factory',
        order: 0,
      },
    ];
    const raw = [{ name: 'sensor', kind: 'metric', parent: 'factory' }];
    const result = await parseSchemaFile(makeFile(raw), existingNodes);

    expect(result[0].path).toBe('factory/sensor');
  });

  it('throws on non-array JSON', async () => {
    const file = makeFile({ name: 'not an array' });

    await expect(parseSchemaFile(file, [])).rejects.toThrow(
      'File must contain a JSON array'
    );
  });

  it('sets default values for missing fields', async () => {
    const raw = [{ name: 'temp', kind: 'metric' }];
    const result = await parseSchemaFile(makeFile(raw), []);

    expect(result[0].order).toBe(0);
    expect(result[0].engineering).toEqual({});
    expect(result[0].parent).toBeNull();
  });
});
