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
        clientId: initialData.clientId,
        username: initialData.username || '',
        password: initialData.password || '',
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Don't send createdAt - let the server handle it
    const brokerData = { ...formData };

    await onSubmit(brokerData);

    if (!initialData) {
      // Only reset form if we're not editing
      setFormData({
        name: '',
        url: '',
        port: 1883,
        clientId: '',
        username: '',
        password: '',
      });
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-100 dark:bg-gray-800 p-8 rounded-lg shadow-md w-full max-w-md mx-auto mb-8 transition-colors"
    >
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6 text-center">
        {initialData ? 'Edit Broker' : 'Add Broker'}
      </h2>

      {['name', 'url', 'port', 'clientId', 'username', 'password'].map(
        (field) => (
          <input
            key={field}
            name={field}
            type={field === 'port' ? 'number' : 'text'}
            placeholder={field.charAt(0).toUpperCase() + field.slice(1)}
            value={formData[field as keyof typeof formData]}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, [field]: e.target.value }))
            }
            className="w-full mb-4 px-4 py-2 rounded 
                       bg-white dark:bg-gray-900 
                       text-gray-800 dark:text-white 
                       border border-gray-300 dark:border-gray-700 
                       placeholder-gray-400 dark:placeholder-gray-500 
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        )
      )}

      <div className="flex justify-end gap-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
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
