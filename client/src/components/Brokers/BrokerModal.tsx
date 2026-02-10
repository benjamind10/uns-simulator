import { useEffect, useState } from 'react';

import { SlideOver } from '../ui/SlideOver';
import type { IBroker } from '../../types';

interface BrokerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (broker: {
    name: string;
    url: string;
    port: number;
    wsPath?: string;
    clientId: string;
    username?: string;
    password?: string;
  }) => Promise<void>;
  initialData?: IBroker | null;
}

function generateClientId(): string {
  return `mqtt-client-${Math.random().toString(36).substring(2, 10)}`;
}

const inputClasses =
  'w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm';

export default function BrokerModal({
  open,
  onClose,
  onSubmit,
  initialData,
}: BrokerModalProps) {
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [port, setPort] = useState(1883);
  const [wsPath, setWsPath] = useState('');
  const [clientId, setClientId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isEditing = !!initialData;

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (open) {
      if (initialData) {
        setName(initialData.name);
        setUrl(initialData.url);
        setPort(initialData.port);
        setWsPath(initialData.wsPath || '');
        setClientId(initialData.clientId);
        setUsername(initialData.username || '');
        setPassword(initialData.password || '');
      } else {
        setName('');
        setUrl('');
        setPort(1883);
        setWsPath('');
        setClientId('');
        setUsername('');
        setPassword('');
      }
    }
  }, [open, initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const resolvedClientId = clientId.trim() || generateClientId();

    setSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        url: url.trim(),
        port,
        ...(wsPath.trim() ? { wsPath: wsPath.trim() } : {}),
        clientId: resolvedClientId,
        ...(username.trim() ? { username: username.trim() } : {}),
        ...(password ? { password } : {}),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const isValid = name.trim() !== '' && url.trim() !== '' && port > 0;

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      title={isEditing ? 'Edit Broker' : 'Add Broker'}
      description={
        isEditing
          ? 'Update the MQTT broker configuration.'
          : 'Configure a new MQTT broker connection.'
      }
    >
      <form
        onSubmit={handleSubmit}
        className="flex flex-col h-full"
      >
        <div className="flex-1 space-y-4">
          {/* Name */}
          <div>
            <label
              htmlFor="broker-name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Name <span className="text-red-500">*</span>
            </label>
            <input
              id="broker-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Production Broker"
              className={inputClasses}
              required
            />
          </div>

          {/* URL */}
          <div>
            <label
              htmlFor="broker-url"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              URL <span className="text-red-500">*</span>
            </label>
            <input
              id="broker-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. mqtt.example.com"
              className={inputClasses}
              required
            />
          </div>

          {/* Port */}
          <div>
            <label
              htmlFor="broker-port"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Port <span className="text-red-500">*</span>
            </label>
            <input
              id="broker-port"
              type="number"
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
              placeholder="1883"
              min={1}
              max={65535}
              className={inputClasses}
              required
            />
          </div>

          {/* WebSocket Path */}
          <div>
            <label
              htmlFor="broker-wspath"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              WebSocket Path
            </label>
            <input
              id="broker-wspath"
              type="text"
              value={wsPath}
              onChange={(e) => setWsPath(e.target.value)}
              placeholder="/mqtt or /ws"
              className={inputClasses}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Some brokers require a path like /mqtt or /ws for WebSocket connections.
            </p>
          </div>

          {/* Client ID */}
          <div>
            <label
              htmlFor="broker-clientid"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Client ID
            </label>
            <input
              id="broker-clientid"
              type="text"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="Auto-generated if empty"
              className={inputClasses}
            />
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              Leave blank to auto-generate a unique client ID.
            </p>
          </div>

          {/* Username */}
          <div>
            <label
              htmlFor="broker-username"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Username
            </label>
            <input
              id="broker-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Optional"
              className={inputClasses}
              autoComplete="off"
            />
          </div>

          {/* Password */}
          <div>
            <label
              htmlFor="broker-password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Password
            </label>
            <input
              id="broker-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Optional"
              className={inputClasses}
              autoComplete="new-password"
            />
          </div>
        </div>

        {/* Sticky footer */}
        <div className="sticky bottom-0 -mx-5 -mb-4 px-5 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!isValid || submitting}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting
              ? 'Saving...'
              : isEditing
                ? 'Update Broker'
                : 'Add Broker'}
          </button>
        </div>
      </form>
    </SlideOver>
  );
}
