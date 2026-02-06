/* eslint-disable @typescript-eslint/no-unused-vars */
import { createAsyncThunk } from '@reduxjs/toolkit';

import type {
  ISimulationProfile,
  NodeSettings,
} from '../../types/simulationProfile';
import {
  fetchSimulationProfiles,
  fetchSimulationProfile,
  createSimulationProfile,
  updateSimulationProfile,
  deleteSimulationProfile,
  upsertNodeSettings,
  deleteNodeSettings,
  startSimulation,
  stopSimulation,
  pauseSimulation,
  resumeSimulation,
  getSimulationStatus, // Add this import
  type CreateSimulationProfileInput,
  type UpdateSimulationProfileInput,
  type NodeSettingsInput,
} from '../../api/simulationProfile';
import { SIMULATION_PROFILE_ACTIONS } from '../constants';

// Fetch all simulation profiles
export const fetchSimulationProfilesAsync = createAsyncThunk<
  ISimulationProfile[]
>(SIMULATION_PROFILE_ACTIONS.FETCH_ALL, async () => {
  return await fetchSimulationProfiles();
});

// Fetch a single simulation profile
export const fetchSimulationProfileAsync = createAsyncThunk<
  ISimulationProfile,
  string
>(SIMULATION_PROFILE_ACTIONS.FETCH_ONE, async (id) => {
  return await fetchSimulationProfile(id);
});

// Create a new simulation profile
export const createSimulationProfileAsync = createAsyncThunk<
  ISimulationProfile,
  CreateSimulationProfileInput
>(SIMULATION_PROFILE_ACTIONS.CREATE, async (input) => {
  return await createSimulationProfile(input);
});

// Update a simulation profile
export const updateSimulationProfileAsync = createAsyncThunk<
  ISimulationProfile,
  { id: string; input: UpdateSimulationProfileInput }
>(SIMULATION_PROFILE_ACTIONS.UPDATE, async ({ id, input }) => {
  return await updateSimulationProfile(id, input);
});

// Delete a simulation profile
export const deleteSimulationProfileAsync = createAsyncThunk<string, string>(
  SIMULATION_PROFILE_ACTIONS.DELETE,
  async (id) => {
    await deleteSimulationProfile(id);
    return id;
  }
);

// Upsert node settings for a profile
export const upsertNodeSettingsAsync = createAsyncThunk<
  NodeSettings,
  { profileId: string; nodeId: string; settings: NodeSettingsInput }
>(
  SIMULATION_PROFILE_ACTIONS.UPSERT_NODE_SETTINGS,
  async ({ profileId, nodeId, settings }) => {
    const result = await upsertNodeSettings(profileId, nodeId, settings);
    // Remove duplicate nodeId if present in result
    const { nodeId: _ignored, ...rest } = result;
    return { nodeId, ...rest };
  }
);

// Delete node settings for a profile
export const deleteNodeSettingsAsync = createAsyncThunk<
  string,
  { profileId: string; nodeId: string }
>(
  SIMULATION_PROFILE_ACTIONS.DELETE_NODE_SETTINGS,
  async ({ profileId, nodeId }) => {
    await deleteNodeSettings(profileId, nodeId);
    return nodeId;
  }
);

// Extract a clean error message from graphql-request errors
function extractErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const resp = (error as any).response;
    if (resp?.errors?.[0]?.message) {
      return resp.errors[0].message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}

// Simulation Control Thunks
export const startSimulationAsync = createAsyncThunk<boolean, string>(
  SIMULATION_PROFILE_ACTIONS.START_SIMULATION,
  async (profileId, { rejectWithValue }) => {
    try {
      return await startSimulation(profileId);
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, 'Failed to start simulation')
      );
    }
  }
);

export const stopSimulationAsync = createAsyncThunk<boolean, string>(
  SIMULATION_PROFILE_ACTIONS.STOP_SIMULATION,
  async (profileId, { rejectWithValue }) => {
    try {
      return await stopSimulation(profileId);
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, 'Failed to stop simulation')
      );
    }
  }
);

export const pauseSimulationAsync = createAsyncThunk<boolean, string>(
  SIMULATION_PROFILE_ACTIONS.PAUSE_SIMULATION,
  async (profileId, { rejectWithValue }) => {
    try {
      return await pauseSimulation(profileId);
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, 'Failed to pause simulation')
      );
    }
  }
);

export const resumeSimulationAsync = createAsyncThunk<boolean, string>(
  SIMULATION_PROFILE_ACTIONS.RESUME_SIMULATION,
  async (profileId, { rejectWithValue }) => {
    try {
      return await resumeSimulation(profileId);
    } catch (error) {
      return rejectWithValue(
        extractErrorMessage(error, 'Failed to resume simulation')
      );
    }
  }
);

// Get simulation status (for syncing state)
export const getSimulationStatusAsync = createAsyncThunk<
  { profileId: string; status: any },
  string
>(SIMULATION_PROFILE_ACTIONS.GET_SIMULATION_STATUS, async (profileId) => {
  const status = await getSimulationStatus(profileId); // Should be the full object
  return { profileId, status };
});
