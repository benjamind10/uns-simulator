import type { SchemaNode } from '../types';

export async function parseSchemaFile(file: File): Promise<SchemaNode[]> {
  const text = await file.text();
  const raw = JSON.parse(text);

  if (!Array.isArray(raw))
    throw new Error('File must contain a JSON array of nodes');

  // Map + generate temp IDs and parent strings
  const byPath = new Map<string, string>(); // path → generated id
  return raw.map((n) => {
    if (!n.name || !n.kind || !n.path)
      throw new Error('Each node needs name, kind, path');
    const id = crypto.randomUUID();
    byPath.set(n.path, id);
    const parentPath = n.path.split('/').slice(0, -1).join('/') || null;

    return {
      id,
      name: n.name,
      kind: n.kind,
      parent: parentPath ? byPath.get(parentPath) ?? null : null,
      path: n.path,
      order: 0,
      dataType: n.dataType,
      unit: n.unit,
      engineering: n.engineering ?? {},
      isTemporary: true,
    } as SchemaNode;
  });
}
