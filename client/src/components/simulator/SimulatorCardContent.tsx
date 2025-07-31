import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';

import {
  fetchSimulationProfilesAsync,
  updateSimulationProfileAsync,
  upsertNodeSettingsAsync,
} from '../../store/simulationProfile/simulationProfieThunk';
import { selectProfiles } from '../../store/simulationProfile/simulationProfileSlice';
import type { AppDispatch, RootState } from '../../store/store';
import type {
  ISchema,
  ISimulationProfile,
  NodeSettings,
  ISchemaNode,
} from '../../types';

import SimulatorGlobalForm from './SimulatorGlobalForm';
import SimulatorNodeSettings from './SimulatorNodeSettings';

type TabType =
  | 'details'
  | 'global_settings'
  | 'node_settings'
  | 'global'
  | 'behavior';

// Accept fetchNodesByIds as a prop
type SimulatorCardContentProps = {
  fetchNodesByIds?: (ids: string[]) => Promise<ISchemaNode[]>;
};

const SimulatorCardContent: React.FC<SimulatorCardContentProps> = ({
  fetchNodesByIds,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  const dispatch = useDispatch<AppDispatch>();
  const { profileId } = useParams<{ profileId?: string }>();
  const profiles = Object.values(
    useSelector(selectProfiles)
  ) as ISimulationProfile[];
  const schemas = useSelector((state: RootState) => state.schema.schemas); // <-- always called

  // Find the selected profile from the store using URL param
  const selectedProfile = profiles.find(
    (p: { id: string }) => p.id === profileId
  );

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

  // Handler for saving node settings
  const handleSaveNodeSettings = async (
    settings: Record<string, NodeSettings>
  ) => {
    if (!selectedProfile) return;
    try {
      // Save each node's settings using the dedicated mutation
      await Promise.all(
        Object.entries(settings).map(([nodeId, nodeSetting]) =>
          dispatch(
            upsertNodeSettingsAsync({
              profileId: selectedProfile.id,
              nodeId,
              settings: nodeSetting,
            })
          )
        )
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
            activeTab === 'global'
              ? 'border-b-2 border-blue-600 text-blue-600'
              : 'text-gray-500 dark:text-gray-400'
          }`}
          onClick={() => setActiveTab('global')}
        >
          Pass
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div>
          <div className="mb-6">
            <div className="text-lg font-semibold mb-2 dark:text-white text-gray-900">
              Status
            </div>
            <div className="text-3xl font-bold text-green-500 mb-4">
              Running
            </div>
            <div className="flex gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-semibold">
                Start
              </button>
              <button className="bg-gray-400 dark:bg-gray-700 text-white px-4 py-2 rounded font-semibold">
                Pause
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold">
                Stop
              </button>
            </div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-6 h-40 flex items-center justify-center shadow-sm">
            <span className="text-gray-500 dark:text-gray-400">
              [Chart Placeholder]
            </span>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-xs shadow-sm">
            <div className="dark:text-gray-300 text-gray-600">
              09:14:08 INFO Topic A ...
            </div>
            <div className="dark:text-gray-300 text-gray-600">
              09:14:06 INFO ...
            </div>
            <div className="dark:text-gray-300 text-gray-600">
              09:14:04 INFO ...
            </div>
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
          />
        </div>
      )}

      {activeTab === 'behavior' && (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <span>[Behavior content goes here]</span>
        </div>
      )}

      {activeTab === 'global' && (
        <div className="py-8 text-center text-gray-500 dark:text-gray-400">
          <span>[Global settings content goes here]</span>
        </div>
      )}
    </>
  );
};

export default SimulatorCardContent;
