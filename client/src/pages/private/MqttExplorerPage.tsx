import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { selectBrokers, fetchBrokersAsync } from '../../store/brokers';
import { selectBrokerStatus } from '../../store/mqtt/mqttSlice';
import { connectToBrokerAsync } from '../../store/mqtt/mqttThunk';
import { getClient } from '../../store/mqtt/mqttClientManager';
import MqttTopicTree from '../../components/brokers/MqttTopicTree';
import MqttMessageViewer from '../../components/brokers/MqttMessageViewer';
import { buildTopicTree } from '../../utils/mqttTopicTree';
import type { AppDispatch, RootState } from '../../store/store';
import type { MqttMessage } from '../../types';
import {
  startSimulationAsync,
  stopSimulationAsync,
  pauseSimulationAsync,
  resumeSimulationAsync,
  getSimulationStatusAsync,
} from '../../store/simulationProfile/simulationProfieThunk';

export default function MqttExplorerPage() {
  const dispatch = useDispatch<AppDispatch>();
  const brokers = useSelector(selectBrokers);
  const [selectedBrokerId, setSelectedBrokerId] = React.useState<string>('');
  const [messages, setMessages] = React.useState<MqttMessage[]>([]);
  const [selectedTopic, setSelectedTopic] = React.useState<string | null>(null);
  const [topicInput, setTopicInput] = React.useState<string>('');

  const selectedBroker = brokers.find((b) => b.id === selectedBrokerId);
  const brokerStatus = useSelector((state: RootState) =>
    selectedBrokerId
      ? selectBrokerStatus(state, selectedBrokerId)
      : 'disconnected'
  );

  // Simulation profile logic
  const profiles = useSelector(
    (state: RootState) => state.simulationProfile.profiles
  );
  const selectedProfileId = useSelector(
    (state: RootState) => state.simulationProfile.selectedProfileId
  );
  const selectedProfile = selectedProfileId
    ? profiles[selectedProfileId]
    : null;

  const simulationStates = useSelector(
    (state: RootState) => state.simulationProfile.simulationStates
  );
  const simulationLoading = useSelector(
    (state: RootState) => state.simulationProfile.simulationLoading
  );
  const simulationErrors = useSelector(
    (state: RootState) => state.simulationProfile.simulationErrors
  );

  const currentState = selectedProfileId
    ? simulationStates[selectedProfileId] || 'idle'
    : 'idle';
  const isLoading = selectedProfileId
    ? simulationLoading[selectedProfileId] || false
    : false;
  const error = selectedProfileId ? simulationErrors[selectedProfileId] : null;

  useEffect(() => {
    dispatch(fetchBrokersAsync());
  }, [dispatch]);

  useEffect(() => {
    if (selectedBroker && brokerStatus === 'disconnected') {
      dispatch(connectToBrokerAsync(selectedBroker));
    }
    setMessages([]);
    setSelectedTopic(null);
    setTopicInput('');
  }, [selectedBrokerId, selectedBroker, brokerStatus, dispatch]);

  useEffect(() => {
    if (!selectedProfileId) return;
    dispatch(getSimulationStatusAsync(selectedProfileId) as any);

    if (currentState === 'running' || currentState === 'paused') {
      const interval = setInterval(() => {
        dispatch(getSimulationStatusAsync(selectedProfileId) as any);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [dispatch, selectedProfileId]);

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

  const topics = Array.from(new Set(messages.map((msg) => msg.topic)));
  const topicTreeRoot = buildTopicTree(topics);

  const filteredMessages = selectedTopic
    ? messages.filter(
        (msg) =>
          msg.topic === selectedTopic ||
          msg.topic.startsWith(selectedTopic + '/')
      )
    : messages;

  // Simulation control handlers
  const handleStart = () => {
    if (selectedProfileId)
      dispatch(startSimulationAsync(selectedProfileId) as any);
  };
  const handleStop = () => {
    if (selectedProfileId)
      dispatch(stopSimulationAsync(selectedProfileId) as any);
  };
  const handlePause = () => {
    if (selectedProfileId)
      dispatch(pauseSimulationAsync(selectedProfileId) as any);
  };
  const handleResume = () => {
    if (selectedProfileId)
      dispatch(resumeSimulationAsync(selectedProfileId) as any);
  };

  return (
    <div className="w-full min-h-full bg-gray-100 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto flex flex-col">
        <h1 className="text-3xl font-bold mb-6">MQTT Explorer</h1>
        {/* Broker Picker */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6 mb-6">
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
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6 flex gap-8 flex-1 min-h-[60vh] w-full">
            <div className="w-1/2 min-w-[420px] max-w-[700px]">
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
                  className="flex-1 px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
                messages={messages}
                onSelectTopic={(topic) => {
                  setSelectedTopic(topic);
                  setTopicInput(topic);
                }}
              />
            </div>
            <div className="w-1/2 min-w-[420px] max-w-full">
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
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-gray-500 dark:text-gray-400">
              Please select a broker to begin exploring MQTT topics.
            </p>
          </div>
        )}
      </div>

      {/* Floating Simulation Controls Widget */}
      <div
        className="fixed bottom-6 right-6 z-50 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-lg shadow-lg p-4 w-80"
        style={{ minWidth: 250 }}
      >
        <h2 className="font-bold mb-2 text-gray-900 dark:text-gray-100 flex justify-between items-center">
          Simulator: {selectedProfile ? selectedProfile.name : 'No Profile'}
          <span
            className={`text-xs px-2 py-1 rounded ${
              currentState === 'running'
                ? 'bg-green-100 text-green-700'
                : currentState === 'paused'
                ? 'bg-yellow-100 text-yellow-700'
                : currentState === 'stopped'
                ? 'bg-red-100 text-red-700'
                : currentState === 'error'
                ? 'bg-red-100 text-red-700'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            {currentState.toUpperCase()}
          </span>
        </h2>
        <div className="mb-2">
          {selectedProfile && selectedProfile.description && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {selectedProfile.description}
            </div>
          )}
          {isLoading && (
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Loading...
            </div>
          )}
          {error && (
            <div className="text-xs text-red-600 dark:text-red-400">
              Error: {error}
            </div>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <button
            className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:bg-gray-300"
            disabled={isLoading || currentState === 'running'}
            onClick={handleStart}
          >
            Start
          </button>
          <button
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:bg-gray-300"
            disabled={
              isLoading || currentState === 'idle' || currentState === 'stopped'
            }
            onClick={handleStop}
          >
            Stop
          </button>
          <button
            className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 disabled:bg-gray-300"
            disabled={isLoading || currentState !== 'running'}
            onClick={handlePause}
          >
            Pause
          </button>
          <button
            className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 disabled:bg-gray-300"
            disabled={isLoading || currentState !== 'paused'}
            onClick={handleResume}
          >
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}
