import { Edit, Trash2, FileText } from 'lucide-react';

import type { ISchema } from '../../types';

interface SchemaCardProps {
  schema: ISchema;
  onDelete: (id: string) => void;
  onEdit: () => void;
}

export default function SchemaCard({
  schema,
  onDelete,
  onEdit,
}: SchemaCardProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <FileText className="h-8 w-8 text-blue-500" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {schema.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {schema.nodes.length} nodes
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <button
            onClick={onEdit}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            title="Edit Schema"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(schema.id)}
            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            title="Delete Schema"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {schema.description && (
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          {schema.description}
        </p>
      )}

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Created:{' '}
          {schema.createdAt && !isNaN(Number(schema.createdAt))
            ? new Date(
                typeof schema.createdAt === 'number'
                  ? schema.createdAt
                  : Number(schema.createdAt)
              ).toLocaleDateString()
            : '-'}
        </span>
        <span>{schema.brokerIds.length} broker(s)</span>
      </div>
    </div>
  );
}
