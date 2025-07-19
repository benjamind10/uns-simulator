import { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useBrokers } from '../../contexts/BrokersContext';
import { createBroker } from '../../api/brokers';
import BrokerForm from '../../components/BrokerForm';
import BrokerList from '../../components/BrokerList';
import type { IBroker } from '../../types';

export default function BrokersPage() {
  const { brokers, loading, error, deleteBroker, refreshBrokers } =
    useBrokers();

  useEffect(() => {
    refreshBrokers();
  }, [refreshBrokers]);

  const handleAddBroker = async (broker: {
    name: string;
    url: string;
    port: number;
    clientId: string;
    username?: string;
    password?: string;
  }) => {
    try {
      await createBroker(broker);
      refreshBrokers(); // Refresh the list after adding
      toast.success('Broker added successfully');
    } catch (err) {
      toast.error('Failed to add broker');
      console.error(err);
    }
  };

  const handleEditBroker = (broker: IBroker) => {
    // For now, just show a toast - we'll implement edit later
    toast(`Editing broker: ${broker.name}`);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 px-4 pt-10 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">MQTT Broker Configuration</h1>

        <div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white px-4 py-6 rounded-lg shadow-md">
          <BrokerForm onAdd={handleAddBroker} />
        </div>

        <div className="mt-8">
          {loading ? (
            <p>Loading brokers...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <BrokerList
              brokers={brokers}
              onEdit={handleEditBroker}
              onDelete={deleteBroker}
            />
          )}
        </div>
      </div>
    </div>
  );
}
