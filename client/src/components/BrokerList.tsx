import { Edit, Trash2 } from 'lucide-react';

import type { IBroker } from '../types';

interface BrokerListProps {
  brokers: IBroker[];
  onEdit?: (broker: IBroker) => void;
  onDelete?: (id: string) => void;
}

export default function BrokerList({
  brokers,
  onEdit,
  onDelete,
}: BrokerListProps) {
  if (brokers.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">
        No brokers configured yet.
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {brokers.map((broker) => (
        <li
          key={broker.id}
          className="p-4 bg-white dark:bg-gray-800 rounded shadow flex items-center justify-between"
        >
          <div className="flex flex-col">
            <span className="font-bold text-gray-800 dark:text-white">
              {broker.name}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-300">
              {broker.url}:{broker.port} — {broker.clientId}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.(broker)}
              className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              title="Edit broker"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete?.(broker.id)}
              className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete broker"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
