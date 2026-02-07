import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import type { AppDispatch, RootState, ISchema, IBroker } from '../../types';
import { getSimulationStatusAsync } from '../../store/simulationProfile/simulationProfieThunk';
import { selectSchemas } from '../../store/schema/schemaSlice';
import { selectBrokers } from '../../store/brokers';

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

  const currentState = profileId
    ? simulationStates[profileId] || 'idle'
    : 'idle';
  const error = profileId ? simulationErrors[profileId] : null;
  const status = profileId ? simulationStatus[profileId] : undefined;

  // Fetch status on mount and poll every 10s while simulation is active
  useEffect(() => {
    if (!profileId) return;

    dispatch(getSimulationStatusAsync(profileId));

    const isActive =
      currentState === 'running' ||
      currentState === 'starting' ||
      currentState === 'paused' ||
      currentState === 'stopping';

    if (!isActive) return;

    const interval = setInterval(() => {
      dispatch(getSimulationStatusAsync(profileId));
    }, 10000);

    return () => clearInterval(interval);
  }, [dispatch, profileId, currentState]);

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

  const formatDuration = (start?: string | number | Date) => {
    const date = parseDate(start);
    if (!date) return '—';
    const startTime = date.getTime();
    const diffMs = Math.max(0, Date.now() - startTime);
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
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Profile Details
        </h3>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto px-6 py-4 space-y-4">
        {/* Profile info */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800">
            <h4 className="text-sm font-semibold text-blue-700 dark:text-blue-300">
              {selectedProfile.name}
            </h4>
            {selectedProfile.description && (
              <p className="text-xs text-blue-600/70 dark:text-blue-400/70 mt-1">
                {selectedProfile.description}
              </p>
            )}
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow label="Schema" value={schema?.name ?? 'Unknown'} />
            <InfoRow label="Broker" value={broker?.name ?? 'Unknown'} />
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
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
              Simulation Status
            </h4>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex px-4 py-2 rounded-full text-xs font-semibold ${badgeClass}`}
              >
                {currentState.toUpperCase()}
              </span>
              {status?.error && (
                <span className="text-xs text-red-600 dark:text-red-400">
                  {status.error}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <MetricItem label="MQTT" value={mqttConnectedLabel} />
              <MetricItem label="Nodes Active" value={status?.nodeCount ?? nodesTotal} />
              <MetricItem label="Overrides" value={nodeOverrides} />
              <MetricItem label="Reconnects" value={status?.reconnectAttempts ?? 0} />
              <MetricItem label="Started" value={formatDateTime(status?.startTime)} />
              <MetricItem label="Uptime" value={formatDuration(status?.startTime)} />
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
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
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
            // Helper to check if a node has meaningful overrides
            const hasOverrides = (ns: any) => {
              // Check frequency (meaningful if not 0 or undefined)
              const hasFrequency = ns.frequency && ns.frequency !== 0;
              
              // Check failRate (meaningful if not 0 or undefined)
              const hasFailRate = ns.failRate && ns.failRate !== 0;
              
              // Check payload - must have non-default values
              const hasPayload = ns.payload && (() => {
                const keys = Object.keys(ns.payload);
                if (keys.length === 0) return false;
                
                // Check if payload has any non-default values
                // Default payload is: { quality: 'good', timestampMode: 'auto', value: 0, valueMode: 'random', customFields: [] }
                const { quality, timestampMode, value, valueMode, customFields, ...rest } = ns.payload;
                
                // If there are custom fields, that's a customization
                if (customFields && customFields.length > 0) return true;
                
                // If there are any extra fields beyond defaults, that's a customization
                if (Object.keys(rest).length > 0) return true;
                
                // If quality is not 'good', that's a customization
                if (quality && quality !== 'good') return true;
                
                // If timestampMode is not 'auto', that's a customization
                if (timestampMode && timestampMode !== 'auto') return true;
                
                // If valueMode is not 'random', that's a customization
                if (valueMode && valueMode !== 'random') return true;
                
                // If value is set and not 0, that's a customization
                if (value !== undefined && value !== null && value !== 0 && value !== '') return true;
                
                return false;
              })();
              
              return hasFrequency || hasFailRate || hasPayload;
            };
            
            const nodesWithOverrides = selectedProfile.nodeSettings.filter(hasOverrides);
            
            return (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
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
                          className="px-6 py-3 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400 font-mono min-w-0">
                            <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <span className="truncate">
                              {node?.path ?? node?.name ?? ns.nodeId}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
                            {ns.frequency && ns.frequency !== 0 ? (
                              <span>{ns.frequency}ms</span>
                            ) : null}
                            {ns.failRate && ns.failRate !== 0 ? (
                              <span className="text-red-500">
                                {(Number(ns.failRate) * 100).toFixed(0)}% fail
                              </span>
                            ) : null}
                            {ns.payload &&
                            Object.keys(ns.payload).length > 0 ? (
                              <span className="text-blue-500">
                                payload
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400 italic">
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
    <div className="px-6 py-3 flex items-center justify-between">
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
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
    <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
        {value}
      </p>
    </div>
  );
}

export default SimulationStatusPanel;
