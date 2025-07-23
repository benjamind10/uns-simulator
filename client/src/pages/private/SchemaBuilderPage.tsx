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
==== BASE ====
==== BASE ====

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
    <div className="flex flex-col max-w-6xl mx-auto py-10 gap-8">
      {/* Schema Management Section */}
      <SchemaManager
        selectedSchemaId={selectedSchemaId}
        setSelectedSchemaId={handleSchemaSelection}
      />

      {/* Schema Node Editor Section */}
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
