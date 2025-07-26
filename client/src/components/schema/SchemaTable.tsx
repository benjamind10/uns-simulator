import { useNavigate } from 'react-router-dom';

import type { ISchema } from '../../types';

interface SchemaTableProps {
  schemas: ISchema[];
  loading: boolean;
}

export default function SchemaTable({ schemas, loading }: SchemaTableProps) {
  const navigate = useNavigate();

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white dark:bg-gray-800 rounded shadow">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Description</th>
            <th className="px-4 py-2 text-left">Nodes</th>
            <th className="px-4 py-2 text-left">Brokers</th>
            <th className="px-4 py-2 text-left">Created</th>
            <th className="px-4 py-2 text-left">Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-400">
                Loading...
              </td>
            </tr>
          ) : schemas.length === 0 ? (
            <tr>
              <td colSpan={6} className="text-center py-8 text-gray-400">
                No schemas found.
              </td>
            </tr>
          ) : (
            schemas.map((schema) => (
              <tr key={schema.id}>
                <td className="px-4 py-2">{schema.name}</td>
                <td className="px-4 py-2">{schema.description}</td>
                <td className="px-4 py-2">{schema.nodes?.length ?? 0}</td>
                <td className="px-4 py-2">
                  {schema.brokerIds && schema.brokerIds.length > 0
                    ? schema.brokerIds.join(', ')
                    : '-'}
                </td>
                <td className="px-4 py-2">
                  {schema.createdAt
                    ? new Date(
                        typeof schema.createdAt === 'number'
                          ? schema.createdAt
                          : Number(schema.createdAt)
                      ).toLocaleString()
                    : '-'}
                </td>
                <td className="px-4 py-2">
                  <button
                    className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-xs"
                    onClick={() => navigate(`/schema-builder/${schema.id}`)}
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
