import { useParams, useNavigate } from 'react-router-dom';

import SchemaManager from '../../components/schema/SchemaManager';
import SchemaNodeEditor from '../../components/schema/SchemaNodeEditor';

export default function SchemaBuilderPage() {
  const navigate = useNavigate();
  const { schemaId } = useParams<{ schemaId: string }>();

  // Handler for schema selection
  const handleSchemaSelection = (id: string | null) => {
    if (id) {
      navigate(`/app/schemas/${id}`);
    } else {
      navigate(`/app/schemas`);
    }
  };

  return (
    <div className="flex flex-col gap-2 h-full min-h-0 px-6 py-4">
      {/* Compact toolbar header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 px-6 py-4 flex-shrink-0">
        <SchemaManager
          selectedSchemaId={schemaId || null}
          setSelectedSchemaId={handleSchemaSelection}
        />
      </div>

      {/* Main content area */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex-1 min-h-0 overflow-hidden">
        {schemaId ? (
          <SchemaNodeEditor schemaId={schemaId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-3">
            <svg className="w-12 h-12 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <p className="text-sm font-medium">Select or create a schema to start building</p>
          </div>
        )}
      </div>
    </div>
  );
}
