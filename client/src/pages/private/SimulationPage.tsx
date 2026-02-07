import { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Plus,
  Trash2,
  Play,
  Square,
  Pause,
  RotateCcw,
  Cpu,
} from 'lucide-react';

import {
  fetchSimulationProfilesAsync,
  createSimulationProfileAsync,
  deleteSimulationProfileAsync,
  startSimulationAsync,
  stopSimulationAsync,
  pauseSimulationAsync,
  resumeSimulationAsync,
  getSimulationStatusAsync,
  updateSimulationProfileAsync,
} from '../../store/simulationProfile/simulationProfieThunk';
import { selectSchemas } from '../../store/schema/schemaSlice';
import { fetchSchemasAsync } from '../../store/schema/schemaThunk';
import { fetchBrokersAsync, selectBrokers } from '../../store/brokers';
import {
  connectToBrokerAsync,
  disconnectFromBrokerAsync,
} from '../../store/mqtt/mqttThunk';
import SimulatorCardContent from '../../components/simulator/SimulatorCardContent';
import SimulationStatusPanel from '../../components/simulator/SimulationControls';
import ConfirmDialog from '../../components/global/ConfirmDialog';
import type {
  AppDispatch,
  IBroker,
  ISchema,
  ISimulationProfile,
  RootState,
} from '../../types';

export default function SimulationPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { profileId } = useParams<{ profileId?: string }>();

  const profilesRecord = useSelector(
    (state: RootState) => state.simulationProfile.profiles
  );
  const profiles = Object.values(profilesRecord) as ISimulationProfile[];
  const schemas = useSelector(selectSchemas);
  const brokers = useSelector(selectBrokers);

  const [showCreate, setShowCreate] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditOrphaned, setShowEditOrphaned] = useState(false);
  const [editForm, setEditForm] = useState({ brokerId: '', schemaId: '' });
  const [mobileView, setMobileView] = useState<'settings' | 'status'>('settings');
  const [form, setForm] = useState({
    name: '',
    description: '',
    schemaId: '',
    brokerId: '',
  });

  const selectedProfile = profiles.find((p) => p.id === profileId) ?? null;

  // Simulation state from Redux
  const simulationStates = useSelector(
    (state: RootState) => state.simulationProfile.simulationStates
  );
  const simulationLoading = useSelector(
    (state: RootState) => state.simulationProfile.simulationLoading
  );
  const brokerStatuses = useSelector(
    (state: RootState) => state.mqtt.connections
  );

  const currentState = profileId
    ? simulationStates[profileId] || 'idle'
    : 'idle';
  const isLoading = profileId
    ? simulationLoading[profileId] || false
    : false;

  // Status badge config
  const stateConfig: Record<
    string,
    { dot: string; text: string; pulse: boolean }
  > = {
    running: { dot: 'bg-green-500', text: 'Running', pulse: true },
    starting: { dot: 'bg-green-500', text: 'Starting...', pulse: true },
    paused: { dot: 'bg-yellow-500', text: 'Paused', pulse: false },
    stopping: { dot: 'bg-red-500', text: 'Stopping...', pulse: true },
    stopped: { dot: 'bg-gray-400', text: 'Stopped', pulse: false },
    error: { dot: 'bg-red-500', text: 'Error', pulse: false },
    idle: { dot: 'bg-gray-400', text: 'Idle', pulse: false },
  };
  const status = stateConfig[currentState] ?? stateConfig.idle;

  useEffect(() => {
    dispatch(fetchSimulationProfilesAsync());
    dispatch(fetchSchemasAsync());
    dispatch(fetchBrokersAsync());
  }, [dispatch]);

  useEffect(() => {
    if (profileId) {
      dispatch(getSimulationStatusAsync(profileId));
    }
  }, [dispatch, profileId]);

  // Redirect if profileId not in profiles
  useEffect(() => {
    if (profileId && profiles.length > 0 && !selectedProfile) {
      navigate('/app/simulator');
    }
  }, [profileId, profiles, selectedProfile, navigate]);

  const handleSelectProfile = useCallback(
    (id: string) => {
      if (id) {
        navigate(`/app/simulator/${id}`);
      } else {
        navigate('/app/simulator');
      }
    },
    [navigate]
  );

  const handleCreate = async () => {
    if (!form.name.trim() || !form.schemaId || !form.brokerId) return;
    try {
      const result = await dispatch(
        createSimulationProfileAsync({
          ...form,
          globalSettings: {
            defaultUpdateFrequency: 1000,
            timeScale: 1,
          },
        })
      ).unwrap();
      toast.success('Profile created!');
      setForm({ name: '', description: '', schemaId: '', brokerId: '' });
      setShowCreate(false);
      navigate(`/app/simulator/${result.id}`);
    } catch {
      toast.error('Failed to create profile');
    }
  };

  const handleDelete = async () => {
    if (!profileId) return;
    try {
      await dispatch(deleteSimulationProfileAsync(profileId));
      toast.success('Profile deleted!');
      navigate('/app/simulator');
      setShowDeleteConfirm(false);
    } catch {
      toast.error('Failed to delete profile');
    }
  };

  const handleOpenEditOrphaned = () => {
    if (selectedProfile) {
      setEditForm({
        brokerId: selectedProfile.brokerId || '',
        schemaId: selectedProfile.schemaId || '',
      });
      setShowEditOrphaned(true);
    }
  };

  const handleSaveOrphaned = async () => {
    if (!profileId) return;
    try {
      await dispatch(
        updateSimulationProfileAsync({
          id: profileId,
          input: {
            brokerId: editForm.brokerId || undefined,
            schemaId: editForm.schemaId || undefined,
          },
        })
      ).unwrap();
      toast.success('Profile updated!');
      setShowEditOrphaned(false);
    } catch {
      toast.error('Failed to update profile');
    }
  };

  // Simulation control handlers
  const handleStart = async () => {
    if (!profileId) return;
    const brokerId = selectedProfile?.brokerId;
    const brokerStatus =
      brokerId && brokerStatuses[brokerId]
        ? (brokerStatuses[brokerId] as { status: string }).status
        : 'disconnected';

    if (brokerStatus !== 'connected') {
      toast.error(
        'Broker not connected. Please connect using the button above.',
        { duration: 4000 }
      );
      return;
    }

    try {
      await dispatch(startSimulationAsync(profileId));
      // Small delay so server has time to set startTime before we fetch
      setTimeout(() => dispatch(getSimulationStatusAsync(profileId)), 500);
    } catch {
      toast.error('Could not start simulation. Server may be offline.');
    }
  };

  const handleStop = async () => {
    if (!profileId) return;
    try {
      await dispatch(stopSimulationAsync(profileId));
      dispatch(getSimulationStatusAsync(profileId));
    } catch {
      toast.error('Could not stop simulation.');
    }
  };

  const handlePause = async () => {
    if (!profileId) return;
    try {
      await dispatch(pauseSimulationAsync(profileId));
      dispatch(getSimulationStatusAsync(profileId));
    } catch {
      toast.error('Could not pause simulation.');
    }
  };

  const handleResume = async () => {
    if (!profileId) return;
    try {
      await dispatch(resumeSimulationAsync(profileId));
      setTimeout(() => dispatch(getSimulationStatusAsync(profileId)), 500);
    } catch {
      toast.error('Could not resume simulation.');
    }
  };

  // Broker connection handlers
  const handleConnectBroker = async (brokerId: string) => {
    const broker = brokers.find((b) => b.id === brokerId);
    if (!broker) return;

    try {
      await dispatch(connectToBrokerAsync(broker)).unwrap();
      toast.success(`Connected to ${broker.name}`);
    } catch (error) {
      console.error('Error connecting to broker:', error);
      toast.error(`Failed to connect to ${broker.name}`);
    }
  };

  const handleDisconnectBroker = async (brokerId: string) => {
    try {
      await dispatch(disconnectFromBrokerAsync(brokerId)).unwrap();
      const broker = brokers.find((b) => b.id === brokerId);
      toast.success(`Disconnected from ${broker?.name || 'broker'}`);
    } catch (error) {
      console.error('Error disconnecting from broker:', error);
      toast.error('Failed to disconnect from broker');
    }
  };

  // Fetch nodes by IDs utility
  const fetchNodesByIds = useCallback(
    async (ids: string[]) => {
      const allNodes = schemas.flatMap((schema) => schema.nodes ?? []);
      return allNodes.filter((node) => ids.includes(node.id));
    },
    [schemas]
  );

  return (
    <div className="flex flex-col gap-2 h-full min-h-0 px-3 sm:px-6 py-3 sm:py-4">
      {/* Compact toolbar header */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 px-3 sm:px-6 py-3 sm:py-4 flex-shrink-0">
        <div className="flex flex-col gap-3">
          {/* Top row: Profile selector + status */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 min-w-0">
            <select
              value={profileId || ''}
              onChange={(e) => handleSelectProfile(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700 text-sm font-medium sm:min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              <option value="">Select a profile...</option>
              {profiles.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Status badge */}
            {profileId && selectedProfile && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <span className="relative flex h-2 w-2">
                    {status.pulse && (
                      <span
                        className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.dot}`}
                      />
                    )}
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${status.dot}`}
                    />
                  </span>
                  {status.text}
                </span>

                {/* Broker connection status and controls */}
                {selectedProfile.brokerId && (() => {
                  const broker = brokers.find((b) => b.id === selectedProfile.brokerId);
                  const brokerStatus = brokerStatuses[selectedProfile.brokerId];
                  const status = brokerStatus?.status || 'disconnected';
                  const isConnected = status === 'connected';
                  const isConnecting = status === 'connecting';

                  return broker ? (
                    <div className="inline-flex items-center gap-1.5 sm:pl-2 sm:ml-2 sm:border-l border-gray-200 dark:border-gray-700">
                      <span className={`relative flex h-2 w-2`}>
                        <span
                          className={`relative inline-flex rounded-full h-2 w-2 ${
                            isConnected
                              ? 'bg-green-500'
                              : isConnecting
                              ? 'bg-yellow-500 animate-pulse'
                              : 'bg-gray-400'
                          }`}
                        />
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px] sm:max-w-none">
                        {broker.name}
                      </span>
                      {isConnected ? (
                        <button
                          onClick={() => handleDisconnectBroker(broker.id)}
                          className="px-2 py-1 text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title={`Disconnect from ${broker.name}`}
                        >
                          Disconnect
                        </button>
                      ) : (
                        <button
                          onClick={() => handleConnectBroker(broker.id)}
                          disabled={isConnecting}
                          className="px-2 py-1 text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={`Connect to ${broker.name}`}
                        >
                          {isConnecting ? 'Connecting...' : 'Connect'}
                        </button>
                      )}  
                    </div>
                  ) : null;
                })()}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Create profile inline */}
            {showCreate ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Profile name"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  className="px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700 w-full sm:w-32 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  autoFocus
                />
                <select
                  value={form.schemaId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, schemaId: e.target.value }))
                  }
                  className="px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700 w-full sm:w-36 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Schema...</option>
                  {schemas.map((s: ISchema) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <select
                  value={form.brokerId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, brokerId: e.target.value }))
                  }
                  className="px-3 py-1.5 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700 w-full sm:w-36 focus:outline-none focus:ring-2 focus:ring-blue-400"
                >
                  <option value="">Broker...</option>
                  {brokers.map((b: IBroker) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleCreate}
                    disabled={
                      !form.name.trim() || !form.schemaId || !form.brokerId
                    }
                    className="flex-1 sm:flex-none px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Create
                  </button>
                  <button
                    onClick={() => {
                      setShowCreate(false);
                      setForm({
                        name: '',
                        description: '',
                        schemaId: '',
                        brokerId: '',
                      });
                    }}
                    className="flex-1 sm:flex-none px-2 py-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Profile
              </button>
            )}

            {/* Delete button */}
            {profileId && selectedProfile && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-sm rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

            {/* Simulation controls */}
            {profileId && selectedProfile && (
              <div className="flex items-center gap-1 sm:ml-2 sm:pl-2 sm:border-l border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleStart}
                  disabled={isLoading || currentState === 'running'}
                  className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Start simulation"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Start</span>
                </button>
                <button
                  onClick={handlePause}
                  disabled={isLoading || currentState !== 'running'}
                  className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-yellow-700 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Pause simulation"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pause</span>
                </button>
                <button
                  onClick={handleResume}
                  disabled={isLoading || currentState !== 'paused'}
                  className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Resume simulation"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Resume</span>
                </button>
                <button
                  onClick={handleStop}
                  disabled={
                    isLoading ||
                    currentState === 'idle' ||
                    currentState === 'stopped'
                  }
                  className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Stop simulation"
                >
                  <Square className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Stop</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main content area */}
      {selectedProfile && (!selectedProfile.brokerId || !selectedProfile.schemaId) && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 sm:px-4 py-3 flex-shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <span className="text-amber-600 dark:text-amber-400 text-lg mt-0.5">⚠️</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  {!selectedProfile.brokerId && !selectedProfile.schemaId
                    ? 'Missing Broker and Schema'
                    : !selectedProfile.brokerId
                    ? 'Missing Broker'
                    : 'Missing Schema'}
                </p>
                <p className="text-xs text-amber-800 dark:text-amber-200 mt-1">
                  {!selectedProfile.brokerId && !selectedProfile.schemaId
                    ? 'This profile is missing broker and schema references. Click "Fix" to reassign them.'
                    : !selectedProfile.brokerId
                    ? 'This profile is missing a broker reference. Click "Fix" to reassign it.'
                    : 'This profile is missing a schema reference. Click "Fix" to reassign it.'}
                </p>
              </div>
            </div>
            <button
              onClick={handleOpenEditOrphaned}
              className="px-3 py-1.5 text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-lg transition-colors whitespace-nowrap"
            >
              Fix
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex-1 min-h-0 flex flex-col overflow-hidden">
        {selectedProfile ? (
          <>
            {/* Mobile/Tablet Tab Switcher - visible below lg */}
            <div className="flex lg:hidden border-b border-gray-200 dark:border-gray-700 flex-shrink-0 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => setMobileView('settings')}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all relative ${
                  mobileView === 'settings'
                    ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Settings
                {mobileView === 'settings' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></span>
                )}
              </button>
              <button
                onClick={() => setMobileView('status')}
                className={`flex-1 px-4 py-3 text-sm font-semibold transition-all relative ${
                  mobileView === 'status'
                    ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                Status
                {mobileView === 'status' && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400"></span>
                )}
              </button>
            </div>

            {/* Content panels */}
            <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
              {/* Settings Panel */}
              <div
                className={`w-full lg:w-1/2 flex-col min-h-0 lg:border-r border-gray-200 dark:border-gray-700 overflow-hidden ${
                  mobileView === 'settings' ? 'flex' : 'hidden'
                } lg:flex`}
              >
                <SimulatorCardContent fetchNodesByIds={fetchNodesByIds} />
              </div>

              {/* Status Panel */}
              <div
                className={`w-full lg:w-1/2 flex-col min-h-0 overflow-hidden ${
                  mobileView === 'status' ? 'flex' : 'hidden'
                } lg:flex`}
              >
                <SimulationStatusPanel />
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full w-full text-gray-400 dark:text-gray-500 gap-3">
            <Cpu className="w-12 h-12 opacity-40" />
            <p className="text-sm font-medium">
              Select or create a simulation profile to get started
            </p>
          </div>
        )}
      </div>

      {/* Confirm delete dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Simulation Profile"
        message={`Are you sure you want to delete "${selectedProfile?.name}"? This cannot be undone.`}
      />

      {/* Edit orphaned references dialog */}
      {showEditOrphaned && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm max-w-md w-full p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Re-link Broker & Schema
            </h2>

            <div className="space-y-4">
              {!selectedProfile?.brokerId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Broker
                  </label>
                  <select
                    value={editForm.brokerId}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, brokerId: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Select a broker...</option>
                    {brokers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {!selectedProfile?.schemaId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Schema
                  </label>
                  <select
                    value={editForm.schemaId}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, schemaId: e.target.value }))
                    }
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  >
                    <option value="">Select a schema...</option>
                    {schemas.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowEditOrphaned(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveOrphaned}
                disabled={
                  (!selectedProfile?.brokerId && !editForm.brokerId) ||
                  (!selectedProfile?.schemaId && !editForm.schemaId)
                }
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
