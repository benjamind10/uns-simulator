import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import type { AppDispatch } from '../../store/store';
import {
  saveNodesToSchemaAsync,
  fetchSchemasAsync,
} from '../../store/schema/schemaThunk';
import { selectSchemas } from '../../store/schema/schemaSlice';
import type { ISchemaNode } from '../../types';
import { buildTree } from '../../utils/tree';
import TreeNode from './TreeNode'; // <-- Import the extracted component
import FileUpload from './FileUpload';

interface SchemaNodeEditorProps {
  schemaId: string;
}

export default function SchemaNodeEditor({ schemaId }: SchemaNodeEditorProps) {
  const dispatch = useDispatch<AppDispatch>();
  const schemas = useSelector(selectSchemas);
  const schema = schemas.find((s) => s.id === schemaId);

  const [tempNodes, setTempNodes] = useState<ISchemaNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ISchemaNode | null>(null);
  const [form, setForm] = useState<{
    name: string;
    kind: 'group' | 'metric';
    dataType: '' | 'Int' | 'Float' | 'Bool' | 'String';
    unit: string;
  }>({
    name: '',
    kind: 'group',
    dataType: '',
    unit: '',
  });

  useEffect(() => {
    dispatch(fetchSchemasAsync());
    setTempNodes([]);
    setSelectedNode(null);
  }, [dispatch, schemaId]);

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        Select a schema to edit or wait for it to load.
      </div>
    );
  }

  const savedNodes =
    schema.nodes?.map((n) => ({
      ...n,
      parent: !n.parent || n.parent === '' ? null : n.parent,
      isTemporary: false,
    })) ?? [];

  const currentTree = buildTree(savedNodes, null);
  const allNodes = [...savedNodes, ...tempNodes];
  const futureTree = buildTree(allNodes, null);

  const handleSelect = (node: ISchemaNode) => {
    setSelectedNode(node);
    setForm({
      name: node.name,
      kind: node.kind,
      dataType: node.dataType ?? '',
      unit: node.unit ?? '',
    });
  };

  const handleAddNode = () => {
    const newNode: ISchemaNode = {
      id: Date.now().toString(),
      name: form.name,
      kind: form.kind,
      parent: selectedNode?.id || null,
      path: selectedNode ? `${selectedNode.path}/${form.name}` : form.name,
      order: 0,
      dataType: form.dataType === '' ? undefined : form.dataType,
      unit: form.unit,
      engineering: {},
      isTemporary: true,
    };

    setTempNodes([...tempNodes, newNode]);
    setForm({ name: '', kind: 'group', dataType: '', unit: '' });
    setSelectedNode(null);
    toast.success('Node added to temporary list');
  };

  const handleDeleteNode = (nodeId: string) => {
    const deleteNodeAndChildren = (
      nodes: ISchemaNode[],
      targetId: string
    ): ISchemaNode[] => {
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

  const handleClearNode = () => {
    setSelectedNode(null);
    setForm({ name: '', kind: 'group', dataType: '', unit: '' });
  };

  const handleClearAll = () => {
    setTempNodes([]);
    setSelectedNode(null);
    setForm({ name: '', kind: 'group', dataType: '', unit: '' });
    toast.success('All temporary nodes cleared');
  };

  const handleSaveAll = async () => {
    if (tempNodes.length === 0) {
      toast.error('No temporary nodes to save');
      return;
    }

    try {
      await dispatch(
        saveNodesToSchemaAsync({
          schemaId,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          nodes: tempNodes.map(({ id, isTemporary, children, ...node }) => ({
            ...node,
            order: typeof node.order === 'number' ? node.order : 0,
            path: node.path ?? '',
          })),
        })
      ).unwrap();

      setTempNodes([]);
      setSelectedNode(null);
      setForm({ name: '', kind: 'group', dataType: '', unit: '' });

      await dispatch(fetchSchemasAsync());
      toast.success('All nodes saved to database!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('Failed to save nodes to database');
    }
  };

  return (
    <div className="flex gap-4">
      {/* Left: Current Asset Tree */}
      <div
        className="w-1/3 bg-white dark:bg-gray-800 rounded shadow p-4"
        style={{ maxHeight: '500px', overflow: 'auto' }}
      >
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
      <div
        className="w-1/3 bg-white dark:bg-gray-800 rounded shadow p-4"
        style={{ height: '500px', overflow: 'auto' }}
      >
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
        <h2 className="font-bold mb-4 text-lg flex items-center justify-between">
          Node Builder
          <FileUpload
            onImport={(nodes) => setTempNodes((prev) => [...prev, ...nodes])}
          />
        </h2>
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
                <select
                  value={form.dataType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      dataType: e.target.value as
                        | ''
                        | 'Int'
                        | 'Float'
                        | 'Bool'
                        | 'String',
                    }))
                  }
                  className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900"
                >
                  <option value="">Select type</option>
                  <option value="Int">Int</option>
                  <option value="Float">Float</option>
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
