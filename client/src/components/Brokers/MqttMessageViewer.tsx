import type { FC } from 'react';

import type { MqttMessage } from '../../types';

interface MqttViewerProps {
  messages: MqttMessage[];
  topics: string[];
}

const MqttMessageViewer: FC<MqttViewerProps> = ({ messages }) => {
  return (
    <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-800 p-2">
      <h3 className="text-base font-semibold mb-2 tracking-tight text-gray-700 dark:text-gray-200 flex-shrink-0">
        Received Messages
      </h3>
      {messages.length === 0 ? (
        <p className="text-gray-500 dark:text-gray-400">
          No messages received yet.
        </p>
      ) : (
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-y-auto pr-2 space-y-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className="p-3 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
              >
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {msg.timestamp} |{' '}
                  <span className="font-mono">{msg.topic}</span>
                </div>
                <div className="font-mono break-all">{msg.payload}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MqttMessageViewer;
