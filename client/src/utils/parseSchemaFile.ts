import type { ISchemaNode } from '../types';

type RawNode = {
  id?: string;
  name: string;
  kind: 'group' | 'metric';
  parent?: string | null; // may be name OR id
  dataType?: 'Int' | 'Float' | 'Bool' | 'String';
  unit?: string;
  engineering?: Record<string, unknown>;
  order?: number;
  path?: string; // allow path in input
};

/**
 * @param file - The file to import
 * @param existingNodes - The current nodes from the Redux store (array of SchemaNode)
 */
export async function parseSchemaFile(
  file: File,
  existingNodes: ISchemaNode[]
): Promise<ISchemaNode[]> {
  const text = await file.text();
  const raw: RawNode[] = JSON.parse(text);

  if (!Array.isArray(raw)) throw new Error('File must contain a JSON array');

  // Build a map of existing node names and ids to their real DB ids
  const dbIdMap = new Map<string, string>();
  for (const node of existingNodes) {
    dbIdMap.set(node.id, node.id);
    dbIdMap.set(node.name, node.id);
  }

  // Sort by hierarchy depth (parents first)
  const sortedRaw = raw.sort((a, b) => {
    if (!a.parent && b.parent) return -1;
    if (a.parent && !b.parent) return 1;
    return (a.order ?? 0) - (b.order ?? 0);
  });

  const result: ISchemaNode[] = [];
  const tempIdMap = new Map<string, number>(); // original id -> array index

  // First pass: create nodes with null parents
  sortedRaw.forEach((n, index) => {
    if (n.id) {
      tempIdMap.set(n.id, index);
    }

    const schemaNode: ISchemaNode = {
      id: crypto.randomUUID(),
      name: n.name,
      kind: n.kind,
      parent: null, // Will be fixed in second pass
      dataType: n.dataType,
      unit: n.unit,
      engineering: n.engineering ?? {},
      order: typeof n.order === 'number' ? n.order : 0,
      path: n.path || n.name, // Will be fixed in second pass
      isTemporary: true,
    };

    result.push(schemaNode);
  });

  // Second pass: fix parent relationships using array positions and DB ids
  sortedRaw.forEach((n, index) => {
    if (n.parent) {
      // Try to resolve parent from existing nodes (Redux store)
      let parentId = dbIdMap.get(n.parent);
      // If not found, fall back to imported nodes in this batch
      if (!parentId) {
        const parentIndex = tempIdMap.get(n.parent);
        if (parentIndex !== undefined && parentIndex < index) {
          parentId = result[parentIndex].id;
        }
      }
      if (parentId) {
        result[index].parent = parentId;
        // Fix path
        const parentNode =
          existingNodes.find((node) => node.id === parentId) ||
          result.find((node) => node.id === parentId);
        const parentPath = parentNode?.path;
        result[index].path = parentPath ? `${parentPath}/${n.name}` : n.name;
      }
    }
  });

  return result;
}
