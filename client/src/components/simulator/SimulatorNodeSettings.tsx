import { useState, useEffect, useRef } from 'react';

import type { NodeSettings } from '../../types';

interface NodeSettingsTabProps {
  onSave: (settings: Record<string, NodeSettings>) => void;
  nodeIds: string[];
  fetchNodesByIds?: (ids: string[]) => Promise<any[]>;
  nodeSettings?: Record<string, NodeSettings>; // <-- Add this prop for initial settings
}

export default function SimulatorNodeSettings({
  onSave,
  nodeIds,
  fetchNodesByIds,
  nodeSettings = {}, // <-- Default to empty object
}: NodeSettingsTabProps) {
  const [nodes, setNodes] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, NodeSettings>>({});
  const didInit = useRef(false);

  // Fetch nodes by IDs
  useEffect(() => {
    if (fetchNodesByIds && nodeIds.length > 0) {
      fetchNodesByIds(nodeIds).then((fetched) => {
        setNodes(fetched);
      });
    } else {
      setNodes(nodeIds.map((id) => ({ id })));
    }
  }, [nodeIds, fetchNodesByIds]);

  // Initialize settings from nodeSettings prop ONLY ONCE when nodes are loaded
  useEffect(() => {
    if (nodes.length > 0 && !didInit.current) {
      const metricNodeIds = nodes
        .filter((node) => node.kind === 'metric')
        .map((node) => node.id);

      const merged: Record<string, NodeSettings> = {};
      metricNodeIds.forEach((id) => {
        merged[id] = nodeSettings[id] ?? {
          frequency: '',
          failRate: '',
          payload: { quality: '', value: '', timestamp: '' },
        };
      });

      setSettings(merged);
      didInit.current = true;
    }
  }, [nodes, nodeSettings]);

  // Only show nodes with kind === 'metric'
  const metricNodes = nodes.filter((node) => node.kind === 'metric');

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

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Node Settings</h2>
      {metricNodes.map((node) => (
        <div
          key={node.id}
          className="mb-6 p-4 rounded bg-gray-100 dark:bg-gray-800"
        >
          <h3 className="font-semibold mb-2">
            Node: {node.name ? node.path : node.id}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Frequency</label>
              <input
                type="number"
                value={settings[node.id]?.frequency ?? ''}
                onChange={(e) =>
                  handleChange(node.id, 'frequency', Number(e.target.value))
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
                value={settings[node.id]?.failRate ?? ''}
                onChange={(e) =>
                  handleChange(node.id, 'failRate', Number(e.target.value))
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
