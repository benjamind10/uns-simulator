import { useSelector, useDispatch } from 'react-redux';
import {
  selectSelectedSchemaId,
  setSelectedSchemaId,
} from '../../store/schema/schemaSlice';
import SchemaManager from '../../components/SchemaManager';
import SchemaNodeEditor from '../../components/SchemaNodeEditor';

/* ------------------------------------------------------------------
 * MAIN PAGE COMPONENT
 * -----------------------------------------------------------------*/
export default function SchemaBuilderPage() {
  const dispatch = useDispatch();
  const selectedSchemaId = useSelector(selectSelectedSchemaId);

  return (
    <div className="flex flex-col max-w-6xl mx-auto py-10 gap-8">
      {/* Schema CRUD section */}
      <SchemaManager
        selectedSchemaId={selectedSchemaId}
        setSelectedSchemaId={(id) => dispatch(setSelectedSchemaId(id))}
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
