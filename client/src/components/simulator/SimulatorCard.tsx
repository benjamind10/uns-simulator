import { Cpu, Edit, Trash2 } from 'lucide-react';

import type { ISimulationProfile, IBroker, ISchema } from '../../types';

interface SimulatorCardProps {
  simulator: ISimulationProfile;
  onDelete: (id: string) => void;
  onOpen: () => void;
  brokers?: IBroker[];
  schemas?: ISchema[];
}

export default function SimulatorCard({
  simulator,
  onDelete,
  onOpen,
  brokers = [],
  schemas = [],
}: SimulatorCardProps) {
  const schema = schemas.find((s) => s.id === simulator.schemaId);
  const broker = brokers.find((b) => b.id === simulator.brokerId);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Cpu className="h-8 w-8 text-blue-500" />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {simulator.name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {simulator.description || 'No description'}
            </p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onOpen}
            className="p-2 text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
            title="Open Simulator"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(simulator.id)}
            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400"
            title="Delete Simulator"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
        <span>
          <strong>Schema:</strong> {schema ? schema.name : '-'}
        </span>
        <span>
          <strong>Broker:</strong> {broker ? broker.name : '-'}
        </span>
      </div>

      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>
          Created:{' '}
          {simulator.createdAt && !isNaN(Number(simulator.createdAt))
            ? new Date(
                typeof simulator.createdAt === 'number'
                  ? simulator.createdAt
                  : Number(simulator.createdAt)
              ).toLocaleDateString()
            : '-'}
        </span>
      </div>
    </div>
  );
}
