import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { fetchSchemaNodesByParent } from '../api/schemaNode'; // Add this import
import { createSchemaNodeAsync } from '../store/schemaNode/schemaNodeThunk';

interface SchemaNode {
  id: string;
  name: string;
  kind: string;
  parent: string | null;
  dataType?: string;
  unit?: string;
  children?: SchemaNode[];
  isTemporary?: boolean; // Add flag to distinguish temp nodes
}

const generateTempId = () =>
  `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

function TreeNode({
  node,
  onSelect,
  onDelete,
  selectedId,
}: {
  node: SchemaNode;
  onSelect: (node: SchemaNode) => void;
  onDelete: (nodeId: string) => void;
  selectedId: string | null;
}) {
  return (
    <div className="ml-4">
      <div
        className={`cursor-pointer py-1 px-2 rounded flex justify-between items-center group ${
          selectedId === node.id
            ? 'bg-blue-100 dark:bg-blue-900 font-semibold'
            : 'hover:bg-gray-100 dark:hover:bg-gray-700'
        }`}
        onClick={() => onSelect(node)}
      >
        <span className={node.isTemporary ? 'text-blue-600 italic' : ''}>
          {node.name} {node.isTemporary && '(temp)'}
        </span>
        {/* Only show delete button for temporary nodes */}
        {node.isTemporary && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node.id);
            }}
            className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-sm"
          >
            ✕
          </button>
        )}
      </div>
      {node.children && node.children.length > 0 && (
        <div className="ml-4 border-l border-gray-300 dark:border-gray-700 pl-2">
          {node.children.map((child: SchemaNode) => (
            <TreeNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              onDelete={onDelete}
              selectedId={selectedId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function SchemaNodeEditor({ schemaId }: { schemaId: string }) {
  const [savedNodes, setSavedNodes] = useState<SchemaNode[]>([]); // From database
  const [tempNodes, setTempNodes] = useState<SchemaNode[]>([]); // Temporary nodes
  const [selectedNode, setSelectedNode] = useState<SchemaNode | null>(null);
  const [form, setForm] = useState<{
    name: string;
    kind: 'group' | 'metric';
    dataType: string;
    unit: string;
  }>({
    name: '',
    kind: 'group',
    dataType: '',
    unit: '',
  });

  // Load saved nodes when schema changes
  useEffect(() => {
    if (schemaId) {
      fetchSchemaNodesByParent(schemaId) // This should fetch ALL nodes for the schema!
        .then((nodes) => {
          const schemaNodes = nodes.map((n) => ({
            ...n,
            parent: n.parent ?? null,
            isTemporary: false,
          }));
          setSavedNodes(schemaNodes);
        })
        .catch(() => {
          setSavedNodes([]);
        });
    }
    setTempNodes([]);
    setSelectedNode(null);
  }, [schemaId]);

  // Combine saved and temporary nodes
  const allNodes = [...savedNodes, ...tempNodes];

  // Build tree from combined nodes
  const buildTree = (
    nodes: SchemaNode[],
    parentId: string | null = null
  ): Array<SchemaNode & { children: SchemaNode[] }> =>
    nodes
      .filter((n) => n.parent === parentId)
      .map((n) => ({
        ...n,
        children: buildTree(nodes, n.id),
      }));

  const currentTree = buildTree(savedNodes, null); // Current saved tree
  const futureTree = buildTree(allNodes, null); // Future tree (saved + temp)

  // Select node and fill form
  const handleSelect = (node: SchemaNode) => {
    setSelectedNode(node);
    setForm({
      name: node.name,
      kind:
        node.kind === 'group' || node.kind === 'metric' ? node.kind : 'group',
      dataType: node.dataType || '',
      unit: node.unit || '',
    });
  };

  // Add new temporary node
  const handleAddNode = () => {
    if (!form.name.trim()) return;

    const parentId = selectedNode ? selectedNode.id : null;
    const newNode: SchemaNode = {
      id: generateTempId(),
      name: form.name,
      kind: form.kind,
      parent: parentId,
      dataType: form.kind === 'metric' ? form.dataType : undefined,
      unit: form.kind === 'metric' ? form.unit : undefined,
      isTemporary: true,
    };

    setTempNodes((prev) => [...prev, newNode]);
    setForm({ name: '', kind: 'group', dataType: '', unit: '' });
    setSelectedNode(null);
    toast.success('Node added to temporary list');
  };

  // Delete temporary node
  const handleDeleteNode = (nodeId: string) => {
    const deleteNodeAndChildren = (
      nodes: SchemaNode[],
      targetId: string
    ): SchemaNode[] => {
      const filtered = nodes.filter((n) => n.id !== targetId);
      return filtered.filter((n) => n.parent !== targetId);
    };

    setTempNodes((prev) => deleteNodeAndChildren(prev, nodeId));

    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
      setForm({ name: '', kind: 'group', dataType: '', unit: '' });
    }

    toast.success('Node removed from temporary list');
  };

  // Clear selected node
  const handleClearNode = () => {
    setSelectedNode(null);
    setForm({ name: '', kind: 'group', dataType: '', unit: '' });
  };

  // Clear all temporary nodes
  const handleClearAll = () => {
    setTempNodes([]);
    setSelectedNode(null);
    setForm({ name: '', kind: 'group', dataType: '', unit: '' });
    toast.success('All temporary nodes cleared');
  };

  const saveNodeRecursive = async (
    node: SchemaNode & { children: SchemaNode[] },
    parentId: string | null = null,
    parentPath = ''
  ) => {
    const nodePath = parentPath
      ? `${parentPath}/${node.name}`
      : `/${node.name}`;
    const input = {
      name: node.name,
      kind: node.kind as 'group' | 'metric',
      parent: parentId,
      schema: schemaId, // <-- Link to selected schema
      path: nodePath,
      order: 0,
      dataType: node.kind === 'metric' ? node.dataType : undefined,
      unit: node.kind === 'metric' ? node.unit : undefined,
      engineering: {},
    };
    // Replace with your actual save function (API or Redux thunk)
    createSchemaNodeAsync(input); // Or your API call
    for (const child of node.children || []) {
      await saveNodeRecursive(
        { ...child, children: child.children ?? [] },
        node.id,
        nodePath
      );
    }
  };

  // Save all temporary nodes to database
  const handleSaveAll = async () => {
    if (tempNodes.length === 0) {
      toast.error('No temporary nodes to save');
      return;
    }

    try {
      const tempRootNodes = buildTree(tempNodes, null);
      for (const root of tempRootNodes) {
        await saveNodeRecursive(root, null, '');
      }

      setTempNodes([]);
      setSelectedNode(null);
      setForm({ name: '', kind: 'group', dataType: '', unit: '' });

      // Refresh saved nodes for the selected schema
      const updatedNodes = await fetchSchemaNodesByParent(schemaId);
      setSavedNodes(
        updatedNodes.map((n) => ({
          ...n,
          parent: n.parent ?? null,
          isTemporary: false,
        }))
      );

      toast.success('All nodes saved to database!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save nodes to database');
    }
  };

  return (
    <div className="flex gap-4">
      {/* Left: Current Asset Tree */}
      <div className="w-1/3 bg-white dark:bg-gray-800 rounded shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Current Asset Tree</h2>
          <span className="text-sm text-gray-500">
            {savedNodes.length} saved
          </span>
        </div>
        {currentTree.length > 0 ? (
          currentTree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              onSelect={handleSelect}
              onDelete={handleDeleteNode}
              selectedId={selectedNode?.id ?? null}
            />
          ))
        ) : (
          <div className="text-gray-400">No saved nodes yet.</div>
        )}
      </div>

      {/* Middle: Future Asset Tree */}
      <div className="w-1/3 bg-white dark:bg-gray-800 rounded shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Future Asset Tree</h2>
          <span className="text-sm text-gray-500">{tempNodes.length} temp</span>
        </div>
        {futureTree.length > 0 ? (
          futureTree.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              onSelect={handleSelect}
              onDelete={handleDeleteNode}
              selectedId={selectedNode?.id ?? null}
            />
          ))
        ) : (
          <div className="text-gray-400">
            {savedNodes.length > 0 ? 'Same as current tree.' : 'No nodes yet.'}
          </div>
        )}
      </div>

      {/* Right: Node Builder Form */}
      <div className="w-1/3 bg-white dark:bg-gray-800 rounded shadow p-6">
        <h2 className="font-bold mb-4 text-lg">Node Builder</h2>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleAddNode();
          }}
        >
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900"
              placeholder="Enter node name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              value={form.kind}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  kind: e.target.value as 'group' | 'metric',
                }))
              }
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900"
            >
              <option value="group">Group</option>
              <option value="metric">Metric</option>
            </select>
          </div>
          {form.kind === 'metric' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Data Type
                </label>
                <input
                  type="text"
                  value={form.dataType}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dataType: e.target.value }))
                  }
                  className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900"
                  placeholder="Float, Int, Bool, String"
                />
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
                  placeholder="%, °C, m/s, etc."
                />
              </div>
            </>
          )}

          <div className="flex flex-col gap-2 mt-6">
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              {selectedNode ? 'Add Child Node' : 'Add Root Node'}
            </button>
            {selectedNode && (
              <button
                type="button"
                onClick={handleClearNode}
                className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
              >
                Clear Selection
              </button>
            )}
            {tempNodes.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Save All to Database
                </button>
              </>
            )}
          </div>
        </form>

        {selectedNode && (
          <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-700 rounded">
            <div className="text-sm text-gray-600 dark:text-gray-300">
              Selected:{' '}
              <span className="font-semibold">{selectedNode.name}</span>
              {selectedNode.isTemporary && ' (temporary)'}
              <br />
              New nodes will be added as children.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
