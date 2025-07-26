import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { AppDispatch } from '../../store/store';
import { fetchSchemasAsync } from '../../store/schema/schemaThunk';
import {
  selectSchemas,
  selectSchemaLoading,
} from '../../store/schema/schemaSlice';
import SchemaTable from '../../components/schema/SchemaTable';

export default function SchemaPage() {
  const dispatch = useDispatch<AppDispatch>();
  const schemas = useSelector(selectSchemas);
  const loading = useSelector(selectSchemaLoading);

  useEffect(() => {
    dispatch(fetchSchemasAsync());
  }, [dispatch]);

  // Stats
  const totalSchemas = schemas.length;
  const totalNodes = schemas.reduce(
    (sum, s) => sum + (s.nodes?.length || 0),
    0
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Schema Admin</h1>
      <div className="mb-6 flex gap-8">
        <div className="bg-blue-100 dark:bg-blue-900 rounded p-4">
          <div className="text-lg font-semibold">{totalSchemas}</div>
          <div className="text-xs text-gray-500">Total Schemas</div>
        </div>
        <div className="bg-green-100 dark:bg-green-900 rounded p-4">
          <div className="text-lg font-semibold">{totalNodes}</div>
          <div className="text-xs text-gray-500">Total Nodes</div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <SchemaTable schemas={schemas} loading={loading} />
      </div>
    </div>
  );
}
