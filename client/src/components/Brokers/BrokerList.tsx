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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Error';
      default:
        return 'Disconnected';
    }
  };

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
            className="p-4 bg-white dark:bg-gray-800 rounded shadow flex flex-col gap-3 h-full"
          >
            <div className="flex items-start justify-between mb-1">
              <span className="font-bold text-gray-800 dark:text-white">
                {broker.name}
              </span>

              {/* status pill */}
              <span
                className={`inline-flex items-center gap-1 text-xs font-medium ${getStatusColor(
                  status
                )}`}
              >
                {getStatusText(status)}
              </span>
            </div>

            {/* connection details - fixed height to ensure alignment */}
            <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1 flex-1">
              <p>
                <span className="font-medium">URL:</span> {broker.url}:{broker.port}
              </p>
              <p>
                <span className="font-medium">Client ID:</span> {broker.clientId}
              </p>
              {broker.username && (
                <p>
                  <span className="font-medium">User:</span> {broker.username}
                </p>
              )}
            </div>

            {/* actions */}
            <div className="flex gap-2 items-center mt-auto">
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
