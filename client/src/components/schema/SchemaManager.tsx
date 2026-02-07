import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { Download, Plus, Trash2 } from 'lucide-react';

import type { AppDispatch } from '../../store/store';
import {
  fetchSchemasAsync,
  createSchemaAsync,
  deleteSchemaAsync,
} from '../../store/schema/schemaThunk';
import {
  selectSchemas,
  selectSchemaLoading,
} from '../../store/schema/schemaSlice';
import ConfirmDialog from '../global/ConfirmDialog';

interface SchemaManagerProps {
  selectedSchemaId: string | null;
  setSelectedSchemaId: (id: string | null) => void;
}

export default function SchemaManager({
  selectedSchemaId,
  setSelectedSchemaId,
}: SchemaManagerProps) {
  const dispatch = useDispatch<AppDispatch>();
  const schemas = useSelector(selectSchemas);
  const loading = useSelector(selectSchemaLoading);

  const [showCreate, setShowCreate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });

  useEffect(() => {
    dispatch(fetchSchemasAsync());
  }, [dispatch]);

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    try {
      const result = await dispatch(createSchemaAsync(form)).unwrap();
      toast.success('Schema created!');
      setForm({ name: '', description: '' });
      setShowCreate(false);
      setSelectedSchemaId(result.id ?? null);
    } catch {
      toast.error('Failed to create schema');
    }
  };

  const handleDelete = async () => {
    if (!selectedSchemaId) return;
    try {
      // Navigate away first to avoid rendering deleted schema
      setSelectedSchemaId(null);
      setShowDeleteConfirm(false);
      
      await dispatch(deleteSchemaAsync(selectedSchemaId)).unwrap();
      await dispatch(fetchSchemasAsync());
      toast.success('Schema deleted!');
    } catch (error) {
      console.error('Failed to delete schema:', error);
      toast.error('Failed to delete schema');
      // Refetch to ensure UI is in sync
      await dispatch(fetchSchemasAsync());
    }
  };

  const handleExport = () => {
    if (!selectedSchema) {
      toast.error('Select a schema to export');
      return;
    }

    const exportPayload = (selectedSchema.nodes ?? []).map((node) => ({
      id: node.id,
      name: node.name,
      kind: node.kind,
      parent: node.parent,
      path: node.path,
      order: node.order,
      dataType: node.dataType,
      unit: node.unit,
      engineering: node.engineering,
      objectData: node.objectData,
    }));

    const safeName = selectedSchema.name
      .trim()
      .replace(/[^a-z0-9-_]+/gi, '_');
    const fileName = `${safeName || 'schema'}.uns.json`;

    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const selectedSchema = schemas.find((s) => s.id === selectedSchemaId);

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Schema selector */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <select
          value={selectedSchemaId || ''}
          onChange={(e) => setSelectedSchemaId(e.target.value || null)}
          className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm font-medium w-full sm:w-auto sm:min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-400"
          disabled={loading}
        >
          <option value="">Select a schema...</option>
          {schemas.map((schema) => (
            <option key={schema.id} value={schema.id}>
              {schema.name}
              {schema.description ? ` — ${schema.description}` : ''}
            </option>
          ))}
        </select>

        {selectedSchema && (
          <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
            {selectedSchema.nodes?.length ?? 0} nodes
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {showCreate ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Schema name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700 w-40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              autoFocus
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700 w-44 focus:outline-none focus:ring-2 focus:ring-blue-400 hidden md:block"
            />
            <button
              onClick={handleCreate}
              disabled={!form.name.trim()}
              className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Create
            </button>
            <button
              onClick={() => {
                setShowCreate(false);
                setForm({ name: '', description: '' });
              }}
              className="px-2 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Schema
          </button>
        )}

        {selectedSchemaId && (
          <>
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800/60 text-sm rounded-lg transition-colors"
              title="Export schema as JSON"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm rounded-lg transition-colors"
              title="Delete schema"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Schema"
        message={`Are you sure you want to delete "${selectedSchema?.name}"? This will remove all nodes and cannot be undone.`}
      />
    </div>
  );
}
