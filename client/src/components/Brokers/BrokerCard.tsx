import { useState } from 'react';
import { Atom, Edit, Trash2 } from 'lucide-react';
import ConfirmDialog from '../global/ConfirmDialog';
import type { IBroker } from '../../types';

interface BrokerCardProps {
  broker: IBroker;
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  onDelete: (id: string) => void;
  onEdit: () => void;
}

export default function BrokerCard({
  broker,
  status = 'disconnected',
  onEdit,
  onDelete,
}: BrokerCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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

  const handleDelete = () => {
    onDelete?.(broker.id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 flex flex-col gap-3">
        {/* Title and status */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-3">
            <Atom className="h-8 w-8 text-blue-500" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">
                {broker.name}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {broker.url}:{broker.port}
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded ${getStatusColor(
              status
            )} text-white`}
          >
            {getStatusText(status)}
          </span>
        </div>

        {/* Client ID and Icons */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300">
          <span>
            <span className="font-medium">Client ID:</span> {broker.clientId}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit?.()}
              className="p-2 hover:text-blue-600 dark:hover:text-blue-400"
              title="Edit Broker"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 hover:text-red-600 dark:hover:text-red-400"
              title="Delete Broker"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Broker"
        message={`Are you sure you want to delete "${broker.name}"? This action cannot be undone.`}
      />
    </>
  );
}
