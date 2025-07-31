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
import ConfirmDialog from '../global/ConfirmDialog'; // confirm modal

import TreeNode from './TreeNode';
import FileUpload from './FileUpload';

/* ------------------------------------------------------------------ */
interface SchemaNodeEditorProps {
  schemaId: string;
}

export default function SchemaNodeEditor({ schemaId }: SchemaNodeEditorProps) {
  const dispatch = useDispatch<AppDispatch>();
  const schemas = useSelector(selectSchemas);
  const schema = schemas.find((s) => s.id === schemaId);

  const [tempNodes, setTempNodes] = useState<ISchemaNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<ISchemaNode | null>(null);
  const [showClearSavedConfirm, setShowClearSavedConfirm] = useState(false);

  const [form, setForm] = useState({
    name: '',
    kind: 'group' as 'group' | 'metric',
    dataType: '' as '' | 'Int' | 'Float' | 'Bool' | 'String',
    unit: '',
  });

  /* ── refresh schema on mount / id change ── */
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

  /* --------------------- helpers --------------------- */
  const savedNodes =
    schema.nodes?.map((n) => ({
      ...n,
      parent: !n.parent || n.parent === '' ? null : n.parent,
      isTemporary: false,
    })) ?? [];

  const currentTree = buildTree(savedNodes, null);
  const futureTree = buildTree([...savedNodes, ...tempNodes], null);

  const handleSelect = (node: ISchemaNode) => {
    setSelectedNode(node);
    setForm({
      name: node.name,
      kind:
        node.kind === 'group' || node.kind === 'metric' ? node.kind : 'group',
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

    setTempNodes((p) => [...p, newNode]);
    setForm({ name: '', kind: 'group', dataType: '', unit: '' });
    setSelectedNode(null);
    toast.success('Node added to temporary list');
  };

  const handleDeleteNode = (nodeId: string) => {
    const prune = (nodes: ISchemaNode[], target: string) =>
      nodes.filter((n) => n.id !== target && n.parent !== target);

    setTempNodes((p) => prune(p, nodeId));

    if (selectedNode?.id === nodeId) {
      setSelectedNode(null);
      setForm({ name: '', kind: 'group', dataType: '', unit: '' });
    }
    toast.success('Node removed');
  };

  const handleClearNode = () => {
    setSelectedNode(null);
    setForm({ name: '', kind: 'group', dataType: '', unit: '' });
  };

  const handleClearAllTemp = () => {
    setTempNodes([]);
    handleClearNode();
    toast.success('All temporary nodes cleared');
  };

  /* ---- NEW: clear ALL saved nodes from DB ---- */
  const handleClearSaved = async () => {
    try {
      await dispatch(saveNodesToSchemaAsync({ schemaId, nodes: [] })).unwrap();
      toast.success('All saved nodes removed');
      setShowClearSavedConfirm(false);
      dispatch(fetchSchemasAsync());
    } catch (err) {
      console.error(err);
      toast.error('Failed to clear saved nodes');
    }
  };

  const handleSaveAll = async () => {
    if (tempNodes.length === 0)
      return toast.error('No temporary nodes to save');

    try {
      await dispatch(
        saveNodesToSchemaAsync({
          schemaId,
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          nodes: tempNodes.map(({ isTemporary, children, ...n }) => ({
            id: n.id,
            name: n.name,
            kind: n.kind,
            parent: n.parent,
            path: n.path ?? '',
            order: typeof n.order === 'number' ? n.order : 0,
            dataType: n.dataType,
            unit: n.unit ?? '',
            engineering: n.engineering ?? {},
          })),
        })
      ).unwrap();

      setTempNodes([]);
      handleClearNode();
      dispatch(fetchSchemasAsync());
      toast.success('All nodes saved to database!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to save nodes');
    }
  };

  /* ------------------------------------------------------------------ */
  return (
    <div className="flex gap-4">
      {/* ── LEFT: Current Asset Tree ── */}
      <div
        className="w-1/3 bg-white dark:bg-gray-800 rounded shadow p-4"
        style={{ maxHeight: 500, overflow: 'auto' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Current Asset Tree</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {savedNodes.length} saved
            </span>
            {savedNodes.length > 0 && (
              <button
                onClick={() => setShowClearSavedConfirm(true)}
                className="text-red-500 hover:text-red-700 text-xs underline"
              >
                Clear Saved
              </button>
            )}
          </div>
        </div>
        {currentTree.length ? (
          currentTree.map((n) => (
            <TreeNode
              key={n.id}
              node={n}
              onSelect={handleSelect}
              onDelete={handleDeleteNode}
              selectedId={selectedNode?.id ?? null}
            />
          ))
        ) : (
          <div className="text-gray-400">No saved nodes yet.</div>
        )}
      </div>

      {/* ── MIDDLE: Future Asset Tree ── */}
      <div
        className="w-1/3 bg-white dark:bg-gray-800 rounded shadow p-4"
        style={{ height: 500, overflow: 'auto' }}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-lg">Future Asset Tree</h2>
          <span className="text-sm text-gray-500">{tempNodes.length} temp</span>
        </div>
        {futureTree.length ? (
          futureTree.map((n) => (
            <TreeNode
              key={n.id}
              node={n}
              onSelect={handleSelect}
              onDelete={handleDeleteNode}
              selectedId={selectedNode?.id ?? null}
            />
          ))
        ) : (
          <div className="text-gray-400">
            {savedNodes.length ? 'Same as current tree.' : 'No nodes yet.'}
          </div>
        )}
      </div>

      {/* ── RIGHT: Builder Form ── */}
      <div className="w-1/3 bg-white dark:bg-gray-800 rounded shadow p-6">
        <h2 className="font-bold mb-4 text-lg flex items-center justify-between">
          Node Builder
          <FileUpload
            onImport={(nodes) => setTempNodes((p) => [...p, ...nodes])}
          />
        </h2>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            handleAddNode();
          }}
        >
          {/* NAME */}
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          {/* KIND */}
          <div>
            <label className="block text-sm font-medium mb-1">Type</label>
            <select
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900"
              value={form.kind}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  kind: e.target.value as 'group' | 'metric',
                }))
              }
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
                  className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900"
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
                  className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-900"
                  placeholder="%, °C, m/s, …"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                />
              </div>
            </>
          )}

          {/* ACTION BUTTONS */}
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
                  onClick={handleClearAllTemp}
                  className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600"
                >
                  Clear All Temp
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
          <div className="mt-6 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm text-gray-600 dark:text-gray-300">
            Selected: <span className="font-semibold">{selectedNode.name}</span>
            {selectedNode.isTemporary && ' (temporary)'}
            <br />
            New nodes will be added as children.
          </div>
        )}
      </div>

      {/* ── Confirm delete dialog ── */}
      <ConfirmDialog
        isOpen={showClearSavedConfirm}
        onClose={() => setShowClearSavedConfirm(false)}
        onConfirm={handleClearSaved}
        title="Remove ALL saved nodes"
        message="This will delete every node currently stored in the database for this schema. Are you sure?"
      />
    </div>
  );
}
