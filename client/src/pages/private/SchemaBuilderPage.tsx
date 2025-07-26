import { useParams, useNavigate } from 'react-router-dom';
import SchemaManager from '../../components/schema/SchemaManager';
import SchemaNodeEditor from '../../components/schema/SchemaNodeEditor';

export default function SchemaBuilderPage() {
  const navigate = useNavigate();
  const { schemaId } = useParams<{ schemaId: string }>();

  // Handler for schema selection
  const handleSchemaSelection = (id: string | null) => {
    if (id) {
      navigate(`/schema-builder/${id}`);
    } else {
      navigate(`/schema-builder`);
    }
  };

  return (
    <div className="w-full min-h-screen bg-gray-100 dark:bg-gray-900 py-3 px-4">
      <div className="max-w-6xl mx-auto flex flex-col gap-2">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
          <SchemaManager
            selectedSchemaId={schemaId || null}
            setSelectedSchemaId={handleSchemaSelection}
          />
        </div>
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
          {schemaId ? (
            <SchemaNodeEditor schemaId={schemaId} />
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
