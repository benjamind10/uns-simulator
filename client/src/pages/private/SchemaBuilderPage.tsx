import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { createSchemaNodeAsync } from '../../store/schemaNode/schemaNodeThunk';
import type { AppDispatch } from '../../store/store';

/* ------------------------------------------------------------------
 * TYPES & HELPERS
 * -----------------------------------------------------------------*/
export type TreeNodeType = {
  id: string;
  name: string;
  kind: 'Group' | 'Metric';
  children?: TreeNodeType[];
  // Metric‑only extras
  dataType?: 'Float' | 'Int' | 'Bool' | 'String';
  unit?: string;
};

// Simple ID generator – swap for uuid/nanoid if you prefer
const genId = () =>
  Date.now().toString(36) + Math.random().toString(36).substring(2, 7);

/* ------------------------------------------------------------------
 * PURE TREE MANIPULATION HELPERS
 * -----------------------------------------------------------------*/
const addChild = (
  tree: TreeNodeType[],
  parentId: string | null,
  child: TreeNodeType
): TreeNodeType[] => {
  if (parentId === null) return [...tree, child];
  const walk = (nodes: TreeNodeType[]): TreeNodeType[] =>
    nodes.map((n) => {
      if (n.id === parentId) {
        return { ...n, children: [...(n.children || []), child] };
      }
      if (n.children) return { ...n, children: walk(n.children) };
      return n;
    });
  return walk(tree);
};

const updateNode = (
  tree: TreeNodeType[],
  nodeId: string,
  patch: Partial<TreeNodeType>
): TreeNodeType[] => {
  const walk = (nodes: TreeNodeType[]): TreeNodeType[] =>
    nodes.map((n) => {
      if (n.id === nodeId) return { ...n, ...patch };
      if (n.children) return { ...n, children: walk(n.children) };
      return n;
    });
  return walk(tree);
};

const deleteNode = (tree: TreeNodeType[], nodeId: string): TreeNodeType[] => {
  const walk = (nodes: TreeNodeType[]): TreeNodeType[] =>
    nodes
      .filter((n) => n.id !== nodeId)
      .map((n) => (n.children ? { ...n, children: walk(n.children) } : n));
  return walk(tree);
};

/* ------------------------------------------------------------------
 * TREE ITEM COMPONENT (recursive)
 * -----------------------------------------------------------------*/
function TreeNode({
  node,
  onSelect,
  selectedId,
}: {
  node: TreeNodeType;
  onSelect: (n: TreeNodeType) => void;
  selectedId: string | null;
}) {
  return (
    <div className="ml-3">
      <div
        className={`cursor-pointer py-1 px-2 rounded transition-colors ${
          selectedId === node.id
            ? 'bg-blue-100 dark:bg-blue-800 font-semibold'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        onClick={() => onSelect(node)}
      >
        {node.name}
      </div>
      {node.children?.length ? (
        <div className="ml-4 border-l border-gray-300 dark:border-gray-700 pl-2">
          {node.children.map((c) => (
            <TreeNode
              key={c.id}
              node={c}
              onSelect={onSelect}
              selectedId={selectedId}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------
 * MAIN PAGE COMPONENT
 * -----------------------------------------------------------------*/
export default function SchemaBuilderPage() {
  /** -----------------------------------------------------------------
   * Local state
   * ----------------------------------------------------------------*/
  const [tree, setTree] = useState<TreeNodeType[]>([]); // whole tree
  const [selected, setSelected] = useState<TreeNodeType | null>(null); // currently‑selected node
  const [form, setForm] = useState({
    name: '',
    type: 'Group' as 'Group' | 'Metric',
    dataType: 'Float',
    unit: '%',
    parentId: null as string | null, // <-- Add this
  });

  /** -----------------------------------------------------------------
   * Redux hooks
   * ----------------------------------------------------------------*/
  const dispatch = useDispatch<AppDispatch>();

  /** -----------------------------------------------------------------
   * Form helpers
   * ----------------------------------------------------------------*/
  const resetForm = () =>
    setForm({
      name: '',
      type: 'Group',
      dataType: 'Float',
      unit: '%',
      parentId: null, // <-- Add this
    });

  const handleSelect = (node: TreeNodeType) => {
    setSelected(node);
    setForm({
      name: node.name,
      type: node.kind,
      dataType: node.dataType || 'Float',
      unit: node.unit || '',
      parentId: null, // Reset parentId on select
    });
  };

  // Helper function to get all nodes (for parent dropdown)
  const getAllNodes = (nodes: TreeNodeType[]): TreeNodeType[] => {
    const result: TreeNodeType[] = [];
    const walk = (nodeList: TreeNodeType[]) => {
      nodeList.forEach((node) => {
        result.push(node);
        if (node.children) walk(node.children);
      });
    };
    walk(nodes);
    return result;
  };

  const handleAddOrUpdate = () => {
    if (!form.name.trim()) return;

    if (selected && tree.some((t) => t.id === selected.id)) {
      // --- UPDATE ---
      setTree((prev) =>
        updateNode(prev, selected.id, {
          name: form.name,
          kind: form.type,
          dataType:
            form.type === 'Metric'
              ? (form.dataType as 'Float' | 'Int' | 'Bool' | 'String')
              : undefined,
          unit: form.type === 'Metric' ? form.unit : undefined,
        })
      );
    } else {
      // --- ADD (using parentId from form, not selected node) ---
      const newNode: TreeNodeType = {
        id: genId(),
        name: form.name,
        kind: form.type,
        children: [],
        dataType:
          form.type === 'Metric'
            ? (form.dataType as 'Float' | 'Int' | 'Bool' | 'String')
            : undefined,
        unit: form.type === 'Metric' ? form.unit : undefined,
      };
      setTree((prev) => addChild(prev, form.parentId, newNode)); // <-- Use form.parentId
    }

    setSelected(null);
    resetForm();
  };

  const handleDelete = () => {
    if (!selected) return;
    setTree((prev) => deleteNode(prev, selected.id));
    setSelected(null);
    resetForm();
  };

  /** -----------------------------------------------------------------
   * DB sync (save entire tree)
   * ----------------------------------------------------------------*/
  const generatePath = (nodeName: string, parentPath?: string): string => {
    if (!parentPath) return `/${nodeName}`;
    return `${parentPath}/${nodeName}`;
  };

  const saveNodeRecursive = async (
    node: TreeNodeType,
    parentId: string | null,
    parentPath: string = ''
  ): Promise<void> => {
    const nodePath = generatePath(node.name, parentPath || undefined);

    // Create input object that matches your GraphQL schema
    const input = {
      name: node.name,
      kind: node.kind.toLowerCase() as 'group' | 'metric',
      parent: parentId,
      path: nodePath,
      order: 0,
      // Only include dataType and unit for metrics
      ...(node.kind === 'Metric' &&
        node.dataType && { dataType: node.dataType }),
      ...(node.kind === 'Metric' && node.unit && { unit: node.unit }),
      engineering: {},
    };

    const result = await dispatch(createSchemaNodeAsync(input)).unwrap();

    // Recurse to children with new parent id and path
    if (node.children?.length) {
      for (const child of node.children) {
        await saveNodeRecursive(child, result.id, nodePath);
      }
    }
  };

  const handleSaveAll = async () => {
    try {
      for (const root of tree) {
        await saveNodeRecursive(root, null, '');
      }
      toast.success('All nodes saved to database!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save nodes to database!');
    }
  };

  /** -----------------------------------------------------------------
   * RENDER
   * ----------------------------------------------------------------*/
  return (
    <div className="flex flex-col max-w-6xl mx-auto py-10">
      {/* Top bar */}
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={handleSaveAll}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Save All to Database
        </button>
      </div>

      <div className="flex gap-8">
        {/* ---------------- Tree Pane ---------------- */}
        <div className="w-1/3 bg-white dark:bg-gray-800 rounded shadow p-4 overflow-auto">
          <h2 className="font-bold mb-4 text-lg">Asset Tree</h2>
          {tree.length === 0 && (
            <p className="text-sm text-gray-500">
              No nodes yet. Use the form to add one.
            </p>
          )}
          {tree.map((n) => (
            <TreeNode
              key={n.id}
              node={n}
              onSelect={handleSelect}
              selectedId={selected?.id || null}
            />
          ))}
        </div>

        {/* ---------------- Form Pane ---------------- */}
        <div className="w-2/3 bg-white dark:bg-gray-800 rounded shadow p-6">
          <h2 className="font-bold mb-4 text-lg">
            {selected ? 'Edit / Add Child' : 'Add Root Node'}
          </h2>

          {selected && (
            <p className="mb-2 text-sm text-gray-500">
              Parent: <span className="font-medium">{selected.name}</span>
            </p>
          )}

          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddOrUpdate();
            }}
          >
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, name: e.target.value }))
                }
                className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    type: e.target.value as 'Group' | 'Metric',
                  }))
                }
                className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900"
              >
                <option value="Group">Group</option>
                <option value="Metric">Metric</option>
              </select>
            </div>

            {/* Add Parent selector */}
            <div>
              <label className="block text-sm font-medium mb-1">Parent</label>
              <select
                value={form.parentId || ''}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    parentId: e.target.value || null,
                  }))
                }
                className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900"
              >
                <option value="">(Root Level)</option>
                {getAllNodes(tree)
                  .filter((node) => node.kind === 'Group') // Only allow adding to Groups
                  .map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.name}
                    </option>
                  ))}
              </select>
            </div>

            {form.type === 'Metric' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Data Type
                  </label>
                  <select
                    value={form.dataType}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dataType: e.target.value }))
                    }
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900"
                  >
                    <option value="Float">Float</option>
                    <option value="Int">Int</option>
                    <option value="Bool">Bool</option>
                    <option value="String">String</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Unit</label>
                  <input
                    type="text"
                    value={form.unit}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, unit: e.target.value }))
                    }
                    className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900"
                  />
                </div>
              </>
            )}

            <div className="flex gap-4 mt-6">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                {selected ? 'Add Child / Update' : 'Add Root'}
              </button>
              {selected && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Delete
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
