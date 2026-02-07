import { useState } from 'react';
import { Edit, Trash2 } from 'lucide-react';

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
      <div className="rounded-lg bg-white dark:bg-gray-800 shadow p-5 flex flex-col gap-3">
        {/* header row */}
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
            {broker.name}
          </h3>

          {/* status pill */}
          <span
            className={`inline-flex items-center gap-1 text-xs font-medium ${getStatusColor(
              status
            )}`}
          >
            {getStatusText(status)}
          </span>
        </div>

        {/* connection details */}
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <p>
            <span className="font-medium">URL:</span> {broker.url}:{broker.port}
          </p>
          <p>
            <span className="font-medium">Client ID:</span> {broker.clientId}
          </p>
          {broker.username && (
            <p>
              <span className="font-medium">Username:</span> {broker.username}
            </p>
          )}
        </div>

        {/* actions */}
        <div className="mt-auto flex gap-3">
          <button
            onClick={() => onEdit?.()}
            className="flex items-center gap-1 text-blue-600 hover:underline dark:text-blue-400 text-sm"
          >
            <Edit size={16} /> Edit
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1 text-red-600 hover:underline dark:text-red-400 text-sm"
          >
            <Trash2 size={16} /> Delete
          </button>
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
