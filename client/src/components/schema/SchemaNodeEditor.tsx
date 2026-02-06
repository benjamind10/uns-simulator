import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {
  ChevronRight,
  Save,
  Trash2,
  XCircle,
  Pencil,
  Plus,
} from 'lucide-react';

import type { AppDispatch } from '../../store/store';
import {
  saveNodesToSchemaAsync,
  fetchSchemasAsync,
} from '../../store/schema/schemaThunk';
import { selectSchemas } from '../../store/schema/schemaSlice';
import type { ISchemaNode } from '../../types';
import { buildTree, collectAllIds, recomputePaths } from '../../utils/tree';
import { generateUUID } from '../../utils/uuid';
import ConfirmDialog from '../global/ConfirmDialog';

import TreeNode from './TreeNode';
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // 'add' = adding a child under selectedNode; 'edit' = editing selectedNode's properties
  const [mode, setMode] = useState<'add' | 'edit'>('add');

  const [form, setForm] = useState({
    name: '',
    kind: 'group' as 'group' | 'metric',
    dataType: '' as '' | 'Int' | 'Float' | 'Bool' | 'Boolean' | 'String',
    unit: '',
  });

  // Refresh on schema change
  useEffect(() => {
    dispatch(fetchSchemasAsync());
    setTempNodes([]);
    setSelectedNode(null);
  }, [dispatch, schemaId]);

  // Expand all nodes by default when schema loads
  useEffect(() => {
    if (schema?.nodes) {
      setExpandedIds(collectAllIds(schema.nodes));
    }
  }, [schema?.nodes]);

  // DnD sensor with activation distance to avoid accidental drags
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  if (!schema) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        Select a schema to start building.
      </div>
    );
  }

  // Merge saved + temp nodes
  const savedNodes: ISchemaNode[] =
    schema.nodes?.map((n) => ({
      ...n,
      parent: !n.parent || n.parent === '' ? null : n.parent,
      isTemporary: false,
    })) ?? [];

  const allNodes = [...savedNodes, ...tempNodes];
  const tree = buildTree(allNodes, null);
  const allNodeIds = allNodes.map((n) => n.id);

  // Build parent breadcrumb path
  const parentBreadcrumb = useMemo(() => {
    if (!selectedNode) return null;
    const parts: string[] = [];
    let current: ISchemaNode | undefined = selectedNode;
    while (current) {
      parts.unshift(current.name);
      current = allNodes.find((n) => n.id === current!.parent);
    }
    return parts;
  }, [selectedNode, allNodes]);

  /* ── Handlers ── */

  const handleSelect = (node: ISchemaNode) => {
    if (selectedNode?.id === node.id) {
      // Deselect on second click
      setSelectedNode(null);
      setMode('add');
      setForm({ name: '', kind: 'group', dataType: '', unit: '' });
    } else {
      setSelectedNode(node);
      // Default to edit mode — populate form with node properties
      setMode('edit');
      setForm({
        name: node.name,
        kind: node.kind as 'group' | 'metric',
        dataType: (node.dataType as '' | 'Int' | 'Float' | 'Bool' | 'Boolean' | 'String') || '',
        unit: node.unit || '',
      });
    }
  };

  const handleSwitchToAdd = () => {
    setMode('add');
    setForm({ name: '', kind: 'group', dataType: '', unit: '' });
  };

  const handleSwitchToEdit = () => {
    if (!selectedNode) return;
    setMode('edit');
    setForm({
      name: selectedNode.name,
      kind: selectedNode.kind as 'group' | 'metric',
      dataType: (selectedNode.dataType as '' | 'Int' | 'Float' | 'Bool' | 'Boolean' | 'String') || '',
      unit: selectedNode.unit || '',
    });
  };

  const handleUpdateNode = () => {
    if (!selectedNode || !form.name.trim()) return;

    const updatedFields: Partial<ISchemaNode> = {
      name: form.name.trim(),
      kind: form.kind,
      dataType: form.kind === 'metric' ? form.dataType || 'Float' : undefined,
      unit: form.unit,
    };

    // Recompute path if name changed
    let newPath = selectedNode.path;
    if (form.name.trim() !== selectedNode.name) {
      const parentPath = selectedNode.parent
        ? allNodes.find((n) => n.id === selectedNode.parent)?.path
        : null;
      newPath = parentPath
        ? `${parentPath}/${form.name.trim()}`
        : form.name.trim();
    }

    setTempNodes((prev) => {
      const existing = prev.find((n) => n.id === selectedNode.id);
      if (existing) {
        return prev.map((n) =>
          n.id === selectedNode.id
            ? { ...n, ...updatedFields, path: newPath, isTemporary: true }
            : n
        );
      }
      // Saved node — convert to temp edit
      const savedNode = savedNodes.find((n) => n.id === selectedNode.id);
      if (savedNode) {
        return [
          ...prev,
          { ...savedNode, ...updatedFields, path: newPath, isTemporary: true },
        ];
      }
      return prev;
    });

    // Update selectedNode reference
    setSelectedNode((prev) =>
      prev ? { ...prev, ...updatedFields, path: newPath } : prev
    );

    toast.success('Node updated');
  };

  const handleAddNode = () => {
    if (!form.name.trim()) return;
    const isRoot = !selectedNode;
    const newNode: ISchemaNode = {
      id: generateUUID(),
      name: form.name.trim(),
      kind: form.kind,
      parent: isRoot ? null : selectedNode!.id,
      path: isRoot
        ? form.name.trim()
        : `${selectedNode!.path}/${form.name.trim()}`,
      order: 0,
      dataType: form.kind === 'metric' ? form.dataType || 'Float' : undefined,
      unit: form.unit,
      engineering: {},
      objectData: form.kind === 'metric' ? {} : undefined,
      isTemporary: true,
    };

    setTempNodes((p) => [...p, newNode]);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(newNode.id);
      if (selectedNode) next.add(selectedNode.id);
      return next;
    });
    setForm((f) => ({ ...f, name: '' }));
    toast.success('Node added');
  };

  const handleDeleteNode = (nodeId: string) => {
    // Collect node + descendants
    const toDelete = new Set<string>();
    const collect = (id: string) => {
      toDelete.add(id);
      allNodes
        .filter((n) => n.parent === id)
        .forEach((n) => collect(n.id));
    };
    collect(nodeId);

    setTempNodes((p) => p.filter((n) => !toDelete.has(n.id)));

    if (selectedNode && toDelete.has(selectedNode.id)) {
      setSelectedNode(null);
      setMode('add');
      setForm({ name: '', kind: 'group', dataType: '', unit: '' });
    }
    toast.success('Node removed');
  };

  const handleRename = (nodeId: string, newName: string) => {
    setTempNodes((prev) => {
      const existing = prev.find((n) => n.id === nodeId);
      if (existing) {
        return prev.map((n) =>
          n.id === nodeId ? { ...n, name: newName } : n
        );
      }
      // If it's a saved node, convert it to a temp edit
      const savedNode = savedNodes.find((n) => n.id === nodeId);
      if (savedNode) {
        return [...prev, { ...savedNode, name: newName, isTemporary: true }];
      }
      return prev;
    });
  };

  const handleToggleExpand = (nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleClearSelection = () => {
    setSelectedNode(null);
    setMode('add');
    setForm({ name: '', kind: 'group', dataType: '', unit: '' });
  };

  const handleClearAllTemp = () => {
    setTempNodes([]);
    handleClearSelection();
    toast.success('All unsaved changes cleared');
  };

  const handleClearSaved = async () => {
    try {
      await dispatch(saveNodesToSchemaAsync({ schemaId, nodes: [] })).unwrap();
      toast.success('All saved nodes removed');
      setShowClearConfirm(false);
      dispatch(fetchSchemasAsync());
    } catch {
      toast.error('Failed to clear saved nodes');
    }
  };

  const handleSaveAll = async () => {
    if (tempNodes.length === 0) return toast.error('No changes to save');

    try {
      const nodesToSave = tempNodes.map(
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        ({ isTemporary, children, ...n }) => ({
          id: n.id,
          name: n.name,
          kind: n.kind,
          parent: n.parent ?? '',
          path: n.path ?? '',
          order: typeof n.order === 'number' ? n.order : 0,
          dataType: n.kind === 'metric' ? n.dataType ?? 'Float' : undefined,
          unit: n.unit ?? '',
          engineering: n.engineering ?? {},
          objectData: n.kind === 'metric' ? n.objectData ?? {} : undefined,
        })
      );

      await dispatch(
        saveNodesToSchemaAsync({ schemaId, nodes: nodesToSave })
      ).unwrap();

      setTempNodes([]);
      handleClearSelection();
      dispatch(fetchSchemasAsync());
      toast.success('All nodes saved!');
    } catch {
      toast.error('Failed to save nodes');
    }
  };

  /* ── DnD Handlers ── */

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const overId = event.over?.id as string | undefined;
    if (overId && overId !== activeId) {
      const overNode = allNodes.find((n) => n.id === overId);
      if (overNode?.kind === 'group') {
        setDragOverId(overId);
        return;
      }
    }
    setDragOverId(null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    setDragOverId(null);

    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const draggedId = active.id as string;
    const targetId = over.id as string;
    const targetNode = allNodes.find((n) => n.id === targetId);

    // Only allow dropping onto groups
    if (!targetNode || targetNode.kind !== 'group') return;

    // Don't allow dropping a node onto its own descendant
    const isDescendant = (parentId: string, childId: string): boolean => {
      const children = allNodes.filter((n) => n.parent === parentId);
      return children.some(
        (c) => c.id === childId || isDescendant(c.id, childId)
      );
    };
    if (isDescendant(draggedId, targetId)) return;

    // Reparent the node
    const updated = recomputePaths(allNodes, draggedId, targetId);

    // Split back into saved vs temp
    const newTempNodes: ISchemaNode[] = [];
    for (const node of updated) {
      const wasSaved = savedNodes.some((s) => s.id === node.id);
      const original = allNodes.find((n) => n.id === node.id);
      const changed =
        original &&
        (original.parent !== node.parent || original.path !== node.path);

      if (wasSaved && changed) {
        newTempNodes.push({ ...node, isTemporary: true });
      } else if (!wasSaved) {
        newTempNodes.push({ ...node, isTemporary: true });
      }
    }
    setTempNodes(newTempNodes);

    // Expand the target so the moved node is visible
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(targetId);
      return next;
    });

    toast.success('Node moved');
  };

  /* ── Render ── */
  return (
    <div className="flex gap-4 h-full min-h-0">
      {/* ── LEFT: Unified Tree ── */}
      <div className="w-3/5 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-base text-gray-900 dark:text-gray-100">
              Namespace Tree
            </h2>
            <span className="text-xs text-gray-500">
              {savedNodes.length} saved
              {tempNodes.length > 0 && (
                <span className="text-orange-500 ml-1">
                  +{tempNodes.length} new
                </span>
              )}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileUpload
              onImport={(nodes) => {
                const normalized = nodes.map((n) => ({
                  ...n,
                  id: n.id ?? generateUUID(),
                  name: n.name ?? '',
                  kind: n.kind ?? 'group',
                  parent: !n.parent || n.parent === '' ? null : n.parent,
                  path: n.path ?? n.name,
                  order: typeof n.order === 'number' ? n.order : 0,
                  dataType:
                    n.kind === 'metric' ? n.dataType ?? 'Float' : undefined,
                  unit: n.unit ?? '',
                  engineering: n.engineering ?? {},
                  objectData:
                    n.kind === 'metric' ? n.objectData ?? {} : undefined,
                  isTemporary: true as const,
                }));
                setTempNodes((p) => [...p, ...normalized]);
                setExpandedIds((prev) => {
                  const next = new Set(prev);
                  normalized.forEach((n) => next.add(n.id));
                  return next;
                });
              }}
            />
            {savedNodes.length > 0 && (
              <button
                onClick={() => setShowClearConfirm(true)}
                className="text-xs text-red-500 hover:text-red-700 transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-2">
          {tree.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={allNodeIds}
                strategy={verticalListSortingStrategy}
              >
                {tree.map((n) => (
                  <TreeNode
                    key={n.id}
                    node={n}
                    selectedId={selectedNode?.id ?? null}
                    expandedIds={expandedIds}
                    onSelect={handleSelect}
                    onDelete={handleDeleteNode}
                    onToggleExpand={handleToggleExpand}
                    onRename={handleRename}
                    dragOverId={dragOverId}
                  />
                ))}
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <div className="px-3 py-1.5 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-blue-300 text-sm font-medium">
                    {allNodes.find((n) => n.id === activeId)?.name ?? ''}
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              No nodes yet. Add your first node using the form.
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Node Editor / Builder ── */}
      <div className="w-2/5 flex flex-col min-h-0 overflow-auto">
        {/* Mode toggle when a node is selected */}
        {selectedNode ? (
          <>
            <div className="flex items-center gap-1 mb-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleSwitchToEdit}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  mode === 'edit'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Node
              </button>
              <button
                type="button"
                onClick={handleSwitchToAdd}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  mode === 'add'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Child
              </button>
            </div>

            {/* Selected node breadcrumb */}
            {parentBreadcrumb && (
              <div className="mb-3 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-sm text-blue-700 dark:text-blue-300 flex-wrap min-w-0">
                    <span className="text-xs text-blue-500 font-medium mr-1">
                      {mode === 'edit' ? 'Editing:' : 'Parent:'}
                    </span>
                    {parentBreadcrumb.map((part, i) => (
                      <span key={i} className="flex items-center gap-1">
                        {i > 0 && (
                          <ChevronRight className="w-3 h-3 text-blue-400" />
                        )}
                        <span className="font-medium">{part}</span>
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={handleClearSelection}
                    className="text-blue-400 hover:text-blue-600 ml-2 flex-shrink-0"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <h2 className="font-semibold text-base mb-3 text-gray-900 dark:text-gray-100 flex-shrink-0">
            Add Root Node
          </h2>
        )}

        {/* Form */}
        <form
          className="space-y-3 flex-shrink-0"
          onSubmit={(e) => {
            e.preventDefault();
            if (mode === 'edit') {
              handleUpdateNode();
            } else {
              handleAddNode();
            }
          }}
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Name
            </label>
            <input
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="e.g., Temperature, Site_1, OEE"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Type
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={form.kind}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  kind: e.target.value as 'group' | 'metric',
                }))
              }
              disabled={mode === 'edit'}
            >
              <option value="group">Group (folder)</option>
              <option value="metric">Metric (data point)</option>
            </select>
          </div>

          {form.kind === 'metric' && (
            <>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Data Type
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={form.dataType}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      dataType: e.target.value as
                        | ''
                        | 'Int'
                        | 'Float'
                        | 'Bool'
                        | 'Boolean'
                        | 'String',
                    }))
                  }
                >
                  <option value="">Select type</option>
                  <option value="Int">Int</option>
                  <option value="Float">Float</option>
                  <option value="Bool">Bool</option>
                  <option value="Boolean">Boolean</option>
                  <option value="String">String</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Unit
                </label>
                <input
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="%, °C, m/s, psi, …"
                  value={form.unit}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, unit: e.target.value }))
                  }
                />
              </div>
            </>
          )}

          {/* Path preview */}
          {form.name.trim() && (
            <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 font-mono">
              {mode === 'edit'
                ? (() => {
                    const parentPath = selectedNode?.parent
                      ? allNodes.find((n) => n.id === selectedNode.parent)?.path
                      : null;
                    return parentPath
                      ? `${parentPath}/${form.name.trim()}`
                      : form.name.trim();
                  })()
                : selectedNode
                  ? `${selectedNode.path}/${form.name.trim()}`
                  : form.name.trim()}
            </div>
          )}

          {/* Primary action */}
          <button
            type="submit"
            disabled={!form.name.trim()}
            className={`w-full px-4 py-2.5 text-white text-sm font-medium rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
              mode === 'edit'
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-blue-500 hover:bg-blue-600'
            }`}
          >
            {mode === 'edit'
              ? 'Update Node'
              : selectedNode
                ? 'Add Child Node'
                : 'Add Root Node'}
          </button>
        </form>

        {/* Secondary actions */}
        <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
          {tempNodes.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleSaveAll}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
              >
                <Save className="w-4 h-4" />
                Save All Changes ({tempNodes.length})
              </button>
              <button
                type="button"
                onClick={handleClearAllTemp}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Discard Unsaved
              </button>
            </>
          )}
        </div>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearSaved}
        title="Remove ALL saved nodes"
        message="This will delete every node currently stored for this schema. This cannot be undone."
      />
    </div>
  );
}
