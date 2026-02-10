import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import type { AppDispatch, RootState, ISchema, IBroker } from '../../types';
import { getSimulationStatusAsync } from '../../store/simulationProfile/simulationProfieThunk';
import { selectSchemas } from '../../store/schema/schemaSlice';
import { selectBrokers } from '../../store/brokers';
import { selectSystemMqttConnected } from '../../store/mqtt/systemMqttSlice';

const SimulationStatusPanel: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { profileId } = useParams<{ profileId: string }>();

  const profiles = useSelector(
    (state: RootState) => state.simulationProfile.profiles
  );
  const selectedProfile = profileId ? profiles[profileId] : null;

  const simulationStates = useSelector(
    (state: RootState) => state.simulationProfile.simulationStates
  );
  const simulationErrors = useSelector(
    (state: RootState) => state.simulationProfile.simulationErrors
  );
  const simulationStatus = useSelector(
    (state: RootState) => state.simulationProfile.simulationStatus
  );
  const schemas = useSelector(selectSchemas);
  const brokers = useSelector(selectBrokers);
  const systemMqttConnected = useSelector(selectSystemMqttConnected);

  const currentState = profileId
    ? simulationStates[profileId] || 'idle'
    : 'idle';
  const error = profileId ? simulationErrors[profileId] : null;
  const status = profileId ? simulationStatus[profileId] : undefined;

  // Fetch status on mount and poll every 10s while simulation is active
  // BUT: Skip polling if MQTT is connected (real-time updates)
  useEffect(() => {
    if (!profileId) return;

    dispatch(getSimulationStatusAsync(profileId));

    const isActive =
      currentState === 'running' ||
      currentState === 'starting' ||
      currentState === 'paused' ||
      currentState === 'stopping';

    // Only poll if MQTT is NOT connected
    if (!isActive || systemMqttConnected) return;

    const interval = setInterval(() => {
      dispatch(getSimulationStatusAsync(profileId));
    }, 10000);

    return () => clearInterval(interval);
  }, [dispatch, profileId, currentState, systemMqttConnected]);

  if (!profileId || !selectedProfile) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No profile selected
      </div>
    );
  }

  const schema = schemas.find(
    (s: ISchema) => s.id === selectedProfile.schemaId
  );
  const broker = brokers.find(
    (b: IBroker) => b.id === selectedProfile.brokerId
  );

  // State badge styling
  const stateStyles: Record<string, string> = {
    running:
      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    starting:
      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    paused:
      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    stopped:
      'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    stopping:
      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    error:
      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    idle: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
  };

  const badgeClass =
    stateStyles[currentState] ?? stateStyles.idle;

  const parseDate = (value?: string | number | Date): Date | null => {
    if (!value) return null;
    // Handle numeric strings (timestamps serialized as strings by GraphQL)
    const parsed =
      typeof value === 'string' && /^\d+$/.test(value)
        ? new Date(Number(value))
        : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const formatDateTime = (value?: string | number | Date) => {
    const date = parseDate(value);
    return date ? date.toLocaleString() : '—';
  };

  const formatDuration = (
    start?: string | number | Date,
    end?: string | number | Date
  ) => {
    const startDate = parseDate(start);
    if (!startDate) return '—';
    const startMs = startDate.getTime();
    const isActive =
      currentState === 'running' ||
      currentState === 'starting' ||
      currentState === 'paused';
    const endMs = isActive
      ? Date.now()
      : (parseDate(end)?.getTime() ?? startMs);
    const diffMs = Math.max(0, endMs - startMs);
    const seconds = Math.floor(diffMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainingSeconds = seconds % 60;
    const remainingMinutes = minutes % 60;
    if (hours > 0) return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
    if (minutes > 0) return `${minutes}m ${remainingSeconds}s`;
    return `${remainingSeconds}s`;
  };

  const nodesTotal = schema?.nodes?.length ?? 0;
  const nodeOverrides = selectedProfile.nodeSettings?.length ?? 0;
  const mqttConnectedLabel =
    status?.mqttConnected === true
      ? 'Connected'
      : status?.mqttConnected === false
        ? 'Disconnected'
        : 'Unknown';

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-3 sm:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Profile Details
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto px-3 sm:px-6 py-3 sm:py-4 space-y-4">
        {/* Profile info */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300 truncate">
              {selectedProfile.name}
            </h4>
            {selectedProfile.description && (
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1 line-clamp-2">
                {selectedProfile.description}
              </p>
            )}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow label="Schema" value={schema?.name ?? 'Unknown'} />

            {/* Broker with Change button */}
            <div className="px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Broker
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-right truncate">
                  {broker?.name ?? 'Unknown'}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const event = new CustomEvent('openChangeBrokerModal');
                    window.dispatchEvent(event);
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium whitespace-nowrap"
                >
                  Change
                </button>
              </div>
            </div>

            <InfoRow
              label="Broker URL"
              value={
                broker ? `${broker.url}:${broker.port}` : '—'
              }
            />
            <InfoRow
              label="Nodes"
              value={`${schema?.nodes?.length ?? 0} total`}
            />
          </div>
        </div>

        {/* Status */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Simulation Status
            </h4>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                systemMqttConnected
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
              }`}
            >
              {systemMqttConnected ? '⚡ Real-time' : '🔄 Polling'}
            </span>
          </div>
          <div className="px-3 sm:px-6 py-3 sm:py-4 space-y-4">
            <div className="flex flex-col xs:flex-row items-start xs:items-center gap-2 xs:gap-3">
              <span
                className={`inline-flex px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold ${badgeClass}`}
              >
                {currentState.toUpperCase()}
              </span>
              {status?.error && (
                <span className="text-xs text-red-600 dark:text-red-400 line-clamp-2">
                  {status.error}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <MetricItem label="MQTT" value={mqttConnectedLabel} />
              <MetricItem label="Nodes Active" value={status?.nodeCount ?? nodesTotal} />
              <MetricItem label="Overrides" value={nodeOverrides} />
              <MetricItem label="Reconnects" value={status?.reconnectAttempts ?? 0} />
              <MetricItem label="Started" value={formatDateTime(status?.startTime)} />
              <MetricItem label="Uptime" value={formatDuration(status?.startTime, status?.lastActivity)} />
              <MetricItem label="Last Activity" value={formatDateTime(status?.lastActivity)} />
              <MetricItem label="Time Scale" value={`${selectedProfile.globalSettings.timeScale ?? 1}x`} />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 text-xs text-red-700 dark:text-red-400">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Global settings summary */}
        {selectedProfile.globalSettings && (
          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                Active Settings
              </h4>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              <InfoRow
                label="Update Frequency"
                value={`${selectedProfile.globalSettings.defaultUpdateFrequency ?? 1000}ms`}
              />
              <InfoRow
                label="Time Scale"
                value={`${selectedProfile.globalSettings.timeScale ?? 1}x`}
              />
              {selectedProfile.globalSettings.publishRoot && (
                <InfoRow
                  label="Publish Root"
                  value={selectedProfile.globalSettings.publishRoot}
                />
              )}
              {selectedProfile.globalSettings.startDelay ? (
                <InfoRow
                  label="Start Delay"
                  value={`${selectedProfile.globalSettings.startDelay}ms`}
                />
              ) : null}
              {selectedProfile.globalSettings.simulationLength ? (
                <InfoRow
                  label="Duration"
                  value={`${selectedProfile.globalSettings.simulationLength}ms`}
                />
              ) : null}
            </div>
          </div>
        )}

        {/* Node settings summary */}
        {selectedProfile.nodeSettings &&
          selectedProfile.nodeSettings.length > 0 && (() => {
            // Helper to check if payload has non-default values
            const hasNonDefaultPayload = (payload: any) => {
              if (!payload) return false;
              if (payload.customFields && payload.customFields.length > 0) return true;
              if (payload.quality && payload.quality !== 'good') return true;
              if (payload.timestampMode && payload.timestampMode !== 'auto') return true;
              if (payload.valueMode && payload.valueMode !== 'random') return true;
              if (payload.value !== undefined && payload.value !== null && payload.value !== 0 && payload.value !== '') return true;
              if (payload.minValue != null || payload.maxValue != null) return true;
              if (payload.step != null) return true;
              if (payload.precision != null) return true;
              if (payload.fixedTimestamp != null) return true;
              return false;
            };

            // Helper to check if a node has meaningful overrides
            const hasOverrides = (ns: any) => {
              const hasFrequency = ns.frequency && ns.frequency !== 0;
              const hasFailRate = ns.failRate && ns.failRate !== 0;
              return hasFrequency || hasFailRate || hasNonDefaultPayload(ns.payload);
            };
            
            const nodesWithOverrides = selectedProfile.nodeSettings.filter(hasOverrides);
            
            return (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-3 sm:px-6 py-3 sm:py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    Node Overrides
                    <span className="ml-2 text-xs font-normal text-gray-400">
                      ({nodesWithOverrides.length})
                    </span>
                  </h4>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {nodesWithOverrides.length > 0 ? (
                    nodesWithOverrides.map((ns) => {
                      const node = schema?.nodes?.find(
                        (n) => n.id === ns.nodeId
                      );
                      return (
                        <div
                          key={ns.nodeId}
                          className="px-3 sm:px-6 py-3 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 font-mono min-w-0 flex-1 w-full xs:w-auto">
                            <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate max-w-full">
                              {node?.path ?? node?.name ?? ns.nodeId}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {ns.frequency && ns.frequency !== 0 ? (
                              <span className="whitespace-nowrap">{ns.frequency}ms</span>
                            ) : null}
                            {ns.failRate && ns.failRate !== 0 ? (
                              <span className="text-red-500 whitespace-nowrap">
                                {(Number(ns.failRate) * 100).toFixed(0)}% fail
                              </span>
                            ) : null}
                            {hasNonDefaultPayload(ns.payload) ? (
                              <span className="text-blue-500 whitespace-nowrap">
                                payload
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 sm:px-6 py-3 text-xs text-gray-500 dark:text-gray-400 italic">
                      No node overrides configured
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
      </div>
    </div>
  );
};

/* Small helper for info rows */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 sm:px-6 py-3 flex items-center justify-between gap-2">
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-right truncate">
        {value}
      </span>
    </div>
  );
}

function MetricItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-2 sm:px-3 py-2">
      <p className="text-[10px] sm:text-[11px] uppercase tracking-wide text-gray-400 truncate">
        {label}
      </p>
      <p className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">
        {value}
      </p>
    </div>
  );
}

export default SimulationStatusPanel;
