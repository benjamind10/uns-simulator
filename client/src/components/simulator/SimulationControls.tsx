import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import type { RootState } from '../../types';
import {
  startSimulationAsync,
  stopSimulationAsync,
  pauseSimulationAsync,
  resumeSimulationAsync,
  getSimulationStatusAsync,
} from '../../store/simulationProfile/simulationProfieThunk';

const SimulationControls: React.FC = () => {
  const dispatch = useDispatch();
  const { profileId } = useParams<{ profileId: string }>();

  const profiles = useSelector(
    (state: RootState) => state.simulationProfile.profiles
  );
  const selectedProfile = profileId ? profiles[profileId] : null;

  const simulationStates = useSelector(
    (state: RootState) => state.simulationProfile.simulationStates
  );
  const simulationLoading = useSelector(
    (state: RootState) => state.simulationProfile.simulationLoading
  );
  const simulationErrors = useSelector(
    (state: RootState) => state.simulationProfile.simulationErrors
  );

  // Broker connection check
  const brokerStatuses = useSelector(
    (state: RootState) => state.mqtt.connections
  );

  const [showAlert, setShowAlert] = useState(false);

  const currentState = profileId
    ? simulationStates[profileId] || 'idle'
    : 'idle';

  useEffect(() => {
    if (profileId) {
      dispatch(getSimulationStatusAsync(profileId) as any);
    }
  }, [dispatch, profileId]);

  const handleStart = () => {
    // Check if broker is connected
    const requiredBrokerId = selectedProfile?.brokerId;
    const brokerStatus =
      requiredBrokerId && brokerStatuses[requiredBrokerId]
        ? brokerStatuses[requiredBrokerId]
        : { status: 'disconnected' };

    // Type guard to ensure brokerStatus has a 'status' property
    const status =
      typeof brokerStatus === 'object' && 'status' in brokerStatus
        ? (brokerStatus as any).status
        : 'disconnected';

    if (status !== 'connected') {
      setShowAlert(true);
      return;
    }

    if (profileId) {
      dispatch(startSimulationAsync(profileId) as any);
    }
  };

  const handleStop = async () => {
    if (profileId) {
      await dispatch(stopSimulationAsync(profileId) as any);
      dispatch(getSimulationStatusAsync(profileId) as any); // Refetch status
    }
  };

  const handlePause = () => {
    if (profileId) {
      dispatch(pauseSimulationAsync(profileId) as any);
    }
  };

  const handleResume = () => {
    if (profileId) {
      dispatch(resumeSimulationAsync(profileId) as any);
    }
  };

  const isLoading = profileId ? simulationLoading[profileId] || false : false;
  const error = profileId ? simulationErrors[profileId] : null;

  if (!profileId || !selectedProfile) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Simulation Controls
        </h2>
        <div className="text-center text-gray-500 dark:text-gray-400">
          {!profileId ? 'No profile ID in URL' : 'Profile not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-gray-800 rounded-lg max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
        Simulation Controls
      </h2>

      {/* Profile Info */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded">
        <h3 className="font-semibold mb-1 text-gray-900 dark:text-gray-100">
          {selectedProfile.name}
        </h3>
        {selectedProfile.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedProfile.description}
          </p>
        )}
      </div>

      {/* Status Display */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded">
        <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
          Status:
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">State:</span>
            <span
              className={`font-medium ${
                currentState === 'running'
                  ? 'text-green-600 dark:text-green-400'
                  : currentState === 'paused'
                  ? 'text-yellow-600 dark:text-yellow-400'
                  : currentState === 'stopped'
                  ? 'text-red-600 dark:text-red-400'
                  : currentState === 'error'
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              {currentState.toUpperCase()}
            </span>
          </div>
          {isLoading && (
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Loading:</span>
              <span className="text-blue-600 dark:text-blue-400">
                Processing...
              </span>
            </div>
          )}
          {error && (
            <div className="text-red-600 dark:text-red-400 text-sm">
              Error: {error}
            </div>
          )}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleStart}
          disabled={isLoading || currentState === 'running'}
          className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded hover:bg-green-700 dark:hover:bg-green-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Start
        </button>
        <button
          onClick={handleStop}
          disabled={
            isLoading || currentState === 'idle' || currentState === 'stopped'
          }
          className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white rounded hover:bg-red-700 dark:hover:bg-red-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Stop
        </button>
        <button
          onClick={handlePause}
          disabled={isLoading || currentState !== 'running'}
          className="px-4 py-2 bg-yellow-600 dark:bg-yellow-700 text-white rounded hover:bg-yellow-700 dark:hover:bg-yellow-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Pause
        </button>
        <button
          onClick={handleResume}
          disabled={isLoading || currentState !== 'paused'}
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          Resume
        </button>
      </div>

      {/* Simple Alert Popup */}
      {showAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              Broker Not Connected
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Please connect to the required broker in the dashboard before
              starting the simulation.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowAlert(false)}
                className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-400 dark:hover:bg-gray-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400">
          Debug Info
        </summary>
        <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-700 rounded text-xs overflow-auto">
          {JSON.stringify(
            {
              profileId,
              profileExists: !!selectedProfile,
              profileName: selectedProfile?.name || 'N/A',
              currentState,
              isLoading,
              error,
            },
            null,
            2
          )}
        </pre>
      </details>
    </div>
  );
};

export default SimulationControls;
