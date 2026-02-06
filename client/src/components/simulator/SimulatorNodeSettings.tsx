import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';

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

  if (metricNodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
        No metric nodes in this schema
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {metricNodes.map((node) => (
        <div
          key={node.id}
          className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Node header */}
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 font-mono">
              {node.path?.split('/').map((part, i) => (
                <span key={i} className="inline-flex items-center gap-0.5">
                  {i > 0 && (
                    <ChevronRight className="w-2.5 h-2.5 text-gray-400" />
                  )}
                  <span>{part}</span>
                </span>
              ))}
            </div>
          </div>
          {/* Settings */}
          <div className="px-3 py-3 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Frequency (ms)
              </label>
              <input
                type="number"
                value={settings[node.id]?.frequency ?? ''}
                onChange={(e) =>
                  handleChange(node.id, 'frequency', Number(e.target.value))
                }
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="Default"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Fail Rate (0-1)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={settings[node.id]?.failRate ?? ''}
                onChange={(e) =>
                  handleChange(node.id, 'failRate', Number(e.target.value))
                }
                className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                placeholder="0"
              />
            </div>
          </div>
        </div>
      ))}

      <div className="flex gap-2 pt-2">
        <button
          className="flex-1 px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
          onClick={handleClear}
          type="button"
        >
          Clear All
        </button>
        <button
          className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded-lg transition-colors"
          onClick={() => onSave(settings)}
          type="button"
        >
          Save Node Settings
        </button>
      </div>
    </div>
  );
}
