import { useState } from 'react';
import { Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';

import ConfirmDialog from './ConfirmDialog';
import type { IBroker } from '../types';

interface BrokerCardProps {
  broker: IBroker;
  onEdit?: (b: IBroker) => void;
  onDelete?: (id: string) => void;
  status?: 'online' | 'offline'; // optional live status
}

export default function BrokerCard({
  broker,
  status = 'offline',
  onEdit,
  onDelete,
}: BrokerCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const statusInfo = {
    online: { label: 'Online', color: 'text-green-600', Icon: CheckCircle2 },
    offline: { label: 'Offline', color: 'text-red-600', Icon: XCircle },
  }[status];

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
            className={`inline-flex items-center gap-1 text-xs font-medium ${statusInfo.color}`}
          >
            <statusInfo.Icon size={14} /> {statusInfo.label}
          </span>
        </div>

        {/* connection details */}
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p>
            <span className="font-medium">URL:</span> {broker.url}:{broker.port}
          </p>
          <p>
            <span className="font-medium">Client ID:</span> {broker.clientId}
          </p>
        </div>

        {/* actions */}
        <div className="mt-auto flex gap-3">
          <button
            onClick={() => onEdit?.(broker)}
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
