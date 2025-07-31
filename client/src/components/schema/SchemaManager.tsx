import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';

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
      setSelectedSchemaId(result.id ?? null); // <-- use id, not _id
    } catch {
      toast.error('Failed to create schema');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteSchemaAsync(id)).unwrap();
      await dispatch(fetchSchemasAsync());
      toast.success('Schema deleted!');
      if (selectedSchemaId === id) setSelectedSchemaId(null);
    } catch {
      toast.error('Failed to delete schema');
    }
  };

  return (
    <div className="mb-8">
      <h2 className="font-bold text-xl mb-4">Schemas</h2>
      <div className="flex gap-2 items-end mb-6">
        <input
          type="text"
          placeholder="Schema name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="p-2 border rounded w-48 dark:bg-gray-800"
        />
        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          className="p-2 border rounded w-64 dark:bg-gray-800"
        />
        <button
          onClick={handleCreate}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Create Schema
        </button>
      </div>

      {loading && <div className="mb-4 text-gray-400">Loading...</div>}

      <div className="flex items-center gap-4 mb-6">
        <label htmlFor="schema-select" className="font-medium">
          Select Schema:
        </label>
        <select
          id="schema-select"
          value={selectedSchemaId || ''}
          onChange={(e) => setSelectedSchemaId(e.target.value || null)}
          className="p-2 border rounded w-64 bg-white dark:bg-gray-800"
        >
          <option value="">-- Choose a schema --</option>
          {schemas.map((schema) => (
            <option key={schema.id} value={schema.id}>
              {schema.name}
              {schema.description ? ` - ${schema.description}` : ''}
            </option>
          ))}
        </select>
        {selectedSchemaId && (
          <button
            onClick={() => handleDelete(selectedSchemaId)}
            className="text-red-500 hover:text-red-700 px-2 py-1 border rounded"
          >
            Delete Selected
          </button>
        )}
      </div>
    </div>
  );
}
