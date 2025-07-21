import type { FC } from 'react';

interface Message {
  topic: string;
  payload: string;
  timestamp: string;
}

interface MqttViewerProps {
  messages: Message[];
  topics: string[];
}

const MqttViewer: FC<MqttViewerProps> = ({ messages, topics }) => {
  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Subscribed Topics</h3>
      {topics.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No topics subscribed.
        </p>
      ) : (
        <ul className="mb-4 list-disc list-inside text-blue-600 dark:text-blue-400">
          {topics.map((topic) => (
            <li key={topic}>{topic}</li>
          ))}
        </ul>
      )}

      <h3 className="text-lg font-semibold mb-2">Received Messages</h3>
      {messages.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No messages received yet.
        </p>
      ) : (
        <div className="space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className="p-3 rounded bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
            >
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                {msg.timestamp} | <span className="font-mono">{msg.topic}</span>
              </div>
              <div className="font-mono break-all">{msg.payload}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MqttViewer;
