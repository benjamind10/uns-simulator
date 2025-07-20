import { useState } from 'react';
import SchemaManager from './SchemaManager';
import SchemaNodeEditor from '../../components/SchemaNodeEditor';

/* ------------------------------------------------------------------
 * MAIN PAGE COMPONENT
 * -----------------------------------------------------------------*/
export default function SchemaBuilderPage() {
  // You can lift state up here if needed for both components
  const [selectedSchemaId, setSelectedSchemaId] = useState<string | null>(null);

  return (
    <div className="flex flex-col max-w-6xl mx-auto py-10 gap-8">
      {/* Schema CRUD section */}
      <SchemaManager
        selectedSchemaId={selectedSchemaId}
        setSelectedSchemaId={setSelectedSchemaId}
      />

      {/* Schema Nodes section */}
      {selectedSchemaId ? (
        <SchemaNodeEditor schemaId={selectedSchemaId} />
      ) : (
        <div className="text-center text-gray-400 text-lg mt-12">
          Please select a schema to start building.
        </div>
      )}
    </div>
  );
}
