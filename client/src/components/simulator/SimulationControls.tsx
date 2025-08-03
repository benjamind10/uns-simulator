import React, { useEffect } from 'react';
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

  // Use a simpler selector approach
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
  //   const status = useSelector((state: RootState) =>
  //     selectSimulationStatus(state, profileId)
  //   );

  const currentState = profileId
    ? simulationStates[profileId] || 'idle'
    : 'idle';

  console.log('Current State:', currentState);

  useEffect(() => {
    if (profileId) {
      dispatch(getSimulationStatusAsync(profileId) as any);
    }
  }, [dispatch, profileId]);

  const handleStart = () => {
    if (profileId) {
      dispatch(startSimulationAsync(profileId) as any);
    }
  };

  const handleStop = () => {
    if (profileId) {
      dispatch(stopSimulationAsync(profileId) as any);
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

  // If no profile is selected from URL, show message
  if (!profileId || !selectedProfile) {
    return (
      <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          Simulation Controls
        </h2>
        <div className="text-center text-gray-500 dark:text-gray-400">
          {!profileId ? 'No profile ID in URL' : 'Profile not found'}
        </div>
        {profileId && (
          <div className="text-xs text-gray-400 mt-2 text-center">
            Looking for profile: {profileId}
          </div>
        )}
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
              // totalProfiles: Object.keys(profiles).length,
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
