import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Settings, Sliders } from 'lucide-react';

import {
  fetchSimulationProfilesAsync,
  updateSimulationProfileAsync,
  upsertNodeSettingsAsync,
} from '../../store/simulationProfile/simulationProfieThunk';
import type { AppDispatch, RootState } from '../../store/store';
import type {
  ISchema,
  ISimulationProfile,
  NodeSettings,
  ISchemaNode,
} from '../../types';

import SimulatorGlobalForm from './SimulatorGlobalForm';
import SimulatorNodeSettings from './SimulatorNodeSettings';

type TabType = 'global_settings' | 'node_settings';

type SimulatorCardContentProps = {
  fetchNodesByIds?: (ids: string[]) => Promise<ISchemaNode[]>;
};

const SimulatorCardContent: React.FC<SimulatorCardContentProps> = ({
  fetchNodesByIds,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('global_settings');
  const dispatch = useDispatch<AppDispatch>();
  const { profileId } = useParams<{ profileId?: string }>();

  const profiles = useSelector(
    (state: RootState) => state.simulationProfile.profiles
  );
  const selectedProfile = profileId ? profiles[profileId] : null;
  const schemas = useSelector((state: RootState) => state.schema.schemas);

  if (!selectedProfile) {
    return null;
  }

  const selectedSchema = schemas?.find(
    (s: ISchema) => s.id === selectedProfile.schemaId
  );
  const nodeIds =
    selectedSchema?.nodes?.map((node: ISchema['nodes'][number]) => node.id) ??
    [];

  const handleSaveGlobalSettings = async (
    settings: ISimulationProfile['globalSettings']
  ) => {
    if (!selectedProfile) return;
    try {
      await dispatch(
        updateSimulationProfileAsync({
          id: selectedProfile.id,
          input: {
            name: selectedProfile.name,
            description: selectedProfile.description,
            schemaId: selectedProfile.schemaId,
            brokerId: selectedProfile.brokerId,
            globalSettings: settings,
            defaultScenario: selectedProfile.defaultScenario,
          },
        })
      ).unwrap();
      toast.success('Global settings saved!');
    } catch {
      toast.error('Failed to save global settings');
    }
  };

  function sanitizeNodeSettings(settings: Record<string, NodeSettings>) {
    const sanitizeNumber = (val: number | string | undefined | null) =>
      val === '' || val === undefined || val === null ? undefined : Number(val);

    const sanitized: Record<string, NodeSettings> = {};
    for (const [nodeId, nodeSetting] of Object.entries(settings)) {
      sanitized[nodeId] = {
        ...nodeSetting,
        frequency: sanitizeNumber(nodeSetting.frequency),
        failRate: sanitizeNumber(nodeSetting.failRate),
        payload: nodeSetting.payload
          ? {
              ...nodeSetting.payload,
              value: sanitizeNumber(nodeSetting.payload.value),
              timestamp: sanitizeNumber(nodeSetting.payload.timestamp),
            }
          : undefined,
      };
    }
    return sanitized;
  }

  const handleSaveNodeSettings = async (
    settings: Record<string, NodeSettings>
  ) => {
    if (!selectedProfile) return;
    try {
      const sanitizedSettings = sanitizeNodeSettings(settings);
      await Promise.all(
        Object.entries(sanitizedSettings).map(([nodeId, nodeSetting]) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { nodeId: _omit, ...settingsWithoutNodeId } = nodeSetting;
          return dispatch(
            upsertNodeSettingsAsync({
              profileId: selectedProfile.id,
              nodeId,
              settings: settingsWithoutNodeId,
            })
          );
        })
      );
      await dispatch(fetchSimulationProfilesAsync());
      toast.success('Node settings saved!');
    } catch {
      toast.error('Failed to save node settings');
    }
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    {
      key: 'global_settings',
      label: 'Global Settings',
      icon: <Settings className="w-3.5 h-3.5" />,
    },
    {
      key: 'node_settings',
      label: 'Node Settings',
      icon: <Sliders className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab header */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto px-6 py-4">
        {activeTab === 'global_settings' && (
          <SimulatorGlobalForm
            initialSettings={
              selectedProfile?.globalSettings || {
                defaultUpdateFrequency: 1000,
                timeScale: 1,
              }
            }
            onSave={handleSaveGlobalSettings}
          />
        )}

        {activeTab === 'node_settings' && (
          <SimulatorNodeSettings
            nodeIds={nodeIds}
            onSave={handleSaveNodeSettings}
            fetchNodesByIds={fetchNodesByIds}
            nodeSettings={
              selectedProfile?.nodeSettings
                ? Object.fromEntries(
                    selectedProfile.nodeSettings.map((ns) => [ns.nodeId, ns])
                  )
                : {}
            }
          />
        )}
      </div>
    </div>
  );
};

export default SimulatorCardContent;
