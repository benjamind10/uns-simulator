import { useEffect, useState } from 'react';
import { fetchBrokers, createBroker } from '../../api/brokers';
import type { IBroker } from '../../types';
import BrokerForm from '../../components/BrokerForm';
import BrokerList from '../../components/BrokerList';

export default function BrokersPage() {
  const [brokers, setBrokers] = useState<IBroker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBrokers = async () => {
      try {
        const data = await fetchBrokers();
        setBrokers(data);
      } catch (err) {
        setError('Failed to load brokers');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadBrokers();
  }, []);

  const handleAddBroker = async (broker: {
    name: string;
    url: string;
    port: number;
    clientId: string;
    username?: string;
    password?: string;
  }) => {
    const newBroker = await createBroker(broker);
    setBrokers((prev) => [...prev, newBroker]);
  };

  return (
    <div className="min-h-screen bg-white text-gray-800 dark:bg-gray-900 dark:text-gray-100 px-4 pt-10 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">MQTT Broker Configuration</h1>

        {loading && <p className="text-gray-400">Loading brokers...</p>}
        {error && <p className="text-red-500">{error}</p>}

        {!loading && (
          <>
            <div className="bg-white text-gray-900 dark:bg-gray-900 dark:text-white px-4 py-6 rounded-lg shadow-md">
              <BrokerForm onAdd={handleAddBroker} />
            </div>

            <div className="mt-8">
              <BrokerList brokers={brokers} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
