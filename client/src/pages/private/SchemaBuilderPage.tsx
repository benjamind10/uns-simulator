import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import {
  selectSelectedSchemaId,
  setSelectedSchemaId,
} from '../../store/schema/schemaSlice';
import SchemaManager from '../../components/schema/SchemaManager';
import SchemaNodeEditor from '../../components/schema/SchemaNodeEditor';

export default function SchemaBuilderPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const selectedSchemaId = useSelector(selectSelectedSchemaId);
  const { schemaId } = useParams<{ schemaId: string }>();

  // Sync URL param with Redux state
  useEffect(() => {
    if (schemaId && schemaId !== selectedSchemaId) {
      dispatch(setSelectedSchemaId(schemaId));
    }
  }, [schemaId, selectedSchemaId, dispatch]);

  // Handler for schema selection compatible with React.Dispatch<SetStateAction<string | null>>
  const handleSchemaSelection: React.Dispatch<
    React.SetStateAction<string | null>
  > = (value) => {
    const id = typeof value === 'function' ? value(selectedSchemaId) : value;
    dispatch(setSelectedSchemaId(id));
    if (id) {
      navigate(`/schema-builder/${id}`);
    } else {
      navigate(`/schema-builder`);
    }
  };

  /* ─────────── render ─────────── */
  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 py-12 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-8">
        {/* Schema Management Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
          <SchemaManager
            selectedSchemaId={selectedSchemaId}
            setSelectedSchemaId={handleSchemaSelection}
          />
        </div>

        {/* Schema Node Editor Section */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
          {selectedSchemaId ? (
            <SchemaNodeEditor schemaId={selectedSchemaId} />
          ) : (
            <div className="text-center text-gray-400 text-lg mt-12">
              Please select a schema to start building.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
