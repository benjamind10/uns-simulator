import { useEffect, useState } from 'react';

import type { IBroker } from '../../types';

interface BrokerFormProps {
  onSubmit: (broker: Omit<IBroker, 'id'>) => Promise<void>;
  initialData?: IBroker | null;
  onCancel?: () => void;
}

export default function BrokerForm({
  onSubmit,
  initialData,
  onCancel,
}: BrokerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    port: 1883,
    wsPath: '',
    clientId: '',
    username: '',
    password: '',
  });

  // Load initial data when editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name,
        url: initialData.url,
        port: initialData.port,
        wsPath: initialData.wsPath || '',
        clientId: initialData.clientId,
        username: initialData.username || '',
        password: initialData.password || '',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-generate clientId if left blank
    const clientId = formData.clientId.trim() || 
      `mqtt-client-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Ensure port is a number
    const brokerData = {
      ...formData,
      clientId,
      port: Number(formData.port), // <-- convert to number
    };

    await onSubmit(brokerData);

    if (!initialData) {
      setFormData({
        name: '',
        url: '',
        port: 1883,
        wsPath: '',
        clientId: '',
        username: '',
        password: '',
      });
    }
  };

  const handleCancel = () => {
    setFormData({
      name: '',
      url: '',
      port: 1883,
      wsPath: '',
      clientId: '',
      username: '',
      password: '',
    });
    if (onCancel) onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md mx-auto mb-8 transition-colors"
    >
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 text-center">
        {initialData ? 'Edit Broker' : 'Add Broker'}
      </h2>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Name
        </label>
        <input
          name="name"
          type="text"
          placeholder="My MQTT Broker"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, name: e.target.value }))
          }
          className="w-full px-4 py-2 rounded 
                     bg-white dark:bg-gray-900 
                     text-gray-800 dark:text-white 
                     border border-gray-300 dark:border-gray-700 
                     placeholder-gray-400 dark:placeholder-gray-500 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          URL
        </label>
        <input
          name="url"
          type="text"
          placeholder="localhost or mqtt.example.com"
          value={formData.url}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, url: e.target.value }))
          }
          className="w-full px-4 py-2 rounded 
                     bg-white dark:bg-gray-900 
                     text-gray-800 dark:text-white 
                     border border-gray-300 dark:border-gray-700 
                     placeholder-gray-400 dark:placeholder-gray-500 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Port
        </label>
        <input
          name="port"
          type="number"
          placeholder="1883 (MQTT) or 9001 (WebSocket)"
          value={formData.port}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, port: Number(e.target.value) }))
          }
          className="w-full px-4 py-2 rounded
                     bg-white dark:bg-gray-900
                     text-gray-800 dark:text-white
                     border border-gray-300 dark:border-gray-700
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Use 1883 for standard MQTT (auto-converts to WebSocket 9001), or specify WebSocket port directly
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          WebSocket Path (optional)
        </label>
        <input
          name="wsPath"
          type="text"
          placeholder="/mqtt or /ws"
          value={formData.wsPath}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, wsPath: e.target.value }))
          }
          className="w-full px-4 py-2 rounded
                     bg-white dark:bg-gray-900
                     text-gray-800 dark:text-white
                     border border-gray-300 dark:border-gray-700
                     placeholder-gray-400 dark:placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Some brokers require a path like /mqtt or /ws for WebSocket connections
        </p>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Client ID
        </label>
        <input
          name="clientId"
          type="text"
          placeholder="Auto-generated if empty"
          value={formData.clientId}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, clientId: e.target.value }))
          }
          className="w-full px-4 py-2 rounded 
                     bg-white dark:bg-gray-900 
                     text-gray-800 dark:text-white 
                     border border-gray-300 dark:border-gray-700 
                     placeholder-gray-400 dark:placeholder-gray-500 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Username (optional)
        </label>
        <input
          name="username"
          type="text"
          placeholder="Username"
          value={formData.username}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, username: e.target.value }))
          }
          className="w-full px-4 py-2 rounded 
                     bg-white dark:bg-gray-900 
                     text-gray-800 dark:text-white 
                     border border-gray-300 dark:border-gray-700 
                     placeholder-gray-400 dark:placeholder-gray-500 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Password (optional)
        </label>
        <input
          name="password"
          type="password"
          placeholder="Password"
          value={formData.password}
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, password: e.target.value }))
          }
          className="w-full px-4 py-2 rounded 
                     bg-white dark:bg-gray-900 
                     text-gray-800 dark:text-white 
                     border border-gray-300 dark:border-gray-700 
                     placeholder-gray-400 dark:placeholder-gray-500 
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-white"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {initialData ? 'Update Broker' : 'Add Broker'}
        </button>
      </div>
    </form>
  );
}
