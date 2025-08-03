import { Edit, Trash2, Plug, PlugZap } from 'lucide-react';
import { Link } from 'react-router-dom';

import type { IBroker } from '../../types';

interface BrokerListProps {
  brokers: IBroker[];
  brokerStatuses?: Record<string, any>;
  onDelete?: (id: string) => void;
  onConnect?: (broker: IBroker) => void;
  onDisconnect?: (broker: IBroker) => void;
}

export default function BrokerList({
  brokers,
  brokerStatuses = {},
  onDelete,
  onConnect,
  onDisconnect,
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
      {brokers.map((broker) => {
        const status =
          brokerStatuses[broker.id]?.status ||
          brokerStatuses[broker.id] ||
          'disconnected';

        return (
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
              <span className="text-xs mt-1">
                Status:{' '}
                <span
                  className={
                    status === 'connected'
                      ? 'text-green-600'
                      : status === 'connecting'
                      ? 'text-yellow-600'
                      : status === 'error'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }
                >
                  {status}
                </span>
              </span>
            </div>

            <div className="flex gap-2 items-center">
              {status === 'connected' ? (
                <button
                  onClick={() => onDisconnect?.(broker)}
                  className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Disconnect broker"
                >
                  <Plug size={16} />
                </button>
              ) : (
                <button
                  onClick={() => onConnect?.(broker)}
                  className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                  title={
                    status === 'connecting' ? 'Connecting...' : 'Connect broker'
                  }
                  disabled={status === 'connecting'}
                >
                  <PlugZap size={16} />
                </button>
              )}
              <Link
                to={`/dashboard/brokers/${broker.id}`}
                className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                title="Edit broker"
              >
                <Edit size={16} />
              </Link>
              <button
                onClick={() => onDelete?.(broker.id)}
                className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                title="Delete broker"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
