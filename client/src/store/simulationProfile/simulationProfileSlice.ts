import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

import type {
  ISimulationProfile,
  RootState,
  SimulationState,
  SimulationProfileState,
  SimulationStatus,
  SimulationLogEntry,
} from '../../types';

import {
  fetchSimulationProfilesAsync,
  fetchSimulationProfileAsync,
  createSimulationProfileAsync,
  updateSimulationProfileAsync,
  deleteSimulationProfileAsync,
  startSimulationAsync,
  stopSimulationAsync,
  pauseSimulationAsync,
  resumeSimulationAsync,
  getSimulationStatusAsync,
  fetchSimulationLogsAsync,
} from './simulationProfieThunk';

const initialState: SimulationProfileState = {
  profiles: {},
  selectedProfileId: null,
  loading: false,
  error: null,
  simulationStates: {},
  simulationLoading: {},
  simulationErrors: {},
  simulationStatus: {},
  simulationLogs: {},
};

const simulationProfileSlice = createSlice({
  name: 'simulationProfile',
  initialState,
  reducers: {
    setProfiles(state, action: PayloadAction<ISimulationProfile[]>) {
      state.profiles = action.payload.reduce((acc, profile) => {
        acc[profile.id] = profile;
        // Sync simulation status from profile.status if present
        if (profile.status) {
          state.simulationStatus[profile.id] =
            profile.status as SimulationStatus;
          state.simulationStates[profile.id] = profile.status
            .state as SimulationState;
        }
        return acc;
      }, {} as Record<string, ISimulationProfile>);
    },
    setSelectedProfileId(state, action: PayloadAction<string | null>) {
      state.selectedProfileId = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    addProfile(state, action: PayloadAction<ISimulationProfile>) {
      state.profiles[action.payload.id] = action.payload;
      if (action.payload.status) {
        state.simulationStatus[action.payload.id] = action.payload
          .status as SimulationStatus;
        state.simulationStates[action.payload.id] = action.payload.status
          .state as SimulationState;
      }
    },
    updateProfile(state, action: PayloadAction<ISimulationProfile>) {
      state.profiles[action.payload.id] = action.payload;
      if (action.payload.status) {
        state.simulationStatus[action.payload.id] = action.payload
          .status as SimulationStatus;
        state.simulationStates[action.payload.id] = action.payload.status
          .state as SimulationState;
      }
    },
    removeProfile(state, action: PayloadAction<string>) {
      delete state.profiles[action.payload];
      delete state.simulationStates[action.payload];
      delete state.simulationLoading[action.payload];
      delete state.simulationErrors[action.payload];
      delete state.simulationStatus[action.payload];
      delete state.simulationLogs[action.payload];
      if (state.selectedProfileId === action.payload) {
        state.selectedProfileId = null;
      }
    },
    setSimulationState(
      state,
      action: PayloadAction<{
        profileId: string;
        simulationState: SimulationState;
      }>
    ) {
      const { profileId, simulationState } = action.payload;
      state.simulationStates[profileId] = simulationState;
      if (state.simulationStatus[profileId]) {
        state.simulationStatus[profileId].state = simulationState;
      }
    },
    setSimulationLoading(
      state,
      action: PayloadAction<{ profileId: string; loading: boolean }>
    ) {
      const { profileId, loading } = action.payload;
      state.simulationLoading[profileId] = loading;
    },
    setSimulationError(
      state,
      action: PayloadAction<{ profileId: string; error: string | null }>
    ) {
      const { profileId, error } = action.payload;
      state.simulationErrors[profileId] = error;
      if (state.simulationStatus[profileId]) {
        state.simulationStatus[profileId].error = error || undefined;
      }
    },
    // Add reducer for updating simulation status directly
    updateSimulationStatus(
      state,
      action: PayloadAction<{ profileId: string; status: SimulationStatus }>
    ) {
      const { profileId, status } = action.payload;
      state.simulationStatus[profileId] = status;
      state.simulationStates[profileId] = status.state;
      if (status.state !== 'error') {
        state.simulationErrors[profileId] = null;
      }
    },
    // Simulation log reducers
    addSimulationLog(
      state,
      action: PayloadAction<{
        profileId: string;
        log: SimulationLogEntry;
      }>
    ) {
      const { profileId, log } = action.payload;
      if (!state.simulationLogs[profileId]) {
        state.simulationLogs[profileId] = [];
      }
      state.simulationLogs[profileId].push(log);
      if (state.simulationLogs[profileId].length > 500) {
        state.simulationLogs[profileId] =
          state.simulationLogs[profileId].slice(-500);
      }
    },
    addSimulationLogs(
      state,
      action: PayloadAction<{
        profileId: string;
        logs: SimulationLogEntry[];
      }>
    ) {
      const { profileId, logs } = action.payload;
      if (!state.simulationLogs[profileId]) {
        state.simulationLogs[profileId] = [];
      }
      state.simulationLogs[profileId].push(...logs);
      if (state.simulationLogs[profileId].length > 500) {
        state.simulationLogs[profileId] =
          state.simulationLogs[profileId].slice(-500);
      }
    },
    clearSimulationLogs(state, action: PayloadAction<string>) {
      state.simulationLogs[action.payload] = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch all profiles
      .addCase(fetchSimulationProfilesAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSimulationProfilesAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.profiles = action.payload.reduce((acc, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {} as Record<string, ISimulationProfile>);
      })
      .addCase(fetchSimulationProfilesAsync.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to fetch simulation profiles';
      })
      // Fetch single profile
      .addCase(fetchSimulationProfileAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSimulationProfileAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.profiles[action.payload.id] = action.payload;
      })
      .addCase(fetchSimulationProfileAsync.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to fetch simulation profile';
      })
      // Create profile
      .addCase(createSimulationProfileAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createSimulationProfileAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.profiles[action.payload.id] = action.payload;
      })
      .addCase(createSimulationProfileAsync.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to create simulation profile';
      })
      // Update profile
      .addCase(updateSimulationProfileAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSimulationProfileAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.profiles[action.payload.id] = action.payload;
      })
      .addCase(updateSimulationProfileAsync.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to update simulation profile';
      })
      // Delete profile
      .addCase(deleteSimulationProfileAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSimulationProfileAsync.fulfilled, (state, action) => {
        const profileId = action.payload;
        delete state.profiles[profileId];
        delete state.simulationStates[profileId];
        delete state.simulationErrors[profileId];
        delete state.simulationLoading[profileId];
        delete state.simulationStatus[profileId];
        delete state.simulationLogs[profileId];
      })
      .addCase(deleteSimulationProfileAsync.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to delete simulation profile';
      })
      // Start simulation
      .addCase(startSimulationAsync.pending, (state, action) => {
        const profileId = action.meta.arg;
        state.simulationLoading[profileId] = true;
        state.simulationErrors[profileId] = null;
      })
      .addCase(startSimulationAsync.fulfilled, (state, action) => {
        const profileId = action.meta.arg;
        state.simulationLoading[profileId] = false;
        state.simulationStates[profileId] = 'running';
      })
      .addCase(startSimulationAsync.rejected, (state, action) => {
        const profileId = action.meta.arg;
        state.simulationLoading[profileId] = false;
        state.simulationStates[profileId] = 'error';
        state.simulationErrors[profileId] =
          (action.payload as string) ||
          action.error.message ||
          'Failed to start simulation';
      })
      // Stop simulation
      .addCase(stopSimulationAsync.pending, (state, action) => {
        const profileId = action.meta.arg;
        state.simulationLoading[profileId] = true;
        state.simulationErrors[profileId] = null;
      })
      .addCase(stopSimulationAsync.fulfilled, (state, action) => {
        const profileId = action.meta.arg;
        state.simulationLoading[profileId] = false;
        state.simulationStates[profileId] = 'stopped';
      })
      .addCase(stopSimulationAsync.rejected, (state, action) => {
        const profileId = action.meta.arg;
        state.simulationLoading[profileId] = false;
        state.simulationErrors[profileId] =
          (action.payload as string) ||
          action.error.message ||
          'Failed to stop simulation';
      })
      // Pause simulation
      .addCase(pauseSimulationAsync.pending, (state, action) => {
        const profileId = action.meta.arg;
        state.simulationLoading[profileId] = true;
        state.simulationErrors[profileId] = null;
      })
      .addCase(pauseSimulationAsync.fulfilled, (state, action) => {
        const profileId = action.meta.arg;
        state.simulationLoading[profileId] = false;
        state.simulationStates[profileId] = 'paused';
      })
      .addCase(pauseSimulationAsync.rejected, (state, action) => {
        const profileId = action.meta.arg;
        state.simulationLoading[profileId] = false;
        state.simulationErrors[profileId] =
          (action.payload as string) ||
          action.error.message ||
          'Failed to pause simulation';
      })
      // Resume simulation
      .addCase(resumeSimulationAsync.pending, (state, action) => {
        const profileId = action.meta.arg;
        state.simulationLoading[profileId] = true;
        state.simulationErrors[profileId] = null;
      })
      .addCase(resumeSimulationAsync.fulfilled, (state, action) => {
        const profileId = action.meta.arg;
        state.simulationLoading[profileId] = false;
        state.simulationStates[profileId] = 'running';
      })
      .addCase(resumeSimulationAsync.rejected, (state, action) => {
        const profileId = action.meta.arg;
        state.simulationLoading[profileId] = false;
        state.simulationErrors[profileId] =
          (action.payload as string) ||
          action.error.message ||
          'Failed to resume simulation';
      })
      // Get simulation status
      .addCase(getSimulationStatusAsync.fulfilled, (state, action) => {
        const { profileId, status } = action.payload;
        state.simulationStates[profileId] = status.state;
        state.simulationStatus[profileId] = status;
      })
      // Fetch simulation logs (polling fallback)
      .addCase(fetchSimulationLogsAsync.fulfilled, (state, action) => {
        const { profileId, logs } = action.payload;
        if (!state.simulationLogs[profileId]) {
          state.simulationLogs[profileId] = [];
        }
        // Merge new logs (avoid duplicates by timestamp)
        const existing = new Set(
          state.simulationLogs[profileId].map((l) => l.timestamp)
        );
        const newLogs = logs.filter((l) => !existing.has(l.timestamp));
        state.simulationLogs[profileId].push(...newLogs);
        if (state.simulationLogs[profileId].length > 500) {
          state.simulationLogs[profileId] =
            state.simulationLogs[profileId].slice(-500);
        }
      });
  },
});

export const {
  setProfiles,
  setSelectedProfileId,
  setLoading,
  setError,
  addProfile,
  updateProfile,
  removeProfile,
  setSimulationState,
  setSimulationLoading,
  setSimulationError,
  updateSimulationStatus,
  addSimulationLog,
  addSimulationLogs,
  clearSimulationLogs,
} = simulationProfileSlice.actions;

export const selectSelectedProfileId = (state: RootState) =>
  state.simulationProfile.selectedProfileId;

export const selectSelectedProfile = (
  state: RootState
): ISimulationProfile | null => {
  const id = state.simulationProfile.selectedProfileId;
  return id ? state.simulationProfile.profiles[id] || null : null;
};

export const selectProfiles = (state: RootState) =>
  state.simulationProfile.profiles;

// Fix the selectProfileById selector
export const selectProfileById = createSelector(
  [
    (state: RootState) => state.simulationProfile.profiles,
    (_: RootState, profileId: string | undefined) => profileId,
  ],
  (profiles, profileId) => {
    return profileId ? profiles[profileId] || null : null;
  }
);

// Add selector for simulation status
export const selectSimulationStatus = createSelector(
  [
    (state: RootState) => state.simulationProfile.simulationStates,
    (_: RootState, profileId: string | undefined) => profileId,
  ],
  (simulationStatus, profileId) => {
    return profileId ? simulationStatus[profileId] || null : null;
  }
);

export default simulationProfileSlice.reducer;
