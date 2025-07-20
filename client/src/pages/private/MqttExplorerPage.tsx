import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectBrokers, fetchBrokersAsync } from '../../store/brokers';
import MqttViewer from '../../components/MqttViewer';
import type { AppDispatch } from '../../store/store';

export default function MqttExplorerPage() {
  const dispatch = useDispatch<AppDispatch>();
  const brokers = useSelector(selectBrokers);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>('');
  const [topics] = useState<string[]>(['test/topic']);
  const [messages] = useState([
    {
      topic: 'test/topic',
      payload: 'Hello MQTT!',
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);

  // Fetch brokers on mount
  useEffect(() => {
    dispatch(fetchBrokersAsync());
  }, [dispatch]);

  const selectedBroker = brokers.find((b) => b.id === selectedBrokerId);

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">MQTT Explorer</h1>

      {/* Broker Picker */}
      <div className="mb-8">
        <label htmlFor="broker-select" className="block mb-2 font-medium">
          Select Broker
        </label>
        <select
          id="broker-select"
          value={selectedBrokerId}
          onChange={(e) => setSelectedBrokerId(e.target.value)}
          className="w-full px-4 py-2 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        >
          <option value="">-- Choose a broker --</option>
          {brokers.map((broker) => (
            <option key={broker.id} value={broker.id}>
              {broker.name} ({broker.url}:{broker.port})
            </option>
          ))}
        </select>
      </div>

      {/* Explorer UI */}
      {selectedBroker ? (
        <div className="bg-white dark:bg-gray-800 rounded shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Connected to: {selectedBroker.name}
          </h2>
          {/* MQTT Viewer Component */}
          <MqttViewer messages={messages} topics={topics} />
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          Please select a broker to begin exploring MQTT topics.
        </p>
      )}
    </div>
  );
}
