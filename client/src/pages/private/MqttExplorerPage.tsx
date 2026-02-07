import React, { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Pause, Play, Trash2, Radio } from 'lucide-react';

import { selectBrokers, fetchBrokersAsync } from '../../store/brokers';
import { selectBrokerStatus } from '../../store/mqtt/mqttSlice';
import { connectToBrokerAsync } from '../../store/mqtt/mqttThunk';
import { getClient } from '../../store/mqtt/mqttClientManager';
import MqttTopicTree from '../../components/Brokers/MqttTopicTree';
import MqttMessageViewer from '../../components/Brokers/MqttMessageViewer';
import { buildTopicTree } from '../../utils/mqttTopicTree';
import type { AppDispatch, RootState } from '../../store/store';
import type { MqttMessage } from '../../types';

export default function MqttExplorerPage() {
  const dispatch = useDispatch<AppDispatch>();
  const brokers = useSelector(selectBrokers);
  const [selectedBrokerId, setSelectedBrokerId] = React.useState<string>('');
  const [messages, setMessages] = React.useState<MqttMessage[]>([]);
  const [selectedTopic, setSelectedTopic] = React.useState<string | null>(null);
  const [paused, setPaused] = React.useState(false);
  const pausedRef = useRef(false);

  const selectedBroker = brokers.find((b) => b.id === selectedBrokerId);
  const brokerStatus = useSelector((state: RootState) =>
    selectedBrokerId
      ? selectBrokerStatus(state, selectedBrokerId)
      : 'disconnected'
  );

  useEffect(() => {
    dispatch(fetchBrokersAsync());
  }, [dispatch]);

  useEffect(() => {
    if (selectedBroker && brokerStatus === 'disconnected') {
      dispatch(connectToBrokerAsync(selectedBroker));
    }
    setMessages([]);
    setSelectedTopic(null);
  }, [selectedBrokerId, selectedBroker, brokerStatus]);

  // Keep ref in sync with state
  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    if (!selectedBroker) return;
    if (brokerStatus !== 'connected') return;

    const client = getClient(selectedBroker.id);
    if (!client) return;

    const handleMessage = (topic: string, payload: Buffer) => {
      if (pausedRef.current) return;
      setMessages((prev) => {
        const newMessage = {
          topic,
          payload: payload.toString(),
          timestamp: new Date().toLocaleTimeString(),
        };
        const newMessages = [newMessage, ...prev];
        return newMessages.slice(0, 1000);
      });
    };

    client.subscribe('#');
    client.on('message', handleMessage);

    return () => {
      client.unsubscribe('#');
      client.off('message', handleMessage);
    };
  }, [selectedBroker, brokerStatus]);

  const topics = Array.from(new Set(messages.map((msg) => msg.topic)));
  const topicTreeRoot = buildTopicTree(topics);

  const filteredMessages = selectedTopic
    ? messages.filter(
        (msg) =>
          msg.topic === selectedTopic ||
          msg.topic.startsWith(selectedTopic + '/')
      )
    : messages;

  const handleSelectTopic = useCallback((topic: string) => {
    setSelectedTopic(topic);
  }, []);

  const handleClearFilter = useCallback(() => {
    setSelectedTopic(null);
  }, []);

  const handleClearMessages = useCallback(() => {
    setMessages([]);
    setSelectedTopic(null);
  }, []);

  // Status badge config
  const statusConfig = {
    connected: {
      dot: 'bg-green-500',
      text: 'Connected',
      pulse: true,
    },
    connecting: {
      dot: 'bg-yellow-500',
      text: 'Connecting...',
      pulse: true,
    },
    error: {
      dot: 'bg-red-500',
      text: 'Error',
      pulse: false,
    },
    disconnected: {
      dot: 'bg-gray-400',
      text: 'Disconnected',
      pulse: false,
    },
  };

  const status = statusConfig[brokerStatus] ?? statusConfig.disconnected;

  return (
    <div className="flex flex-col gap-2 h-full min-h-0 px-6 py-4">
      {/* Compact toolbar header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Broker selector */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <select
              value={selectedBrokerId}
              onChange={(e) => setSelectedBrokerId(e.target.value)}
              className="px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm font-medium min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select a broker...</option>
              {brokers.map((broker) => (
                <option key={broker.id} value={broker.id}>
                  {broker.name} ({broker.url}:{broker.port})
                </option>
              ))}
            </select>

            {/* Connection status badge */}
            {selectedBrokerId && (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                <span className="relative flex h-2 w-2">
                  {status.pulse && (
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.dot}`}
                    />
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${status.dot}`}
                  />
                </span>
                {status.text}
              </span>
            )}
          </div>

          {/* Controls */}
          {selectedBroker && (
            <div className="flex items-center gap-2">
              {/* Stats */}
              <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
                {topics.length} topics · {messages.length} messages
              </span>

              {/* Pause/Resume */}
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  paused
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                title={paused ? 'Resume message stream' : 'Pause message stream'}
              >
                {paused ? (
                  <Play className="w-3.5 h-3.5" />
                ) : (
                  <Pause className="w-3.5 h-3.5" />
                )}
                {paused ? 'Resume' : 'Pause'}
              </button>

              {/* Clear messages */}
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearMessages}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Clear all messages"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Clear
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex-1 min-h-0 overflow-hidden">
        {selectedBroker ? (
          <div className="flex h-full min-h-0">
            {/* Left: Topic Tree */}
            <div className="w-1/2 flex flex-col min-h-0 border-r border-gray-200 dark:border-gray-700">
              <MqttTopicTree
                root={topicTreeRoot}
                messages={messages}
                selectedTopic={selectedTopic}
                onSelectTopic={handleSelectTopic}
              />
            </div>

            {/* Right: Message Viewer */}
            <div className="w-1/2 flex flex-col min-h-0">
              <MqttMessageViewer
                messages={filteredMessages}
                selectedTopic={selectedTopic}
                onClearFilter={handleClearFilter}
                paused={paused}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 gap-3">
            <Radio className="w-12 h-12 opacity-40" />
            <p className="text-sm font-medium">
              Select a broker to start exploring MQTT topics
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
