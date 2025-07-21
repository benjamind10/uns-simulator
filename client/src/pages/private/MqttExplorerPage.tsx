import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { selectBrokers, fetchBrokersAsync } from '../../store/brokers';
import { selectBrokerStatus } from '../../store/mqtt/mqttSlice';
import { connectToBrokerAsync } from '../../store/mqtt/mqttThunk';
import { getClient } from '../../store/mqtt/mqttClientManager';
import MqttMessageViewer from '../../components/Brokers/MqttMessageViewer';
import MqttTopicTree from '../../components/Brokers/MqttTopicTree';
import { buildTopicTree } from '../../utils/mqttTopicTree';
import type { AppDispatch, RootState } from '../../store/store';
import type { MqttMessage } from '../../types';

export default function MqttExplorerPage() {
  const dispatch = useDispatch<AppDispatch>();
  const brokers = useSelector(selectBrokers);
  const [selectedBrokerId, setSelectedBrokerId] = useState<string>('');
  const [messages, setMessages] = useState<MqttMessage[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [topicInput, setTopicInput] = useState<string>('');

  const selectedBroker = brokers.find((b) => b.id === selectedBrokerId);
  const brokerStatus = useSelector((state: RootState) =>
    selectedBrokerId
      ? selectBrokerStatus(state, selectedBrokerId)
      : 'disconnected'
  );

  // Fetch brokers on mount
  useEffect(() => {
    dispatch(fetchBrokersAsync());
  }, [dispatch]);

  // Connect to broker using Redux/thunk when selected
  useEffect(() => {
    if (selectedBroker && brokerStatus === 'disconnected') {
      dispatch(connectToBrokerAsync(selectedBroker));
    }
    // Optionally clear messages when broker changes
    setMessages([]);
    setSelectedTopic(null);
    setTopicInput('');
  }, [selectedBrokerId, selectedBroker, brokerStatus, dispatch]); // Only runs when selectedBrokerId or dependencies change

  // Subscribe to all topics using the singleton client
  useEffect(() => {
    if (!selectedBroker) return;
    if (brokerStatus !== 'connected') return;

    const client = getClient(selectedBroker.id);
    if (!client) return;

    const handleMessage = (topic: string, payload: Buffer) => {
      setMessages((prev) => [
        {
          topic,
          payload: payload.toString(),
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    };

    client.subscribe('#');
    client.on('message', handleMessage);

    return () => {
      client.unsubscribe('#');
      client.off('message', handleMessage);
    };
  }, [selectedBroker, brokerStatus]);

  // Build topic tree from received messages
  const topics = Array.from(new Set(messages.map((msg) => msg.topic)));
  const topicTreeRoot = buildTopicTree(topics);

  // Filter messages by selected topic (exact match or subtree)
  const filteredMessages = selectedTopic
    ? messages.filter(
        (msg) =>
          msg.topic === selectedTopic ||
          msg.topic.startsWith(selectedTopic + '/')
      )
    : messages;

  return (
    <div className="max-w-5xl mx-auto py-10">
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
        {selectedBrokerId && (
          <div className="mt-2 text-sm">
            Status:{' '}
            <span
              className={
                brokerStatus === 'connected'
                  ? 'text-green-600'
                  : brokerStatus === 'connecting'
                  ? 'text-yellow-600'
                  : brokerStatus === 'error'
                  ? 'text-red-600'
                  : 'text-gray-600'
              }
            >
              {brokerStatus}
            </span>
          </div>
        )}
      </div>

      {selectedBroker ? (
        <div className="bg-white dark:bg-gray-800 rounded shadow p-6 flex gap-8">
          <div className="w-1/2 overflow-auto">
            {/* Topic selector input */}
            <form
              className="mb-4 flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                setSelectedTopic(topicInput.trim() || null);
              }}
            >
              <input
                type="text"
                className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                placeholder="Type topic to filter (e.g. Test1/Test3)"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
              />
              <button
                type="submit"
                className="px-3 py-1 rounded bg-blue-500 text-white text-sm"
              >
                Go
              </button>
            </form>
            <MqttTopicTree
              root={topicTreeRoot}
              onSelectTopic={(topic) => {
                setSelectedTopic(topic);
                setTopicInput(topic);
              }}
            />
          </div>
          <div className="w-1/2">
            {selectedTopic && (
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                  Filtering by topic:{' '}
                  <span className="font-mono">{selectedTopic}</span>
                </span>
                <button
                  className="px-2 py-1 rounded bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-100 text-xs"
                  onClick={() => {
                    setSelectedTopic(null);
                    setTopicInput('');
                  }}
                >
                  Clear
                </button>
              </div>
            )}
            <MqttMessageViewer messages={filteredMessages} topics={[]} />
          </div>
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400">
          Please select a broker to begin exploring MQTT topics.
        </p>
      )}
    </div>
  );
}
