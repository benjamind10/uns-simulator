import { useState, useEffect, useRef } from 'react';

import type { ISchemaNode, NodeSettings } from '../../types';

interface NodeSettingsTabProps {
  onSave: (settings: Record<string, NodeSettings>) => void;
  nodeIds: string[];
  fetchNodesByIds?: (ids: string[]) => Promise<ISchemaNode[]>;
  nodeSettings?: Record<string, NodeSettings>;
}

const createDefaultSettings = (nodeId: string): NodeSettings => ({
  nodeId,
  frequency: 0,
  failRate: 0,
  payload: { quality: '', value: '', timestamp: 0 },
});

export default function SimulatorNodeSettings({
  onSave,
  nodeIds,
  fetchNodesByIds,
  nodeSettings = {},
}: NodeSettingsTabProps) {
  const [nodes, setNodes] = useState<ISchemaNode[]>([]);
  const [settings, setSettings] = useState<Record<string, NodeSettings>>({});
  const didInit = useRef(false);

  // Fetch or create nodes
  useEffect(() => {
    let isMounted = true;

    const loadNodes = async () => {
      if (fetchNodesByIds && nodeIds.length > 0) {
        const fetched = await fetchNodesByIds(nodeIds);
        if (isMounted) setNodes(fetched);
      } else {
        const fallbackNodes = nodeIds.map((id) => ({
          id,
          name: id,
          kind: 'metric' as const,
          parent: null,
          path: id,
          order: 0,
        }));
        setNodes(fallbackNodes);
      }
    };

    loadNodes();
    return () => {
      isMounted = false;
    };
  }, [nodeIds, fetchNodesByIds]);

  // Initialize settings once
  useEffect(() => {
    if (nodes.length > 0 && !didInit.current) {
      const metricNodes = nodes.filter((node) => node.kind === 'metric');
      const merged = Object.fromEntries(
        metricNodes.map((node) => [
          node.id,
          nodeSettings[node.id] ?? createDefaultSettings(node.id),
        ])
      );

      setSettings(merged);
      didInit.current = true;
    }
  }, [nodes, nodeSettings]);

  const metricNodes = nodes.filter((node) => node.kind === 'metric');

  const handleChange = (
    nodeId: string,
    field: keyof NodeSettings,
    value: string | number
  ) => {
    setSettings((prev) => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], [field]: value },
    }));
  };

  const handleClear = () => {
    const cleared = Object.fromEntries(
      metricNodes.map((node) => [node.id, createDefaultSettings(node.id)])
    );
    setSettings(cleared);
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
              <label className="block text-sm mb-1">Frequency (ms)</label>
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
              <label className="block text-sm mb-1">Fail Rate (ms)</label>
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
      <div className="flex justify-end gap-2">
        <button
          className="bg-gray-400 hover:bg-gray-500 text-white px-4 py-2 rounded font-semibold"
          onClick={handleClear}
          type="button"
        >
          Clear
        </button>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold"
          onClick={() => onSave(settings)}
          type="button"
        >
          Save Node Settings
        </button>
      </div>
    </div>
  );
}
