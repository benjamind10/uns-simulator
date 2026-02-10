import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Settings, Sliders } from 'lucide-react';

import {
  deleteNodeSettingsAsync,
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
    const sanitizeNumber = (val: number | string | boolean | undefined | null) =>
      val === '' || val === undefined || val === null || typeof val === 'boolean'
        ? undefined
        : Number(val);

    // Compare payload against the effective defaults to determine if user actually changed anything.
    // effectiveDefaults includes schema-inherited + global default fields.
    const hasPayloadOverride = (payload: any, effectiveDefaults: any) => {
      if (!payload) return false;
      const defaults = effectiveDefaults || {};

      // Check core fields against effective defaults
      if ((payload.quality || 'good') !== (defaults.quality || 'good')) return true;
      if ((payload.timestampMode || 'auto') !== (defaults.timestampMode || 'auto')) return true;
      if ((payload.valueMode || 'random') !== (defaults.valueMode || 'random')) return true;

      // Check numeric value fields — only if they differ from defaults
      const defaultValue = defaults.value ?? 0;
      if (payload.value !== undefined && payload.value !== null && payload.value !== '' && payload.value !== defaultValue) return true;
      if ((payload.minValue ?? null) !== (defaults.minValue ?? null)) return true;
      if ((payload.maxValue ?? null) !== (defaults.maxValue ?? null)) return true;
      if ((payload.step ?? null) !== (defaults.step ?? null)) return true;
      if ((payload.precision ?? null) !== (defaults.precision ?? null)) return true;
      if ((payload.fixedTimestamp ?? null) !== (defaults.fixedTimestamp ?? null)) return true;

      // Compare custom fields — only count as override if they differ from inherited ones
      const payloadCF = payload.customFields || [];
      const defaultCF = defaults.customFields || [];
      if (JSON.stringify(payloadCF) !== JSON.stringify(defaultCF)) return true;

      return false;
    };

    // Build effective defaults per node (schema + global)
    const allNodes = selectedSchema?.nodes ?? [];
    const globalPayload = selectedProfile?.globalSettings?.defaultPayload || {};

    const getNodeEffectiveDefaults = (nodeId: string) => {
      const schemaNode = allNodes.find((n) => n.id === nodeId);
      if (!schemaNode) return { quality: 'good', timestampMode: 'auto', value: 0, valueMode: 'random', customFields: [] };

      // Walk up parent chain for schema payload
      let ancestorPayload: any = {};
      let parentId = schemaNode.parent;
      while (parentId) {
        const parent = allNodes.find((n) => n.id === parentId);
        if (!parent) break;
        if (parent.kind === 'group' && parent.payloadTemplate) {
          ancestorPayload = { ...parent.payloadTemplate };
          break;
        }
        parentId = parent.parent;
      }
      const metricPayload = schemaNode.payloadTemplate ? { ...schemaNode.payloadTemplate } : {};
      const ancestorCF = ancestorPayload.customFields?.length ? ancestorPayload.customFields : [];
      const metricCF = metricPayload.customFields?.length ? metricPayload.customFields : [];
      const schemaPayload = { ...ancestorPayload, ...metricPayload, customFields: [...ancestorCF, ...metricCF] };

      // Merge: hardcoded < schema < global
      const schemaCF = schemaPayload.customFields?.length ? schemaPayload.customFields : [];
      const globalCF = (globalPayload as any).customFields?.length ? (globalPayload as any).customFields : [];
      return {
        quality: 'good',
        timestampMode: 'auto',
        value: 0,
        valueMode: 'random',
        ...schemaPayload,
        ...globalPayload,
        customFields: [...schemaCF, ...globalCF],
      };
    };

    const sanitized: Record<string, NodeSettings> = {};
    for (const [nodeId, nodeSetting] of Object.entries(settings)) {
      const hasFrequency = nodeSetting.frequency && nodeSetting.frequency !== 0;
      const hasFailRate = nodeSetting.failRate && nodeSetting.failRate !== 0;
      const effectiveDefaults = getNodeEffectiveDefaults(nodeId);
      const hasPayload = hasPayloadOverride(nodeSetting.payload, effectiveDefaults);

      if (hasFrequency || hasFailRate || hasPayload) {
        sanitized[nodeId] = {
          ...nodeSetting,
          frequency: sanitizeNumber(nodeSetting.frequency),
          failRate: sanitizeNumber(nodeSetting.failRate),
          payload: nodeSetting.payload
            ? {
                ...nodeSetting.payload,
                value: nodeSetting.payload.value,
                fixedTimestamp: sanitizeNumber(nodeSetting.payload.fixedTimestamp),
              }
            : undefined,
        };
      }
    }
    return sanitized;
  }

  const handleSaveNodeSettings = async (
    settings: Record<string, NodeSettings>
  ) => {
    if (!selectedProfile) return;
    try {
      const sanitizedSettings = sanitizeNodeSettings(settings);

      // Delete nodes that were previously saved but now have default-only values
      const previouslyStoredIds = new Set(
        selectedProfile.nodeSettings?.map((ns) => ns.nodeId) ?? []
      );
      const nodesToDelete = [...previouslyStoredIds].filter(
        (id) => !sanitizedSettings[id]
      );

      await Promise.all([
        ...Object.entries(sanitizedSettings).map(([nodeId, nodeSetting]) => {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { nodeId: _omit, ...settingsWithoutNodeId } = nodeSetting;
          return dispatch(
            upsertNodeSettingsAsync({
              profileId: selectedProfile.id,
              nodeId,
              settings: settingsWithoutNodeId,
            })
          );
        }),
        ...nodesToDelete.map((nodeId) =>
          dispatch(
            deleteNodeSettingsAsync({
              profileId: selectedProfile.id,
              nodeId,
            })
          )
        ),
      ]);
      await dispatch(fetchSimulationProfilesAsync());
      toast.success('Node settings saved!');
    } catch {
      toast.error('Failed to save node settings');
    }
  };

  const handleClearOverride = async (nodeId: string) => {
    if (!selectedProfile) return;
    await dispatch(
      deleteNodeSettingsAsync({ profileId: selectedProfile.id, nodeId })
    ).unwrap();
    await dispatch(fetchSimulationProfilesAsync());
  };

  const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
    {
      key: 'global_settings',
      label: 'Global Settings',
      icon: <Settings className="w-3.5 h-3.5" />,
    },
    {
      key: 'node_settings',
      label: 'Metric Settings',
      icon: <Sliders className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab header */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap flex-shrink-0 ${
                  activeTab === tab.key
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {tab.icon}
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-auto px-3 sm:px-6 py-3 sm:py-4 scrollbar-thin">
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
            onClearOverride={handleClearOverride}
            fetchNodesByIds={fetchNodesByIds}
            nodeSettings={
              selectedProfile?.nodeSettings
                ? Object.fromEntries(
                    selectedProfile.nodeSettings.map((ns) => [ns.nodeId, ns])
                  )
                : {}
            }
            globalDefaultPayload={selectedProfile?.globalSettings?.defaultPayload}
            allSchemaNodes={selectedSchema?.nodes ?? []}
            profileId={selectedProfile.id}
          />
        )}
      </div>
    </div>
  );
};

export default SimulatorCardContent;
