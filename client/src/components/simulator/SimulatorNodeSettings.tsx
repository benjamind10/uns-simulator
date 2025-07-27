import { useState } from 'react';

import type { NodeSettings } from '../../types';

interface NodeSettingsTabProps {
  nodeSettings: Record<string, NodeSettings>;
  onSave: (settings: Record<string, NodeSettings>) => void;
  nodeIds: string[];
}

export default function SimulatorNodeSettings({
  nodeSettings,
  onSave,
  nodeIds,
}: NodeSettingsTabProps) {
  const [settings, setSettings] =
    useState<Record<string, NodeSettings>>(nodeSettings);

  const handleChange = (
    nodeId: string,
    field: keyof NodeSettings,
    value: string | number
  ) => {
    setSettings((prev: Record<string, NodeSettings>) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        [field]: value,
      },
    }));
  };

  const handlePayloadChange = (
    nodeId: string,
    key: string,
    value: string | number
  ) => {
    setSettings((prev) => ({
      ...prev,
      [nodeId]: {
        ...prev[nodeId],
        payload: {
          ...prev[nodeId]?.payload,
          [key]: value,
        },
      },
    }));
  };

  console.log('nodeIds:', nodeIds);

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Node Settings</h2>
      {nodeIds.map((nodeId) => (
        <div
          key={nodeId}
          className="mb-6 p-4 rounded bg-gray-100 dark:bg-gray-800"
        >
          <h3 className="font-semibold mb-2">Node: {nodeId}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Frequency</label>
              <input
                type="number"
                value={settings[nodeId]?.frequency ?? ''}
                onChange={(e) =>
                  handleChange(nodeId, 'frequency', Number(e.target.value))
                }
                className="w-full px-2 py-1 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Fail Rate</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings[nodeId]?.failRate ?? ''}
                onChange={(e) =>
                  handleChange(nodeId, 'failRate', Number(e.target.value))
                }
                className="w-full px-2 py-1 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Payload Quality</label>
              <input
                type="text"
                value={settings[nodeId]?.payload?.quality ?? ''}
                onChange={(e) =>
                  handlePayloadChange(nodeId, 'quality', e.target.value)
                }
                className="w-full px-2 py-1 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Payload Value</label>
              <input
                type="text"
                value={settings[nodeId]?.payload?.value ?? ''}
                onChange={(e) =>
                  handlePayloadChange(nodeId, 'value', e.target.value)
                }
                className="w-full px-2 py-1 rounded border"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Payload Timestamp</label>
              <input
                type="number"
                value={settings[nodeId]?.payload?.timestamp ?? ''}
                onChange={(e) =>
                  handlePayloadChange(
                    nodeId,
                    'timestamp',
                    Number(e.target.value)
                  )
                }
                className="w-full px-2 py-1 rounded border"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
        onClick={() => onSave(settings)}
      >
        Save Node Settings
      </button>
    </div>
  );
}
