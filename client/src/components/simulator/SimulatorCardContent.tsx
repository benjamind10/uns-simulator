import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

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
import NodePayloadSettings from './NodePayloadSettings';
import SimulationControls from './SimulationControls';

type TabType =
  | 'details'
  | 'global_settings'
  | 'node_settings'
  | 'node_payloads';

type SimulatorCardContentProps = {
  fetchNodesByIds?: (ids: string[]) => Promise<ISchemaNode[]>;
};

const SimulatorCardContent: React.FC<SimulatorCardContentProps> = ({
  fetchNodesByIds,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const dispatch = useDispatch<AppDispatch>();
  const { profileId } = useParams<{ profileId?: string }>();

  // Use simple selectors to avoid memoization issues
  const profiles = useSelector(
    (state: RootState) => state.simulationProfile.profiles
  );
  const selectedProfile = profileId ? profiles[profileId] : null;
  const schemas = useSelector((state: RootState) => state.schema.schemas);

  // If no profile is selected, show a card prompting the user to select one
  if (!selectedProfile) {
    return (
      <div className="bg-white dark:bg-gray-900 p-8 flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-700 dark:text-gray-200 mb-4">
            No Simulation Profile Selected
          </div>
          <div className="text-gray-500 dark:text-gray-400 mb-6">
            Please select a profile from the left panel to configure and run the
            simulator.
          </div>
          <div>
            <span className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded">
              ← Select a profile to begin
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Get selected schema and node IDs for Node Settings tab
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

  return (
    <>
      <div className="flex gap-8 border-b border-gray-300 dark:border-gray-700 mb-4">
        <button
          className={`pb-2 font-semibold ${
            activeTab === 'details'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('details')}
        >
          Details
        </button>
        <button
          className={`pb-2 font-semibold ${
            activeTab === 'global_settings'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('global_settings')}
        >
          Global Settings
        </button>
        <button
          className={`pb-2 font-semibold ${
            activeTab === 'node_settings'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('node_settings')}
        >
          Node Settings
        </button>
        <button
          className={`pb-2 font-semibold ${
            activeTab === 'node_payloads'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('node_payloads')}
        >
          Node Payloads
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div>
          <div className="mb-6">
            <SimulationControls />
          </div>
        </div>
      )}

      {activeTab === 'global_settings' && (
        <div className="py-8">
          <SimulatorGlobalForm
            initialSettings={
              selectedProfile?.globalSettings || {
                defaultUpdateFrequency: 1000,
                timeScale: 1,
              }
            }
            onSave={handleSaveGlobalSettings}
          />
        </div>
      )}

      {activeTab === 'node_settings' && (
        <div className="py-8">
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
        </div>
      )}

      {activeTab === 'node_payloads' && (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <NodePayloadSettings />
        </div>
      )}
    </>
  );
};

export default SimulatorCardContent;
