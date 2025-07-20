import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
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
import { toast } from 'react-hot-toast';

export default function SchemaManager({
  selectedSchemaId,
  setSelectedSchemaId,
}: {
  selectedSchemaId: string | null;
  setSelectedSchemaId: (id: string | null) => void;
}) {
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
      setSelectedSchemaId(result.id);
    } catch {
      toast.error('Failed to create schema');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await dispatch(deleteSchemaAsync(id)).unwrap();
      toast.success('Schema deleted!');
      if (selectedSchemaId === id) setSelectedSchemaId(null);
    } catch {
      toast.error('Failed to delete schema');
    }
  };

  return (
    <div className="mb-8">
      <h2 className="font-bold text-xl mb-2">Schemas</h2>
      <div className="flex gap-4 items-end mb-4">
        <input
          type="text"
          placeholder="Schema name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="p-2 border rounded"
        />
        <input
          type="text"
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm((f) => ({ ...f, description: e.target.value }))
          }
          className="p-2 border rounded"
        />
        <button
          type="button"
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          Add Schema
        </button>
      </div>
      <div className="flex items-center gap-4 mb-4">
        <label className="font-medium">Select Schema:</label>
        <select
          value={selectedSchemaId || ''}
          onChange={(e) => setSelectedSchemaId(e.target.value)}
          className="p-2 border rounded bg-gray-50 dark:bg-gray-900"
        >
          <option value="" disabled>
            -- Choose a schema --
          </option>
          {schemas.map((schema) => (
            <option key={schema.id} value={schema.id}>
              {schema.name}
            </option>
          ))}
        </select>
        {selectedSchemaId && (
          <button
            type="button"
            onClick={() => handleDelete(selectedSchemaId)}
            className="ml-2 text-red-500 hover:underline"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
