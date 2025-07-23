import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { ISimulationProfile } from '../../types';
import {
  fetchSimulationProfilesAsync,
  fetchSimulationProfileAsync,
  createSimulationProfileAsync,
  updateSimulationProfileAsync,
  deleteSimulationProfileAsync,
} from './simulationProfieThunk';

interface SimulationProfileState {
  profiles: ISimulationProfile[];
  selectedProfile: ISimulationProfile | null;
  loading: boolean;
  error: string | null;
}

const initialState: SimulationProfileState = {
  profiles: [],
  selectedProfile: null,
  loading: false,
  error: null,
};

const simulationProfileSlice = createSlice({
  name: 'simulationProfile',
  initialState,
  reducers: {
    setProfiles(state, action: PayloadAction<ISimulationProfile[]>) {
      state.profiles = action.payload;
    },
    setSelectedProfile(
      state,
      action: PayloadAction<ISimulationProfile | null>
    ) {
      state.selectedProfile = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    addProfile(state, action: PayloadAction<ISimulationProfile>) {
      state.profiles.push(action.payload);
    },
    updateProfile(state, action: PayloadAction<ISimulationProfile>) {
      const idx = state.profiles.findIndex((p) => p.id === action.payload.id);
      if (idx !== -1) state.profiles[idx] = action.payload;
    },
    removeProfile(state, action: PayloadAction<string>) {
      state.profiles = state.profiles.filter((p) => p.id !== action.payload);
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
        state.profiles = action.payload;
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
        state.selectedProfile = action.payload;
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
        state.profiles.push(action.payload);
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
        const idx = state.profiles.findIndex((p) => p.id === action.payload.id);
        if (idx !== -1) state.profiles[idx] = action.payload;
        if (
          state.selectedProfile &&
          state.selectedProfile.id === action.payload.id
        ) {
          state.selectedProfile = action.payload;
        }
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
        state.profiles = state.profiles.filter((p) => p.id !== action.payload);
        if (
          state.selectedProfile &&
          state.selectedProfile.id === action.payload
        ) {
          state.selectedProfile = null;
        }
      })
      .addCase(deleteSimulationProfileAsync.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || 'Failed to delete simulation profile';
      });
  },
});

export const {
  setProfiles,
  setSelectedProfile,
  setLoading,
  setError,
  addProfile,
  updateProfile,
  removeProfile,
} = simulationProfileSlice.actions;

export default simulationProfileSlice.reducer;
