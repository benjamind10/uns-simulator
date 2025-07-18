import { useEffect, useState } from 'react';
import { fetchBrokers, createBroker } from '../api/brokers';
import type { IBroker } from '../types';
import BrokerForm from '../components/BrokerForm';
import BrokerList from '../components/BrokerList';

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
    <div className="max-w-3xl mx-auto mt-10 px-4">
      <h1 className="text-3xl font-bold mb-6">MQTT Broker Configuration</h1>

      {loading && <p className="text-gray-500">Loading brokers...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && (
        <>
          <BrokerForm onAdd={handleAddBroker} />
          <BrokerList brokers={brokers} />
        </>
      )}
    </div>
  );
}
