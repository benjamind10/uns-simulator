import React from 'react';
import { Cpu, Trash2 } from 'lucide-react';

import type { IBroker, ISchema, ISimulationProfile } from '../../types';

interface SimulatorCardProps {
  simulator: ISimulationProfile;
  schemas: ISchema[];
  brokers: IBroker[];
  onDelete: (id: string) => void;
  onOpen: () => void;
}

const SimulatorCard: React.FC<SimulatorCardProps> = ({
  simulator,
  schemas,
  brokers,
  onDelete,
  onOpen,
}) => {
  const schema = schemas.find((s) => s.id === simulator.schemaId);
  const broker = brokers.find((b) => b.id === simulator.brokerId);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Cpu className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
            {simulator.name}
          </h3>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(simulator.id);
          }}
          className="p-1 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {simulator.description && (
        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
          {simulator.description}
        </p>
      )}

      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
        <span>{schema?.name ?? '—'}</span>
        <span>{broker?.name ?? '—'}</span>
      </div>

      <button
        onClick={onOpen}
        className="mt-2 w-full px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
      >
        Open Simulator
      </button>
    </div>
  );
};

export default SimulatorCard;
