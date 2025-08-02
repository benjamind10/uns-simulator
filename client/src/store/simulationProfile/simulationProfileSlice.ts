import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { createSelector } from '@reduxjs/toolkit';

import type {
  ISimulationProfile,
  RootState,
  SimulationState,
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
} from './simulationProfieThunk';

interface SimulationProfileState {
  profiles: Record<string, ISimulationProfile>;
  selectedProfileId: string | null;
  loading: boolean;
  error: string | null;
  // Simulation control state
  simulationStates: Record<string, SimulationState>;
  simulationLoading: Record<string, boolean>;
  simulationErrors: Record<string, string | null>;
}

const initialState: SimulationProfileState = {
  profiles: {},
  selectedProfileId: null,
  loading: false,
  error: null,
  simulationStates: {},
  simulationLoading: {},
  simulationErrors: {},
};

const simulationProfileSlice = createSlice({
  name: 'simulationProfile',
  initialState,
  reducers: {
    setProfiles(state, action: PayloadAction<ISimulationProfile[]>) {
      state.profiles = action.payload.reduce((acc, profile) => {
        acc[profile.id] = profile;
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
    },
    updateProfile(state, action: PayloadAction<ISimulationProfile>) {
      state.profiles[action.payload.id] = action.payload;
    },
    removeProfile(state, action: PayloadAction<string>) {
      delete state.profiles[action.payload];
      if (state.selectedProfileId === action.payload) {
        state.selectedProfileId = null;
      }
    },
    // Simulation control reducers
    setSimulationState(
      state,
      action: PayloadAction<{
        profileId: string;
        simulationState: SimulationState;
      }>
    ) {
      const { profileId, simulationState } = action.payload;
      state.simulationStates[profileId] = simulationState;
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
        state.loading = false;
        delete state.profiles[action.payload];
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
        state.simulationErrors[profileId] =
          action.error.message || 'Failed to start simulation';
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
          action.error.message || 'Failed to stop simulation';
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
          action.error.message || 'Failed to pause simulation';
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
          action.error.message || 'Failed to resume simulation';
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
} = simulationProfileSlice.actions;

export const selectSelectedProfileId = (state: RootState) =>
  state.simulationProfile.selectedProfileId;

export const selectSelectedProfile = (
  state: RootState
): ISimulationProfile | null => {
  const id = state.simulationProfile.selectedProfileId;
  return (
    (state.simulationProfile.profiles as unknown as ISimulationProfile[]).find(
      (p) => p.id === id
    ) || null
  );
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

export default simulationProfileSlice.reducer;
