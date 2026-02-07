import { useState, useEffect, useRef } from 'react';
import { ChevronRight, ChevronDown, Send, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { testPublishNode } from '../../api/simulationProfile';
import type { ISchemaNode, NodeSettings } from '../../types';

import NodePayloadEditor from './NodePayloadEditor';

interface NodeSettingsTabProps {
  onSave: (settings: Record<string, NodeSettings>) => void;
  nodeIds: string[];
  fetchNodesByIds?: (ids: string[]) => Promise<ISchemaNode[]>;
  nodeSettings?: Record<string, NodeSettings>;
  profileId?: string;
}

const createDefaultSettings = (nodeId: string): NodeSettings => ({
  nodeId,
  frequency: 0,
  failRate: 0,
  payload: {
    quality: 'good',
    timestampMode: 'auto',
    value: 0,
    valueMode: 'random',
    customFields: [],
  },
});

export default function SimulatorNodeSettings({
  onSave,
  nodeIds,
  fetchNodesByIds,
  nodeSettings = {},
  profileId,
}: NodeSettingsTabProps) {
  const [nodes, setNodes] = useState<ISchemaNode[]>([]);
  const [settings, setSettings] = useState<Record<string, NodeSettings>>({});
  const [expandedPayloads, setExpandedPayloads] = useState<Set<string>>(
    new Set()
  );
  const [testingNodes, setTestingNodes] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
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

  // Filter nodes based on search term
  const filteredNodes = metricNodes.filter(
    (node) =>
      !searchTerm ||
      node.path?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const handlePayloadChange = (
    nodeId: string,
    payload: NodeSettings['payload']
  ) => {
    setSettings((prev) => ({
      ...prev,
      [nodeId]: { ...prev[nodeId], payload },
    }));
  };

  const togglePayloadExpanded = (nodeId: string) => {
    setExpandedPayloads((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const handleClear = () => {
    const cleared = Object.fromEntries(
      metricNodes.map((node) => [node.id, createDefaultSettings(node.id)])
    );
    setSettings(cleared);
    setExpandedPayloads(new Set());
  };

  const handleTestPublish = async (nodeId: string) => {
    if (!profileId) {
      toast.error('Profile ID is required to test publish');
      return;
    }

    setTestingNodes((prev) => new Set(prev).add(nodeId));

    try {
      const result = await testPublishNode(profileId, nodeId);

      if (result.success) {
        toast.success(
          `Test message published!\nTopic: ${result.topic}`,
          { duration: 4000 }
        );
        console.log('Test payload:', result.payload);
      } else {
        toast.error(`Failed to publish: ${result.error}`);
      }
    } catch (error) {
      toast.error(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
    } finally {
      setTestingNodes((prev) => {
        const next = new Set(prev);
        next.delete(nodeId);
        return next;
      });
    }
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
      {/* Search bar */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search nodes by name or path..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 pr-10"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            type="button"
            title="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Results count */}
      {searchTerm && (
        <div className="text-xs text-gray-500 dark:text-gray-400 px-1">
          Found {filteredNodes.length} of {metricNodes.length} nodes
        </div>
      )}

      {/* Filtered nodes list */}
      {filteredNodes.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-gray-400 text-sm">
          {searchTerm ? 'No nodes match your search' : 'No metric nodes in this schema'}
        </div>
      ) : (
        filteredNodes.map((node) => (
        <div
          key={node.id}
          className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        >
          {/* Node header */}
          <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-mono">
                <div className="flex items-center gap-1">
                  {node.path?.split('/').map((part, i) => (
                    <span key={i} className="inline-flex items-center gap-0.5">
                      {i > 0 && (
                        <ChevronRight className="w-2.5 h-2.5 text-gray-400" />
                      )}
                      <span>{part}</span>
                    </span>
                  ))}
                </div>
                {node.dataType && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-medium">
                    {node.dataType}
                  </span>
                )}
              </div>
              {profileId && (
                <button
                  type="button"
                  onClick={() => handleTestPublish(node.id)}
                  disabled={testingNodes.has(node.id)}
                  className="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Send test message"
                >
                  <Send className="w-3 h-3" />
                  {testingNodes.has(node.id) ? 'Testing...' : 'Test'}
                </button>
              )}
            </div>
          </div>
          {/* Settings */}
          <div className="px-3 py-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
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

            {/* Configure Payload Toggle Button */}
            <button
              type="button"
              onClick={() => togglePayloadExpanded(node.id)}
              className="w-full px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {expandedPayloads.has(node.id) ? (
                <>
                  <ChevronDown className="w-4 h-4" />
                  Hide Value Behavior
                </>
              ) : (
                <>
                  <ChevronRight className="w-4 h-4" />
                  Configure Value Behavior
                </>
              )}
            </button>

            {/* Payload Editor */}
            {expandedPayloads.has(node.id) && (
              <NodePayloadEditor
                dataType={node.dataType}
                payload={settings[node.id]?.payload || {}}
                onChange={(newPayload) =>
                  handlePayloadChange(node.id, newPayload)
                }
              />
            )}
          </div>
        </div>
        ))
      )}

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